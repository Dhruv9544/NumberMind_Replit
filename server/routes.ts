import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { GameEngine } from "./gameEngine";
import { z } from "zod";

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
      const user = await storage.getUser(userId);
      const stats = await storage.getUserStats(userId);
      res.json({ ...user, stats });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Game routes
  app.post("/api/games", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { gameMode, difficulty, opponentId } = req.body;
      
      const game = await storage.createGame({
        player1Id: userId,
        player2Id: gameMode === 'ai' ? null : opponentId,
        gameMode,
        difficulty: difficulty || 'standard',
        status: 'waiting',
      });
      
      res.json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  app.get("/api/games/:gameId", isAuthenticated, async (req: any, res) => {
    try {
      const { gameId } = req.params;
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      const moves = await storage.getGameMoves(gameId);
      res.json({ ...game, moves });
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
      
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      const updates: any = {};
      if (game.player1Id === userId) {
        updates.player1Secret = secretNumber;
      } else if (game.player2Id === userId) {
        updates.player2Secret = secretNumber;
      } else {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Check if both secrets are set to start the game
      if (game.player1Secret && game.player2Secret) {
        updates.status = 'active';
        updates.startedAt = new Date();
        updates.currentTurn = game.player1Id;
      } else if ((game.player1Secret || updates.player1Secret) && !game.player2Id) {
        // AI game
        updates.player2Secret = GameEngine.generateRandomNumber();
        updates.status = 'active';
        updates.startedAt = new Date();
        updates.currentTurn = game.player1Id;
      }
      
      const updatedGame = await storage.updateGame(gameId, updates);
      res.json(updatedGame);
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
      
      const game = await storage.getGame(gameId);
      if (!game || game.status !== 'active') {
        return res.status(400).json({ message: "Game not active" });
      }
      
      if (game.currentTurn !== userId) {
        return res.status(400).json({ message: "Not your turn" });
      }
      
      // Get opponent's secret
      const opponentSecret = game.player1Id === userId ? game.player2Secret : game.player1Secret;
      if (!opponentSecret) {
        return res.status(400).json({ message: "Opponent secret not set" });
      }
      
      const feedback = GameEngine.calculateFeedback(guess, opponentSecret);
      const isWin = GameEngine.checkWinCondition(guess, opponentSecret);
      
      // Get current move count
      const existingMoves = await storage.getGameMoves(gameId);
      const moveNumber = existingMoves.filter(m => m.playerId === userId).length + 1;
      
      const move = await storage.addGameMove({
        gameId,
        playerId: userId,
        guess,
        correctDigits: feedback.correctDigits,
        correctPositions: feedback.correctPositions,
        moveNumber,
      });
      
      // Update game state
      const gameUpdates: any = {};
      if (isWin) {
        gameUpdates.status = 'finished';
        gameUpdates.winnerId = userId;
        gameUpdates.finishedAt = new Date();
        
        // Update user stats
        const stats = await storage.getUserStats(userId);
        if (stats) {
          await storage.upsertUserStats({
            userId,
            gamesPlayed: (stats.gamesPlayed || 0) + 1,
            gamesWon: (stats.gamesWon || 0) + 1,
            currentStreak: (stats.currentStreak || 0) + 1,
            bestStreak: Math.max(stats.bestStreak || 0, (stats.currentStreak || 0) + 1),
            totalGuesses: (stats.totalGuesses || 0) + moveNumber,
          });
        }
      } else {
        // Switch turns
        gameUpdates.currentTurn = game.player1Id === userId ? game.player2Id : game.player1Id;
      }
      
      await storage.updateGame(gameId, gameUpdates);
      
      res.json({ move, feedback, isWin });
    } catch (error) {
      console.error("Error making move:", error);
      res.status(500).json({ message: "Failed to make move" });
    }
  });

  app.get("/api/users/me/games", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const games = await storage.getUserGames(userId);
      res.json(games);
    } catch (error) {
      console.error("Error fetching user games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.get("/api/users/me/friends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
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
