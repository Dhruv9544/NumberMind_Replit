import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNumberInput } from '@/components/GameComponents';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Loader2, RotateCcw } from 'lucide-react';

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
  difficulty: string;
  status: 'waiting' | 'active' | 'finished';
  currentTurn?: string;
  winnerId?: string;
  moves: Move[];
}

export default function GamePlay() {
  const { user } = useAuth();
  const { gameId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { digits, currentSlot, inputDigit, clearInput, getValue, isComplete, focusSlot, reset } = useNumberInput();

  const { data: game, refetch } = useQuery<GameState>({
    queryKey: ['/api/games', gameId],
    enabled: !!gameId,
    refetchInterval: 1000,
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

  const handleGuess = () => {
    if (!isComplete()) {
      toast({
        title: 'Invalid Guess',
        description: 'Enter a complete 4-digit number with unique digits',
        variant: 'destructive',
      });
      return;
    }
    makeMoveMutation.mutate({ guess: getValue() });
  };

  if (!game) return <div className="w-full h-screen flex items-center justify-center bg-slate-900" />;

  const playerMoves = game.moves.filter(m => m.playerId === user?.id);
  const opponentMoves = game.moves.filter(m => m.playerId !== user?.id);
  const isPlayerTurn = game.currentTurn === user?.id;
  const isGameOver = game.status === 'finished';
  const playerWon = game.winnerId === user?.id;
  const isAIGame = game.player2Id === 'AI';

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            className="text-purple-200 hover:text-white hover:bg-purple-500/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-1">NumberMind</h1>
            <p className="text-purple-200 text-sm">
              {isGameOver ? (playerWon ? '🎉 You Won!' : '😢 You Lost') : 'Crack the Code'}
            </p>
          </div>
          <div className="w-10" />
        </div>

        {isGameOver ? (
          // Game Over Screen
          <Card className="border-purple-500/30 bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="text-6xl mb-4">{playerWon ? '🎉' : '😢'}</div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {playerWon ? 'You Found The Code!' : 'Code Not Found'}
              </h2>
              <p className="text-purple-200 mb-8">
                {playerWon
                  ? `You cracked the code in ${playerMoves.length} ${playerMoves.length === 1 ? 'guess' : 'guesses'}!`
                  : `The correct number was: ${game.moves.find(m => m.playerId === (isAIGame ? 'AI' : opponentMoves[0]?.playerId))?.guess || '????'}`}
              </p>
              <Button
                onClick={() => setLocation('/')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold h-12 px-8"
              >
                Play Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Your Guesses History */}
            <Card className="lg:col-span-1 border-purple-500/20 bg-slate-900/50 backdrop-blur h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Your Guesses</CardTitle>
                <p className="text-purple-300 text-sm mt-1">{playerMoves.length} guesses so far</p>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {playerMoves.length === 0 ? (
                  <p className="text-purple-300 text-sm text-center py-8">No guesses yet</p>
                ) : (
                  playerMoves.map((m, idx) => (
                    <div key={m.id} className="bg-slate-800/50 rounded-lg p-3 border border-purple-500/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-lg text-purple-300">{m.guess}</span>
                        <span className="text-xs text-purple-400">#{playerMoves.length - idx}</span>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1 bg-green-500/20 rounded px-2 py-1 text-center">
                          <div className="text-green-400 font-bold text-sm">🟢 {m.correctPositions}</div>
                          <div className="text-green-300 text-xs">Exact</div>
                        </div>
                        <div className="flex-1 bg-yellow-500/20 rounded px-2 py-1 text-center">
                          <div className="text-yellow-400 font-bold text-sm">🟡 {m.correctDigits}</div>
                          <div className="text-yellow-300 text-xs">Wrong Spot</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Opponent Guesses History */}
            <Card className="lg:col-span-1 border-purple-500/20 bg-slate-900/50 backdrop-blur h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">
                  {isAIGame ? 'AI Guesses' : "Opponent's Guesses"}
                </CardTitle>
                <p className="text-purple-300 text-sm mt-1">{opponentMoves.length} guesses</p>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {opponentMoves.length === 0 ? (
                  <p className="text-purple-300 text-sm text-center py-8">No guesses yet</p>
                ) : (
                  opponentMoves.map((m, idx) => (
                    <div key={m.id} className="bg-slate-800/50 rounded-lg p-3 border border-blue-500/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-lg text-blue-300">{m.guess}</span>
                        <span className="text-xs text-blue-400">#{opponentMoves.length - idx}</span>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1 bg-green-500/20 rounded px-2 py-1 text-center">
                          <div className="text-green-400 font-bold text-sm">🟢 {m.correctPositions}</div>
                          <div className="text-green-300 text-xs">Exact</div>
                        </div>
                        <div className="flex-1 bg-yellow-500/20 rounded px-2 py-1 text-center">
                          <div className="text-yellow-400 font-bold text-sm">🟡 {m.correctDigits}</div>
                          <div className="text-yellow-300 text-xs">Wrong Spot</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Input Section */}
            <Card className="lg:col-span-1 border-purple-500/20 bg-slate-900/50 backdrop-blur h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-white">
                  {isPlayerTurn ? 'Make Your Guess' : 'Opponent Turn'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isPlayerTurn ? (
                  <div className="space-y-4">
                    {/* Display Slots */}
                    <div className="flex justify-center gap-2 bg-slate-800/30 p-4 rounded-lg">
                      {digits.map((d, i) => (
                        <button
                          key={i}
                          onClick={() => focusSlot(i)}
                          className={`w-12 h-12 rounded-lg font-bold text-lg transition-all ${
                            d
                              ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50'
                              : 'bg-slate-700/50 text-slate-400 border-2 border-dashed border-slate-600'
                          } ${
                            i === currentSlot
                              ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-800 scale-110'
                              : 'hover:scale-105'
                          }`}
                          data-testid={`input-slot-${i}`}
                        >
                          {d || '·'}
                        </button>
                      ))}
                    </div>

                    {/* Legend */}
                    <div className="bg-slate-800/30 p-3 rounded text-xs space-y-1 text-purple-300">
                      <div>🟢 = Correct digit & correct position</div>
                      <div>🟡 = Correct digit & wrong position</div>
                      <div>⚫ = Digit not in the number</div>
                    </div>

                    {/* Keypad */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Button
                            key={n}
                            onClick={() => inputDigit(n.toString())}
                            className="h-10 bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all hover:scale-105"
                            data-testid={`keypad-${n}`}
                          >
                            {n}
                          </Button>
                        ))}
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {[6, 7, 8, 9, 0].map(n => (
                          <Button
                            key={n}
                            onClick={() => inputDigit(n.toString())}
                            className="h-10 bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all hover:scale-105"
                            data-testid={`keypad-${n}`}
                          >
                            {n}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2">
                      <Button
                        onClick={clearInput}
                        variant="outline"
                        className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                        data-testid="button-clear"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                      <Button
                        onClick={handleGuess}
                        disabled={!isComplete() || makeMoveMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold disabled:opacity-50"
                        data-testid="button-submit"
                      >
                        {makeMoveMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-block mb-4">
                      <div className="w-12 h-12 border-4 border-purple-500 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                    <p className="text-purple-300 font-semibold mb-2">
                      {isAIGame ? 'AI is thinking...' : 'Opponent is playing...'}
                    </p>
                    <p className="text-purple-400 text-sm">
                      {isAIGame ? '🤖' : '👤'} Analyzing your secret...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
