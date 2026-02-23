import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-950 p-6 selection:bg-emerald-500/30 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl border-dashed">
          <CardContent className="pt-12 pb-10 px-8 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 relative group">
               <ShieldAlert className="h-10 w-10 text-red-500 group-hover:scale-110 transition-transform" />
               <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse" />
            </div>

            <h1 className="text-3xl font-black text-white italic uppercase mb-2 tracking-tight">Signal <span className="text-red-500">Lost</span></h1>
            <p className="text-neutral-500 font-bold text-xs uppercase tracking-[0.2em] mb-8 leading-relaxed">
              Target coordinate does not exist. The sector you are attempting to reach is outside the established network.
            </p>

            <Link href="/">
              <Button className="w-full h-14 bg-neutral-800 hover:bg-neutral-700 text-white rounded-2xl font-black italic uppercase tracking-widest flex items-center justify-center gap-3 transition-all border border-neutral-700 hover:border-emerald-500/50 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Return to HQ
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <p className="mt-8 text-center text-[10px] font-bold text-neutral-800 uppercase tracking-[0.5em]">System Error: 404_COORDINATE_NOT_FOUND</p>
      </motion.div>
    </div>
  );
}
