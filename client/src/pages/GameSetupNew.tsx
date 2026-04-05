import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, Link, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNumberInput } from '@/components/GameComponents';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Zap, 
  Loader2, 
  Users, 
  Search, 
  Bot as BotIcon, 
  Globe, 
  HelpCircle,
  ChevronRight,
  ShieldAlert,
  User as UserIcon,
  RotateCcw,
  Gamepad2,
  BookOpen,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogTrigger
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { GameLoader } from '@/components/GameLoader';
import { HowToPlayTour, resetTour } from '@/components/HowToPlayTour';
import { ExampleBox } from '@/components/ExampleBox';
import { PracticeMode } from '@/components/PracticeMode';

export default function GameSetup() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [gameMode, setGameMode] = useState<string>('ai');
  const [selectedFriend, setSelectedFriend] = useState<{ id: string; name: string } | null>(null);
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gameId, setGameId] = useState<string | null>(null);

  // ── Onboarding state ──────────────────────────────────────────────────
  const [showTour, setShowTour] = useState(false);
  const [showPractice, setShowPractice] = useState(false);

  // Stable ref so the keyboard handler always calls the latest handleStart
  const handleStartRef = useRef<() => void>(() => {});
  const { digits, currentSlot, inputDigit, clearInput, getValue, isComplete, focusSlot } = useNumberInput(4, {
    enabled: !showFriendPicker,
    onSubmit: () => handleStartRef.current(),
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ['/api/search/users', searchQuery],
    enabled: searchQuery.length >= 2 && gameMode === 'friend' && showFriendPicker,
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      const response = await apiRequest('GET', `/api/search/users?q=${encodeURIComponent(searchQuery)}`);
      return response.json();
    },
  });

  const routeParams = useParams<{ gameId?: string }>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const id = routeParams?.gameId || params.get('gameId');  // prefer route param
    const opponent = params.get('opponent'); // username of challenged friend
    if (mode) setGameMode(mode || 'ai');
    if (id) {
      setGameId(id);
      // When arriving via rematch (/game/setup/:gameId), default to friend mode
      // so the secret-setting path executes correctly
      if (!mode) setGameMode('friend');
    }
    // If arriving from Friends page challenge (gameId already created),
    // pre-select the opponent so the button is enabled
    if (id && opponent) {
      setSelectedFriend({ id: '_pre_challenged', name: opponent });
    } else if (id) {
      // gameId exists but no opponent — still unlock the button
      setSelectedFriend({ id: '_pre_challenged', name: 'Your friend' });
    }
  }, [routeParams?.gameId]);

  const createGameMutation = useMutation({
    mutationFn: async () => {
      // If we already have a gameId (came from Friends challenge), skip creation
      if (gameId) {
        return { id: gameId };
      }
      if (gameMode === 'friend' && !selectedFriend) {
        throw new Error('Please select a friend to challenge');
      }
      const response = await apiRequest('POST', '/api/games', { 
        gameMode,
        difficulty: 'standard',
        friendId: gameMode === 'friend' ? selectedFriend?.id : undefined,
        friendName: gameMode === 'friend' ? selectedFriend?.name : undefined,
      });
      return response.json();
    },
    onSuccess: (game) => {
      setSecretMutation.mutate({
        gameId: game.id,
        secretNumber: getValue(),
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create game',
        variant: 'destructive',
      });
    },
  });

  const setSecretMutation = useMutation({
    mutationFn: async ({ gameId, secretNumber }: { gameId: string; secretNumber: string }) => {
      const response = await apiRequest('PUT', `/api/games/${gameId}/secret`, { secretNumber });
      return response.json();
    },
    onSuccess: (game) => {
      const messages: Record<string, { title: string; desc: string }> = {
        ai: { title: 'Game Started!', desc: 'Playing against AI. Make your first guess!' },
        friend: { title: 'Challenge Sent!', desc: `Waiting for ${selectedFriend?.name} to accept...` },
        random: { title: 'Searching...', desc: 'Looking for a worthy opponent...' },
        join: { title: 'Joined!', desc: 'Game session started.' }
      };

      const msg = messages[gameMode] || messages.ai;
      toast({ title: msg.title, description: msg.desc });
      setLocation(`/game/play/${game.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start game',
        variant: 'destructive',
      });
    },
  });

  const handleStart = () => {
    // Helper: check for duplicate digits
    const hasDuplicateDigits = (num: string) => new Set(num.split('')).size !== num.length;

    // Case 1: joining via pre-existing gameId (friend challenge from Friends page)
    if (gameId) {
      if (!isComplete()) {
        toast({ title: 'Set Your Secret', description: 'Enter your 4-digit secret number first', variant: 'destructive' });
        return;
      }
      if (hasDuplicateDigits(getValue())) {
        toast({ title: 'Invalid Number', description: 'All 4 digits must be unique — no repeated digits allowed.', variant: 'destructive' });
        return;
      }
      setSecretMutation.mutate({ gameId, secretNumber: getValue() });
      return;
    }

    // Case 2: friend mode via search picker
    if (gameMode === 'friend' && !selectedFriend) {
      toast({ title: 'Select a Player', description: 'Search and select an opponent', variant: 'destructive' });
      return;
    }
    
    if (!isComplete()) {
      toast({ title: 'Invalid Number', description: 'Set your 4-digit secret number', variant: 'destructive' });
      return;
    }

    // Validate unique digits before creating/sending any challenge
    if (hasDuplicateDigits(getValue())) {
      toast({ title: 'Invalid Number', description: 'All 4 digits must be unique — no repeated digits allowed.', variant: 'destructive' });
      return;
    }

    createGameMutation.mutate();
  };

  // Keep the ref pointing to the latest handleStart
  handleStartRef.current = handleStart;

  const modeData = {
    ai: { icon: BotIcon, label: 'Practice (AI)', desc: 'Sharpen your skills', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    random: { icon: Globe, label: 'Online Match', desc: 'Face a random player', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    friend: { icon: Users, label: 'Challenge', desc: 'Duel with a friend', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    join: { icon: Zap, label: 'Join Private', desc: 'Join via game link', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  }[gameMode] || { icon: Zap, label: 'Game Setup', desc: 'Configure your match', color: 'text-emerald-400', bg: 'bg-emerald-400/10' };

  const isLoading = createGameMutation.isPending || setSecretMutation.isPending;

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-neutral-950 text-neutral-50 flex flex-col font-sans selection:bg-emerald-500/30">
      <AnimatePresence>
        {isLoading && <GameLoader fullScreen text="Establishing Combat Link..." />}
      </AnimatePresence>

      {/* Dynamic background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full h-full bg-emerald-500/10 rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-8 sm:py-12 flex flex-col flex-1">
        {/* How To Play Tour — auto-shows for first-time users */}
        <HowToPlayTour
          forceShow={showTour}
          enableJoyride
          onClose={() => setShowTour(false)}
        />

        {/* Header Section */}
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all active:scale-95 group">
              <ArrowLeft className="w-5 h-5 text-neutral-400 group-hover:text-emerald-400" />
            </Link>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Match Configuration</p>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 italic">
                 {modeData.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Show Tutorial replay button */}
            <button
              onClick={() => { resetTour(); setShowTour(true); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors group text-xs font-bold text-neutral-500 hover:text-emerald-400"
              title="Show Tutorial"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tutorial</span>
            </button>

          <Dialog>
             <DialogTrigger asChild>
               <Button variant="ghost" size="icon" className="rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-emerald-400">
                  <HelpCircle className="w-5 h-5" />
               </Button>
             </DialogTrigger>
             <DialogContent className="max-w-md border-neutral-800 bg-neutral-900 text-white overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">How to Play</DialogTitle>
                  <DialogDescription className="text-neutral-400">
                    The goal: guess your opponent's secret 4-digit number before they guess yours.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                  {/* Quick rules */}
                  <div className="space-y-2">
                    {[
                      { emoji: '🔒', text: 'Each player picks a secret 4-digit number with all unique digits.' },
                      { emoji: '🎯', text: 'Take turns guessing your opponent\'s number.' },
                      { emoji: '💡', text: 'After each guess you get Pos (right position) and Dig (right digit, any position).' },
                      { emoji: '🏆', text: 'First to get Pos = 4 wins!' },
                    ].map((r, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-800/60 border border-neutral-800">
                        <span className="text-lg shrink-0">{r.emoji}</span>
                        <p className="text-xs text-neutral-300 leading-relaxed">{r.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Live example */}
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-neutral-500 mb-2">📖 Example</p>
                    <ExampleBox
                      secret="1234"
                      guess="1243"
                      pos={2}
                      dig={4}
                      highlightGuess={[0, 1, 2, 3]}
                      caption="Secret is 1234. You guess 1243. All 4 digits exist (Dig=4), but only 1 and 2 are in the right spot (Pos=2)."
                    />
                  </div>

                  {/* Full tour link */}
                  <button
                    onClick={() => {
                      resetTour();
                      setShowTour(true);
                      (document.activeElement as HTMLElement)?.blur();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 transition-colors text-sm font-bold"
                  >
                    <BookOpen className="w-4 h-4" />
                    Open Full Tutorial
                  </button>
                </div>
             </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Setup Content */}
        <div className="space-y-6 flex-1">
          {/* Mode Badge/Info */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("p-4 rounded-2xl border flex items-center gap-4 transition-all", modeData.bg, "border-white/5 shadow-lg")}
          >
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner", modeData.bg)}>
               <modeData.icon className={cn("w-6 h-6", modeData.color)} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-none">{modeData.desc}</h3>
              <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest font-bold">Standard Match Protocol</p>
            </div>
          </motion.div>

          {/* Social Picker if Friend Mode */}
          {gameMode === 'friend' && (
            <div className="space-y-2">
              {gameId ? (
                /* Came from Friends page - game already created, just show who we challenged */
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-cyan-600 flex items-center justify-center text-white font-black text-base shrink-0">
                    {selectedFriend?.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-0.5">Challenging</p>
                    <p className="font-black text-white text-base">@{selectedFriend?.name ?? 'your friend'}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Challenge Sent
                  </div>
                </div>
              ) : (
                /* No gameId - show search picker */
                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 px-1 mb-2 block">Opponent Details</label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-emerald-500 transition-colors" />
                    <Input 
                      placeholder="Search player username..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowFriendPicker(true);
                      }}
                      className="pl-12 h-14 bg-neutral-900 border-neutral-800 rounded-2xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all font-medium"
                    />
                    
                    <AnimatePresence>
                      {showFriendPicker && searchQuery.length >= 2 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 w-full mt-2 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto"
                        >
                          {searchResults.length > 0 ? (
                            <div className="p-2 space-y-1">
                              {searchResults.map((p: any) => (
                                <button
                                  key={p.id}
                                  onClick={() => {
                                    setSelectedFriend({ id: p.id, name: p.username });
                                    setShowFriendPicker(false);
                                    setSearchQuery(p.username);
                                  }}
                                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800 transition-colors group text-left"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                                       <UserIcon className="w-4 h-4 text-neutral-400 group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-sm text-neutral-200">@{p.username}</p>
                                      <p className="text-[10px] text-neutral-500 uppercase tracking-tighter">Verified Player</p>
                                    </div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-emerald-500" />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center">
                              <p className="text-sm text-neutral-500 italic">No threats found with that name.</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {selectedFriend && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-sm font-bold text-emerald-400">@{selectedFriend.name}</span>
                      <span className="text-xs text-neutral-500">selected</span>
                      <button
                        onClick={() => { setSelectedFriend(null); setSearchQuery(''); }}
                        className="ml-auto text-neutral-500 hover:text-neutral-300"
                      >
                        <span className="text-xs">✕</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Number Selection Card */}
          <Card
            data-tour="secret-input"
            className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm overflow-hidden rounded-3xl shadow-2xl"
          >
            <div className="h-1 w-full bg-emerald-500/50" />
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500 italic flex items-center justify-center gap-2">
                 <ShieldAlert className="w-4 h-4 text-orange-500" />
                 Secure Your Secret
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-6 pb-8 space-y-6">
              {/* Display Slots */}
              <div className="flex justify-center gap-3">
                 {digits.map((d, i) => (
                   <motion.button
                     key={i}
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => focusSlot(i)}
                     className={cn(
                       "w-12 h-16 sm:w-16 sm:h-20 rounded-2xl font-black text-2xl sm:text-3xl transition-all flex items-center justify-center",
                       d 
                         ? "bg-neutral-800 text-white border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]" 
                         : "bg-neutral-950 border-2 border-neutral-800 text-neutral-800",
                       i === currentSlot && "ring-2 ring-emerald-500/50 ring-offset-4 ring-offset-neutral-950"
                     )}
                   >
                     {d || '·'}
                   </motion.button>
                 ))}
              </div>

              {/* Numpad */}
              <div data-tour="numpad" className="grid grid-cols-5 gap-2 max-w-[280px] mx-auto">
                 {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
                   <Button
                     key={n}
                     variant="ghost"
                     onClick={() => inputDigit(n.toString())}
                     className="h-10 sm:h-12 border border-neutral-800 bg-neutral-900 shadow-sm hover:scale-110 hover:bg-neutral-800 hover:text-emerald-400 hover:border-emerald-500/50 transition-all font-black text-lg p-0"
                   >
                     {n}
                   </Button>
                 ))}
              </div>

              <div className="flex gap-3">
                 <Button
                    onClick={clearInput}
                    variant="outline"
                    className="flex-1 border-neutral-800 text-neutral-500 hover:text-red-400 hover:border-red-400/30 rounded-xl h-12"
                 >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                 </Button>
                 <Button
                    data-tour="start-btn"
                    onClick={handleStart}
                    disabled={
                      !isComplete() ||
                      isLoading ||
                      (gameMode === 'friend' && !gameId && !selectedFriend)
                    }
                    className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-black italic uppercase tracking-wider h-12 rounded-xl shadow-lg shadow-emerald-500/10"
                 >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Engage Match"
                    )}
                 </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Example Box ── */}
          <div data-tour="example-box">
            <p className="text-[10px] uppercase font-black tracking-widest text-neutral-600 mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" />
              How feedback works
            </p>
            <ExampleBox
              secret="1234"
              guess="1243"
              pos={2}
              dig={4}
              highlightGuess={[0, 1, 2, 3]}
              caption="Secret: 1234 · Guess: 1243 → 4 digits exist (Dig=4), only positions 1 & 2 match (Pos=2)"
            />
          </div>

          {/* ── Practice Mode toggle ── */}
          <div>
            <AnimatePresence>
              {showPractice ? (
                <motion.div
                  key="practice"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <PracticeMode onDone={() => setShowPractice(false)} />
                </motion.div>
              ) : (
                <motion.button
                  key="practice-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setShowPractice(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 text-neutral-500 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-xs font-bold group"
                >
                  <Gamepad2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  🎮 Try a quick practice round first
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer info/stats */}
        <div className="mt-8 text-center space-y-4">
           {gameMode === 'friend' && selectedFriend && (
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 border border-neutral-800">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-neutral-400 tracking-tighter">
                   Targeting: <span className="text-emerald-400">{selectedFriend.name}</span>
                </span>
             </div>
           )}
           <p className="text-[10px] uppercase font-bold text-neutral-600 tracking-widest leading-loose max-w-[240px] mx-auto">
              All matches are skill-based and follow fair play protocols. Good luck.
           </p>
        </div>
      </div>
    </div>
  );
}



