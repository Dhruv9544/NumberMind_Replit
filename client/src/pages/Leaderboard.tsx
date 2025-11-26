import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trophy, Target, TrendingUp } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar?: string;
  stats: {
    gamesWon: number;
    winRate: number;
    gamesPlayed: number;
  };
}

export default function Leaderboard() {
  const [, setLocation] = useLocation();
  
  const { data: leaderboard = [] } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard'],
  });

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
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
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-400" />
              Leaderboard
            </h1>
            <p className="text-purple-200">Top players by wins and win rate</p>
          </div>
        </div>

        <div className="space-y-2">
          {leaderboard.map((user, idx) => (
            <Card
              key={user.id}
              className="border-purple-500/20 bg-slate-900/50 backdrop-blur hover:border-purple-500/50 transition-all cursor-pointer"
              onClick={() => setLocation(`/profile/${user.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                      #{idx + 1}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{user.name}</h3>
                      <p className="text-sm text-purple-300">{user.stats.gamesPlayed} games played</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Target className="w-4 h-4 text-green-400" />
                        <span className="text-2xl font-bold text-green-400">{user.stats.gamesWon}</span>
                      </div>
                      <p className="text-xs text-purple-300">Wins</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                        <span className="text-2xl font-bold text-blue-400">{user.stats.winRate}%</span>
                      </div>
                      <p className="text-xs text-purple-300">Win Rate</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
