import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  NumberSlot, 
  NumberPad, 
  GameHistory, 
  PlayerInfo, 
  GameStatus, 
  useNumberInput 
} from "@/components/GameComponents";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface GameMove {
  guess: string;
  correctDigits: number;
  correctPositions: number;
  playerId: string;
}

interface GameData {
  id: string;
  player1Id: string;
  player2Id?: string;
  currentTurn: string;
  status: string;
  gameMode: string;
  moves: GameMove[];
}

export default function GamePlay() {
  const { user } = useAuth();
  const { gameId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    digits,
    currentSlot,
    inputDigit,
    clearInput,
    getValue,
    isComplete,
    reset,
    focusSlot,
  } = useNumberInput();

  // WebSocket connection
  const { isConnected, lastMessage, sendMessage } = useWebSocket(gameId, user?.id);

  // Fetch game data
  const { data: gameData, isLoading, error } = useQuery<GameData>({
    queryKey: ["/api/games", gameId],
    enabled: !!gameId,
    refetchInterval: 5000, // Refetch every 5 seconds as backup to WebSocket
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

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'opponent_move':
          // Refetch game data when opponent makes a move
          queryClient.invalidateQueries({ queryKey: ["/api/games", gameId] });
          toast({
            title: "Opponent's Turn",
            description: "Your opponent made a move!",
          });
          break;
        case 'game_state_update':
          // Update game state
          queryClient.invalidateQueries({ queryKey: ["/api/games", gameId] });
          break;
        case 'player_joined':
          toast({
            title: "Player Joined",
            description: "Your opponent has joined the game!",
          });
          break;
      }
    }
  }, [lastMessage, queryClient, gameId, toast]);

  const makeMoveMutation = useMutation({
    mutationFn: async ({ guess }: { guess: string }) => {
      const response = await apiRequest("POST", `/api/games/${gameId}/moves`, { guess });
      return response.json();
    },
    onSuccess: (data) => {
      const { move, feedback, isWin } = data;
      
      // Send WebSocket message to opponent
      sendMessage({
        type: 'game_move',
        move,
        feedback,
      });

      // Reset input
      reset();

      // Show feedback
      if (isWin) {
        toast({
          title: "Victory!",
          description: "You cracked the code!",
        });
        setLocation(`/game/result/${gameId}`);
      } else {
        toast({
          title: "Move Made",
          description: `${feedback.correctDigits} correct digits, ${feedback.correctPositions} correct positions`,
        });
      }

      // Refresh game data
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitGuess = () => {
    if (!isComplete()) {
      toast({
        title: "Invalid Guess",
        description: "Please enter a complete 4-digit number with unique digits.",
        variant: "destructive",
      });
      return;
    }

    makeMoveMutation.mutate({ guess: getValue() });
  };

  const handleForfeit = () => {
    if (confirm("Are you sure you want to forfeit this game?")) {
      setLocation("/");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-muted-foreground">Loading game...</p>
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
              The game you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => setLocation("/")} data-testid="button-home">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter moves for current player
  const myMoves = gameData.moves.filter(move => move.playerId === user?.id);
  const isMyTurn = gameData.currentTurn === user?.id;
  const turnNumber = gameData.moves.length + 1;

  // Get opponent info
  const opponentId = gameData.player1Id === user?.id ? gameData.player2Id : gameData.player1Id;
  const opponentName = gameData.gameMode === 'ai' ? 'AI Assistant' : 'Opponent';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto bg-background min-h-screen relative overflow-hidden">
        <div className="p-6">
          {/* Game Header */}
          <div className="mb-6">
            {/* Players Info */}
            <div className="flex items-center justify-between mb-4">
              <PlayerInfo
                name="You"
                avatar={user?.firstName?.[0] || user?.lastName?.[0] || "U"}
                streak={user?.stats?.currentStreak || 0}
                isActive={isMyTurn}
              />
              
              <div className="text-center">
                <div className="text-lg font-bold">VS</div>
                <div className="text-xs text-muted-foreground">
                  Turn <span data-testid="turn-number">{turnNumber}</span>
                </div>
              </div>
              
              <PlayerInfo
                name={opponentName}
                avatar={gameData.gameMode === 'ai' ? 'AI' : 'O'}
                streak={0}
                isActive={!isMyTurn}
              />
            </div>
            
            {/* Turn Indicator */}
            <GameStatus
              status={isMyTurn ? "Your Turn - Make your guess" : "Opponent's Turn - Wait for their move"}
              turnNumber={turnNumber}
            />
          </div>
          
          {/* Game History */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <i className="fas fa-history mr-2 text-primary"></i>
              Your Guesses
            </h3>
            <GameHistory moves={myMoves} />
          </div>
          
          {/* Current Guess Input */}
          {isMyTurn && (
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3">Next Guess</label>
              
              <div className="flex justify-center space-x-2 mb-4">
                {digits.map((digit, index) => (
                  <NumberSlot
                    key={index}
                    value={digit}
                    isActive={index === currentSlot}
                    onClick={() => focusSlot(index)}
                    dataTestId={`guess-slot-${index}`}
                  />
                ))}
              </div>
              
              {/* Compact Number Pad */}
              <NumberPad
                onDigitClick={inputDigit}
                onClear={clearInput}
                onSubmit={handleSubmitGuess}
                showSubmit
                submitLabel="Submit Guess"
                disabledDigits={digits.filter(d => d !== "").map(d => parseInt(d))}
              />
            </div>
          )}
          
          {/* Waiting for opponent */}
          {!isMyTurn && (
            <div className="mb-6 text-center">
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <i className="fas fa-clock text-4xl text-muted-foreground mb-4"></i>
                  <h3 className="font-semibold mb-2">Waiting for opponent</h3>
                  <p className="text-sm text-muted-foreground">
                    Your opponent is thinking about their next move...
                  </p>
                  {isConnected && (
                    <div className="flex items-center justify-center space-x-2 mt-3">
                      <div className="w-2 h-2 bg-accent rounded-full pulse-animation"></div>
                      <span className="text-xs text-accent">Connected</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Game Actions */}
          <div className="flex space-x-3">
            <Button
              variant="destructive"
              onClick={handleForfeit}
              className="flex-1 p-3 rounded-lg font-semibold transition-colors"
              data-testid="button-forfeit"
            >
              <i className="fas fa-flag mr-2"></i>
              Forfeit
            </Button>
            <Button
              variant="secondary"
              onClick={() => setLocation("/")}
              className="flex-1 p-3 rounded-lg font-semibold transition-colors border border-border"
              data-testid="button-exit"
            >
              <i className="fas fa-home mr-2"></i>
              Exit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
