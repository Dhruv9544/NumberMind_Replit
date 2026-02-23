import { useAuth } from '@/hooks/useAuth';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  LogOut, 
  Trophy, 
  Zap, 
  Bell, 
  BarChart3, 
  User, 
  Bot, 
  Users, 
  Globe,
  Flame,
  BadgeCheck,
  ChevronRight,
  Calendar,
  History,
  LayoutDashboard,
  Medal,
  Target
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: challenges = [] } = useQuery<Array<{ id: string; status: string; fromPlayerName: string }>>({
    queryKey: ['/api/challenges'],
    refetchInterval: 2000,
  });
  
  const pendingCount = challenges.filter((c: any) => c.status === 'pending').length;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/auth';
    } catch (error) {
      console.error("Logout failed", error);
    }
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

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-50 overflow-x-hidden font-sans selection:bg-emerald-500/30">
      {/* Background radial effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-lg mx-auto px-4 py-8 sm:py-12 flex flex-col items-center"
      >
        {/* Branding */}
        <div className="text-center mb-10 w-full">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">Systems Online</span>
           </div>
           <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3 italic">
              NUMBER<span className="text-emerald-500">MIND</span>
           </h1>
           <p className="text-neutral-500 text-sm font-medium uppercase tracking-[0.2em] max-w-xs mx-auto">
              Decipher. Deduce. Dominate.
           </p>
        </div>

        {/* Pending Challenges Notification */}
        <AnimatePresence>
          {pendingCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="w-full"
            >
              <Card 
                className="border-yellow-500/30 bg-yellow-500/5 backdrop-blur-sm cursor-pointer hover:bg-yellow-500/10 transition-all rounded-3xl overflow-hidden group shadow-lg shadow-yellow-500/5"
                onClick={() => setLocation('/challenges')}
              >
                <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center relative shadow-inner">
                      <Bell className="w-6 h-6 text-yellow-400" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-neutral-900 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <p className="text-yellow-400 font-black italic uppercase text-sm">{pendingCount} Pending Challenge{pendingCount > 1 ? 's' : ''}</p>
                      <p className="text-yellow-200/50 text-[10px] font-bold uppercase tracking-widest">Incoming transmission detected</p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-black italic text-[10px] uppercase h-8 px-4 rounded-xl">
                    Intercept
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Stats Quick View */}
        <Card className="w-full mb-8 border-neutral-800 bg-neutral-900/50 backdrop-blur-sm overflow-hidden rounded-3xl group hover:border-neutral-700 transition-all">
          <CardContent className="p-1">
             <div className="p-4 sm:p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                   <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center overflow-hidden shadow-2xl group-hover:border-emerald-500 transition-colors">
                         <span className="text-xl font-black text-neutral-300 group-hover:text-emerald-400 transition-colors">
                            {getInitials()}
                         </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-emerald-500 border-4 border-neutral-900 flex items-center justify-center shadow-lg">
                         <BadgeCheck className="w-3 h-3 text-white" />
                      </div>
                   </div>
                   <div className="min-w-0">
                      <h3 className="font-black text-lg leading-tight truncate max-w-[150px]">
                        @{user?.username || 'Player'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                         <Badge variant="secondary" className="bg-neutral-800 text-[10px] h-5 font-bold border-none uppercase text-neutral-400">
                           Verified Player
                         </Badge>
                         <div className="flex items-center gap-1 text-orange-500">
                            <Flame className="w-3 h-3 fill-orange-500" />
                            <span className="text-xs font-black">{user?.stats?.currentStreak || 0}</span>
                         </div>
                      </div>
                   </div>
                </div>
                
                <div className="h-10 w-[1px] bg-neutral-800 mx-2 hidden sm:block" />
                
                <div className="text-right flex-shrink-0">
                   <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Win Rate</p>
                   <p className="text-2xl font-black text-white tabular-nums">{winRate}%</p>
                </div>
             </div>
             
             {/* Mini Stats Bar */}
             <div className="grid grid-cols-3 bg-black/20 border-t border-neutral-800/50 py-3 px-6">
                <div className="text-center">
                   <p className="text-[9px] font-black uppercase text-neutral-600 mb-0.5">Games</p>
                   <p className="text-xs font-black text-neutral-400">{user?.stats?.gamesPlayed || 0}</p>
                </div>
                <div className="text-center border-x border-neutral-800/50">
                   <p className="text-[9px] font-black uppercase text-neutral-600 mb-0.5">Victories</p>
                   <p className="text-xs font-black text-emerald-500/80">{user?.stats?.gamesWon || 0}</p>
                </div>
                <div className="text-center">
                   <p className="text-[9px] font-black uppercase text-neutral-600 mb-0.5">Best Streak</p>
                   <p className="text-xs font-black text-blue-500/80">{user?.stats?.bestStreak || 0}</p>
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Primary Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8">
           <motion.div variants={itemVariants}>
              <Link href="/game/setup?mode=friend">
                <Button className="w-full h-24 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl p-6 flex flex-col items-start justify-center gap-1 shadow-lg shadow-emerald-500/10 group overflow-hidden relative">
                   <Users className="w-12 h-12 absolute -right-2 top-1/2 -translate-y-1/2 text-white/10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500" />
                   <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="font-black italic uppercase tracking-wider text-xs">Duel Mode</span>
                   </div>
                   <span className="font-black text-xl leading-none">Challenge Friend</span>
                </Button>
              </Link>
           </motion.div>

           <motion.div variants={itemVariants}>
              <Link href="/game/setup?mode=random">
                <Button className="w-full h-24 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-white rounded-3xl p-6 flex flex-col items-start justify-center gap-1 shadow-xl group overflow-hidden relative">
                   <Globe className="w-12 h-12 absolute -right-2 top-1/2 -translate-y-1/2 text-white/5 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500" />
                   <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cyan-500" />
                      <span className="font-black italic uppercase tracking-wider text-xs text-cyan-500">Global Match</span>
                   </div>
                   <span className="font-black text-xl leading-none">Quick Online</span>
                </Button>
              </Link>
           </motion.div>

           <motion.div variants={itemVariants} className="sm:col-span-2">
              <Link href="/game/setup?mode=ai">
                <Button variant="ghost" className="w-full h-16 bg-neutral-900/40 border border-dashed border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 rounded-2xl px-6 flex items-center justify-between group transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                         <Bot className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="text-left">
                        <span className="block font-black text-sm text-neutral-200">Practice vs AI</span>
                        <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-tighter">Perfect for training sessions</span>
                      </div>
                   </div>
                   <ChevronRight className="w-5 h-5 text-neutral-700 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </Button>
              </Link>
           </motion.div>
        </div>

        {/* Secondary Navigation */}
        <div className="grid grid-cols-4 gap-4 w-full px-2">
           {[
             { href: "/leaderboard", icon: Trophy, label: "Ranks", color: "text-amber-500" },
             { href: "/profile", icon: LayoutDashboard, label: "Stats", color: "text-blue-500" },
             { href: "/history", icon: History, label: "History", color: "text-emerald-500" },
             { href: "/challenges", icon: Bell, label: "Incoming", color: "text-purple-500" }
           ].map((item, idx) => (
             <motion.div key={idx} variants={itemVariants}>
                <Link href={item.href}>
                  <button className="w-full flex flex-col items-center gap-2 group p-2 hover:translate-y-[-2px] transition-transform">
                     <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:border-neutral-700 transition-colors shadow-lg">
                        <item.icon className={cn("w-5 h-5", item.color, "opacity-70 group-hover:opacity-100 transition-opacity")} />
                     </div>
                     <span className="text-[10px] font-black uppercase text-neutral-500 tracking-tighter group-hover:text-neutral-300 transition-colors">{item.label}</span>
                  </button>
                </Link>
             </motion.div>
           ))}
        </div>

        {/* Logout Option (Subtle) */}
        <motion.div variants={itemVariants} className="mt-12 flex flex-col items-center gap-6">
           <button 
             onClick={handleLogout}
             className="flex items-center gap-2 px-6 py-2 rounded-full hover:bg-neutral-900 border border-transparent hover:border-neutral-800 text-neutral-700 hover:text-neutral-400 transition-all font-black text-[10px] uppercase tracking-widest"
           >
              <LogOut className="w-3 h-3" />
              Terminate Session
           </button>
           <p className="text-[10px] font-bold text-neutral-800 uppercase tracking-[0.3em] cursor-default">Build v2.4.0 Codename: Enigma</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

