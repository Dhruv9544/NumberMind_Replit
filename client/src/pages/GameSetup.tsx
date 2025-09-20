import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NumberSlot, NumberPad, useNumberInput } from "@/components/GameComponents";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function GameSetup() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [gameMode, setGameMode] = useState<string>("ai");
  
  const {
    digits,
    currentSlot,
    inputDigit,
    clearInput,
    randomNumber,
    getValue,
    isComplete,
    reset,
    focusSlot,
  } = useNumberInput();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode");
    if (mode) {
      setGameMode(mode);
    }
  }, []);

  const createGameMutation = useMutation({
    mutationFn: async ({ gameMode, difficulty }: { gameMode: string; difficulty?: string }) => {
      const response = await apiRequest("POST", "/api/games", { gameMode, difficulty });
      return response.json();
    },
    onSuccess: (game) => {
      setSecretMutation.mutate({
        gameId: game.id,
        secretNumber: getValue(),
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const setSecretMutation = useMutation({
    mutationFn: async ({ gameId, secretNumber }: { gameId: string; secretNumber: string }) => {
      const response = await apiRequest("PUT", `/api/games/${gameId}/secret`, { secretNumber });
      return response.json();
    },
    onSuccess: (game) => {
      setLocation(`/game/play/${game.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStartGame = () => {
    if (!isComplete()) {
      toast({
        title: "Invalid Number",
        description: "Please enter a complete 4-digit number with unique digits.",
        variant: "destructive",
      });
      return;
    }

    createGameMutation.mutate({ gameMode });
  };

  const getOpponentInfo = () => {
    switch (gameMode) {
      case "ai":
        return {
          name: "AI Assistant",
          avatar: "AI",
          difficulty: "Expert",
        };
      case "random":
        return {
          name: "Random Player",
          avatar: "?",
          difficulty: "Unknown",
        };
      case "friend":
        return {
          name: "Friend",
          avatar: "F",
          difficulty: "Variable",
        };
      default:
        return {
          name: "Opponent",
          avatar: "O",
          difficulty: "Unknown",
        };
    }
  };

  const opponent = getOpponentInfo();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto bg-background min-h-screen relative overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <i className="fas fa-arrow-left text-xl"></i>
            </Button>
            <h2 className="text-xl font-bold">Choose Your Secret</h2>
            <div className="w-10"></div>
          </div>
          
          {/* Opponent Info */}
          <Card className="mb-6 border-border">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center text-white font-bold">
                  <span data-testid="opponent-avatar">{opponent.avatar}</span>
                </div>
                <div>
                  <h3 className="font-semibold" data-testid="opponent-name">{opponent.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Difficulty: <span className="text-accent">{opponent.difficulty}</span>
                  </p>
                </div>
                <div className="flex-1"></div>
                <div className="w-3 h-3 bg-accent rounded-full pulse-animation"></div>
              </div>
            </CardContent>
          </Card>
          
          {/* Instructions */}
          <Card className="mb-6 bg-muted/30">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2 flex items-center">
                <i className="fas fa-lightbulb text-chart-3 mr-2"></i>
                How to Play
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Choose a 4-digit secret number</li>
                <li>• No repeated digits allowed</li>
                <li>• Your opponent will try to guess it</li>
                <li>• First to guess wins!</li>
              </ul>
            </CardContent>
          </Card>
          
          {/* Number Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3 text-center">
              Your Secret Number
            </label>
            
            <div className="flex justify-center space-x-2 mb-4">
              {digits.map((digit, index) => (
                <NumberSlot
                  key={index}
                  value={digit}
                  isActive={index === currentSlot}
                  onClick={() => focusSlot(index)}
                  dataTestId={`secret-slot-${index}`}
                />
              ))}
            </div>
            
            {/* Number Pad */}
            <NumberPad
              onDigitClick={inputDigit}
              onClear={clearInput}
              onRandom={randomNumber}
              showRandom
              disabledDigits={digits.filter(d => d !== "").map(d => parseInt(d))}
            />
          </div>
          
          {/* Start Game Button */}
          <Button
            onClick={handleStartGame}
            disabled={!isComplete() || createGameMutation.isPending || setSecretMutation.isPending}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground p-4 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-start-game"
          >
            {createGameMutation.isPending || setSecretMutation.isPending ? (
              <i className="fas fa-spinner fa-spin mr-2"></i>
            ) : null}
            Start Game
          </Button>
        </div>
      </div>
    </div>
  );
}
