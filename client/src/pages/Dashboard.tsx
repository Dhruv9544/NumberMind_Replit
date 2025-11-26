import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Play, Trophy, Zap, Bell, BarChart3, User } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: challenges = [] } = useQuery({
    queryKey: ['/api/challenges'],
    refetchInterval: 2000,
  });
  
  const pendingCount = challenges.filter((c: any) => c.status === 'pending').length;

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const handleStartGame = (mode: string) => {
    setLocation(`/game/setup?mode=${mode}`);
  };

  const winRate = user?.stats?.gamesPlayed && user.stats.gamesPlayed > 0
    ? Math.round((user.stats.gamesWon / user.stats.gamesPlayed) * 100)
    : 0;

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'P';
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">NumberMind</h1>
            <p className="text-purple-200 text-sm">Welcome back, {user?.firstName || 'Player'}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setLocation('/leaderboard')}
              variant="ghost"
              size="icon"
              className="text-purple-200 hover:text-white hover:bg-purple-500/20"
            >
              <BarChart3 className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setLocation('/profile')}
              variant="ghost"
              size="icon"
              className="text-purple-200 hover:text-white hover:bg-purple-500/20"
            >
              <User className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setLocation('/notifications')}
              variant="ghost"
              size="icon"
              className="relative text-purple-200 hover:text-white hover:bg-purple-500/20"
            >
              <Bell className="w-5 h-5" />
            </Button>
            {pendingCount > 0 && (
              <Button
                onClick={() => setLocation('/challenges')}
                className="relative bg-yellow-600 hover:bg-yellow-700 text-white gap-2"
              >
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-purple-200 hover:text-white hover:bg-purple-500/20"
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Player Stats Card */}
        <Card className="mb-8 border-purple-500/20 bg-slate-900/50 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {getInitials()}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-purple-200 text-sm">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{user?.stats?.gamesPlayed || 0}</div>
                <div className="text-xs text-purple-200">Games Played</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{user?.stats?.gamesWon || 0}</div>
                <div className="text-xs text-purple-200">Wins</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{winRate}%</div>
                <div className="text-xs text-purple-200">Win Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Modes */}
        <div className="space-y-4 mb-8">
          <h2 className="text-white font-semibold mb-4">Start a Game</h2>
          
          <Button
            onClick={() => handleStartGame('ai')}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-14 rounded-lg transition-all group"
            data-testid="button-play-ai"
          >
            <Zap className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Practice vs AI
          </Button>

          <Button
            onClick={() => handleStartGame('friend')}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-14 rounded-lg transition-all group"
            data-testid="button-challenge-friend"
          >
            <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Challenge Friend
          </Button>

          <Button
            onClick={() => handleStartGame('random')}
            className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white h-14 rounded-lg transition-all group"
            data-testid="button-random-opponent"
          >
            <Trophy className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Random Opponent
          </Button>

          <Button
            onClick={() => setLocation('/join-game')}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white h-14 rounded-lg transition-all group"
          >
            <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Join Game by Code
          </Button>
        </div>
      </div>
    </div>
  );
}
