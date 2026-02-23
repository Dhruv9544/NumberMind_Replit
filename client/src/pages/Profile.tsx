import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams, Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Trophy, 
  Target, 
  TrendingUp, 
  Flame, 
  Zap, 
  User, 
  Mail, 
  Calendar, 
  ChevronRight, 
  Star,
  BadgeCheck,
  ShieldCheck,
  LayoutDashboard,
  History,
  Activity,
  Award,
  Loader2,
  Medal
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  createdAt: string;
}

import { GameLoader } from '@/components/GameLoader';

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();

  const { data: profile, isLoading: isProfileLoading } = useQuery<UserProfile>({
    queryKey: ['/api/profile', userId],
    enabled: !!userId,
  });

  const { data: myProfile, isLoading: isMyProfileLoading } = useQuery<UserProfile>({
    queryKey: ['/api/profile'],
    enabled: !userId,
  });

  const displayProfile = profile || myProfile;
  const isLoading = userId ? isProfileLoading : isMyProfileLoading;
  const effectiveUserId = userId || (currentUser?.id);

  const { data: achievements = [] } = useQuery<any[]>({
    queryKey: ['/api/profile', effectiveUserId, 'achievements'],
    queryFn: async () => {
       const res = await fetch(`/api/profile/${effectiveUserId}/achievements`);
       if (!res.ok) return [];
       return res.json();
    },
    enabled: !!effectiveUserId,
  });

  const { data: history = [] } = useQuery<any[]>({
    queryKey: ['/api/games/history', effectiveUserId],
    queryFn: async () => {
       const res = await fetch(`/api/games/history?userId=${effectiveUserId}&limit=5`);
       if (!res.ok) return [];
       return res.json();
    },
    enabled: !!effectiveUserId,
  });

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-neutral-950">
        <GameLoader text="Syncing Stats Command..." />
      </div>
    );
  }

  if (!displayProfile) {
    return (
       <div className="w-full h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-neutral-950 p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6">
             <User className="w-8 h-8 text-neutral-600" />
          </div>
          <h2 className="text-2xl font-black uppercase italic mb-2">Profile Not Found</h2>
          <p className="text-neutral-500 max-w-xs mb-8">This operative's identity cannot be verified on the current network.</p>
          <Link href="/">
             <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-black italic uppercase tracking-wider px-8 h-12 rounded-xl">
                Return to Dashboard
             </Button>
          </Link>
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
    <div className="min-h-[calc(100vh-4rem)] w-full bg-neutral-950 text-neutral-50 pb-12 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Background radial effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/" className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all active:scale-95 group">
            <ArrowLeft className="w-5 h-5 text-neutral-400 group-hover:text-emerald-400" />
          </Link>
          <div className="flex-1">
             <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">Operative Record</p>
             <h1 className="text-3xl font-black tracking-tight italic uppercase italic">
                {userId ? "Player" : "Your"} <span className="text-blue-500">Profile</span>
             </h1>
          </div>
        </div>

        {/* Profile Command Header */}
        <Card className="mb-8 border-neutral-800 bg-neutral-900/5 backdrop-blur-sm overflow-hidden rounded-[2.5rem] border-dashed">
          <CardContent className="p-8 sm:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
               <div className="relative flex-shrink-0">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] bg-neutral-900 border-4 border-neutral-800 flex items-center justify-center text-white font-black text-5xl shadow-2xl relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 drop-shadow-2xl">{getInitials()}</span>
                  </motion.div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-emerald-500 border-4 border-neutral-900 flex items-center justify-center shadow-lg">
                     <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
               </div>

               <div className="text-center md:text-left flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                     <h2 className="text-4xl sm:text-5xl font-black text-white italic tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                        {displayProfile.username || displayProfile.name}
                     </h2>
                     <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 h-6 font-black italic text-xs">
                        RANK Lvl 42
                     </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-neutral-500 font-bold uppercase tracking-widest text-xs">
                     <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500/50" />
                        <span>System Status: Online</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500/50 fill-yellow-500/10" />
                        <span>MVP Status: Certified</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500/50" />
                        <span>Joined {new Date(displayProfile.createdAt).getFullYear()}</span>
                     </div>
                  </div>

                  {displayProfile.bio && (
                     <p className="mt-6 text-neutral-400 font-medium max-w-lg leading-relaxed text-sm">
                        "{displayProfile.bio}"
                     </p>
                  )}
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Tactical Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           {[
             { label: "Matches", value: displayProfile.stats.gamesPlayed, icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
             { label: "Victories", value: displayProfile.stats.gamesWon, icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/5", border: "border-yellow-500/20" },
             { label: "Win Rate", value: `${displayProfile.stats.winRate}%`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/20" },
             { label: "Current Hit", value: displayProfile.stats.currentStreak, icon: Flame, color: "text-orange-500", bg: "bg-orange-500/5", border: "border-orange-500/20" }
           ].map((stat, i) => (
             <Card key={i} className={cn("bg-neutral-900 backdrop-blur-sm group hover:scale-[1.02] transition-all", stat.bg, stat.border)}>
               <CardContent className="p-6 text-center flex flex-col items-center">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner", stat.bg)}>
                     <stat.icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                  <div className={cn("text-3xl font-black mb-1 tabular-nums", stat.color)}>{stat.value}</div>
                  <p className="text-[10px] font-black uppercase text-neutral-500 tracking-wider font-mono">{stat.label}</p>
               </CardContent>
             </Card>
           ))}
        </div>

        {/* Detailed Intelligence */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <Card className="md:col-span-2 border-neutral-800 bg-neutral-900 border-dashed rounded-3xl overflow-hidden">
             <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black italic text-white flex items-center gap-3 uppercase tracking-tighter">
                   <Zap className="w-5 h-5 text-emerald-500" />
                   Performance Metrics
                </CardTitle>
                <CardDescription className="font-bold text-[10px] uppercase text-neutral-600 tracking-widest">In-depth behavioral analysis</CardDescription>
             </CardHeader>
             <CardContent className="px-8 pb-8 space-y-2">
                {[
                  { label: "Max Consecutive Wins", value: displayProfile.stats.bestStreak, suffix: " Matches", color: "text-orange-500" },
                  { label: "Total Guesses Logged", value: displayProfile.stats.totalGuesses, color: "text-blue-500" },
                  { label: "Efficiency Rating (Avg Guesses)", value: displayProfile.stats.averageGuesses || "-", color: "text-emerald-500" },
                  { label: "Fastest Breach Detected", value: "24s", color: "text-purple-500" }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-4 border-b border-neutral-800 last:border-0 group">
                    <span className="text-xs font-black uppercase text-neutral-500 tracking-wider">{item.label}</span>
                    <span className={cn("font-black text-xl tabular-nums italic group-hover:scale-110 transition-transform", item.color)}>
                      {item.value}<span className="text-[10px] ml-1">{item.suffix || ""}</span>
                    </span>
                  </div>
                ))}
             </CardContent>
           </Card>

           <div className="space-y-4">
              <Card className="border-neutral-800 bg-neutral-900/50 rounded-3xl overflow-hidden group hover:border-emerald-500/20 transition-all">
                <CardHeader className="p-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Award className="w-4 h-4 text-emerald-500" />
                         </div>
                         <h3 className="font-black italic uppercase text-sm">Achievements</h3>
                      </div>
                      <span className="text-xs font-bold text-neutral-600">12/30</span>
                   </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                   <div className="flex -space-x-2">
                      {achievements.length > 0 ? achievements.map((ach, i) => (
                        <div key={ach.id} className="w-10 h-10 rounded-xl bg-neutral-800 border-2 border-neutral-900 flex items-center justify-center shadow-lg group-hover:translate-y-[-2px] transition-transform" title={ach.achievementName}>
                           <Medal className="w-4 h-4 text-emerald-500" />
                        </div>
                      )) : (
                        <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">No achievements yet</div>
                      )}
                   </div>
                </CardContent>
              </Card>

              <Card className="border-neutral-800 bg-neutral-900/50 rounded-3xl overflow-hidden border-dashed">
                 <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-700">Recent Tactics Log</p>
                    <div className="space-y-4 w-full">
                       {history.length > 0 ? history.map((game, i) => {
                         const isWinner = game.winnerId === effectiveUserId;
                         return (
                           <Link key={game.id} href={`/game/result/${game.id}`}>
                             <div className="flex items-center gap-3 w-full bg-neutral-950 p-2 rounded-xl mb-2 hover:bg-neutral-900 transition-colors cursor-pointer border border-transparent hover:border-neutral-800">
                               <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                  isWinner ? "bg-emerald-500/10" : "bg-red-500/10"
                               )}>
                                  <ShieldCheck className={cn("w-4 h-4", isWinner ? "text-emerald-500/50" : "text-red-500/50")} />
                               </div>
                               <div className="flex-1 text-left min-w-0">
                                  <p className="text-[9px] font-black uppercase text-neutral-400 truncate">
                                     {isWinner ? "Victory" : "Defeat"} vs {game.opponentName}
                                  </p>
                                  <p className="text-[8px] font-bold text-neutral-600 uppercase tracking-tighter">
                                     {new Date(game.createdAt).toLocaleDateString()}
                                  </p>
                               </div>
                             </div>
                           </Link>
                         );
                       }) : (
                         <p className="text-[10px] font-bold text-neutral-600 uppercase">No recent missions</p>
                       )}
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
    </div>
  );
}

