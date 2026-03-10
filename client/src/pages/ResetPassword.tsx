import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, CheckCircle2, Loader2, AlertTriangle, KeyRound, Gamepad2, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type PageState = 'validating' | 'valid' | 'invalid' | 'success';

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageState, setPageState] = useState<PageState>('validating');
  const [tokenEmail, setTokenEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (!t) { setPageState('invalid'); return; }
    setToken(t);

    (async () => {
      try {
        const res = await fetch(`/api/auth/reset-password/validate?token=${encodeURIComponent(t)}`);
        const data = await res.json();
        if (res.ok && data.valid) {
          setTokenEmail(data.email || '');
          setPageState('valid');
        } else {
          setPageState('invalid');
        }
      } catch {
        setPageState('invalid');
      }
    })();
  }, []);

  const validate = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords don't match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: 'Reset Failed', description: data.message || 'Something went wrong.', variant: 'destructive' });
      } else {
        setPageState('success');
      }
    } catch {
      toast({ title: 'Network Error', description: 'Failed to connect. Please try again.', variant: 'destructive' });
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
          <p className="text-neutral-500 text-xs font-black uppercase tracking-[0.4em]">Set New Password</p>
        </div>

        <AnimatePresence mode="wait">
          {/* Validating */}
          {pageState === 'validating' && (
            <motion.div key="validating" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
                <CardContent className="py-16 text-center">
                  <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
                  <p className="text-neutral-500 font-bold text-xs uppercase tracking-widest">Validating reset link…</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Invalid / Expired */}
          {pageState === 'invalid' && (
            <motion.div key="invalid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
                <CardContent className="py-12 px-8 sm:px-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tight">Link Expired</h2>
                  <p className="text-neutral-500 font-bold text-xs uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                    This reset link is invalid or has expired. Reset links are only valid for 1 hour.
                  </p>
                  <Button
                    onClick={() => setLocation('/auth/forgot-password')}
                    className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black italic uppercase tracking-[0.2em] mt-2"
                  >
                    Request New Link
                  </Button>
                  <Link
                    href="/auth"
                    className="flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-neutral-500 hover:text-emerald-400 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Login
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Valid — show form */}
          {pageState === 'valid' && (
            <motion.div key="valid" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
                <CardHeader className="pt-10 pb-6 px-8 sm:px-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-7 h-7 text-emerald-400" />
                  </div>
                  <CardTitle className="text-2xl font-black italic uppercase tracking-tight mb-2">
                    New Password
                  </CardTitle>
                  {tokenEmail && (
                    <CardDescription className="text-neutral-500 font-bold text-xs uppercase tracking-widest">
                      For <span className="text-neutral-300">{tokenEmail}</span>
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="pb-10 px-8 sm:px-12">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password */}
                    <div className="space-y-1">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className={cn("w-4 h-4 transition-colors", errors.password ? "text-red-500" : "text-neutral-600 group-focus-within:text-emerald-500")} />
                        </div>
                        <Input
                          id="reset-password-input"
                          type={showPwd ? 'text' : 'password'}
                          placeholder="New password (min. 6 chars)"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                          disabled={loading}
                          className={cn(
                            "h-14 pl-12 pr-12 bg-neutral-800/50 border-neutral-800 rounded-2xl text-sm font-medium focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-neutral-600",
                            errors.password && "border-red-500/50 bg-red-500/5"
                          )}
                          autoComplete="new-password"
                        />
                        <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-600 hover:text-white transition-colors">
                          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <motion.p initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-black uppercase text-red-500 pl-4">{errors.password}</motion.p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className={cn("w-4 h-4 transition-colors", errors.confirmPassword ? "text-red-500" : "text-neutral-600 group-focus-within:text-emerald-500")} />
                        </div>
                        <Input
                          id="reset-confirm-password-input"
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
                          disabled={loading}
                          className={cn(
                            "h-14 pl-12 pr-12 bg-neutral-800/50 border-neutral-800 rounded-2xl text-sm font-medium focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-neutral-600",
                            errors.confirmPassword && "border-red-500/50 bg-red-500/5"
                          )}
                          autoComplete="new-password"
                        />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-600 hover:text-white transition-colors">
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <motion.p initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-black uppercase text-red-500 pl-4">{errors.confirmPassword}</motion.p>
                      )}
                    </div>

                    <Button
                      id="reset-password-submit"
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black italic uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/10 group overflow-hidden relative"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <span className="relative z-10 flex items-center gap-2">
                          Reset Password
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Success */}
          {pageState === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
                <CardContent className="py-12 px-8 sm:px-12 text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring' }}
                    className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto"
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </motion.div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tight">Password Reset!</h2>
                  <p className="text-neutral-500 font-bold text-xs uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                    Your password has been reset successfully. You can now log in with your new password.
                  </p>
                  <Button
                    onClick={() => setLocation('/auth')}
                    className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black italic uppercase tracking-[0.2em] mt-2"
                  >
                    Go to Login
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
