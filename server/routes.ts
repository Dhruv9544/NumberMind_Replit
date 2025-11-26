import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { gameStore } from "./gameStore";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { GameEngine } from "./gameEngine";

interface WSClient extends WebSocket {
  userId?: string;
  gameId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      res.json({
        id: userId,
        email: req.user.claims.email,
        firstName: req.user.claims.given_name,
        lastName: req.user.claims.family_name,
        profileImageUrl: req.user.claims.picture,
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          currentStreak: 0,
          bestStreak: 0,
          totalGuesses: 0,
        }
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Game routes
  app.post("/api/games", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { gameMode, difficulty, friendId, friendName } = req.body;
      
      let player2Id = undefined;
      
      // Handle different game modes
      if (gameMode === 'ai' || gameMode === 'random') {
        // AI and random opponents are treated as AI games
        player2Id = undefined;
      } else if (gameMode === 'friend' && friendId) {
        player2Id = friendId;
      }
      
      const game = gameStore.createGame({
        player1Id: userId,
        player2Id,
        gameMode,
        difficulty: difficulty || 'standard',
        status: 'waiting',
      });

      // Create challenge for friend mode
      if (gameMode === 'friend' && friendId && friendName) {
        const challenge = gameStore.createChallenge({
          gameId: game.id,
          fromPlayerId: userId,
          toPlayerId: friendId,
          fromPlayerName: friendName,
          status: 'pending',
        });

        // Broadcast challenge via WebSocket
        const challengeMsg = JSON.stringify({
          type: 'challenge_received',
          challenge,
          gameCode: game.code,
        });
        wss.clients.forEach((client: WSClient) => {
          if ((client as any).userId === friendId && client.readyState === WebSocket.OPEN) {
            client.send(challengeMsg);
          }
        });
      }
      
      res.json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  // Get pending challenges for user
  app.get("/api/challenges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const challenges = gameStore.getPendingChallengesForUser(userId);
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  // Accept challenge
  app.post("/api/challenges/:challengeId/accept", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeId } = req.params;
      
      const challenge = gameStore.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      if (challenge.toPlayerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const game = gameStore.getGame(challenge.gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Set player2 as the accepting player
      game.player2Id = userId;
      gameStore.updateGame(game.id, game);
      gameStore.updateChallenge(challengeId, { status: 'accepted' });
      
      res.json(game);
    } catch (error) {
      console.error("Error accepting challenge:", error);
      res.status(500).json({ message: "Failed to accept challenge" });
    }
  });

  // Reject challenge
  app.post("/api/challenges/:challengeId/reject", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeId } = req.params;
      
      const challenge = gameStore.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      if (challenge.toPlayerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      gameStore.updateChallenge(challengeId, { status: 'rejected' });
      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting challenge:", error);
      res.status(500).json({ message: "Failed to reject challenge" });
    }
  });

