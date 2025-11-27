import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trophy, Target, TrendingUp, Flame, Zap } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  username?: string;
  email: string;
  avatar?: string;
  bio?: string;
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
    currentStreak: number;
    bestStreak: number;
    totalGuesses: number;
    averageGuesses: number;
  };
}

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['/api/profile', userId],
    enabled: !!userId,
  });

  const { data: myProfile } = useQuery<UserProfile>({
    queryKey: ['/api/profile'],
    enabled: !userId,
  });

  const displayProfile = profile || myProfile;

  if (!displayProfile) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getInitials = () => {
    if (displayProfile.username) {
      return displayProfile.username.slice(0, 2).toUpperCase();
    }
    return displayProfile.name?.[0]?.toUpperCase() || 'P';
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/')}
          className="text-purple-200 hover:text-white hover:bg-purple-500/20 mb-8"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Profile Card */}
        <Card className="mb-6 border-purple-500/20 bg-slate-900/50 backdrop-blur">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                {getInitials()}
              </div>
              <h1 className="text-3xl font-bold text-white">{displayProfile.name}</h1>
              {displayProfile.username && (
                <p className="text-lg text-purple-300 font-medium">@{displayProfile.username}</p>
              )}
              {displayProfile.bio && <p className="text-purple-200 mt-2">{displayProfile.bio}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
            <CardContent className="p-6 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-purple-400 mb-1" data-testid="text-games-played">
                {displayProfile.stats.gamesPlayed}
              </div>
              <p className="text-sm text-purple-200">Games Played</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-slate-900/50 backdrop-blur">
            <CardContent className="p-6 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-green-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-green-400 mb-1" data-testid="text-games-won">
                {displayProfile.stats.gamesWon}
              </div>
              <p className="text-sm text-purple-200">Wins</p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-slate-900/50 backdrop-blur">
            <CardContent className="p-6 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-blue-400 mb-1" data-testid="text-win-rate">
                {displayProfile.stats.winRate}%
              </div>
              <p className="text-sm text-purple-200">Win Rate</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20 bg-slate-900/50 backdrop-blur">
            <CardContent className="p-6 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-3xl font-bold text-yellow-400 mb-1" data-testid="text-current-streak">
                {displayProfile.stats.currentStreak}
              </div>
              <p className="text-sm text-purple-200">Current Streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              Detailed Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-purple-500/20">
              <span className="text-purple-200">Best Win Streak</span>
              <span className="text-white font-bold text-lg" data-testid="text-best-streak">
                {displayProfile.stats.bestStreak} 🔥
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-purple-500/20">
              <span className="text-purple-200">Total Guesses Made</span>
              <span className="text-white font-bold text-lg" data-testid="text-total-guesses">
                {displayProfile.stats.totalGuesses}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-purple-200">Average Guesses Per Game</span>
              <span className="text-white font-bold text-lg" data-testid="text-avg-guesses">
                {displayProfile.stats.averageGuesses || '-'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
