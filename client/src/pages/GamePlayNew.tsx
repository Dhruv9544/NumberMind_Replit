import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNumberInput } from '@/components/GameComponents';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';

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
  player1Secret?: string;
  player2Secret?: string;
  gameMode: string;
  difficulty: string;
  status: 'waiting' | 'active' | 'finished';
  currentTurn?: string;
  winnerId?: string;
  moves: Move[];
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

export default function GamePlay() {
  const { user } = useAuth();
  const { gameId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { digits, currentSlot, inputDigit, clearInput, getValue, isComplete, focusSlot } = useNumberInput();

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
      clearInput();
      setTimeout(() => refetch(), 500);
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            className="text-purple-200 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-white">
            {isGameOver ? (playerWon ? '🎉 You Won!' : '😢 You Lost') : 'Game In Progress'}
          </h1>
          <div className="w-10" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Your Guesses */}
          <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Your Guesses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {playerMoves.length === 0 ? (
                <p className="text-purple-200 text-sm">No guesses yet</p>
              ) : (
                playerMoves.map(m => (
                  <div key={m.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded">
                    <span className="font-mono font-bold text-purple-300">{m.guess}</span>
                    <div className="flex gap-3 text-sm">
                      <span className="text-green-400">✓{m.correctPositions}</span>
                      <span className="text-yellow-400">●{m.correctDigits}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Opponent Guesses */}
          <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">
                {game.player2Id === 'AI' ? 'AI Guesses' : "Opponent's Guesses"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {opponentMoves.length === 0 ? (
                <p className="text-purple-200 text-sm">No guesses yet</p>
              ) : (
                opponentMoves.map(m => (
                  <div key={m.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded">
                    <span className="font-mono font-bold text-blue-300">{m.guess}</span>
                    <div className="flex gap-3 text-sm">
                      <span className="text-green-400">✓{m.correctPositions}</span>
                      <span className="text-yellow-400">●{m.correctDigits}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Input Section */}
        {!isGameOver && (
          <Card className="mt-6 border-purple-500/20 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">
                {isPlayerTurn ? 'Your Turn - Make a Guess' : 'Opponent is thinking...'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPlayerTurn ? (
                <div className="space-y-4">
                  <div className="flex justify-center gap-2">
                    {digits.map((d, i) => (
                      <button
                        key={i}
                        onClick={() => focusSlot(i)}
                        className={`w-14 h-14 rounded-lg font-bold text-lg transition-all ${
                          d
                            ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                            : 'bg-slate-700 text-slate-400'
                        } ${i === currentSlot ? 'ring-2 ring-purple-400 scale-110' : ''}`}
                      >
                        {d || '•'}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                      <Button
                        key={n}
                        onClick={() => inputDigit(n.toString())}
                        disabled={digits.includes(n.toString())}
                        className="h-10 bg-slate-700 hover:bg-slate-600 disabled:opacity-30"
                      >
                        {n}
                      </Button>
                    ))}
                    <Button
                      onClick={() => inputDigit('0')}
                      disabled={digits.includes('0')}
                      className="col-span-2 h-10 bg-slate-700 hover:bg-slate-600 disabled:opacity-30"
                    >
                      0
                    </Button>
                    <Button onClick={clearInput} variant="destructive" className="h-10">
                      ⌫
                    </Button>
                  </div>

                  <Button
                    onClick={handleGuess}
                    disabled={!isComplete() || makeMoveMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 font-semibold"
                  >
                    {makeMoveMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Guess
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-blue-500 rounded-full" />
                  </div>
                  <p className="text-purple-200 mt-4">Waiting for opponent...</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Game Over */}
        {isGameOver && (
          <Card className="mt-6 border-purple-500/20 bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur">
            <CardContent className="pt-8 text-center">
              <p className="text-white text-xl font-bold mb-4">
                {playerWon ? 'You cracked the code!' : 'Opponent found your secret!'}
              </p>
              <Button
                onClick={() => setLocation('/')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
