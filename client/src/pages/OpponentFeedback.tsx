import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";

export default function OpponentFeedback() {
  const { gameId } = useParams();
  const [, setLocation] = useLocation();
  const [correctDigits, setCorrectDigits] = useState<number | null>(null);
  const [correctPositions, setCorrectPositions] = useState<number | null>(null);
  
  // Mock opponent guess - in real implementation, this would come from props or API
  const opponentGuess = "7324";

  const handleSetCorrectDigits = (count: number) => {
    setCorrectDigits(count);
  };

  const handleSetCorrectPositions = (count: number) => {
    setCorrectPositions(count);
  };

  const handleSubmitFeedback = () => {
    if (correctDigits === null || correctPositions === null) {
      alert("Please provide both correct digits and correct positions feedback.");
      return;
    }

    // TODO: Submit feedback to API
    console.log("Feedback:", { correctDigits, correctPositions });
    
    // Return to gameplay
    setLocation(`/game/play/${gameId}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto bg-background min-h-screen relative overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-2">Opponent's Guess</h2>
            <p className="text-muted-foreground">Provide feedback on their attempt</p>
          </div>
          
          {/* Opponent's Guess Display */}
          <Card className="mb-6 border-border">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <div className="text-sm text-muted-foreground mb-2">AI Assistant guessed:</div>
                <div className="flex justify-center space-x-2">
                  {opponentGuess.split('').map((digit, index) => (
                    <div 
                      key={index}
                      className="w-16 h-16 bg-secondary border-2 border-border rounded-lg flex items-center justify-center text-3xl font-bold"
                      data-testid={`opponent-guess-${index}`}
                    >
                      {digit}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Feedback Input */}
          <div className="space-y-6 mb-6">
            {/* Correct Digits */}
            <div>
              <label className="block text-sm font-semibold mb-3">
                <i className="fas fa-circle text-chart-3 mr-2"></i>
                How many digits are correct?
              </label>
              <div className="flex justify-center space-x-2">
                {[0, 1, 2, 3, 4].map((count) => (
                  <Button
                    key={count}
                    variant={correctDigits === count ? "default" : "secondary"}
                    className={
                      correctDigits === count
                        ? "w-12 h-12 bg-chart-3 hover:bg-chart-3/90 text-background rounded-lg font-bold transition-colors border border-chart-3"
                        : "w-12 h-12 bg-secondary hover:bg-secondary/80 rounded-lg font-bold transition-colors border border-border"
                    }
                    onClick={() => handleSetCorrectDigits(count)}
                    data-testid={`correct-digits-${count}`}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Correct Positions */}
            <div>
              <label className="block text-sm font-semibold mb-3">
                <i className="fas fa-bullseye text-accent mr-2"></i>
                How many are in correct positions?
              </label>
              <div className="flex justify-center space-x-2">
                {[0, 1, 2, 3, 4].map((count) => (
                  <Button
                    key={count}
                    variant={correctPositions === count ? "default" : "secondary"}
                    className={
                      correctPositions === count
                        ? "w-12 h-12 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg font-bold transition-colors border border-accent"
                        : "w-12 h-12 bg-secondary hover:bg-secondary/80 rounded-lg font-bold transition-colors border border-border"
                    }
                    onClick={() => handleSetCorrectPositions(count)}
                    data-testid={`correct-positions-${count}`}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Feedback Summary */}
          {(correctDigits !== null || correctPositions !== null) && (
            <Card className="mb-6 bg-muted/30">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">Your feedback:</div>
                  <div className="flex items-center justify-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-chart-3 rounded-full"></div>
                      <span>
                        <span className="font-bold" data-testid="feedback-correct-digits">
                          {correctDigits ?? "?"}
                        </span> correct digits
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-accent rounded-full"></div>
                      <span>
                        <span className="font-bold" data-testid="feedback-correct-positions">
                          {correctPositions ?? "?"}
                        </span> correct positions
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Submit Feedback */}
          <Button
            onClick={handleSubmitFeedback}
            disabled={correctDigits === null || correctPositions === null}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground p-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-submit-feedback"
          >
            <i className="fas fa-paper-plane mr-2"></i>
            Send Feedback
          </Button>
        </div>
      </div>
    </div>
  );
}
