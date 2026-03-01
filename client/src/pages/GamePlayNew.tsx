import { useEffect, useState, useCallback } from 'react';
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
  Bot as BotIcon,
  Clock, 
  Hash,
  ChevronRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  CircleDashed,
  LogOut,
  Gamepad2,
  HelpCircle,
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
import { HowToPlayTour, resetTour } from '@/components/HowToPlayTour';

export default function GamePlay() {
  const { user } = useAuth();
  const { gameId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showWinDialog, setShowWinDialog] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const { digits, currentSlot, inputDigit, clearInput, getValue, isComplete, focusSlot, reset } = useNumberInput(4, {
    enabled: true, // enabled globally; guard inside handleGuess handles turn/game-over
    onSubmit: () => handleGuess(),
  });

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

  // Define handleGuess with useCallback BEFORE passing it to useNumberInput
  const handleGuess = useCallback(() => {
    if (!isComplete()) {
      toast({
        title: 'Invalid Guess',
        description: 'Enter a complete 4-digit number',
        variant: 'destructive',
      });
      return;
    }
    makeMoveMutation.mutate({ guess: getValue() });
  }, [isComplete, getValue, makeMoveMutation, toast]);

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
    <div className="min-h-[calc(100vh-4rem)] w-full bg-neutral-950 text-neutral-50 pb-16 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* How to Play tour - shows first time automatically */}
      <HowToPlayTour forceShow={showTour} onClose={() => setShowTour(false)} />
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

            <div className="flex items-center gap-2">
              {/* Help button - re-opens the tutorial */}
              <button
                onClick={() => { resetTour(); setShowTour(true); }}
                className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors group"
                title="How to Play"
              >
                <HelpCircle className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
              </button>
              <div className="flex -space-x-2">
                <div className="w-9 h-9 rounded-full bg-neutral-800 border-2 border-neutral-950 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="w-9 h-9 rounded-full bg-neutral-800 border-2 border-neutral-950 flex items-center justify-center">
                  {isAIGame ? <BotIcon className="w-4 h-4 text-blue-500" /> : <UserIcon className="w-4 h-4 text-blue-500" />}
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

        {/* MAIN LAYOUT - single responsive column */}
        <main className="max-w-2xl mx-auto px-3 sm:px-4 pb-4 space-y-4">
          {/* Turn Indicator Bar */}
          <div className={cn(
            "p-3 rounded-xl border flex items-center justify-between transition-all duration-500",
            isPlayerTurn
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-blue-500/10 border-blue-500/20 text-blue-300"
          )}>
            <div className="flex items-center gap-2">
              {isPlayerTurn ? (
                <Zap className="w-4 h-4 fill-emerald-500 text-emerald-400 animate-pulse" />
              ) : (
                <CircleDashed className="w-4 h-4 text-blue-400 animate-spin" />
              )}
              <span className="font-bold text-sm tracking-wide">
                {isGameOver ? "Game Over" : (isPlayerTurn ? "Your Turn" : "Waiting for opponent...")}
              </span>
            </div>
            <Badge variant="outline" className={cn(
              "border-none px-2 text-[10px]",
              isPlayerTurn ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
            )}>
              Round #{playerMoves.length + opponentMoves.length + 1}
            </Badge>
          </div>
            {/* Input Section */}
            {!isGameOver && (
            <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm shadow-xl overflow-hidden mb-4">
                <div className={cn(
                  "h-1 w-full",
                  isPlayerTurn ? "bg-emerald-500" : "bg-blue-500 opacity-30"
                )} />
                <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-500" />
                        Your Guess
                      </CardTitle>
                      <CardDescription className="text-neutral-500 text-xs">
                        Type digits or tap below · <kbd className="text-[10px] font-black bg-neutral-800 border border-neutral-700 rounded px-1 py-0.5 text-neutral-500">Enter</kbd> to submit
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-4">
                  {/* Digit slots - compact on mobile */}
                  <div className="flex justify-center gap-2 p-3 rounded-2xl bg-black/20 border border-neutral-800/50">
                    {digits.map((d, i) => (
                      <motion.button
                        key={i}
                        whileTap={{ scale: 0.93 }}
                        disabled={!isPlayerTurn}
                        onClick={() => focusSlot(i)}
                        className={cn(
                          "w-14 h-16 sm:w-16 sm:h-20 rounded-xl font-bold text-2xl sm:text-3xl transition-all flex items-center justify-center",
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

                  {/* Numpad - 3+1 layout, full-width on mobile */}
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2 max-w-xs mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
                      <Button
                        key={n}
                        variant="secondary"
                        disabled={!isPlayerTurn || makeMoveMutation.isPending}
                        onClick={() => inputDigit(n.toString())}
                        className="h-11 sm:h-12 border border-neutral-800 bg-neutral-800/50 hover:bg-neutral-800 hover:border-neutral-700 text-base sm:text-lg font-bold transition-all active:scale-90"
                      >
                        {n}
                      </Button>
                    ))}
                  </div>

                  {/* Keyboard hint - only on desktop */}
                  {isPlayerTurn && (
                    <p className="text-center text-[10px] font-bold text-neutral-700 uppercase tracking-widest hidden sm:block">
                      ⌨ Type digits · Backspace to erase · Enter to submit
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex gap-3 p-4 bg-black/10 border-t border-neutral-800/50">
                  <Button
                    onClick={clearInput}
                    variant="outline"
                    disabled={!isPlayerTurn || makeMoveMutation.isPending}
                    className="flex-1 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white h-11 rounded-xl"
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5" />
                    Erase
                  </Button>
                  <Button
                    onClick={handleGuess}
                    disabled={!isPlayerTurn || !isComplete() || makeMoveMutation.isPending}
                    className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 shadow-lg shadow-emerald-900/20 rounded-xl"
                  >
                    {makeMoveMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Submit
                      </div>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* ── GUESS HISTORY - stacked on mobile, side-by-side on sm+ ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* YOUR GUESSES */}
              <div className="flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-3 px-0.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">Your Guesses</h3>
                  </div>
                  <span className="min-w-[22px] text-center text-[10px] font-black tabular-nums text-neutral-600 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-full">
                    {playerMoves.length}
                  </span>
                </div>

                {/* Scroll container - scrollbar-gutter:stable pre-reserves scrollbar space
                    so the card width NEVER changes when the list grows */}
                <div
                  style={{ scrollbarGutter: 'stable' }}
                  className="overflow-y-auto max-h-[420px] space-y-2
                    [&::-webkit-scrollbar]:w-[5px]
                    [&::-webkit-scrollbar-track]:rounded-full
                    [&::-webkit-scrollbar-track]:bg-neutral-900
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb]:bg-neutral-700"
                >
                  <AnimatePresence initial={false}>
                    {playerMoves.length === 0 ? (
                      <div className="text-center py-10 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30">
                        <p className="text-neutral-600 text-xs font-bold uppercase tracking-widest">No guesses yet</p>
                      </div>
                    ) : (
                      playerMoves.map((move) => (
                        <motion.div
                          key={move.id}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18 }}
                          className="group bg-neutral-900 border border-neutral-800 rounded-xl
                                     hover:border-emerald-500/30 transition-colors duration-200 overflow-hidden"
                        >
                          {/* 3-column grid: number | digits | badges
                              The grid col sizes are fixed so adding a scrollbar never collapses. */}
                          <div className="grid items-center gap-x-2 px-3 py-2.5"
                               style={{ gridTemplateColumns: '26px 1fr auto' }}>

                            <span className="text-[10px] font-black text-neutral-700 tabular-nums text-center">
                              #{move.moveNumber}
                            </span>

                            <div className="flex gap-1">
                              {move.guess.split('').map((digit, i) => (
                                <div
                                  key={i}
                                  className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700
                                             group-hover:border-emerald-500/25 flex items-center justify-center
                                             text-sm font-black text-emerald-400 transition-colors shrink-0"
                                >
                                  {digit}
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <div className="flex items-center gap-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-1.5 py-1">
                                <Target className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span className="text-[11px] font-black text-emerald-400 tabular-nums leading-none">{move.correctPositions}</span>
                              </div>
                              <div className="flex items-center gap-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded-md px-1.5 py-1">
                                <Hash className="w-3 h-3 text-yellow-400 shrink-0" />
                                <span className="text-[11px] font-black text-yellow-400 tabular-nums leading-none">{move.correctDigits}</span>
                              </div>
                            </div>
                          </div>

                          {move.correctPositions === 4 && (
                            <div className="bg-emerald-500/10 border-t border-emerald-500/20 px-3 py-1 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Code Cracked!</span>
                            </div>
                          )}
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* OPPONENT / AI GUESSES */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3 px-0.5">
                  <div className="flex items-center gap-2">
                    <CircleDashed className="w-4 h-4 text-blue-500 shrink-0" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                      {isAIGame ? 'AI Attempts' : 'Opponent'}
                    </h3>
                  </div>
                  <span className="min-w-[22px] text-center text-[10px] font-black tabular-nums text-neutral-600 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-full">
                    {opponentMoves.length}
                  </span>
                </div>

                <div
                  style={{ scrollbarGutter: 'stable' }}
                  className="overflow-y-auto max-h-[420px] space-y-2
                    [&::-webkit-scrollbar]:w-[5px]
                    [&::-webkit-scrollbar-track]:rounded-full
                    [&::-webkit-scrollbar-track]:bg-neutral-900
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb]:bg-neutral-700"
                >
                  <AnimatePresence initial={false}>
                    {opponentMoves.length === 0 ? (
                      <div className="text-center py-10 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30">
                        <p className="text-neutral-600 text-xs font-bold uppercase tracking-widest">No guesses yet</p>
                      </div>
                    ) : (
                      opponentMoves.map((move) => (
                        <motion.div
                          key={move.id}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18 }}
                          className="group bg-neutral-900 border border-neutral-800 rounded-xl
                                     hover:border-blue-500/30 transition-colors duration-200 overflow-hidden"
                        >
                          <div className="grid items-center gap-x-2 px-3 py-2.5"
                               style={{ gridTemplateColumns: '26px 1fr auto' }}>

                            <span className="text-[10px] font-black text-neutral-700 tabular-nums text-center">
                              #{move.moveNumber}
                            </span>

                            <div className="flex gap-1 opacity-85">
                              {move.guess.split('').map((digit, i) => (
                                <div
                                  key={i}
                                  className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700
                                             group-hover:border-blue-500/25 flex items-center justify-center
                                             text-sm font-black text-blue-400 transition-colors shrink-0"
                                >
                                  {digit}
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <div className="flex items-center gap-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md px-1.5 py-1">
                                <Target className="w-3 h-3 text-blue-400 shrink-0" />
                                <span className="text-[11px] font-black text-blue-400 tabular-nums leading-none">{move.correctPositions}</span>
                              </div>
                              <div className="flex items-center gap-0.5 bg-neutral-800 border border-neutral-700 rounded-md px-1.5 py-1">
                                <Hash className="w-3 h-3 text-neutral-500 shrink-0" />
                                <span className="text-[11px] font-black text-neutral-400 tabular-nums leading-none">{move.correctDigits}</span>
                              </div>
                            </div>
                          </div>

                          {move.correctPositions === 4 && (
                            <div className="bg-blue-500/10 border-t border-blue-500/20 px-3 py-1 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-blue-400" />
                              <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">
                                {isAIGame ? 'AI Cracked It!' : 'They Cracked It!'}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>

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




