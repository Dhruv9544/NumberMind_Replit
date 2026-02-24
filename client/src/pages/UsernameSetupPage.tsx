import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  UserCircle, 
  ArrowRight, 
  ShieldCheck, 
  Target, 
  Sparkles,
  Loader2,
  Gamepad2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { GameLoader } from "@/components/GameLoader";

export default function UsernameSetupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState<{ username?: string }>({});

  // Get current user data
  const { data: user } = useQuery<any>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // If user already has a username, redirect to dashboard
  if (user?.usernameSet && user?.username) {
    setLocation("/");
    return null;
  }

  const validateUsername = (value: string): string | undefined => {
    if (!value) return "Username is required";
    if (value.length < 3) return "Username must be at least 3 characters";
    if (value.length > 20) return "Username must be 20 characters or less";
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return "Only letters, numbers, _ and - are allowed";
    return undefined;
  };

  const mutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await fetch('/api/auth/set-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to sync codename');
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Protocol Success",
        description: "Identity established on the network.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Sync Error",
        description: error.message || "Failed to establish identity",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateUsername(username);
    if (error) {
      setErrors({ username: error });
      return;
    }

    setErrors({});
    mutation.mutate(username);
  };

  const isPending = mutation.isPending;

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-neutral-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30 overflow-y-auto font-sans">
      <AnimatePresence>
         {isPending && <GameLoader fullScreen text="Establishing Security Clearance..." />}
      </AnimatePresence>
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-10">
           <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-neutral-900 border border-neutral-800 mb-6 shadow-xl">
              <UserCircle className="w-10 h-10 text-emerald-500" />
           </div>
           <h1 className="text-4xl font-black tracking-tight mb-2 italic uppercase">
              IDENTITY<span className="text-emerald-500">SET</span>
           </h1>
           <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.4em]">Establish Network Presence</p>
        </div>

        <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
          <CardHeader className="pt-10 pb-6 text-center">
            <CardTitle className="text-2xl font-black italic uppercase italic tracking-tight mb-2">
              Select Codename
            </CardTitle>
            <CardDescription className="text-neutral-500 font-bold text-xs uppercase tracking-widest leading-relaxed px-6">
               This unique ID will represent you in global challenges and leaderboards
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-10 px-8 sm:px-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="relative group">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <Target className={cn(
                       "w-4 h-4 transition-colors",
                       errors.username ? "text-red-500" : "text-neutral-600 group-focus-within:text-emerald-500"
                     )} />
                   </div>
                   <Input
                     type="text"
                     placeholder="e.g. cipher_x or MindHacker99"
                     value={username}
                     onChange={(e) => {
                       const value = e.target.value;
                       setUsername(value);
                       const error = validateUsername(value);
                       setErrors({ username: error });
                     }}
                     disabled={mutation.isPending}
                     className={cn(
                       "h-14 pl-12 bg-neutral-800/50 border-neutral-800 rounded-2xl text-sm font-medium tracking-normal focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-neutral-600",
                       errors.username && "border-red-500/50 bg-red-500/5"
                     )}
                   />
                  {username && !errors.username && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </div>
                  )}
                </div>
                {errors.username ? (
                  <motion.p initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-black uppercase text-red-500 pl-4">
                    {errors.username}
                  </motion.p>
                ) : (
                  <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest pl-4">
                    Use letters, numbers, hyphens & underscores
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={mutation.isPending || !!errors.username || !username}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black italic uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/10 group overflow-hidden relative"
              >
                {mutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span className="relative z-10 flex items-center gap-2">
                       Synchronize Identity
                       <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <motion.div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Branding Footer */}
        <div className="mt-10 flex items-center justify-center gap-2 opacity-50">
           <Gamepad2 className="w-4 h-4 text-neutral-700" />
           <span className="text-[10px] font-black italic text-neutral-800 uppercase tracking-widest">NumberMind Protocol v2.4</span>
        </div>
      </motion.div>
    </div>
  );
}

