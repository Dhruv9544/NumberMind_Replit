import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function AuthPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Logged in successfully' });
        setLocation('/');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Login failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: any) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Signup successful. Check your verification token.' });
        setVerificationToken(data.verificationToken);
        setIsVerifying(true);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Signup failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: verificationToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Email verified. You can now login.' });
        setIsVerifying(false);
        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Verification failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">NumberMind</h1>
          <p className="text-purple-200">Master the Art of Deduction</p>
        </div>

        <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-white">{isVerifying ? 'Verify Email' : (isLogin ? 'Login' : 'Sign Up')}</CardTitle>
            <CardDescription>{isVerifying ? 'Enter your verification token' : (isLogin ? 'Enter your credentials' : 'Create your account')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isVerifying ? (
              <form onSubmit={handleVerify} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-800 border-purple-500/30 text-white placeholder:text-gray-400"
                  disabled={loading}
                />
                <Input
                  type="text"
                  placeholder="Verification Token"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  className="bg-slate-800 border-purple-500/30 text-white placeholder:text-gray-400"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold h-12"
                  disabled={loading}
                  data-testid="button-verify"
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </Button>
              </form>
            ) : isLogin ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-800 border-purple-500/30 text-white placeholder:text-gray-400"
                  disabled={loading}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-800 border-purple-500/30 text-white placeholder:text-gray-400"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold h-12"
                  disabled={loading}
                  data-testid="button-login"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-purple-400 border-purple-500/30"
                  onClick={() => setIsLogin(false)}
                  disabled={loading}
                >
                  Don't have an account? Sign up
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-800 border-purple-500/30 text-white placeholder:text-gray-400"
                  disabled={loading}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-800 border-purple-500/30 text-white placeholder:text-gray-400"
                  disabled={loading}
                />
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-800 border-purple-500/30 text-white placeholder:text-gray-400"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold h-12"
                  disabled={loading}
                  data-testid="button-signup"
                >
                  {loading ? 'Signing up...' : 'Sign Up'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-purple-400 border-purple-500/30"
                  onClick={() => setIsLogin(true)}
                  disabled={loading}
                >
                  Already have an account? Login
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-purple-200">
          <p>Challenge friends, compete globally, master the numbers</p>
        </div>
      </div>
    </div>
  );
}
