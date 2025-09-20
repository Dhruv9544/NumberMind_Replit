import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto bg-background min-h-screen relative overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-8 mt-16">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              NumberMind
            </h1>
            <p className="text-muted-foreground text-lg mb-2">Logic Building Game</p>
            <p className="text-sm text-muted-foreground">
              Challenge your mind with strategic number deduction
            </p>
          </div>

          {/* Game Preview */}
          <Card className="mb-8 bg-gradient-to-br from-card to-muted/20 border-border">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">How to Play</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Guess your opponent's secret 4-digit number using logical deduction
                </p>
              </div>
              
              {/* Example gameplay */}
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-8 h-8 bg-secondary rounded text-center leading-8 font-bold">1</div>
                    <div className="w-8 h-8 bg-secondary rounded text-center leading-8 font-bold">2</div>
                    <div className="w-8 h-8 bg-secondary rounded text-center leading-8 font-bold">3</div>
                    <div className="w-8 h-8 bg-secondary rounded text-center leading-8 font-bold">4</div>
                  </div>
                  <div className="flex space-x-3 text-sm">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-chart-3 rounded-full"></div>
                      <span>2 digits</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-accent rounded-full"></div>
                      <span>1 position</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Use feedback to narrow down possibilities and crack the code!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-users text-primary text-xl"></i>
                </div>
                <h4 className="font-semibold text-sm mb-1">Multiplayer</h4>
                <p className="text-xs text-muted-foreground">Challenge friends in real-time</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-brain text-accent text-xl"></i>
                </div>
                <h4 className="font-semibold text-sm mb-1">Strategic</h4>
                <p className="text-xs text-muted-foreground">Pure logic and deduction</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-chart-3/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-trophy text-chart-3 text-xl"></i>
                </div>
                <h4 className="font-semibold text-sm mb-1">Competitive</h4>
                <p className="text-xs text-muted-foreground">Track wins and streaks</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-chart-5/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-zap text-chart-5 text-xl"></i>
                </div>
                <h4 className="font-semibold text-sm mb-1">Fast-Paced</h4>
                <p className="text-xs text-muted-foreground">Quick 5-minute games</p>
              </CardContent>
            </Card>
          </div>

          {/* Login Button */}
          <div className="space-y-4">
            <Button
              onClick={() => window.location.href = "/api/login"}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground p-4 rounded-lg font-semibold text-lg"
              data-testid="button-login"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Start Playing
            </Button>
            
            <p className="text-center text-xs text-muted-foreground">
              Sign in to track your progress and challenge friends
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
