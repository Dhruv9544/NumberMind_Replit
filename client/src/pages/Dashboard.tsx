import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, Trophy, Zap, Bell, BarChart3, User, Bot, Users, Globe } from 'lucide-react';

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
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">NumberMind</h1>
            <p className="text-purple-200 text-sm font-medium">@{user?.username || 'Player'}</p>
          </div>
          <div className="flex gap-1">
            <Button
              onClick={() => setLocation('/leaderboard')}
              variant="ghost"
              size="icon"
              className="text-purple-200 hover:text-white hover:bg-purple-500/20 rounded-xl"
            >
              <BarChart3 className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setLocation('/profile')}
              variant="ghost"
              size="icon"
              className="text-purple-200 hover:text-white hover:bg-purple-500/20 rounded-xl"
            >
              <User className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setLocation('/notifications')}
              variant="ghost"
              size="icon"
              className="relative text-purple-200 hover:text-white hover:bg-purple-500/20 rounded-xl"
            >
              <Bell className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-purple-200 hover:text-white hover:bg-purple-500/20 rounded-xl"
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Pending Challenges Alert */}
        {pendingCount > 0 && (
          <Card 
            className="mb-6 border-yellow-500/30 bg-yellow-500/10 backdrop-blur cursor-pointer hover:bg-yellow-500/20 transition-all"
            onClick={() => setLocation('/challenges')}
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Bell className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-yellow-300 font-bold">{pendingCount} Pending Challenge{pendingCount > 1 ? 's' : ''}</p>
                    <p className="text-yellow-200/70 text-sm">Tap to view and accept</p>
                  </div>
                </div>
                <div className="bg-yellow-500 text-slate-900 px-3 py-1 rounded-full text-sm font-bold">
                  View
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Player Stats Card */}
        <Card className="mb-6 border-purple-500/20 bg-slate-900/50 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {getInitials()}
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-purple-300 text-sm">@{user?.username}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-purple-500/10">
                <div className="text-2xl font-bold text-purple-400">{user?.stats?.gamesPlayed || 0}</div>
                <div className="text-xs text-purple-200 font-medium">Games</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-blue-500/10">
                <div className="text-2xl font-bold text-blue-400">{user?.stats?.gamesWon || 0}</div>
                <div className="text-xs text-purple-200 font-medium">Wins</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-green-500/10">
                <div className="text-2xl font-bold text-green-400">{winRate}%</div>
                <div className="text-xs text-purple-200 font-medium">Win Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Modes */}
        <div className="space-y-3">
          <h2 className="text-white font-bold text-lg mb-4">Play Now</h2>
          
          {/* Practice vs AI */}
          <button
            onClick={() => handleStartGame('ai')}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-16 rounded-2xl transition-all group flex items-center px-5 shadow-lg hover:shadow-purple-500/20"
            data-testid="button-play-ai"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div className="text-left flex-1">
              <div className="font-bold text-lg">Practice vs AI</div>
              <div className="text-purple-200 text-xs">Improve your skills</div>
            </div>
            <Zap className="w-5 h-5 opacity-50 group-hover:opacity-100" />
          </button>

          {/* Challenge Friend */}
          <button
            onClick={() => handleStartGame('friend')}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-16 rounded-2xl transition-all group flex items-center px-5 shadow-lg hover:shadow-blue-500/20"
            data-testid="button-challenge-friend"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left flex-1">
              <div className="font-bold text-lg">Challenge Friend</div>
              <div className="text-blue-200 text-xs">Invite by @username</div>
            </div>
            <Zap className="w-5 h-5 opacity-50 group-hover:opacity-100" />
          </button>

          {/* Random Opponent */}
          <button
            onClick={() => handleStartGame('random')}
            className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white h-16 rounded-2xl transition-all group flex items-center px-5 shadow-lg hover:shadow-cyan-500/20"
            data-testid="button-random-opponent"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
              <Globe className="w-5 h-5" />
            </div>
            <div className="text-left flex-1">
              <div className="font-bold text-lg">Random Opponent</div>
              <div className="text-cyan-200 text-xs">Play with anyone online</div>
            </div>
            <Zap className="w-5 h-5 opacity-50 group-hover:opacity-100" />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setLocation('/leaderboard')}
            className="inline-flex items-center gap-2 text-purple-300 hover:text-white transition-colors"
          >
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-medium">View Global Leaderboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
