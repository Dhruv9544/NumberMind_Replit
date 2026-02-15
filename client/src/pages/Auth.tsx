import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const verifySchema = z.object({
  email: z.string().email('Invalid email address'),
  token: z.string().min(5, 'Verification token is required'),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;
type VerifyForm = z.infer<typeof verifySchema>;

export default function AuthPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
  });

  const verifyForm = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    mode: 'onBlur',
  });

  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  const onLogin = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const responseData = await res.json();
      if (!res.ok) {
        toast({
          title: 'Login Failed',
          description: responseData.message || 'Invalid credentials',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Logged in successfully',
          variant: 'default',
        });
        setLocation('/');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Login failed. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async (data: SignupForm) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const responseData = await res.json();
      if (!res.ok) {
        toast({
          title: 'Signup Failed',
          description: responseData.message || 'Signup failed',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: `Your verification token: ${responseData.verificationToken}`,
          variant: 'default',
        });
        setVerificationEmail(data.email);
        verifyForm.setValue('email', data.email);
        verifyForm.setValue('token', responseData.verificationToken);
        setIsVerifying(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Signup failed. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (data: VerifyForm) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, token: data.token }),
      });
      const responseData = await res.json();
      if (!res.ok) {
        toast({
          title: 'Verification Failed',
          description: responseData.message || 'Invalid verification token',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Email verified! You can now login.',
          variant: 'default',
        });
        setIsVerifying(false);
        setIsLogin(true);
        loginForm.reset();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Verification failed. Please try again.',
        variant: 'destructive',
      });
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
            <CardTitle className="text-white">
              {isVerifying ? 'Verify Email' : isLogin ? 'Login' : 'Sign Up'}
            </CardTitle>
            <CardDescription>
              {isVerifying
                ? 'Enter your verification token'
                : isLogin
                ? 'Welcome back'
                : 'Create your account'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isVerifying ? (
              <form onSubmit={verifyForm.handleSubmit(onVerify)} className="space-y-4">
                <div className="bg-blue-900/30 border border-blue-500/50 rounded p-3">
                  <p className="text-sm text-blue-200">
                    <strong>Token automatically filled!</strong> Check the notification above for your verification token. Click "Verify Email" to confirm.
                  </p>
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    {...verifyForm.register('email')}
                    disabled={loading}
                    className="bg-slate-800 border-purple-500/30 text-white placeholder:text-gray-400"
                  />
                  {verifyForm.formState.errors.email && (
                    <p className="text-red-500 text-sm mt-1">{verifyForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="Verification Token"
                    {...verifyForm.register('token')}
                    disabled={loading}
                    className="bg-slate-800 border-purple-500/30 text-white placeholder:text-gray-400"
                  />
                  {verifyForm.formState.errors.token && (
                    <p className="text-red-500 text-sm mt-1">{verifyForm.formState.errors.token.message}</p>
                  )}
                </div>
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
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    {...loginForm.register('email')}
                    disabled={loading}
                    className={`bg-slate-800 border-purple-500/30 text-white placeholder:text-gray-400 ${
                      loginForm.formState.errors.email ? 'border-red-500 border-2' : ''
                    }`}
                    data-testid="input-email"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-red-500 text-sm mt-1">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    {...loginForm.register('password')}
                    disabled={loading}
                    className={`bg-slate-800 border-purple-500/30 text-white placeholder:text-gray-400 ${
                      loginForm.formState.errors.password ? 'border-red-500 border-2' : ''
                    }`}
                    data-testid="input-password"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-red-500 text-sm mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
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
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    {...signupForm.register('email')}
                    disabled={loading}
                    className={`bg-slate-800 border-purple-500/30 text-white placeholder:text-gray-400 ${
                      signupForm.formState.errors.email && signupForm.formState.touchedFields.email ? 'border-red-500 border-2' : ''
                    }`}
                    data-testid="input-signup-email"
                  />
                  {signupForm.formState.errors.email && signupForm.formState.touchedFields.email && (
                    <p className="text-red-500 text-sm mt-1">{signupForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    {...signupForm.register('password')}
                    disabled={loading}
                    className={`bg-slate-800 border-purple-500/30 text-white placeholder:text-gray-400 ${
                      signupForm.formState.errors.password && signupForm.formState.touchedFields.password ? 'border-red-500 border-2' : ''
                    }`}
                    data-testid="input-signup-password"
                  />
                  {signupForm.formState.errors.password && signupForm.formState.touchedFields.password && (
                    <p className="text-red-500 text-sm mt-1">{signupForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    {...signupForm.register('confirmPassword')}
                    disabled={loading}
                    className={`bg-slate-800 border-purple-500/30 text-white placeholder:text-gray-400 ${
                      signupForm.formState.errors.confirmPassword && signupForm.formState.touchedFields.confirmPassword ? 'border-red-500 border-2' : ''
                    }`}
                    data-testid="input-confirm-password"
                  />
                  {signupForm.formState.errors.confirmPassword && signupForm.formState.touchedFields.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{signupForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
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
