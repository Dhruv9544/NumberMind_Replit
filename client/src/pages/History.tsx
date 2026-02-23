import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ArrowLeft, 
  History, 
  Target, 
  Trophy, 
  Medal, 
  Calendar, 
  ChevronRight, 
  Zap, 
  Bot, 
  Users,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface GameRecord {
  id: string;
  opponentName: string;
  status: string;
  gameMode: string;
  difficulty: string;
  winnerId: string;
  createdAt: string;
  player1Id: string;
  player2Id?: string;
}

import { GameLoader } from "@/components/GameLoader";

export default function HistoryPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: games = [], isLoading, error } = useQuery<GameRecord[]>({
    queryKey: ['/api/games/history'],
    refetchInterval: 5000,
  });

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-neutral-950">
        <GameLoader text="Accessing Historical Records..." />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-neutral-950 text-neutral-50 pb-12 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Background radial effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/" className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all active:scale-95 group">
            <ArrowLeft className="w-5 h-5 text-neutral-400 group-hover:text-emerald-400" />
          </Link>
          <div className="flex-1">
             <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">Post-Operation Analysis</p>
             <h1 className="text-3xl font-black tracking-tight italic uppercase italic">
                Mission <span className="text-blue-500">History</span>
             </h1>
          </div>
        </div>

        {error ? (
          <Card className="border-red-500/30 bg-red-500/5 rounded-3xl p-8 text-center">
             <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
             <h3 className="text-lg font-black uppercase italic mb-2">Sync Error</h3>
             <p className="text-neutral-500 text-sm">Could not retrieve mission logs from the central server.</p>
          </Card>
        ) : games.length === 0 ? (
          <div className="text-center py-20">
             <div className="w-20 h-20 bg-neutral-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-neutral-800">
                <History className="w-10 h-10 text-neutral-700" />
             </div>
             <h3 className="text-xl font-black uppercase italic mb-2 text-neutral-400">No Operations Recorded</h3>
             <p className="text-neutral-600 text-sm mb-10 tracking-wide uppercase text-[10px] font-bold">Your mission log is currently empty. Initiate your first protocol.</p>
             <Link href="/game/setup">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-black italic uppercase tracking-wider h-14 px-8 rounded-2xl">
                   Start New Mission
                </Button>
             </Link>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {games.map((game) => {
              const isWinner = game.winnerId === user?.id;
              const isDraw = game.status === 'finished' && !game.winnerId;
              const isUnfinished = game.status !== 'finished';
              
              return (
                <motion.div key={game.id} variants={itemVariants}>
                  <Card className={cn(
                    "border-neutral-800 bg-neutral-900/40 backdrop-blur-sm hover:border-neutral-700 transition-all rounded-3xl overflow-hidden group active:scale-[0.98]",
                    isWinner ? "hover:border-emerald-500/30" : "hover:border-red-500/30"
                  )}>
                    <Link href={game.status === 'finished' ? `/game/result/${game.id}` : `/game/play/${game.id}`}>
                      <CardContent className="p-0">
                        <div className="p-6 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110",
                              isWinner ? "bg-emerald-500/10 text-emerald-500" : 
                              isUnfinished ? "bg-blue-500/10 text-blue-500" :
                              "bg-red-500/10 text-red-500"
                            )}>
                              {game.gameMode === 'ai' ? <Bot className="w-7 h-7" /> : <Users className="w-7 h-7" />}
                            </div>
                            
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[8px] font-black uppercase h-4 px-1.5 border-neutral-700 text-neutral-500">
                                  {game.gameMode}
                                </Badge>
                                <span className="text-[10px] font-bold text-neutral-600 tabular-nums">
                                  {format(new Date(game.createdAt), 'MMM dd, HH:mm')}
                                </span>
                              </div>
                              <h3 className="font-black text-lg uppercase italic tracking-tighter truncate">
                                vs {game.opponentName}
                              </h3>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {isUnfinished ? (
                              <div className="text-blue-500 flex flex-col items-end">
                                <span className="text-[10px] font-black uppercase tracking-widest mb-1">Active</span>
                                <Zap className="w-5 h-5 animate-pulse" />
                              </div>
                            ) : isWinner ? (
                              <div className="text-emerald-500 flex flex-col items-end">
                                <span className="text-[10px] font-black uppercase tracking-widest mb-1">Victory</span>
                                <Trophy className="w-5 h-5 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                              </div>
                            ) : (
                              <div className="text-neutral-500 flex flex-col items-end">
                                <span className="text-[10px] font-black uppercase tracking-widest mb-1">Defeat</span>
                                <Target className="w-5 h-5 opacity-40" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Footer Bar */}
                        <div className="bg-black/20 border-t border-neutral-800/50 px-6 py-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-neutral-600">
                           <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                 <Calendar className="w-3 h-3" />
                                 {format(new Date(game.createdAt), 'yyyy-MM-dd')}
                              </div>
                              <div className="flex items-center gap-1">
                                 <Medal className="w-3 h-3" />
                                 {game.difficulty}
                              </div>
                           </div>
                           <ChevronRight className="w-4 h-4 group-hover:translate-x-1 group-hover:text-neutral-400 transition-all" />
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
