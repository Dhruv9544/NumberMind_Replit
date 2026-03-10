import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, CheckCircle2, Loader2, KeyRound, Gamepad2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const validateEmail = (val: string) => {
    if (!val) return 'Email is required';
    if (!val.includes('@') || !val.includes('.')) return 'Please enter a valid email address';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    setEmailError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: 'Request Failed', description: data.message || 'Something went wrong. Please try again.', variant: 'destructive' });
      } else {
        setSent(true);
        if (data.resetUrl) setResetUrl(data.resetUrl);
      }
    } catch {
      toast({ title: 'Network Error', description: 'Failed to connect. Please check your connection.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30 overflow-y-auto font-sans">
      {/* Background ambience */}
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
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-neutral-900 border border-neutral-800 mb-6 hover:border-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-500">
            <Gamepad2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2 italic uppercase">
            NUMBER<span className="text-emerald-500">MIND</span>
          </h1>
          <p className="text-neutral-500 text-xs font-black uppercase tracking-[0.4em]">Account Recovery</p>
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
                <CardHeader className="pt-10 pb-6 px-8 sm:px-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-7 h-7 text-emerald-400" />
                  </div>
                  <CardTitle className="text-2xl font-black italic uppercase tracking-tight mb-2">
                    Forgot Password
                  </CardTitle>
                  <CardDescription className="text-neutral-500 font-bold text-xs uppercase tracking-widest leading-relaxed">
                    Enter your email — we'll generate a reset link
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-10 px-8 sm:px-12">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className={cn(
                            "w-4 h-4 transition-colors",
                            emailError ? "text-red-500" : "text-neutral-600 group-focus-within:text-emerald-500"
                          )} />
                        </div>
                        <Input
                          id="forgot-email-input"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                          disabled={loading}
                          className={cn(
                            "h-14 pl-12 bg-neutral-800/50 border-neutral-800 rounded-2xl text-sm font-medium focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-neutral-600",
                            emailError && "border-red-500/50 bg-red-500/5"
                          )}
                          autoFocus
                          autoComplete="email"
                        />
                      </div>
                      {emailError && (
                        <motion.p initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-black uppercase text-red-500 pl-4">
                          {emailError}
                        </motion.p>
                      )}
                    </div>

                    <Button
                      id="forgot-password-submit"
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black italic uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/10 group overflow-hidden relative"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <span className="relative z-10 flex items-center gap-2">
                          Send Reset Link
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </form>

                  <div className="mt-8 flex justify-center">
                    <Link
                      href="/auth"
                      className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-neutral-500 hover:text-emerald-400 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to Login
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
                <CardContent className="pt-12 pb-10 px-8 sm:px-12 text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring' }}
                    className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto"
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </motion.div>

                  <h2 className="text-2xl font-black italic uppercase tracking-tight">Check Your Email</h2>
                  <p className="text-neutral-500 font-bold text-xs uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                    If an account exists for that email, you'll receive a password reset link shortly.
                  </p>

                  {/* Dev mode: show direct link */}
                  {resetUrl && (
                    <div className="mt-2 p-4 rounded-2xl bg-neutral-800/60 border border-neutral-700 text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">
                        ⚙ Dev Mode — Click to Reset
                      </p>
                      <a
                        href={resetUrl}
                        className="text-neutral-300 text-xs break-all hover:text-emerald-400 transition-colors"
                      >
                        {resetUrl}
                      </a>
                    </div>
                  )}

                  <div className="pt-2 space-y-3">
                    <Button
                      onClick={() => setLocation('/auth')}
                      className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black italic uppercase tracking-[0.2em]"
                    >
                      Return to Login
                    </Button>
                    <button
                      onClick={() => { setSent(false); setResetUrl(null); setEmail(''); }}
                      className="text-[11px] font-black uppercase tracking-widest text-neutral-500 hover:text-emerald-400 transition-colors"
                    >
                      Try a different email
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
