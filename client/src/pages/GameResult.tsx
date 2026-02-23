import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLocation, useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Trophy, 
  RotateCcw, 
  Share2, 
  Home, 
  Gamepad2, 
  Target, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Medal, 
  Flame, 
  BarChart3,
  Loader2,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Award
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { GameLoader } from "@/components/GameLoader";

interface GameResultData {
  id: string;
  player1Id: string;
  player2Id?: string;
  player1Secret: string;
  player2Secret: string;
  winnerId: string;
  gameMode: string;
  startedAt: string;
  finishedAt: string;
  moves: Array<{
    playerId: string;
    guess: string;
    moveNumber: number;
  }>;
}

export default function GameResult() {
  const { user } = useAuth();
  const { gameId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: gameData, isLoading, error } = useQuery<GameResultData>({
    queryKey: ["/api/games", gameId],
    enabled: !!gameId,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Session Expired",
        description: "Re-establishing connection...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const handlePlayAgain = () => {
    setLocation("/game/setup");
  };

  const handleShareResult = () => {
    if (navigator.share && gameData) {
      const isWinner = gameData.winnerId === user?.id;
      const myMoves = gameData.moves.filter(m => m.playerId === user?.id);
      const timeElapsed = gameData.startedAt && gameData.finishedAt
        ? Math.floor((new Date(gameData.finishedAt).getTime() - new Date(gameData.startedAt).getTime()) / 1000)
        : 0;
      
      const minutes = Math.floor(timeElapsed / 60);
      const seconds = timeElapsed % 60;
      
      navigator.share({
        title: "NumberMind Breach Report",
        text: `STATUS: ${isWinner ? "ENIGMA SOLVED" : "BREACH FAILED"}. Cracked in ${myMoves.length} cycles and ${minutes}:${seconds.toString().padStart(2, '0')}. Can you beat me? 🧠`,
        url: window.location.href,
      }).catch(() => {
         toast({ title: "Signal Lost", description: "Sharing protocols interrupted." });
      });
    } else {
      toast({
        title: "Intelligence Copied",
        description: "Operation result link saved to clipboard.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] w-full bg-neutral-950 flex flex-col items-center justify-center">
        <GameLoader text="Decrypting Mission Data..." />
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
        <Card className="w-full max-w-md border-neutral-800 bg-neutral-900/50 backdrop-blur-sm rounded-[2.5rem]">
          <CardContent className="pt-12 pb-10 px-8">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-black uppercase italic mb-2">Record Error</h2>
            <p className="text-neutral-500 text-sm mb-10 leading-relaxed uppercase tracking-widest text-[10px]">
              The specified operation record cannot be retrieved from the central archives.
            </p>
            <Button onClick={() => setLocation("/")} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-black italic uppercase h-14 rounded-2xl">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isWinner = gameData.winnerId === user?.id;
  const myMoves = gameData.moves.filter(m => m.playerId === user?.id);
  const timeElapsed = gameData.startedAt && gameData.finishedAt
    ? Math.floor((new Date(gameData.finishedAt).getTime() - new Date(gameData.startedAt).getTime()) / 1000)
    : 0;
  
  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.4, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-50 pb-20 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Background radial effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className={cn(
           "absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[140px] -translate-y-1/2 translate-x-1/2",
           isWinner ? "bg-emerald-500/20" : "bg-red-500/10"
        )} />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-lg mx-auto px-4 py-12"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            className={cn(
              "w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl relative",
              isWinner 
                ? "bg-gradient-to-br from-emerald-500 to-blue-600 rotate-12" 
                : "bg-neutral-800 border-2 border-neutral-700"
            )}
          >
            {isWinner ? (
              <>
                <Trophy className="w-12 h-12 text-white drop-shadow-lg" />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-white rounded-[2.5rem] blur-xl -z-10"
                />
              </>
            ) : (
              <Medal className="w-12 h-12 text-neutral-600" />
            )}
          </motion.div>
          
          <motion.p variants={itemVariants} className={cn(
             "text-[10px] font-black uppercase tracking-[0.4em] mb-2",
             isWinner ? "text-emerald-500" : "text-neutral-500"
          )}>
            {isWinner ? "Operation Successful" : "Mission Terminated"}
          </motion.p>
          <motion.h2 variants={itemVariants} className="text-5xl font-black italic uppercase tracking-tighter mb-4 italic">
            {isWinner ? "VICTORY" : "DEFEAT"}
          </motion.h2>
          <motion.p variants={itemVariants} className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] max-w-xs mx-auto">
            {isWinner 
              ? `Code decrypted in ${myMoves.length} cycles.`
              : "Defensive firewall was too strong."
            }
          </motion.p>
        </div>
        
        {/* Intelligence Report */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 border-neutral-800 bg-neutral-900/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
            <CardHeader className="pt-8 pb-4 border-b border-neutral-800/50">
               <CardTitle className="text-center text-xs font-black uppercase tracking-widest text-neutral-500">Mission Intelligence Report</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="text-center group">
                  <div className="text-[10px] font-black uppercase text-neutral-600 mb-1 group-hover:text-emerald-500 transition-colors">Cycles Used</div>
                  <div className="text-4xl font-black text-white italic tabular-nums group-hover:scale-110 transition-transform">{myMoves.length}</div>
                </div>
                <div className="text-center group">
                  <div className="text-[10px] font-black uppercase text-neutral-600 mb-1 group-hover:text-blue-500 transition-colors">Elapsed Time</div>
                  <div className="text-4xl font-black text-white italic tabular-nums group-hover:scale-110 transition-transform">{formattedTime}</div>
                </div>
              </div>
              
              <div className="space-y-6 pt-6 border-t border-neutral-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <ShieldCheck className="w-4 h-4 text-emerald-500" />
                     <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Your Signature</span>
                  </div>
                  <div className="flex gap-2">
                    {(gameData.player1Id === user?.id ? gameData.player1Secret : gameData.player2Secret)
                      ?.split('').map((digit, index) => (
                      <span key={index} className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center font-black text-lg text-emerald-500 tabular-nums">
                        {digit}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Target className="w-4 h-4 text-blue-500" />
                     <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Target Key</span>
                  </div>
                  <div className="flex gap-2">
                    {(gameData.player1Id === user?.id ? gameData.player2Secret : gameData.player1Secret)
                      ?.split('').map((digit, index) => (
                      <span key={index} className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center font-black text-lg text-blue-500 tabular-nums">
                        {digit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Achievements */}
        {isWinner && (
          <motion.div variants={itemVariants}>
            <Card className="mb-8 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/20 rounded-3xl overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Award className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h3 className="font-black italic uppercase text-xs tracking-widest">Achievement Synchronized</h3>
                </div>
                <div className="flex items-center gap-4 bg-black/20 rounded-2xl p-4 border border-white/5">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-sm uppercase italic">Elite Cryptographer</div>
                    <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-tighter">
                      Solved efficiently with high precision breach
                    </div>
                  </div>
                  <div className="text-emerald-500 font-black italic">+50 XP</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {/* Post-Operation Analysis */}
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 mb-10">
           {[
             { label: "Wins", val: user?.stats?.gamesWon || 0, icon: Trophy, color: "text-emerald-500" },
             { label: "Streak", val: user?.stats?.currentStreak || 0, icon: Flame, color: "text-orange-500" },
             { label: "Rate", val: `${user?.stats?.gamesPlayed ? Math.round((user.stats.gamesWon! / user.stats.gamesPlayed) * 100) : 0}%`, icon: TrendingUp, color: "text-blue-500" }
           ].map((item, i) => (
             <div key={i} className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center mb-1">
                   <item.icon className={cn("w-3 h-3 mb-1", item.color)} />
                </div>
                <div className="text-xl font-black text-white tabular-nums">{item.val}</div>
                <div className="text-[8px] font-black uppercase text-neutral-600 tracking-widest">{item.label}</div>
             </div>
           ))}
        </motion.div>
        
        {/* Command Actions */}
        <motion.div variants={itemVariants} className="space-y-4">
          <Button
            onClick={handlePlayAgain}
            className="w-full h-16 bg-white hover:bg-neutral-200 text-neutral-950 rounded-2xl font-black italic uppercase tracking-[0.2em] shadow-xl group overflow-hidden relative"
          >
             <span className="relative z-10 flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                Initiate New Match
             </span>
             <motion.div className="absolute inset-0 bg-black/5 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
          </Button>
          
          <div className="flex gap-4">
            <Button
              onClick={handleShareResult}
              variant="outline"
              className="flex-1 h-14 border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 text-white rounded-2xl font-black italic uppercase text-xs tracking-widest group"
            >
              <Share2 className="w-4 h-4 mr-2 text-blue-500 group-hover:scale-110 transition-transform" />
              Share Intel
            </Button>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="flex-1 h-14 border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 text-white rounded-2xl font-black italic uppercase text-xs tracking-widest group"
            >
              <Home className="w-4 h-4 mr-2 text-neutral-500 group-hover:scale-110 transition-transform" />
              HQ Return
           </Button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-12 text-center opacity-20">
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-700">Digital Archive Record: NM-{gameId?.slice(0, 8)}</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
