import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Check, X, Clock } from 'lucide-react';

interface Challenge {
  id: string;
  gameId: string;
  fromPlayerId: string;
  fromPlayerName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expiresAt: string;
}

export default function Challenges() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: challenges = [] } = useQuery<Challenge[]>({
    queryKey: ['/api/challenges'],
    refetchInterval: 2000,
  });

  const acceptMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const response = await apiRequest('POST', `/api/challenges/${challengeId}/accept`, {});
      return response.json();
    },
    onSuccess: (game) => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      setLocation(`/game/setup?mode=join&gameId=${game.id}`);
      toast({
        title: 'Challenge Accepted!',
        description: 'Get ready to play!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept challenge',
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      await apiRequest('POST', `/api/challenges/${challengeId}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      toast({
        title: 'Challenge Rejected',
        description: 'They will be notified',
      });
    },
  });

  const pendingChallenges = challenges.filter(c => c.status === 'pending');

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const minutes = Math.floor((expiry.getTime() - now.getTime()) / 60000);
    return Math.max(0, minutes);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
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
            <h1 className="text-3xl font-bold text-white">Challenge Alerts</h1>
            <p className="text-purple-200">You have {pendingChallenges.length} pending challenge{pendingChallenges.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {pendingChallenges.length === 0 ? (
          <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
            <CardContent className="py-12 text-center">
              <p className="text-purple-300 text-lg">No pending challenges right now</p>
              <Button
                onClick={() => setLocation('/')}
                className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Go Back Home
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingChallenges.map(challenge => {
              const timeRemaining = getTimeRemaining(challenge.expiresAt);
              const isExpired = timeRemaining === 0;

              return (
                <Card
                  key={challenge.id}
                  className="border-purple-500/30 bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur overflow-hidden"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">
                          {challenge.fromPlayerName} challenged you!
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-purple-300">
                          <Clock className="w-4 h-4" />
                          {isExpired ? (
                            <span className="text-red-400">Challenge expired</span>
                          ) : (
                            <span>{timeRemaining} minute{timeRemaining !== 1 ? 's' : ''} remaining</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => acceptMutation.mutate(challenge.id)}
                          disabled={isExpired || acceptMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => rejectMutation.mutate(challenge.id)}
                          disabled={isExpired || rejectMutation.isPending}
                          variant="destructive"
                          className="gap-2"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
