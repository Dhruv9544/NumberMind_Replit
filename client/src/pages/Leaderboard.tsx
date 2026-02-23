import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Trophy, 
  Target, 
  TrendingUp, 
  Crown, 
  Medal, 
  Award, 
  Users, 
  Search,
  ChevronRight,
  Flame,
  Zap,
  Star,
  Loader2,
  Gamepad2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

import { GameLoader } from '@/components/GameLoader';

export default function Leaderboard() {
  const [, setLocation] = useLocation();
  
  const { data: leaderboard = [], isLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard'],
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-8 h-8 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />;
      case 2:
        return <Medal className="w-8 h-8 text-slate-400 drop-shadow-[0_0_8px_rgba(148,163,184,0.5)]" />;
      case 3:
        return <Award className="w-8 h-8 text-amber-600 drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]" />;
      default:
        return <span className="text-neutral-500 font-black text-sm italic">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'border-yellow-500/30 bg-yellow-500/5 shadow-yellow-500/5';
      case 2:
        return 'border-slate-500/30 bg-slate-500/5 shadow-slate-500/5';
      case 3:
        return 'border-amber-600/30 bg-amber-600/5 shadow-amber-600/5';
      default:
        return 'border-neutral-800 bg-neutral-900/30';
    }
  };

  const getInitials = (user: LeaderboardUser) => {
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return user.name?.[0]?.toUpperCase() || 'P';
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] w-full bg-neutral-950 flex flex-col items-center justify-center">
        <GameLoader text="Fetching Elite Rankings..." />
      </div>
    );
  }
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-neutral-950 text-neutral-50 pb-12 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Background radial effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] -translate-x-1/2" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all active:scale-95 group">
              <ArrowLeft className="w-5 h-5 text-neutral-400 group-hover:text-emerald-400" />
            </Link>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500 mb-1">Global Rankings</p>
              <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 italic uppercase">
                 Hall of <span className="text-emerald-500">Fame</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                   <Users className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase text-neutral-500 leading-none">Total Contenders</p>
                   <p className="text-sm font-black">{leaderboard.length} Players</p>
                </div>
             </div>
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <Card className="border-neutral-800 bg-neutral-900/30 backdrop-blur-sm border-dashed rounded-[2.5rem]">
            <CardContent className="py-20 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mb-6">
                 <Search className="w-8 h-8 text-neutral-600" />
              </div>
              <h3 className="text-2xl font-black mb-2 uppercase italic">No Contenders Found</h3>
              <p className="text-neutral-500 max-w-xs mx-auto mb-8 font-medium">
                The leaderboard is currently empty. Start a match and claim your spot at the top.
              </p>
              <Link href="/game/setup">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-black italic uppercase tracking-wider px-8 h-12 rounded-xl">
                  Initiate Challenge
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {leaderboard.map((user, idx) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  className={cn(
                    "relative overflow-hidden group transition-all duration-300 hover:translate-x-1 cursor-pointer",
                    getRankStyle(idx + 1)
                  )}
                  onClick={() => setLocation(`/profile/${user.id}`)}
                  data-testid={`card-leaderboard-${idx}`}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-6">
                       <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
                          <div className="w-10 sm:w-16 flex items-center justify-center shrink-0">
                             {getRankIcon(idx + 1)}
                          </div>
                          
                          <div className="relative shrink-0">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center text-white font-black text-lg overflow-hidden group-hover:border-emerald-500 transition-colors">
                              {getInitials(user)}
                            </div>
                            {idx < 3 && (
                               <div className="absolute -top-1 -right-1">
                                  <Star className={cn(
                                    "w-4 h-4 fill-current",
                                    idx === 0 ? "text-yellow-500" : idx === 1 ? "text-slate-400" : "text-amber-600"
                                  )} />
                               </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-black text-white text-base sm:text-xl truncate flex items-center gap-2 italic uppercase tracking-tight">
                              {user.username ? `@${user.username}` : user.name}
                              {user.stats.currentStreak >= 3 && (
                                <Badge className="bg-orange-500/10 text-orange-500 border-none px-1 h-4 font-black italic text-[9px]">
                                   ON FIRE
                                </Badge>
                              )}
                            </h3>
                            <div className="flex items-center gap-3 mt-1 underline-offset-4">
                              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                {user.stats.gamesPlayed} Matches Engaged
                              </span>
                              {user.stats.currentStreak > 0 && (
                                <div className="flex items-center gap-1">
                                   <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                                   <span className="text-[10px] font-black text-orange-400">{user.stats.currentStreak} Streak</span>
                                </div>
                              )}
                            </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-6 sm:gap-12 shrink-0">
                          <div className="text-right hidden sm:block">
                             <div className="flex items-center justify-end gap-2 text-emerald-400 mb-1">
                                <Target className="w-4 h-4" />
                                <span className="text-2xl font-black tabular-nums">{user.stats.gamesWon}</span>
                             </div>
                             <p className="text-[10px] font-black uppercase text-neutral-600 tracking-widest">Victories</p>
                          </div>
                          
                          <div className="text-right">
                             <div className="flex items-center justify-end gap-2 text-blue-400 mb-1">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-2xl font-black tabular-nums">{user.stats.winRate}%</span>
                             </div>
                             <p className="text-[10px] font-black uppercase text-neutral-600 tracking-widest">Win Rate</p>
                          </div>
                          
                          <ChevronRight className="w-5 h-5 text-neutral-800 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                       </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

