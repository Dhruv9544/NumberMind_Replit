import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export default function Home() {
  const { user } = useAuth();
  
  const { data: userGames } = useQuery({
    queryKey: ["/api/users/me/games"],
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const winRate = user?.stats?.gamesPlayed && user?.stats?.gamesPlayed > 0 
    ? Math.round((user.stats.gamesWon / user.stats.gamesPlayed) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto bg-background min-h-screen relative overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-8 mt-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
              NumberMind
            </h1>
            <p className="text-muted-foreground text-sm">Logic Building Game</p>
          </div>
          
          {/* Profile Card */}
          <Card className="mb-6 border-border">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold">
                  <span data-testid="user-avatar">
                    {getInitials(user?.firstName, user?.lastName)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold" data-testid="user-name">
                    {user?.firstName || user?.lastName 
                      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                      : user?.email?.split("@")[0] || "Player"
                    }
                  </h3>
                  <div className="flex space-x-4 text-sm text-muted-foreground">
                    <span data-testid="user-wins">{user?.stats?.gamesWon || 0} Wins</span>
                    <span data-testid="user-streak">🔥 {user?.stats?.currentStreak || 0} Streak</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = "/api/logout"}
                  data-testid="button-logout"
                >
                  <i className="fas fa-sign-out-alt text-muted-foreground"></i>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Game Mode Buttons */}
          <div className="space-y-3 mb-6">
            <Link href="/game/setup?mode=friend">
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground p-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-between group"
                data-testid="button-challenge-friend"
              >
                <div className="flex items-center space-x-3">
                  <i className="fas fa-user-friends text-xl"></i>
                  <span>Challenge Friend</span>
                </div>
                <i className="fas fa-chevron-right group-hover:translate-x-1 transition-transform"></i>
              </Button>
            </Link>
            
            <Link href="/game/setup?mode=random">
              <Button 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground p-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-between group"
                data-testid="button-random-opponent"
              >
                <div className="flex items-center space-x-3">
                  <i className="fas fa-random text-xl"></i>
                  <span>Random Opponent</span>
                </div>
                <i className="fas fa-chevron-right group-hover:translate-x-1 transition-transform"></i>
              </Button>
            </Link>
            
            <Link href="/game/setup?mode=ai">
              <Button 
                variant="secondary"
                className="w-full hover:bg-secondary/80 p-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-between group border border-border"
                data-testid="button-practice-ai"
              >
                <div className="flex items-center space-x-3">
                  <i className="fas fa-robot text-xl"></i>
                  <span>Practice vs AI</span>
                </div>
                <i className="fas fa-chevron-right group-hover:translate-x-1 transition-transform"></i>
              </Button>
            </Link>
            
            <Button 
              className="w-full bg-gradient-to-r from-chart-3 to-chart-5 hover:opacity-90 text-background p-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-between group"
              data-testid="button-daily-challenge"
            >
              <div className="flex items-center space-x-3">
                <i className="fas fa-calendar-star text-xl"></i>
                <span>Daily Challenge</span>
              </div>
              <i className="fas fa-chevron-right group-hover:translate-x-1 transition-transform"></i>
            </Button>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card>
              <CardContent className="p-4 text-center border border-border">
                <div className="text-2xl font-bold text-primary" data-testid="stat-games-played">
                  {user?.stats?.gamesPlayed || 0}
                </div>
                <div className="text-sm text-muted-foreground">Games Played</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center border border-border">
                <div className="text-2xl font-bold text-accent" data-testid="stat-win-rate">
                  {winRate}%
                </div>
                <div className="text-sm text-muted-foreground">Win Rate</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Actions */}
          <div className="flex justify-center space-x-6">
            <Button
              variant="ghost"
              className="flex flex-col items-center space-y-2 p-3 hover:bg-muted rounded-lg transition-colors"
              data-testid="button-leaderboard"
            >
              <i className="fas fa-trophy text-chart-3 text-xl"></i>
              <span className="text-sm text-muted-foreground">Leaderboard</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center space-y-2 p-3 hover:bg-muted rounded-lg transition-colors"
              data-testid="button-achievements"
            >
              <i className="fas fa-medal text-chart-2 text-xl"></i>
              <span className="text-sm text-muted-foreground">Achievements</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center space-y-2 p-3 hover:bg-muted rounded-lg transition-colors"
              data-testid="button-history"
            >
              <i className="fas fa-history text-primary text-xl"></i>
              <span className="text-sm text-muted-foreground">History</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
