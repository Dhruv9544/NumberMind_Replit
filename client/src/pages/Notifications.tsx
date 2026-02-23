import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Bell, 
  Check, 
  Gamepad2, 
  Users, 
  Trophy, 
  Award, 
  Inbox, 
  Clock, 
  ShieldCheck,
  Zap,
  Bot,
  Flame,
  ChevronRight,
  Target,
  Loader2
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  type: string;
  fromUserName?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

import { GameLoader } from '@/components/GameLoader';

export default function Notifications() {
  const [, setLocation] = useLocation();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 3000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest('POST', `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'challenge':
        return <Gamepad2 className="w-5 h-5 text-emerald-500" />;
      case 'friend_request':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'game_finished':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'achievement':
        return <Award className="w-5 h-5 text-purple-500" />;
      default:
        return <Inbox className="w-5 h-5 text-neutral-500" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] w-full bg-neutral-950 flex flex-col items-center justify-center">
        <GameLoader text="Polling for transmissions..." />
      </div>
    );
  }
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-neutral-950 text-neutral-50 pb-12 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Background radial effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/" className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all active:scale-95 group">
            <ArrowLeft className="w-5 h-5 text-neutral-400 group-hover:text-emerald-400" />
          </Link>
          <div className="flex-1">
             <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">Communication Trunk</p>
             <h1 className="text-3xl font-black tracking-tight italic uppercase italic">
                System <span className="text-blue-500">Alerts</span>
             </h1>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-blue-600 text-white font-black italic px-3 h-8 text-xs rounded-lg animate-pulse">
               {unreadCount} UNREAD
            </Badge>
          )}
        </div>

        {notifications.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm border-dashed rounded-[2.5rem] overflow-hidden">
               <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 bg-neutral-800 border-2 border-neutral-700 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-neutral-500">
                     <Bell className="w-8 h-8 opacity-10" />
                  </div>
                  <h3 className="text-2xl font-black uppercase italic text-neutral-400 mb-2">Logs are Empty</h3>
                  <p className="text-neutral-600 font-medium text-sm max-w-[240px] mx-auto mb-10 leading-relaxed uppercase tracking-widest text-[10px]">Your communication buffer is currently clear. No pending alerts detected.</p>
                  <Link href="/">
                    <Button className="bg-neutral-800 hover:bg-neutral-700 text-white font-black italic uppercase tracking-[0.2em] px-8 h-12 rounded-xl transition-all">
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
            className="space-y-3"
          >
            <AnimatePresence>
              {notifications.map(notif => (
                <motion.div
                  key={notif.id}
                  variants={itemVariants}
                  layout
                >
                  <Card
                    className={cn(
                      "group border-neutral-800 bg-neutral-900/40 backdrop-blur-sm rounded-3xl overflow-hidden hover:border-neutral-700 transition-all shadow-lg relative",
                      !notif.read && "border-blue-500/30 bg-blue-500/5 shadow-blue-500/5"
                    )}
                  >
                    {!notif.read && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                    )}
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={cn(
                             "w-12 h-12 rounded-2xl bg-neutral-800 border-2 border-neutral-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform",
                             !notif.read && "border-blue-500/20 bg-blue-500/10"
                          )}>
                             {getIcon(notif.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn(
                               "text-sm font-medium leading-relaxed uppercase tracking-tight",
                               notif.read ? 'text-neutral-500' : 'text-neutral-100 font-black italic'
                            )}>
                              {notif.message}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                               <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-600">
                                  <Clock className="w-3 h-3" />
                                  {new Date(notif.createdAt).toLocaleDateString()}
                               </div>
                               {!notif.read && (
                                  <Badge className="bg-blue-500 text-[8px] h-4 font-black uppercase text-white px-2 rounded-md">NEW</Badge>
                               )}
                            </div>
                          </div>
                        </div>

                        {!notif.read && (
                          <Button
                            onClick={() => markReadMutation.mutate(notif.id)}
                            disabled={markReadMutation.isPending}
                            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-blue-500 w-10 h-10 rounded-xl flex items-center justify-center p-0 transition-all active:scale-90"
                          >
                            <Check className="w-5 h-5" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        <div className="mt-12 flex flex-col items-center gap-4 border-t border-neutral-900 pt-8 opacity-20">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-neutral-700" />
              <span className="text-[10px] font-black italic text-neutral-800 uppercase tracking-widest leading-none">Intelligence Stream Alpha-2</span>
           </div>
        </div>
      </div>
    </div>
  );
}

