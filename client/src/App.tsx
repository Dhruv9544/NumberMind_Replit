import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import GameSetup from "@/pages/GameSetupNew";
import GamePlay from "@/pages/GamePlayNew";
import GameResult from "@/pages/GameResult";
import Challenges from "@/pages/Challenges";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import Notifications from "@/pages/Notifications";

function Router() {
  const [location] = useLocation();
  
  // Check if user is authenticated
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Show loading state
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If on auth page, always show it
  if (location === '/auth' || location.startsWith('/auth')) {
    return <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route component={AuthPage} />
    </Switch>;
  }

  // If not authenticated (401 error or no user), redirect to auth
  if (isError || !user) {
    return <Switch>
      <Route path="*" component={AuthPage} />
    </Switch>;
  }

  // User is authenticated, show app
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/challenges" component={Challenges} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/profile/:userId" component={Profile} />
      <Route path="/profile" component={Profile} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/game/setup" component={GameSetup} />
      <Route path="/game/play/:gameId" component={GamePlay} />
      <Route path="/game/result/:gameId" component={GameResult} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Navbar />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
