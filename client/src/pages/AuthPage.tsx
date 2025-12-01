import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Client-side validation with real-time feedback
  const validateEmail = (value: string): string | undefined => {
    if (!value) return "Email is required";
    if (!value.includes("@") || !value.includes(".")) return "Please enter a valid email address";
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value) return "Password is required";
    if (value.length < 6 && !isLogin) return "Password must be at least 6 characters";
    if (!isLogin && !/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter";
    if (!isLogin && !/[0-9]/.test(value)) return "Password must contain at least one number";
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

    // Validate inputs first
    if (!validateInputs()) {
      return;
    }

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
          title: "Error",
          description: data.message || "Authentication failed",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Success",
        description: data.message || (isLogin ? "Logged in successfully" : "Account created successfully"),
      });

      // Clear form
      setEmail("");
      setPassword("");
      setErrors({});

      // After signup, switch to login view. After login, redirect to dashboard.
      if (!isLogin) {
        setIsLogin(true); // Switch to login mode after signup
      } else {
        // After login, invalidate and refetch auth query, then redirect
        await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        await queryClient.refetchQueries({ queryKey: ['/api/auth/user'] });
        // Router component will handle redirect based on usernameSet
        setLocation("/"); 
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isLogin ? "Login" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin
              ? "Enter your credentials to continue"
              : "Create an account to play"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  const value = e.target.value;
                  setEmail(value);
                  const error = validateEmail(value);
                  setErrors({ ...errors, email: error });
                }}
                required
                data-testid="input-email"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  const value = e.target.value;
                  setPassword(value);
                  const error = validatePassword(value);
                  setErrors({ ...errors, password: error });
                }}
                required
                data-testid="input-password"
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              {!isLogin && (
                <div className="text-gray-500 text-xs mt-2 space-y-1">
                  <p>Password requirements:</p>
                  <p className={password.length >= 6 ? "text-green-600" : ""}>✓ At least 6 characters</p>
                  <p className={/[A-Z]/.test(password) ? "text-green-600" : ""}>✓ One uppercase letter</p>
                  <p className={/[0-9]/.test(password) ? "text-green-600" : ""}>✓ One number</p>
                </div>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="button-submit"
            >
              {loading ? "Loading..." : isLogin ? "Login" : "Sign Up"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-600 hover:underline"
              data-testid="button-toggle-auth"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Login"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
