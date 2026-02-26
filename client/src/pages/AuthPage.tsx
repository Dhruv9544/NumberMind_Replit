import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Gamepad2, 
  Loader2, 
  Eye, 
  EyeOff,
  Zap,
  Target,
  Bot
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { GameLoader } from "@/components/GameLoader";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateEmail = (value: string): string | undefined => {
    if (!value) return "Email is required";
    if (!value.includes("@") || !value.includes(".")) return "Please enter a valid email address";
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value) return "Password is required";
    if (value.length < 6 && !isLogin) return "Password must be at least 6 characters";
    return undefined;
  };

  const validateInputs = (): boolean => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const newErrors: { email?: string; password?: string } = {};
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: isLogin ? "Sign In Failed" : "Sign Up Failed",
          description: data.message || (isLogin ? "Wrong email or password. Please try again." : "Couldn't create your account. Please try again."),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: isLogin ? "Welcome back!" : "Account Created!",
        description: isLogin
          ? `Good to see you again. Let's play.`
          : "Your account is ready. Sign in to start playing.",
      });

      setEmail("");
      setPassword("");
      setErrors({});

      if (!isLogin) {
        setIsLogin(true);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        await queryClient.refetchQueries({ queryKey: ['/api/auth/user'] });
        setLocation("/");
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Couldn't reach the server. Check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30 overflow-y-auto font-sans">
      <AnimatePresence>
         {loading && <GameLoader fullScreen text="Signing you in..." />}
      </AnimatePresence>
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[160px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[160px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Branding */}
        <div className="text-center mb-10 group cursor-default">
           <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-neutral-900 border border-neutral-800 mb-6 group-hover:border-emerald-500 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-500">
              <Gamepad2 className="w-10 h-10 text-emerald-500" />
           </div>
           <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2 italic uppercase">
              NUMBER<span className="text-emerald-500">MIND</span>
           </h1>
           <p className="text-neutral-500 text-xs font-black uppercase tracking-[0.4em]">Sign in to play</p>
        </div>

        <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
          <CardHeader className="pt-10 pb-6 px-8 sm:px-12 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'signup'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <CardTitle className="text-2xl font-black italic uppercase italic tracking-tight mb-2">
                  {isLogin ? "Log In" : "Create Account"}
                </CardTitle>
                <CardDescription className="text-neutral-500 font-bold text-xs uppercase tracking-widest leading-relaxed">
                  {isLogin
                    ? "Welcome back — enter your email and password"
                    : "Register a free account to start playing"}
                </CardDescription>
              </motion.div>
            </AnimatePresence>
          </CardHeader>

          <CardContent className="pb-10 px-8 sm:px-12">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className={cn(
                      "w-4 h-4 transition-colors",
                      errors.email ? "text-red-500" : "text-neutral-600 group-focus-within:text-emerald-500"
                    )} />
                  </div>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({ ...errors, email: undefined });
                    }}
                    required
                    className={cn(
                      "h-14 pl-12 bg-neutral-800/50 border-neutral-800 rounded-2xl text-sm font-medium tracking-normal focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-neutral-600",
                      errors.email && "border-red-500/50 bg-red-500/5"
                    )}
                  />
                </div>
                {errors.email && (
                  <motion.p initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-black uppercase text-red-500 pl-4">{errors.email}</motion.p>
                )}
              </div>

              <div className="space-y-1">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className={cn(
                      "w-4 h-4 transition-colors",
                      errors.password ? "text-red-500" : "text-neutral-600 group-focus-within:text-emerald-500"
                    )} />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors({ ...errors, password: undefined });
                    }}
                    required
                    className={cn(
                      "h-14 pl-12 pr-12 bg-neutral-800/50 border-neutral-800 rounded-2xl text-sm font-medium tracking-normal focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-neutral-600",
                      errors.password && "border-red-500/50 bg-red-500/5"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-600 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <motion.p initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-black uppercase text-red-500 pl-4">{errors.password}</motion.p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black italic uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/10 group overflow-hidden relative"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span className="relative z-10 flex items-center gap-2">
                       {isLogin ? "Log In" : "Sign Up"}
                       <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <motion.div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 flex flex-col items-center gap-4">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs font-black uppercase tracking-widest text-neutral-500 hover:text-emerald-400 transition-colors"
              >
                {isLogin
                  ? "Don't have an account? Sign Up"
                  : "Already have an account? Log In"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Features teaser (only for mobile/compact view) */}
        <div className="mt-12 grid grid-cols-3 gap-6">
           {[
             { icon: Target, label: "Precision" },
             { icon: Zap, label: "Efficiency" },
             { icon: Bot, label: "Tactics" }
           ].map((feature, i) => (
             <div key={i} className="flex flex-col items-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:border-neutral-700 transition-colors">
                   <feature.icon className="w-4 h-4 text-neutral-600 group-hover:text-emerald-500/50 transition-colors" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-700 group-hover:text-neutral-500 transition-colors">{feature.label}</span>
             </div>
           ))}
        </div>
      </motion.div>
    </div>
  );
}

