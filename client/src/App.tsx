import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