  // Join game by code
  app.post("/api/games/join/:code", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { code } = req.params;
      
      const game = gameStore.getGameByCode(code);
      if (!game) {
        return res.status(404).json({ message: "Game not found. Invalid code." });
      }

      if (game.status !== 'waiting') {
        return res.status(400).json({ message: "Game already started" });
      }

      game.player2Id = userId;
      game.status = 'active';
      game.startedAt = new Date();
      game.currentTurn = game.player1Id;
      gameStore.updateGame(game.id, game);
      
      res.json(game);
    } catch (error) {
      console.error("Error joining game:", error);
      res.status(500).json({ message: "Failed to join game" });
    }
  });

  app.get("/api/games/:gameId", isAuthenticated, async (req: any, res) => {
    try {
      const { gameId } = req.params;
      const game = gameStore.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      res.json(game);
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  app.put("/api/games/:gameId/secret", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { gameId } = req.params;
      const { secretNumber } = req.body;
      
      const validation = GameEngine.validateNumber(secretNumber);
      if (!validation.isValid) {
        return res.status(400).json({ message: validation.error });
      }
      
      const game = gameStore.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      if (game.player1Id !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      game.player1Secret = secretNumber;

      if (game.gameMode === 'ai' || game.gameMode === 'random') {
        // Generate AI secret for AI and random opponent modes
        game.player2Id = 'AI';
        game.player2Secret = GameEngine.generateRandomNumber();
        game.status = 'active';
        game.startedAt = new Date();
        game.currentTurn = userId;
      } else {
        // Multiplayer - wait for other player
        game.status = 'active';
        game.startedAt = new Date();
        game.currentTurn = userId;
      }
      
      gameStore.updateGame(gameId, game);
      res.json(game);
    } catch (error) {
      console.error("Error setting secret:", error);
      res.status(500).json({ message: "Failed to set secret" });
    }
  });

  app.post("/api/games/:gameId/moves", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { gameId } = req.params;
      const { guess } = req.body;
      
      const validation = GameEngine.validateNumber(guess);
      if (!validation.isValid) {
        return res.status(400).json({ message: validation.error });
      }
      
      const game = gameStore.getGame(gameId);
      if (!game || game.status !== 'active') {
        return res.status(400).json({ message: "Game not active" });
      }
      
      if (game.currentTurn !== userId) {
        return res.status(400).json({ message: "Not your turn" });
      }
      
      const opponentSecret = game.player1Id === userId ? game.player2Secret : game.player1Secret;
      if (!opponentSecret) {
        return res.status(400).json({ message: "Opponent secret not set" });
      }
      
      const feedback = GameEngine.calculateFeedback(guess, opponentSecret);
      const isWin = GameEngine.checkWinCondition(guess, opponentSecret);
      
      const move = gameStore.addMove(gameId, {
        playerId: userId,
        guess,
        correctDigits: feedback.correctDigits,
        correctPositions: feedback.correctPositions,
        moveNumber: game.moves.filter(m => m.playerId === userId).length + 1,
      });
      
      if (isWin) {
        game.status = 'finished';
        game.winnerId = userId;
        game.endedAt = new Date();
      } else {
        game.currentTurn = game.player1Id === userId ? game.player2Id : game.player1Id;
      }
      
      gameStore.updateGame(gameId, game);
      
      // AI move after delay
      if ((game.gameMode === 'ai' || game.gameMode === 'random') && game.player2Id === 'AI' && !isWin) {
        setTimeout(() => {
          try {
            const updatedGame = gameStore.getGame(gameId);
            if (!updatedGame || updatedGame.status !== 'active') return;
            
            const aiGuess = GameEngine.generateAIGuess('standard');
            const aiValidation = GameEngine.validateNumber(aiGuess);
            
            if (aiValidation.isValid && updatedGame.player1Secret) {
              const aiFeedback = GameEngine.calculateFeedback(aiGuess, updatedGame.player1Secret);
              const aiWins = GameEngine.checkWinCondition(aiGuess, updatedGame.player1Secret);
              
              gameStore.addMove(gameId, {
                playerId: 'AI',
                guess: aiGuess,
                correctDigits: aiFeedback.correctDigits,
                correctPositions: aiFeedback.correctPositions,
                moveNumber: updatedGame.moves.filter(m => m.playerId === 'AI').length + 1,
              });
              
              if (aiWins) {
                updatedGame.status = 'finished';
                updatedGame.winnerId = 'AI';
                updatedGame.endedAt = new Date();
              } else {
                updatedGame.currentTurn = updatedGame.player1Id;
              }
              gameStore.updateGame(gameId, updatedGame);
            }
          } catch (error) {
            console.error('AI error:', error);
          }
        }, 1500);
      }
      
      res.json({ move, feedback, isWin });
    } catch (error) {
      console.error("Error making move:", error);
      res.status(500).json({ message: "Failed to make move" });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server for real-time gameplay
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WSClient) => {
    console.log('WebSocket client connected');
    
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'join_game':
            ws.userId = data.userId;
            ws.gameId = data.gameId;
            
            // Notify other players in the game
            wss.clients.forEach((client: WSClient) => {
              if (client !== ws && 
                  client.gameId === data.gameId && 
                  client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'player_joined',
                  userId: data.userId,
                }));
              }
            });
            break;
            
          case 'game_move':
            // Broadcast move to opponent
            wss.clients.forEach((client: WSClient) => {
              if (client !== ws && 
                  client.gameId === ws.gameId && 
                  client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'opponent_move',
                  move: data.move,
                  feedback: data.feedback,
                }));
              }
            });
            break;
            
          case 'game_update':
            // Broadcast game state updates
            wss.clients.forEach((client: WSClient) => {
              if (client !== ws && 
                  client.gameId === ws.gameId && 
                  client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'game_state_update',
                  gameState: data.gameState,
                }));
              }
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}
