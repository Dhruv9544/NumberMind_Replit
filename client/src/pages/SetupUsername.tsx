import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function SetupUsername() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState('');

  const setUsernameMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/set-username', { username });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Username Set!',
        description: `Welcome, ${username}!`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to set username',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      toast({
        title: 'Invalid Username',
        description: 'Username must be at least 3 characters',
        variant: 'destructive',
      });
      return;
    }
    setUsernameMutation.mutate();
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl">Welcome to NumberMind!</CardTitle>
            <CardDescription className="text-purple-200 mt-2">
              Hi {user?.firstName || 'Player'}, let's set up your username
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Your Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g., mastermind_pro"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none placeholder-slate-500 transition-all"
                  autoFocus
                />
                <p className="text-xs text-purple-300 mt-2">
                  • 3-20 characters • Letters, numbers, underscores only
                </p>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mt-4">
                <p className="text-xs text-purple-200">
                  Your username is how friends will find and challenge you. Choose something memorable!
                </p>
              </div>

              <Button
                type="submit"
                disabled={username.length < 3 || setUsernameMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-11 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {setUsernameMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting Up...
                  </>
                ) : (
                  'Continue to Game'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-purple-300">
          <p>This username will appear on the leaderboard and in challenges</p>
        </div>
      </div>
    </div>
  );
}
