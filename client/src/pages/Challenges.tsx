import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Clock, 
  Bell, 
  ShieldAlert, 
  Swords, 
  Calendar,
  Loader2,
  Trash2,
  AlertCircle,
  ChevronRight,
  User,
  Zap,
  Bot
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Challenge {
  id: string;
  gameId: string;
  fromPlayerId: string;
  fromPlayerName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expiresAt: string;
}

import { GameLoader } from '@/components/GameLoader';

export default function Challenges() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: challenges = [], isLoading } = useQuery<Challenge[]>({
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
        title: 'PROTOCOL ENGAGED',
        description: 'Challenge accepted. Preparing for deployment...',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'SYNC ERROR',
        description: error.message || 'Failed to initialize match',
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
        title: 'ALERT DISMISSED',
        description: 'Challenge transmission terminated',
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] w-full bg-neutral-950 flex flex-col items-center justify-center">
        <GameLoader text="Intercepting Communications..." />
      </div>
    );
  }
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-neutral-950 text-neutral-50 pb-12 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Background radial effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/" className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all active:scale-95 group">
            <ArrowLeft className="w-5 h-5 text-neutral-400 group-hover:text-emerald-400" />
          </Link>
          <div className="flex-1">
             <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">Tactical Alerts</p>
             <h1 className="text-3xl font-black tracking-tight italic uppercase italic">
                Incoming <span className="text-blue-500">Challenges</span>
             </h1>
          </div>
          {pendingChallenges.length > 0 && (
            <Badge className="bg-emerald-500 text-neutral-950 font-black italic px-3 h-8 text-xs rounded-lg animate-pulse">
               {pendingChallenges.length} NEW
            </Badge>
          )}
        </div>

        {pendingChallenges.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm border-dashed rounded-[2.5rem] overflow-hidden">
               <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 bg-neutral-800 border-2 border-neutral-700 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-neutral-500 group">
                     <Bell className="w-8 h-8 opacity-20" />
                  </div>
                  <h3 className="text-2xl font-black uppercase italic text-neutral-400 mb-2">No Active Alerts</h3>
                  <p className="text-neutral-600 font-medium text-sm max-w-[240px] mx-auto mb-10 leading-relaxed uppercase tracking-widest text-[10px]">Your tactical sensor shows no incoming challenge signatures in the current sector.</p>
                  <Link href="/">
                    <Button className="bg-neutral-800 hover:bg-neutral-700 text-white font-black italic uppercase tracking-[0.2em] px-8 h-12 rounded-xl transition-all h-14 group">
                       <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                       Return to HQ
                    </Button>
                  </Link>
               </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <AnimatePresence>
              {pendingChallenges.map(challenge => {
                const timeRemaining = getTimeRemaining(challenge.expiresAt);
                const isExpired = timeRemaining === 0;

                return (
                  <motion.div
                    key={challenge.id}
                    variants={itemVariants}
                    exit={{ opacity: 0, x: 20 }}
                    layout
                  >
                    <Card
                      className={cn(
                        "group border-neutral-800 bg-neutral-900/40 backdrop-blur-sm rounded-3xl overflow-hidden hover:border-emerald-500/30 transition-all shadow-lg",
                        isExpired && "opacity-60 grayscale"
                      )}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                          <div className="flex items-center gap-5">
                             <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center group-hover:bg-neutral-700 transition-colors">
                                   <Swords className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                                </div>
                                {!isExpired && (
                                   <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-neutral-900" />
                                )}
                             </div>
                             <div>
                                <h3 className="text-lg font-black uppercase italic leading-tight group-hover:text-emerald-400 transition-colors">
                                  {challenge.fromPlayerName}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                   <Badge variant="outline" className="text-[9px] h-5 border-neutral-800 text-neutral-500 rounded-lg pointer-events-none">
                                      {isExpired ? "EXPIRED" : "CHALLENGER"}
                                   </Badge>
                                   <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter text-neutral-600">
                                      <Clock className="w-3 h-3" />
                                      {isExpired ? (
                                        <span className="text-red-900">Transmission Timed Out</span>
                                      ) : (
                                        <span className="text-blue-900/80">{timeRemaining}m TTL</span>
                                      )}
                                   </div>
                                </div>
                             </div>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            {!isExpired && (
                              <Button
                                onClick={() => acceptMutation.mutate(challenge.id)}
                                disabled={acceptMutation.isPending}
                                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-black italic uppercase tracking-wider h-12 px-6 rounded-xl shadow-lg shadow-emerald-500/10 group/btn relative overflow-hidden"
                              >
                                {acceptMutation.isPending && acceptMutation.variables === challenge.id ? (
                                   <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <span className="flex items-center gap-2">
                                     Accept
                                     <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                  </span>
                                )}
                              </Button>
                            )}
                            <Button
                              onClick={() => rejectMutation.mutate(challenge.id)}
                              disabled={rejectMutation.isPending}
                              variant="ghost"
                              className="w-12 h-12 sm:w-auto sm:h-12 bg-neutral-800/50 hover:bg-neutral-800 text-neutral-400 hover:text-red-500 flex items-center justify-center rounded-xl transition-all"
                            >
                              <X className="w-5 h-5" />
                              <span className="hidden sm:inline-block ml-2 text-[10px] font-black uppercase tracking-widest">Reject</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        <div className="mt-12 flex flex-col items-center gap-4 border-t border-neutral-900 pt-8">
           <div className="flex items-center gap-2 opacity-30">
              <ShieldAlert className="w-4 h-4 text-neutral-700" />
              <span className="text-[10px] font-black italic text-neutral-800 uppercase tracking-widest leading-none">Encrypted Alert Channel Alpha</span>
           </div>
        </div>
      </div>
    </div>
  );
}

