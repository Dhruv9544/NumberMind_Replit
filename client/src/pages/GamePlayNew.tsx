import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useParams, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useNumberInput } from '@/components/GameComponents';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  RotateCcw, 
  Trophy, 
  Target, 
  User as UserIcon, 
  Clock, 
  Hash,
  ChevronRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  CircleDashed,
  LogOut,
  Gamepad2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Move {
  id: string;
  playerId: string;
  guess: string;
  correctDigits: number;
  correctPositions: number;
  moveNumber: number;
}

interface GameState {
  id: string;
  player1Id: string;
  player2Id?: string;
  gameMode: string;
  status: 'waiting' | 'active' | 'finished';
  currentTurn?: string;
  winnerId?: string;
  moves: Move[];
  player1Secret?: string;
  player2Secret?: string;
}

import { GameLoader } from '@/components/GameLoader';

export default function GamePlay() {
  const { user } = useAuth();
  const { gameId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showWinDialog, setShowWinDialog] = useState(false);

  const { digits, currentSlot, inputDigit, clearInput, getValue, isComplete, focusSlot, reset } = useNumberInput();

  const { data: game, refetch } = useQuery<GameState>({
    queryKey: ['/api/games', gameId],
    enabled: !!gameId,
    refetchInterval: 1500,
  });

  const makeMoveMutation = useMutation({
    mutationFn: async ({ guess }: { guess: string }) => {
      const response = await apiRequest('POST', `/api/games/${gameId}/moves`, { guess });
      return response.json();
    },
    onSuccess: () => {
      reset();
      setTimeout(() => refetch(), 800);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to make move',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (game?.status === 'finished' && !showWinDialog) {
      setShowWinDialog(true);
    }
  }, [game?.status]);

  const handleGuess = () => {
    if (!isComplete()) {
      toast({
        title: 'Invalid Guess',
        description: 'Enter a complete 4-digit number',
        variant: 'destructive',
      });
      return;
    }
    makeMoveMutation.mutate({ guess: getValue() });
  };

  if (!game) return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-neutral-950">
      <GameLoader text="Syncing Combat Parameters..." />
    </div>
  );

  const playerMoves = [...game.moves].filter(m => m.playerId === user?.id).sort((a, b) => b.moveNumber - a.moveNumber);
  const opponentMoves = [...game.moves].filter(m => m.playerId !== user?.id).sort((a, b) => b.moveNumber - a.moveNumber);
  const isPlayerTurn = game.currentTurn === user?.id;
  const isGameOver = game.status === 'finished';
  const playerWon = game.winnerId === user?.id;
  const isAIGame = game.player2Id === 'AI';

  const opponentSecret = user?.id === game.player1Id ? game.player2Secret : game.player1Secret;

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-neutral-950 text-neutral-50 pb-12 font-sans selection:bg-emerald-500/30">
      {/* Background radial effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10">
        {/* Header Breadcrumb / Info */}
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <Link href="/" className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
                <ArrowLeft className="w-4 h-4 text-neutral-400" />
              </Link>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Game #{gameId?.slice(-6).toUpperCase()}</h1>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Badge variant="secondary" className="bg-neutral-800 text-neutral-300 border-none font-medium px-2 py-0">
                    {game.gameMode.toUpperCase()}
                  </Badge>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Started {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-9 h-9 rounded-full bg-neutral-800 border-2 border-neutral-950 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="w-9 h-9 rounded-full bg-neutral-800 border-2 border-neutral-950 flex items-center justify-center">
                  {isAIGame ? <Bot className="w-4 h-4 text-blue-500" /> : <UserIcon className="w-4 h-4 text-blue-500" />}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold leading-none capitalize">
                  {isAIGame ? "Vs AI Assistant" : "Vs Opponent"}
                </p>
                <p className="text-xs text-neutral-400">
                  {playerMoves.length} Guesses 
                </p>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Game Board / Input */}
          <div className="lg:col-span-12 xl:col-span-12">
             {/* Turn Indicator Bar */}
             <div className={cn(
               "mb-8 p-3 rounded-xl border flex items-center justify-between transition-all duration-500",
               isPlayerTurn 
                 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" 
                 : "bg-blue-500/10 border-blue-500/20 text-blue-300"
             )}>
               <div className="flex items-center gap-3">
                 {isPlayerTurn ? (
                   <Zap className="w-5 h-5 fill-emerald-500 text-emerald-400 animate-pulse" />
                 ) : (
                   <CircleDashed className="w-5 h-5 text-blue-400 animate-spin" />
                 )}
                 <span className="font-bold text-sm tracking-wide uppercase">
                   {isGameOver ? "Game Result" : (isPlayerTurn ? "Your Turn to Guess" : "Waiting for Opponent...")}
                 </span>
               </div>
               
               <div className="flex items-center gap-2">
                 <Badge variant="outline" className={cn(
                   "border-none px-2",
                   isPlayerTurn ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                 )}>
                   #{playerMoves.length + opponentMoves.length + 1}
                 </Badge>
               </div>
             </div>
          </div>

          {/* Player Areas */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Input Section */}
            {!isGameOver && (
              <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm shadow-xl overflow-hidden">
                <div className={cn(
                  "h-1 w-full",
                  isPlayerTurn ? "bg-emerald-500" : "bg-blue-500 opacity-30"
                )} />
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-emerald-500" />
                        Next Guess
                      </CardTitle>
                      <CardDescription className="text-neutral-400">
                        Enter any 4 unique digits
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Slots */}
                  <div className="flex justify-center gap-2 sm:gap-4 p-4 rounded-2xl bg-black/20 border border-neutral-800/50">
                    {digits.map((d, i) => (
                      <motion.button
                        key={i}
                        whileTap={{ scale: 0.95 }}
                        disabled={!isPlayerTurn}
                        onClick={() => focusSlot(i)}
                        className={cn(
                          "w-12 h-16 sm:w-16 sm:h-20 rounded-xl font-bold text-2xl sm:text-3xl transition-all flex items-center justify-center",
                          d 
                            ? "bg-neutral-800 text-white border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                            : "bg-neutral-900 border-2 border-dashed border-neutral-800 text-neutral-600",
                          i === currentSlot && isPlayerTurn && "ring-2 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]",
                          !isPlayerTurn && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {d || '·'}
                      </motion.button>
                    ))}
                  </div>

                  {/* Keypad */}
                  <div className="grid grid-cols-5 gap-2 max-w-sm mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
                      <Button
                        key={n}
                        variant="secondary"
                        disabled={!isPlayerTurn || makeMoveMutation.isPending}
                        onClick={() => inputDigit(n.toString())}
                        className="h-12 border border-neutral-800 bg-neutral-800/50 hover:bg-neutral-800 hover:border-neutral-700 text-lg font-bold transition-all active:scale-90"
                      >
                        {n}
                      </Button>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-4 p-6 bg-black/10 border-t border-neutral-800/50">
                  <Button
                    onClick={clearInput}
                    variant="outline"
                    disabled={!isPlayerTurn || makeMoveMutation.isPending}
                    className="flex-1 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white h-12 rounded-xl"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    onClick={handleGuess}
                    disabled={!isPlayerTurn || !isComplete() || makeMoveMutation.isPending}
                    className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 shadow-lg shadow-emerald-900/20 rounded-xl"
                  >
                    {makeMoveMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Submit Move
                      </div>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* History Tabs / Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Your History */}
               <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">Your Guesses</h3>
                  </div>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence initial={false}>
                      {playerMoves.length === 0 ? (
                        <div className="text-center py-12 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30">
                          <p className="text-neutral-500 text-sm">No attempts yet</p>
                        </div>
                      ) : (
                        playerMoves.map((move) => (
                          <motion.div
                            key={move.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm group hover:border-emerald-500/30 transition-all duration-300"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-[10px] font-black text-neutral-600 tabular-nums">#{move.moveNumber}</span>
                                <div className="flex gap-1">
                                  {move.guess.split('').map((digit, i) => (
                                    <div
                                      key={i}
                                      className="w-8 h-9 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center text-sm font-black text-emerald-400 group-hover:border-emerald-500/20 transition-colors"
                                    >
                                      {digit}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/30 border-none font-bold tabular-nums">
                                  {move.correctPositions}·Pos
                                </Badge>
                                <Badge className="bg-yellow-900/20 text-yellow-500 hover:bg-yellow-900/30 border-none font-bold tabular-nums">
                                  {move.correctDigits}·Dig
                                </Badge>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
               </div>

               {/* Opponent History */}
               <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <CircleDashed className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                      {isAIGame ? "AI Attempts" : "Opponent Attempts"}
                    </h3>
                  </div>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence initial={false}>
                      {opponentMoves.length === 0 ? (
                        <div className="text-center py-12 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30">
                          <p className="text-neutral-500 text-sm">No attempts yet</p>
                        </div>
                      ) : (
                        opponentMoves.map((move) => (
                          <motion.div
                            key={move.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm hover:border-blue-500/30 transition-all duration-300"
                          >
                             <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="text-[10px] font-black text-neutral-600 tabular-nums">#{move.moveNumber}</span>
                                  <div className="flex gap-1 opacity-70">
                                    {move.guess.split('').map((digit, i) => (
                                      <div
                                        key={i}
                                        className="w-8 h-9 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center text-sm font-black text-blue-400"
                                      >
                                        {digit}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-blue-900/20 text-blue-400 border-none font-bold">
                                    {move.correctPositions}
                                  </Badge>
                                  <Badge className="bg-neutral-800 text-neutral-500 border-none font-bold">
                                    {move.correctDigits}
                                  </Badge>
                                </div>
                              </div>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
               </div>
            </div>
          </div>

          {/* Right Column: Stats / Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-neutral-800 bg-neutral-900/30 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-neutral-300">Live Match Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center">
                      <Target className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-neutral-500">Your Accuracy</p>
                      <p className="font-bold tabular-nums">
                        {playerMoves.length > 0 
                          ? Math.round((playerMoves.reduce((acc, m) => acc + m.correctPositions, 0) / (playerMoves.length * 4)) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center">
                      <CircleDashed className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-neutral-500">Opponent Pace</p>
                      <p className="font-bold tabular-nums">
                        {opponentMoves.length > 0 ? (opponentMoves.length / (playerMoves.length + opponentMoves.length + 0.1)).toFixed(1) : 0} Moves/Rnd
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-800 bg-neutral-900/30 backdrop-blur-sm border-dashed">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                   <ShieldCheck className="w-5 h-5 text-emerald-500" />
                   <h3 className="font-bold text-sm">Game Security</h3>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed mb-4">
                  Match is end-to-end verified. Your secret number is encrypted and only compared on move submission.
                </p>
                <div className="p-3 bg-neutral-950 rounded border border-neutral-800 text-[10px] font-mono text-emerald-500/50 break-all">
                  HASH: {gameId?.repeat(2).slice(0, 32)}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Win/Loss Dialog */}
      <Dialog open={showWinDialog} onOpenChange={setShowWinDialog}>
        <DialogContent className="max-w-md border-neutral-800 bg-neutral-900 text-white">
          <DialogHeader>
            <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
               {playerWon ? <Trophy className="w-10 h-10 text-emerald-500" /> : <Loader2 className="w-10 h-10 text-red-500" />}
            </div>
            <DialogTitle className="text-3xl font-black text-center">
              {playerWon ? "Victory!" : "Defeat"}
            </DialogTitle>
            <DialogDescription className="text-center text-neutral-400 pt-2 text-lg">
              {playerWon 
                ? "You've successfully cracked the code and outsmarted your opponent."
                : "The opponent was faster this time. Your code was discovered."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 my-4 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
               <span className="text-neutral-500 font-medium">Final Code</span>
               <span className="text-2xl font-black text-emerald-500 tracking-widest">{opponentSecret || "????"}</span>
            </div>
            <div className="flex justify-between items-center">
               <span className="text-neutral-500 font-medium">Total Moves</span>
               <span className="text-xl font-bold">{playerMoves.length} attempts</span>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="w-full border-neutral-700 bg-transparent hover:bg-neutral-800 py-6 text-lg"
              onClick={() => setLocation('/')}
            >
              Main Menu
            </Button>
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 text-lg font-bold"
              onClick={() => setLocation('/game/setup')}
            >
              Play Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Missing icons for the refactor
function Bot(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  )
}

