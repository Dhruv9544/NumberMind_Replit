import { useEffect } from "react";
import { motion } from "framer-motion";
import { Gamepad2, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameLoaderProps {
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

export function GameLoader({ 
  text = "Establishing Connection...", 
  className,
  fullScreen = false 
}: GameLoaderProps) {
  useEffect(() => {
    if (fullScreen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [fullScreen]);

  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-8 p-12", className)}>
      <div className="relative">
        {/* Outer Tech Rings */}
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
           className="w-32 h-32 rounded-[2.5rem] border border-emerald-500/10 flex items-center justify-center"
        >
           <div className="w-full h-full rounded-[2.5rem] border-t-2 border-emerald-500/40 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]" />
        </motion.div>
        
        <motion.div
           animate={{ rotate: -360 }}
           transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
           className="absolute inset-4 rounded-3xl border border-blue-500/10 flex items-center justify-center"
        >
           <div className="w-full h-full rounded-3xl border-b-2 border-blue-500/30" />
        </motion.div>

        {/* Central Pulse Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <motion.div
                animate={{ 
                  scale: [1, 1.15, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10"
              >
                <Gamepad2 className="w-10 h-10 text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
              </motion.div>
              
              {/* Radar Rings */}
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 2, opacity: [0, 0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 bg-emerald-500/20 rounded-full"
              />
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 2.5, opacity: [0, 0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                className="absolute inset-0 bg-blue-500/10 rounded-full"
              />
            </div>
        </div>
        
        {/* Scanning Line */}
        <motion.div 
           animate={{ 
             top: ['10%', '90%', '10%'],
             opacity: [0, 1, 0]
           }}
           transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
           className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_rgba(16,185,129,1)] z-20 pointer-events-none"
        />
      </div>
      
      <div className="flex flex-col items-center gap-4 min-w-[200px]">
         <div className="flex items-center gap-3">
            <Zap className="w-3 h-3 text-emerald-500 animate-pulse" />
            <motion.p 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-[10px] font-black uppercase tracking-[0.4em] text-white italic"
            >
              {text}
            </motion.p>
            <ShieldCheck className="w-3 h-3 text-blue-500 animate-pulse" />
         </div>
         
         {/* Progress Simulation Bar */}
         <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800/50 p-[1px]">
            <motion.div 
               initial={{ x: '-100%' }}
               animate={{ x: '100%' }}
               transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
               className="w-1/3 h-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_15px_rgba(16,185,129,0.8)]"
            />
         </div>
         
         {/* Data Readout Simulation */}
         <div className="flex justify-between w-full text-[8px] font-mono text-neutral-700 uppercase font-black tracking-widest px-1">
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 0.2 }}
            >
              RX: {Math.floor(Math.random() * 1000)}KB/S
            </motion.span>
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 0.3 }}
            >
              STATUS: SYNCING_COORDINATES
            </motion.span>
         </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
