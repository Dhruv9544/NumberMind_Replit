import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Play, Loader2 } from 'lucide-react';

export default function JoinGame() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [gameCode, setGameCode] = useState('');

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!gameCode.trim()) {
        throw new Error('Please enter a game code');
      }
      
      const response = await apiRequest('POST', `/api/games/join/${gameCode.trim().toUpperCase()}`, {});
      return response.json();
    },
    onSuccess: (game) => {
      setLocation(`/game/setup?mode=join&gameId=${game.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Join Failed',
        description: error.message || 'Invalid game code or game not available',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    joinMutation.mutate();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      </div>

      <div className="relative z-10 max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            className="text-purple-200 hover:text-white hover:bg-purple-500/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Join Game</h1>
            <p className="text-purple-200 text-sm">Enter the game code from your friend</p>
          </div>
        </div>

        <Card className="mb-6 border-purple-500/20 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white text-lg">Game Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-purple-200 text-sm">Ask your friend for their game code (e.g., ABC12345)</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Enter game code"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white placeholder-slate-400 border border-purple-500/30 focus:border-purple-500 focus:outline-none text-center text-2xl font-mono font-bold tracking-widest"
              />

              <Button
                type="submit"
                disabled={!gameCode.trim() || joinMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-12 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {joinMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Join Game
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white text-sm">How it works</CardTitle>
          </CardHeader>
          <CardContent className="text-purple-200 text-sm space-y-2">
            <p>• Your friend challenges you</p>
            <p>• They get a game code</p>
            <p>• Enter the code here to join</p>
            <p>• You'll have 5 minutes to respond</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
