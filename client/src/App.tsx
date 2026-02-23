import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import { GameLoader } from "@/components/GameLoader";
import { WebSocketProvider } from "@/context/WebSocketContext";
import AuthPage from "@/pages/AuthPage";
import UsernameSetupPage from "@/pages/UsernameSetupPage";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import GameSetup from "@/pages/GameSetupNew";
import GamePlay from "@/pages/GamePlayNew";
import GameResult from "@/pages/GameResult";
import Challenges from "@/pages/Challenges";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import Notifications from "@/pages/Notifications";
import HistoryPage from "@/pages/History";

function Router() {
  const [location, setLocation] = useLocation();
  
  // Check if user is authenticated
  const { data: user, isLoading } = useQuery<any>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Handle redirects using effect instead of during render
  useEffect(() => {
    if (isLoading) return;
    
    if (!user && location !== '/auth') {
      setLocation('/auth');
    } else if (user && !user.usernameSet && location !== '/setup-username') {
      setLocation('/setup-username');
    } else if (user && user.usernameSet && (location === '/auth' || location === '/setup-username')) {
      setLocation('/');
    }
  }, [user, isLoading, location, setLocation]);

  // Show custom game loader
  if (isLoading) {
    return <GameLoader fullScreen text="Verifying Clearance..." />;
  }

  // If not authenticated, show auth page
  if (!user) {
    return <Switch>
      <Route path="*" component={AuthPage} />
    </Switch>;
  }

  // If username not set, show username setup
  if (!user.usernameSet) {
    return <Switch>
      <Route path="/setup-username" component={UsernameSetupPage} />
      <Route path="*" component={UsernameSetupPage} />
    </Switch>;
  }

  // User is authenticated and has username, show app
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/challenges" component={Challenges} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/profile/:userId" component={Profile} />
      <Route path="/profile" component={Profile} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/history" component={HistoryPage} />
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
        <WebSocketProvider>
          <Router />
        </WebSocketProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
