import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { gameStore } from "./gameStore";
import { GameEngine } from "./gameEngine";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { loginSchema, signupSchema } from "@shared/schema";

interface WSClient extends WebSocket {
  userId?: string;
  gameId?: string;
}

// Middleware to require authentication
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Inject storage into gameStore for database persistence
  gameStore.setStorage(storage);

  // Auth routes
  app.post('/api/auth/signup', async (req: any, res) => {
    try {
      const parsed = signupSchema.safeParse(req.body);
      if (!parsed.success) {
        const error = parsed.error.errors[0];
        return res.status(400).json({ message: error.message });
      }

      const { email, password } = parsed.data;

      // Check if user exists
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "This email is already registered. Please login instead." });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      const verificationToken = Math.random().toString(36).substring(7);

      // Create user
      const user = await storage.createUserWithPassword({
        email,
        passwordHash,
        emailVerificationToken: verificationToken,
      });

      // Auto verify email for this implementation
      await storage.verifyUserEmail(user.id);

      // Set session
      req.session!.userId = user.id;

      res.json({ success: true, userId: user.id, message: "Account created successfully!" });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account. Please try again." });
    }
  });

  app.post('/api/auth/login', async (req: any, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        const error = parsed.error.errors[0];
        return res.status(400).json({ message: error.message });
      }

      const { email, password } = parsed.data;

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Email not found. Please sign up first." });
      }

      // Compare password
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Incorrect password. Please try again." });
      }

      // Set session
      req.session!.userId = user.id;

      res.json({ success: true, userId: user.id, message: "Logged in successfully!" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  });

  app.post('/api/auth/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });

  app.get('/api/auth/user', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      let profile = await gameStore.getProfile(userId);

      if (!profile && user) {
        profile = await gameStore.getOrCreateProfile(userId, {
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user?.email as string,
          avatar: user?.profileImageUrl as string,
        });
      }

      const username = profile?.username || '';

      res.json({
        id: userId,
        email: user?.email,
        username: username,
        firstName: user?.firstName,
        lastName: user?.lastName,
        profileImageUrl: user?.profileImageUrl,
        usernameSet: !!username && username.length > 0,
        stats: {
          gamesPlayed: profile?.stats?.gamesPlayed || 0,
          gamesWon: profile?.stats?.gamesWon || 0,
          currentStreak: profile?.stats?.currentStreak || 0,
          bestStreak: profile?.stats?.bestStreak || 0,
          totalGuesses: profile?.stats?.totalGuesses || 0,
        }
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Set username
  app.post('/api/auth/set-username', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { username } = req.body;

      // --- Validation ---
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: "Username is required" });
      }

      const trimmed = username.trim();

      if (trimmed.length < 3 || trimmed.length > 20) {
        return res.status(400).json({ message: "Username must be 3–20 characters" });
      }

      if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
        return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores" });
      }

      // --- Uniqueness check (exact, case-insensitive) ---
      const existing = await storage.getUserByUsername(trimmed);
      if (existing && existing.id !== userId) {
        return res.status(409).json({ message: `@${trimmed} is already taken. Please choose a different username.` });
      }

      // --- Save directly to users table ---
      await storage.setUsername(userId, trimmed);

      // Keep in-memory profile cache in sync if it's loaded
      const cachedProfile = await gameStore.getProfile(userId).catch(() => null);
      if (cachedProfile) {
        cachedProfile.username = trimmed;
      }

      res.json({ success: true, username: trimmed });
    } catch (error) {
      console.error("Error setting username:", error);
      res.status(500).json({ message: "Failed to set username. Please try again." });
    }
  });


  // Matchmaking queue for random opponents
  const matchmakingQueue: { userId: string; userProfileId: string; profileName: string; gameId: string; timestamp: Date }[] = [];

  // Game routes
  app.post("/api/games", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { gameMode, difficulty, friendId, friendName } = req.body;

      let player2Id: string | undefined = undefined;
      let gameStatus: 'waiting' | 'active' = 'waiting';

      // Handle different game modes
      if (gameMode === 'ai') {
        // AI opponent - starts immediately
        player2Id = 'AI';
        gameStatus = 'active';
      } else if (gameMode === 'random') {
        // Check for available player in queue
        const availableMatch = matchmakingQueue.find(q => q.userId !== userId);

        if (availableMatch) {
          // Found a match - join their game
          const existingGame = await gameStore.getGame(availableMatch.gameId);
          if (existingGame && existingGame.status === 'waiting') {
            existingGame.player2Id = userId;
            existingGame.status = 'active';
            existingGame.startedAt = new Date();
            existingGame.currentTurn = existingGame.player1Id;
            await gameStore.updateGame(existingGame.id, existingGame);

            // Remove from queue
            const idx = matchmakingQueue.indexOf(availableMatch);
            if (idx > -1) matchmakingQueue.splice(idx, 1);

            // Notify the waiting player via WebSocket
            wss.clients.forEach((client: WSClient) => {
              if ((client as any).userId === availableMatch.userId && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'match_found',
                  gameId: existingGame.id,
                  opponentName: 'Opponent',
                }));
              }
            });

            return res.json(existingGame);
          }
        }

        // No match found, create new game and wait
        player2Id = undefined;
        gameStatus = 'waiting';
      } else if (gameMode === 'friend' && friendId) {
        player2Id = friendId;
        gameStatus = 'waiting';
      }

      const game = await gameStore.createGame({
        player1Id: userId,
        player2Id,
        gameMode,
        difficulty: difficulty || 'standard',
        status: gameStatus,
      });

      // Add to matchmaking queue for random mode
      if (gameMode === 'random') {
        matchmakingQueue.push({
          userId: userId,
          userProfileId: userId,
          profileName: 'Player',
          gameId: game.id,
          timestamp: new Date(),
        });
      }

      // Create challenge for friend mode
      if (gameMode === 'friend' && friendId && friendName) {
        const senderUser = await storage.getUser(userId);
        const senderDisplayName = senderUser?.username || senderUser?.firstName || 'A player';
        const challenge = await gameStore.createChallenge({
          gameId: game.id,
          fromPlayerId: userId,
          toPlayerId: friendId,
          fromPlayerName: senderDisplayName,
          status: 'pending',
        });

        // Broadcast challenge via WebSocket with proper sender name
        const challengeMsg = JSON.stringify({
          type: 'challenge_received',
          challenge,
          gameCode: game.code,
          fromPlayerName: senderDisplayName,
          fromPlayerUsername: senderDisplayName,
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
  app.get("/api/challenges", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const challenges = await gameStore.getPendingChallengesForUser(userId);
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  // Accept challenge
  app.post("/api/challenges/:challengeId/accept", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { challengeId } = req.params;

      const challenge = await gameStore.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }

      if (challenge.toPlayerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const game = await gameStore.getGame(challenge.gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Set player2 as the accepting player and transition to active
      game.player2Id = userId;
      game.status = 'active';
      game.startedAt = new Date();
      game.currentTurn = game.player1Id; // Player 1 (the challenger) starts

      await gameStore.updateGame(game.id, game);
      await gameStore.updateChallenge(challengeId, { status: 'accepted' });

      res.json(game);
    } catch (error) {
      console.error("Error accepting challenge:", error);
      res.status(500).json({ message: "Failed to accept challenge" });
    }
  });

  // Reject challenge
  app.post("/api/challenges/:challengeId/reject", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { challengeId } = req.params;

      const challenge = await gameStore.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }

      if (challenge.toPlayerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await gameStore.updateChallenge(challengeId, { status: 'rejected' });

      // Notify the challenger that their challenge was declined
      const rejecter = await storage.getUser(userId);
      const rejecterName = rejecter?.username || "Your opponent";
      const declineMsg = JSON.stringify({
        type: 'challenge_declined',
        challengeId,
        gameId: challenge.gameId,
        declinedBy: rejecterName,
        message: `${rejecterName} declined your challenge`,
      });
      wss.clients.forEach((client: WSClient) => {
        if ((client as any).userId === challenge.fromPlayerId && client.readyState === WebSocket.OPEN) {
          client.send(declineMsg);
        }
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting challenge:", error);
      res.status(500).json({ message: "Failed to reject challenge" });
    }
  });

  // Join game by code
  app.post("/api/games/join/:code", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { code } = req.params;

      const game = await gameStore.getGameByCode(code);
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
      await gameStore.updateGame(game.id, game);

      res.json(game);
    } catch (error) {
      console.error("Error joining game:", error);
      res.status(500).json({ message: "Failed to join game" });
    }
  });

  // Friends endpoints - Production System
  app.get("/api/friends", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const friendList = await storage.getFriendsList(userId);

      // Attach online/in-game status from WS connections
      const enriched = friendList.map(f => ({
        id: f.id,
        username: f.username,
        profileImageUrl: f.profileImageUrl,
        friendshipId: f.friendshipId,
        online: Array.from(wss.clients).some((c: any) =>
          c.userId === f.id && c.readyState === WebSocket.OPEN
        ),
      }));

      res.json(enriched);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.get("/api/friends/requests", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const [incoming, outgoing] = await Promise.all([
        storage.getIncomingFriendRequests(userId),
        storage.getOutgoingFriendRequests(userId),
      ]);
      res.json({ incoming, outgoing });
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  app.post("/api/friends/request", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { username } = req.body;

      if (!username?.trim()) {
        return res.status(400).json({ message: "Username is required" });
      }

      const request = await storage.sendFriendRequest(userId, username.trim().replace(/^@/, ""));
      res.json({ success: true, message: "Friend request sent!", request });
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      res.status(400).json({ message: error.message || "Failed to send friend request" });
    }
  });

  app.post("/api/friends/accept", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { requestId } = req.body;

      if (!requestId) return res.status(400).json({ message: "requestId is required" });

      await storage.acceptFriendRequest(requestId, userId);
      res.json({ success: true, message: "Friend request accepted!" });
    } catch (error: any) {
      console.error("Error accepting friend request:", error);
      res.status(400).json({ message: error.message || "Failed to accept friend request" });
    }
  });

  app.post("/api/friends/decline", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { requestId } = req.body;

      if (!requestId) return res.status(400).json({ message: "requestId is required" });

      await storage.declineFriendRequest(requestId, userId);
      res.json({ success: true, message: "Friend request declined" });
    } catch (error: any) {
      console.error("Error declining friend request:", error);
      res.status(400).json({ message: error.message || "Failed to decline friend request" });
    }
  });

  app.post("/api/friends/cancel", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { requestId } = req.body;

      if (!requestId) return res.status(400).json({ message: "requestId is required" });

      await storage.cancelFriendRequest(requestId, userId);
      res.json({ success: true, message: "Friend request cancelled" });
    } catch (error: any) {
      console.error("Error cancelling friend request:", error);
      res.status(400).json({ message: error.message || "Failed to cancel friend request" });
    }
  });

  app.delete("/api/friends/:username", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { username } = req.params;

      await storage.removeFriend(userId, username);
      res.json({ success: true, message: "Friend removed" });
    } catch (error: any) {
      console.error("Error removing friend:", error);
      res.status(400).json({ message: error.message || "Failed to remove friend" });
    }
  });

  app.post("/api/friends/challenge", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { username } = req.body;

      if (!username?.trim()) {
        return res.status(400).json({ message: "Username is required" });
      }

      const targetUser = await storage.getUserByUsername(username.trim().replace(/^@/, ""));
      if (!targetUser) return res.status(404).json({ message: "User not found" });

      // Must be friends
      const areFriends = await storage.areFriends(userId, targetUser.id);
      if (!areFriends) return res.status(403).json({ message: "You can only challenge friends" });

      // Check if target is online
      const targetOnline = Array.from(wss.clients).some((c: any) =>
        c.userId === targetUser.id && c.readyState === WebSocket.OPEN
      );
      if (!targetOnline) return res.status(400).json({ message: `${targetUser.username} is currently offline` });

      // Get sender info for the notification
      const sender = await storage.getUser(userId);
      const senderName = sender?.username || "Someone";

      // Create game
      const game = await gameStore.createGame({
        player1Id: userId,
        player2Id: targetUser.id,
        gameMode: "friend",
        difficulty: "standard",
        status: "waiting",
      });

      // Create challenge record
      const challenge = await gameStore.createChallenge({
        gameId: game.id,
        fromPlayerId: userId,
        toPlayerId: targetUser.id,
        fromPlayerName: senderName,
        status: "pending",
      });

      // Send real-time challenge to target via WebSocket
      const msg = JSON.stringify({
        type: "challenge_received",
        challenge,
        gameCode: game.code,
        fromPlayerName: senderName,
        fromPlayerUsername: senderName,
      });
      (wss.clients as Set<any>).forEach((client: any) => {
        if (client.userId === targetUser.id && client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      });

      res.json({ success: true, game, challenge });
    } catch (error: any) {
      console.error("Error sending challenge:", error);
      res.status(500).json({ message: error.message || "Failed to send challenge" });
    }
  });

  // Legacy: keep /api/friends/add for backward compat (old invite flow)
  app.post("/api/friends/add", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { friendId, friendName, friendEmail } = req.body;
      const friend = await gameStore.addFriend(userId, friendId, friendName, friendEmail);
      res.json(friend);
    } catch (error) {
      console.error("Error adding friend:", error);
      res.status(500).json({ message: "Failed to add friend" });
    }
  });

  app.post("/api/friends/:friendId/accept", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { friendId } = req.params;
      await gameStore.acceptFriend(userId, friendId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error accepting friend:", error);
      res.status(500).json({ message: "Failed to accept friend" });
    }
  });

  // Profile endpoints
  app.get("/api/profile", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let profile = await gameStore.getProfile(userId);

      if (!profile) {
        profile = await gameStore.getOrCreateProfile(userId, {
          name: req.user.displayName || 'Player',
          email: req.user.email,
          avatar: req.user.photo,
        });
      }

      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get("/api/profile/:userId", async (req: any, res) => {
    try {
      const { userId } = req.params;
      const profile = await gameStore.getProfile(userId);

      if (!profile) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  app.get("/api/profile/:userId/achievements", async (req: any, res) => {
    try {
      const { userId } = req.params;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.patch("/api/profile", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { bio, avatar } = req.body;

      let profile = await gameStore.getProfile(userId);
      if (!profile) {
        const user = await storage.getUser(userId);
        profile = await gameStore.getOrCreateProfile(userId, {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Player',
          email: user?.email as string || '',
          avatar: user?.profileImageUrl as string,
        });
      }

      profile = await gameStore.updateProfile(userId, { bio, avatar });
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Leaderboard endpoints
  app.get("/api/leaderboard", async (req: any, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit || "50"), 100);
      const leaderboard = await gameStore.getLeaderboardFromDB(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Search users by username — simple direct DB lookup
  app.get("/api/search/users", requireAuth, async (req: any, res) => {
    try {
      const { q } = req.query;
      const currentUserId = req.user.id;

      if (!q || (q as string).trim().length < 1) {
        return res.json([]);
      }

      const query = (q as string).trim().replace(/^@/, ""); // strip leading @
      const dbUsers = await storage.searchUsers(query);

      // Exclude self and the AI bot, return only safe public fields
      const results = dbUsers
        .filter((u) => u.id !== currentUserId && u.id !== "AI" && u.username)
        .map((u) => ({
          id: u.id,
          username: u.username,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username,
          avatar: u.profileImageUrl,
          email: u.email,
        }));

      res.json(results);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Notifications (require authentication)
  app.get("/api/notifications", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await gameStore.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:notificationId/read", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

      await gameStore.markNotificationRead(userId, notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ message: "Failed to mark notification read" });
    }
  });

  // Get game history for a user
  app.get("/api/games/history", requireAuth, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const targetUserId = (req.query.userId as string) || currentUserId;
      const limit = parseInt(req.query.limit as string) || 10;
      const games = await storage.getUserGames(targetUserId, limit);

      // Enhance games with opponent info
      const enhancedGames = await Promise.all(games.map(async (game) => {
        const opponentId = game.player1Id === targetUserId ? game.player2Id : game.player1Id;
        let opponentName = "AI Opponent";

        if (opponentId && opponentId !== 'AI') {
          const opponent = await storage.getUser(opponentId);
          opponentName = opponent?.username || opponent?.firstName || "Unknown Player";
        }

        return {
          ...game,
          opponentName
        };
      }));

      res.json(enhancedGames);
    } catch (error) {
      console.error("Error fetching game history:", error);
      res.status(500).json({ message: "Failed to fetch game history" });
    }
  });

  app.get("/api/games/:gameId", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { gameId } = req.params;
      const game = await gameStore.getGame(gameId);

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Only allow players in the game to view it
      if (game.player1Id !== userId && game.player2Id !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      res.json(game);
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  app.put("/api/games/:gameId/secret", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { gameId } = req.params;
      const { secretNumber } = req.body;

      const validation = GameEngine.validateNumber(secretNumber);
      if (!validation.isValid) {
        return res.status(400).json({ message: validation.error });
      }

      const game = await gameStore.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Allow both player1 and player2 to set their secret
      if (game.player1Id === userId) {
        game.player1Secret = secretNumber;
      } else if (game.player2Id === userId) {
        game.player2Secret = secretNumber;
      } else {
        return res.status(403).json({ message: "Not authorized" });
      }

      // For AI modes, generate AI secret and start immediately
      if (game.gameMode === 'ai') {
        game.player2Id = 'AI';
        game.player2Secret = GameEngine.generateRandomNumber();
        game.status = 'active';
        game.startedAt = new Date();
        game.currentTurn = game.player1Id;
      }
      // For random opponent mode, start when first player sets secret (AI will replace if opponent joins)
      else if (game.gameMode === 'random' && game.player1Id === userId && !game.player2Secret) {
        game.player2Id = 'AI';
        game.player2Secret = GameEngine.generateRandomNumber();
        game.status = 'active';
        game.startedAt = new Date();
        game.currentTurn = game.player1Id;
      }
      // For friend/multiplayer modes, only activate when BOTH set secrets
      else if ((game.gameMode === 'friend') && game.player1Secret && game.player2Secret) {
        game.status = 'active';
        game.startedAt = new Date();
        game.currentTurn = game.player1Id;
      }

      await gameStore.updateGame(gameId, game);
      res.json(game);
    } catch (error) {
      console.error("Error setting secret:", error);
      res.status(500).json({ message: "Failed to set secret" });
    }
  });

  app.post("/api/games/:gameId/moves", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { gameId } = req.params;
      const { guess } = req.body;

      const validation = GameEngine.validateNumber(guess);
      if (!validation.isValid) {
        return res.status(400).json({ message: validation.error });
      }

      const game = await gameStore.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.status !== 'active') {
        return res.status(400).json({ message: "Game not active" });
      }

      if (game.currentTurn !== userId) {
        return res.status(400).json({ message: "Not your turn" });
      }

      // Verify both secrets exist
      if (!game.player1Secret || !game.player2Secret) {
        return res.status(400).json({ message: "Both players must set their secrets first" });
      }

      const opponentSecret = game.player1Id === userId ? game.player2Secret : game.player1Secret;

      const feedback = GameEngine.calculateFeedback(guess, opponentSecret);
      const isWin = GameEngine.checkWinCondition(guess, opponentSecret);

      const move = await gameStore.addMove(gameId, {
        gameId,
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
        await gameStore.updateGame(gameId, game);

        // Ensure profile is loaded before updating stats
        await gameStore.getOrCreateProfile(userId, { name: 'Player', email: '', avatar: '' });
        await gameStore.updateStats(userId, gameId);

        // Update stats for opponent (if human)
        const opponentId = game.player1Id === userId ? game.player2Id : game.player1Id;
        if (opponentId && opponentId !== 'AI') {
          await gameStore.getOrCreateProfile(opponentId, { name: 'Player', email: '', avatar: '' });
          await gameStore.updateStats(opponentId, gameId);
        }
      } else {
        game.currentTurn = game.player1Id === userId ? game.player2Id : game.player1Id;
        await gameStore.updateGame(gameId, game);
      }

      // AI move after delay
      if ((game.gameMode === 'ai' || game.gameMode === 'random') && game.player2Id === 'AI' && !isWin) {
        setTimeout(async () => {
          try {
            const updatedGame = await gameStore.getGame(gameId);
            if (!updatedGame || updatedGame.status !== 'active') return;

            const aiGuess = GameEngine.generateAIGuess('standard');
            const aiValidation = GameEngine.validateNumber(aiGuess);

            if (aiValidation.isValid && updatedGame.player1Secret) {
              const aiFeedback = GameEngine.calculateFeedback(aiGuess, updatedGame.player1Secret);
              const aiWins = GameEngine.checkWinCondition(aiGuess, updatedGame.player1Secret);

              await gameStore.addMove(gameId, {
                gameId,
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
                await gameStore.updateGame(gameId, updatedGame);

                // Ensure profile is loaded before updating stats
                await gameStore.getOrCreateProfile(updatedGame.player1Id, { name: 'Player', email: '', avatar: '' });
                await gameStore.updateStats(updatedGame.player1Id, gameId);
              } else {
                updatedGame.currentTurn = updatedGame.player1Id;
                await gameStore.updateGame(gameId, updatedGame);
              }
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

  wss.on('connection', (ws: WSClient, req: any) => {
    // 1. Immediately identify from query string (replaces potentially raced 'identify' message)
    try {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const userId = url.searchParams.get('userId');
      if (userId) {
        ws.userId = userId;
        console.log(`✅ WebSocket identified via URL: userId=${userId}`);
      }
    } catch (err) {
      console.warn('Failed to parse WS connection URL:', err);
    }

    console.log('WebSocket client connected');

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);

        switch (data.type) {
          case 'identify':
            // Store fallback userId (kept for legacy/explicit sync)
            if (data.userId) ws.userId = data.userId;
            console.log(`✅ WebSocket identified via message: userId=${data.userId}`);
            break;

          case 'join_game':
          case 'game:join':
            ws.userId = data.userId;
            ws.gameId = data.gameId;
            if (ws.userId && ws.gameId) {
              gameStore.joinMatch(ws.userId, ws.gameId);
            }

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

          case 'leave_game':
          case 'game:leave':
            // Explicitly ending participation in a match (Req 2 & 3)
            const leaveUserId = data.userId || ws.userId;
            const leaveGameId = data.gameId || ws.gameId;

            if (leaveUserId && leaveGameId) {
              const game = await gameStore.getGame(leaveGameId);
              if (game && (game.status === 'active' || game.status === 'waiting')) {
                const opponentId = game.player1Id === leaveUserId ? game.player2Id : game.player1Id;

                // Stop game and mark abandoned
                await gameStore.updateGame(game.id, {
                  status: 'finished',
                  winnerId: (opponentId && opponentId !== 'AI') ? opponentId : undefined,
                  endedAt: new Date()
                });

                // Update Statistics for both players (Req: Ensure forfeit counts as win/loss)
                if (leaveUserId) {
                  await gameStore.getOrCreateProfile(leaveUserId, { name: 'Player', email: '', avatar: '' });
                  await gameStore.updateStats(leaveUserId, game.id);
                }

                if (opponentId && opponentId !== 'AI') {
                  await gameStore.getOrCreateProfile(opponentId, { name: 'Player', email: '', avatar: '' });
                  await gameStore.updateStats(opponentId, game.id);

                  // Notify opponent (Req 3 & 5)
                  wss.clients.forEach((client: WSClient) => {
                    if (client.userId === opponentId && client.readyState === WebSocket.OPEN) {
                      client.send(JSON.stringify({
                        type: 'game:opponent_left',
                        gameId: game.id,
                        reason: data.reason || 'navigation',
                        message: 'Your opponent left the match.',
                        winner: opponentId
                      }));
                    }
                  });
                }

                // Clear match tracking
                if (leaveUserId) gameStore.leaveMatch(leaveUserId);
              }
              // Clear current socket's game tracking
              if (ws.userId === leaveUserId) ws.gameId = undefined;
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      const { userId } = ws;
      const wsGameId = ws.gameId;
      console.log(`WebSocket disconnected: userId=${userId}, gameId=${wsGameId}`);

      if (!userId) return;

      // 1. Remove user from matchmaking queue if they are in it
      const queueIdx = matchmakingQueue.findIndex(q => q.userId === userId);
      if (queueIdx > -1) {
        matchmakingQueue.splice(queueIdx, 1);
        console.log(`Removed userId=${userId} from matchmakingQueue`);
      }

      // 2. Check for other active sockets for the same user (multi-tab or immediate refresh)
      const hasOtherConnections = Array.from(wss.clients).some((client: any) =>
        client !== ws && client.userId === userId && client.readyState === WebSocket.OPEN
      );

      if (hasOtherConnections) {
        console.log(`User ${userId} still has active connections. Skipping forfeit.`);
        return;
      }

      try {
        // Primary: use ws.gameId if available; fallback: scan all active games by userId
        let gamesToCheck: { id: string; player1Id: string; player2Id?: string; status: string; winnerId?: string }[] = [];

        if (wsGameId) {
          const g = await gameStore.getGame(wsGameId);
          if (g) gamesToCheck = [g];
        }

        if (gamesToCheck.length === 0) {
          gamesToCheck = await gameStore.getActiveGamesByUserId(userId);
        }

        for (const game of gamesToCheck) {
          // Both active and waiting state games are valid to forfeit/finish
          if (game.status !== 'active' && game.status !== 'waiting') continue;

          const opponentId = game.player1Id === userId ? game.player2Id : game.player1Id;

          // Clear match tracking
          gameStore.leaveMatch(userId);

          // If no second player ever joined, just mark game as finished/closed (no winner)
          if (!opponentId || opponentId === 'AI') {
            await gameStore.updateGame(game.id, { status: 'finished', endedAt: new Date() });
            continue;
          }

          // Mark game finished — remaining player wins by forfeit
          await gameStore.updateGame(game.id, {
            status: 'finished',
            winnerId: opponentId,
            endedAt: new Date()
          });

          // Update stats for both (the one who disconnected and the one who stayed)
          try {
            await gameStore.getOrCreateProfile(userId, { name: 'Player', email: '', avatar: '' });
            await gameStore.updateStats(userId, game.id);

            await gameStore.getOrCreateProfile(opponentId, { name: 'Player', email: '', avatar: '' });
            await gameStore.updateStats(opponentId, game.id);
          } catch (statErr) {
            console.error('Error updating stats on disconnect:', statErr);
          }

          // Notify the remaining player
          wss.clients.forEach((client: WSClient) => {
            if (client.userId === opponentId && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'game:opponent_left',
                gameId: game.id,
                message: 'Your opponent left the match.',
                winner: opponentId
              }));
            }
          });
        }
      } catch (err) {
        console.error('Error handling disconnect:', err);
      }
    });
  });

  return httpServer;
}
