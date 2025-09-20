import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface GameResultData {
  id: string;
  player1Id: string;
  player2Id?: string;
  player1Secret: string;
  player2Secret: string;
  winnerId: string;
  gameMode: string;
  startedAt: string;
  finishedAt: string;
  moves: Array<{
    playerId: string;
    guess: string;
    moveNumber: number;
  }>;
}

export default function GameResult() {
  const { user } = useAuth();
  const { gameId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: gameData, isLoading, error } = useQuery<GameResultData>({
    queryKey: ["/api/games", gameId],
    enabled: !!gameId,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  const handlePlayAgain = () => {
    setLocation("/game/setup");
  };

  const handleShareResult = () => {
    if (navigator.share && gameData) {
      const isWinner = gameData.winnerId === user?.id;
      const myMoves = gameData.moves.filter(m => m.playerId === user?.id);
      const timeElapsed = gameData.startedAt && gameData.finishedAt
        ? Math.floor((new Date(gameData.finishedAt).getTime() - new Date(gameData.startedAt).getTime()) / 1000)
        : 0;
      
      const minutes = Math.floor(timeElapsed / 60);
      const seconds = timeElapsed % 60;
      
      navigator.share({
        title: "NumberMind Game Result",
        text: `${isWinner ? "I won" : "I played"} a NumberMind game in ${myMoves.length} guesses and ${minutes}:${seconds.toString().padStart(2, '0')}! 🧠`,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      toast({
        title: "Share",
        description: "Share functionality would copy a link to your clipboard.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <i className="fas fa-exclamation-triangle text-4xl text-destructive mb-4"></i>
            <h2 className="text-xl font-bold mb-2">Game Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The game results you're looking for couldn't be loaded.
            </p>
            <Button onClick={() => setLocation("/")} data-testid="button-home">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isWinner = gameData.winnerId === user?.id;
  const myMoves = gameData.moves.filter(m => m.playerId === user?.id);
  const timeElapsed = gameData.startedAt && gameData.finishedAt
    ? Math.floor((new Date(gameData.finishedAt).getTime() - new Date(gameData.startedAt).getTime()) / 1000)
    : 0;
  
  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto bg-background min-h-screen relative overflow-hidden">
        <div className="p-6">
          {/* Victory/Defeat Animation Container */}
          <div className="text-center mb-8">
            {/* Result Badge */}
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ${
              isWinner 
                ? "bg-gradient-to-br from-chart-3 to-accent" 
                : "bg-gradient-to-br from-muted to-secondary"
            }`}>
              <i className={`text-4xl ${
                isWinner 
                  ? "fas fa-trophy text-background" 
                  : "fas fa-medal text-muted-foreground"
              }`}></i>
            </div>
            
            {/* Result Message */}
            <h2 className={`text-3xl font-bold mb-2 ${
              isWinner 
                ? "bg-gradient-to-r from-chart-3 to-accent bg-clip-text text-transparent" 
                : "text-muted-foreground"
            }`} data-testid="result-title">
              {isWinner ? "Victory!" : "Game Over"}
            </h2>
            <p className="text-muted-foreground" data-testid="result-message">
              {isWinner 
                ? `You cracked the code in ${myMoves.length} guesses!`
                : "Better luck next time!"
              }
            </p>
          </div>
          
          {/* Game Summary */}
          <Card className="mb-6 border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 text-center">Game Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary" data-testid="guess-count">
                    {myMoves.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Your Guesses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent" data-testid="time-elapsed">
                    {formattedTime}
                  </div>
                  <div className="text-sm text-muted-foreground">Time Taken</div>
                </div>
              </div>
              
              {/* Secret Numbers Reveal */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Your secret:</span>
                    <div className="flex space-x-1">
                      {(gameData.player1Id === user?.id ? gameData.player1Secret : gameData.player2Secret)
                        ?.split('').map((digit, index) => (
                        <span 
                          key={index}
                          className="w-8 h-8 bg-primary rounded text-center leading-8 font-bold text-primary-foreground"
                          data-testid={`player-secret-${index}`}
                        >
                          {digit}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Opponent's secret:</span>
                    <div className="flex space-x-1">
                      {(gameData.player1Id === user?.id ? gameData.player2Secret : gameData.player1Secret)
                        ?.split('').map((digit, index) => (
                        <span 
                          key={index}
                          className="w-8 h-8 bg-accent rounded text-center leading-8 font-bold text-accent-foreground"
                          data-testid={`opponent-secret-${index}`}
                        >
                          {digit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Achievements Earned (only show for winners) */}
          {isWinner && (
            <Card className="mb-6 bg-gradient-to-r from-chart-3/20 to-accent/20 border-chart-3/30">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center">
                  <i className="fas fa-medal text-chart-3 mr-2"></i>
                  Achievement Unlocked
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 bg-background/50 rounded-lg p-3">
                    <div className="w-8 h-8 bg-chart-3 rounded-full flex items-center justify-center">
                      <i className="fas fa-zap text-background text-sm"></i>
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Code Breaker</div>
                      <div className="text-xs text-muted-foreground">
                        {myMoves.length <= 6 ? "Solved efficiently" : "Solved the puzzle"}
                      </div>
                    </div>
                    <div className="text-chart-3 font-bold">+50 XP</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Updated Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card>
              <CardContent className="p-3 text-center border border-border">
                <div className="text-lg font-bold text-primary" data-testid="total-wins">
                  {user?.stats?.gamesWon || 0}
                </div>
                <div className="text-xs text-muted-foreground">Total Wins</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center border border-border">
                <div className="text-lg font-bold text-accent" data-testid="current-streak">
                  {user?.stats?.currentStreak || 0}
                </div>
                <div className="text-xs text-muted-foreground">Win Streak</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center border border-border">
                <div className="text-lg font-bold text-chart-3" data-testid="win-rate">
                  {user?.stats?.gamesPlayed && user?.stats?.gamesPlayed > 0 
                    ? Math.round((user.stats.gamesWon! / user.stats.gamesPlayed) * 100)
                    : 0}%
                </div>
                <div className="text-xs text-muted-foreground">Win Rate</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handlePlayAgain}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground p-4 rounded-lg font-semibold transition-colors"
              data-testid="button-play-again"
            >
              <i className="fas fa-redo mr-2"></i>
              Play Again
            </Button>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleShareResult}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground p-3 rounded-lg font-semibold transition-colors"
                data-testid="button-share"
              >
                <i className="fas fa-share mr-2"></i>
                Share
              </Button>
              <Button
                onClick={() => setLocation("/")}
                variant="secondary"
                className="flex-1 p-3 rounded-lg font-semibold transition-colors border border-border"
                data-testid="button-home"
              >
                <i className="fas fa-home mr-2"></i>
                Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
