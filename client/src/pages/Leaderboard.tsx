import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Trophy, Target, TrendingUp, Crown, Medal, Award, Users } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  stats: {
    gamesWon: number;
    winRate: number;
    gamesPlayed: number;
    currentStreak: number;
  };
}

export default function Leaderboard() {
  const [, setLocation] = useLocation();
  
  const { data: leaderboard = [], isLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard'],
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-purple-300 font-bold">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/40';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/40';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/40';
      default:
        return 'border-purple-500/20 bg-slate-900/50';
    }
  };

  const getInitials = (user: LeaderboardUser) => {
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return user.name?.[0]?.toUpperCase() || 'P';
  };

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
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-400" />
              Leaderboard
            </h1>
            <p className="text-purple-200">Top players ranked by wins and win rate</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leaderboard.length === 0 ? (
          <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
            <CardContent className="py-16 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">No Players Yet</h3>
              <p className="text-purple-300 mb-6">Be the first to complete a game and appear on the leaderboard!</p>
              <Button
                onClick={() => setLocation('/')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
              >
                Start Playing
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((user, idx) => (
              <Card
                key={user.id}
                className={`${getRankBg(idx + 1)} backdrop-blur hover:scale-[1.01] transition-all cursor-pointer`}
                onClick={() => setLocation(`/profile/${user.id}`)}
                data-testid={`card-leaderboard-${idx}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 flex items-center justify-center">
                        {getRankIcon(idx + 1)}
                      </div>
                      
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg">
                        {getInitials(user)}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-bold text-white text-lg">
                          {user.username ? `@${user.username}` : user.name}
                        </h3>
                        <p className="text-sm text-purple-300">
                          {user.stats.gamesPlayed} games played
                          {user.stats.currentStreak > 0 && (
                            <span className="ml-2 text-yellow-400">🔥 {user.stats.currentStreak} streak</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Target className="w-4 h-4 text-green-400" />
                          <span className="text-2xl font-bold text-green-400" data-testid={`text-wins-${idx}`}>
                            {user.stats.gamesWon}
                          </span>
                        </div>
                        <p className="text-xs text-purple-300">Wins</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingUp className="w-4 h-4 text-blue-400" />
                          <span className="text-2xl font-bold text-blue-400" data-testid={`text-winrate-${idx}`}>
                            {user.stats.winRate}%
                          </span>
                        </div>
                        <p className="text-xs text-purple-300">Win Rate</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
