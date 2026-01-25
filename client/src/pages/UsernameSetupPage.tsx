import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

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
    if (!value) return "Game name is required";
    if (value.length < 3) return "Game name must be at least 3 characters";
    if (value.length > 20) return "Game name must be at most 20 characters";
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return "Game name can only contain letters, numbers, hyphens, and underscores";
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
      if (!response.ok) throw new Error(data.message || 'Failed to set username');
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Game name set successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set game name",
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Choose Your Game Name</CardTitle>
          <CardDescription className="text-center">
            This name will be displayed in challenges and on your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter your game name"
                value={username}
                onChange={(e) => {
                  const value = e.target.value;
                  setUsername(value);
                  const error = validateUsername(value);
                  setErrors({ username: error });
                }}
                disabled={mutation.isPending}
                data-testid="input-username"
                className={errors.username ? "border-red-500" : ""}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
              <p className="text-gray-500 text-xs mt-2">
                3-20 characters, letters, numbers, hyphens, and underscores only
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending || !!errors.username || !username}
              data-testid="button-set-username"
            >
              {mutation.isPending ? "Setting up..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
