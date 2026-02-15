import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  status: 'waiting' | 'active' | 'finished';
  currentTurn?: string;
  winnerId?: string;
  moves: Move[];
  player1Secret?: string;
  player2Secret?: string;
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
        description: 'Enter a complete 4-digit number',
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

  // Get the maximum number of moves for alignment
  const maxMoves = Math.max(playerMoves.length, opponentMoves.length);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-8">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="sticky top-0 z-20 backdrop-blur-md bg-slate-900/70 border-b border-purple-500/20">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/')}
              className="text-purple-200 hover:text-white hover:bg-purple-500/20 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">NumberMind</h1>
              <p className="text-sm text-purple-300">
                {isGameOver ? (playerWon ? '🎉 You Won!' : '😢 Game Over') : `Turn ${playerMoves.length + opponentMoves.length + 1}`}
              </p>
            </div>
            <div className="text-sm text-purple-300 font-semibold">
              {playerMoves.length}:{opponentMoves.length}
            </div>
          </div>
        </div>

        {isGameOver ? (
          // Game Over Screen
          <div className="max-w-7xl mx-auto px-4 py-16">
            <Card className="border-purple-500/30 bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur">
              <CardContent className="pt-12 pb-12 text-center">
                <div className="text-7xl mb-4">{playerWon ? '🎉' : '😢'}</div>
                <h2 className="text-4xl font-bold text-white mb-2">
                  {playerWon ? 'You Found The Code!' : 'Code Not Found'}
                </h2>
                <p className="text-purple-200 mb-4 text-lg">
                  {playerWon
                    ? `You cracked it in ${playerMoves.length} ${playerMoves.length === 1 ? 'guess' : 'guesses'}!`
                    : `Opponent guessed your code! Their secret number was ${
                        (user?.id === game.player1Id ? game.player2Secret : game.player1Secret) || '????'
                      }`}
                </p>
                <p className="text-purple-300 mb-8">Final Score: You {playerMoves.length} - {opponentMoves.length} {isAIGame ? 'AI' : 'Opponent'}</p>
                <Button
                  onClick={() => setLocation('/')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold h-12 px-8 rounded-lg"
                >
                  Play Again
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Main Game Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Your Guesses */}
              <div className="lg:col-span-1 space-y-3">
                <div className="px-2">
                  <h3 className="text-sm font-bold text-purple-200 uppercase tracking-wider">Your Guesses</h3>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {playerMoves.length === 0 ? (
                    <div className="text-center py-8 text-purple-300">No guesses yet</div>
                  ) : (
                    playerMoves.map((move, idx) => (
                      <div
                        key={move.id}
                        className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/30 rounded-lg p-3 hover:border-purple-500/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xs font-bold text-purple-400 w-5 flex-shrink-0">#{playerMoves.length - idx}</span>
                            <div className="flex gap-1">
                              {move.guess.split('').map((digit, i) => (
                                <div
                                  key={i}
                                  className="w-8 h-8 rounded bg-slate-700 text-purple-300 flex items-center justify-center text-sm font-bold"
                                >
                                  {digit}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold min-w-10 text-center">
                              ✓{move.correctPositions}
                            </div>
                            <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-bold min-w-10 text-center">
                              ◆{move.correctDigits}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* VS Divider */}
              <div className="hidden lg:flex flex-col items-center justify-center">
                <div className="flex-1" />
                <div className="text-purple-400 text-lg font-bold py-4">VS</div>
                <div className="flex-1" />
              </div>

              {/* Opponent Guesses */}
              <div className="lg:col-span-1 space-y-3">
                <div className="px-2">
                  <h3 className="text-sm font-bold text-blue-200 uppercase tracking-wider">
                    {isAIGame ? 'AI Guesses' : "Opponent's Guesses"}
                  </h3>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {opponentMoves.length === 0 ? (
                    <div className="text-center py-8 text-blue-300">No guesses yet</div>
                  ) : (
                    opponentMoves.map((move, idx) => (
                      <div
                        key={move.id}
                        className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/30 rounded-lg p-3 hover:border-blue-500/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xs font-bold text-blue-400 w-5 flex-shrink-0">#{opponentMoves.length - idx}</span>
                            <div className="flex gap-1">
                              {move.guess.split('').map((digit, i) => (
                                <div
                                  key={i}
                                  className="w-8 h-8 rounded bg-slate-700 text-blue-300 flex items-center justify-center text-sm font-bold"
                                >
                                  {digit}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold min-w-10 text-center">
                              ✓{move.correctPositions}
                            </div>
                            <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-bold min-w-10 text-center">
                              ◆{move.correctDigits}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Input Section */}
            {isPlayerTurn ? (
              <Card className="border-purple-500/30 bg-slate-900/50 backdrop-blur">
                <CardContent className="p-6 space-y-6">
                  {/* Display Slots */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-purple-300 uppercase">Your Next Guess</label>
                    <div className="flex justify-center gap-3 bg-slate-800/30 p-6 rounded-lg">
                      {digits.map((d, i) => (
                        <button
                          key={i}
                          onClick={() => focusSlot(i)}
                          className={`w-16 h-16 rounded-lg font-bold text-2xl transition-all ${
                            d
                              ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50 scale-100'
                              : 'bg-slate-700/50 text-slate-400 border-2 border-dashed border-slate-600'
                          } ${i === currentSlot ? 'ring-4 ring-purple-400 ring-offset-2 ring-offset-slate-800' : ''}`}
                        >
                          {d || '·'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Keypad */}
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
                      <Button
                        key={n}
                        onClick={() => inputDigit(n.toString())}
                        className="h-12 text-xl font-bold bg-slate-700 hover:bg-slate-600 text-white transition-all active:scale-95"
                      >
                        {n}
                      </Button>
                    ))}
                  </div>

                  {/* Controls */}
                  <div className="flex gap-3">
                    <Button
                      onClick={clearInput}
                      variant="outline"
                      className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 h-12"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                    <Button
                      onClick={handleGuess}
                      disabled={!isComplete() || makeMoveMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold h-12 disabled:opacity-50 rounded-lg"
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
                </CardContent>
              </Card>
            ) : (
              <Card className="border-purple-500/30 bg-slate-900/50 backdrop-blur">
                <CardContent className="py-12 text-center">
                  <div className="inline-block mb-4">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                  <p className="text-purple-300 font-semibold mb-1 text-lg">
                    {isAIGame ? '🤖 AI is thinking...' : '👤 Opponent is playing...'}
                  </p>
                  <p className="text-purple-400 text-sm">Analyzing your secret number...</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
