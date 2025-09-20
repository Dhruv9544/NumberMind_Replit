import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import GameSetup from "@/pages/GameSetup";
import GamePlay from "@/pages/GamePlay";
import OpponentFeedback from "@/pages/OpponentFeedback";
import GameResult from "@/pages/GameResult";
import FriendChallenge from "@/pages/FriendChallenge";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/game/setup" component={GameSetup} />
          <Route path="/game/play/:gameId" component={GamePlay} />
          <Route path="/game/feedback/:gameId" component={OpponentFeedback} />
          <Route path="/game/result/:gameId" component={GameResult} />
          <Route path="/friends" component={FriendChallenge} />
        </>
      )}
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
