import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import { GameLoader } from "@/components/GameLoader";
import { WebSocketProvider } from "@/context/WebSocketContext";
import LandingPage from "@/pages/Landing";
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
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Unauthenticated: only allow landing and auth pages
      if (location !== "/" && location !== "/auth") {
        setLocation("/");
      }
    } else if (user && !user.usernameSet) {
      // Authenticated but no username yet
      if (location !== "/setup-username") {
        setLocation("/setup-username");
      }
    } else if (user && user.usernameSet) {
      // Fully authenticated: kick away from landing/auth/setup pages
      if (
        location === "/auth" ||
        location === "/setup-username"
      ) {
        setLocation("/");
      }
    }
  }, [user, isLoading, location, setLocation]);

  // Loading screen
  if (isLoading) {
    return <GameLoader fullScreen text="Verifying Clearance..." />;
  }

  // ── Unauthenticated routes ──────────────────────────────────────
  if (!user) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/auth" component={AuthPage} />
        <Route component={LandingPage} />
      </Switch>
    );
  }

  // ── Username setup ──────────────────────────────────────────────
  if (!user.usernameSet) {
    return (
      <Switch>
        <Route path="/setup-username" component={UsernameSetupPage} />
        <Route component={UsernameSetupPage} />
      </Switch>
    );
  }

  // ── Authenticated & fully set up ────────────────────────────────
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
        {/* Navbar is hidden on landing page - it has its own nav */}
        <Navbar />
        <WebSocketProvider>
          <Router />
        </WebSocketProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
