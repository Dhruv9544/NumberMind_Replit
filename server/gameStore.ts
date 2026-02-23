import type { DatabaseStorage } from "./storage";

// In-memory game store with full modern app features
interface StoredGame {
  id: string;
  code: string;
  player1Id: string;
  player2Id?: string;
  player1Secret?: string;
  player2Secret?: string;
  gameMode: string;
  difficulty: string;
  status: 'waiting' | 'active' | 'finished';
  currentTurn?: string;
  winnerId?: string;
  moves: StoredMove[];
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

interface StoredMove {
  id: string;
  gameId: string;
  playerId: string;
  guess: string;
  correctDigits: number;
  correctPositions: number;
  moveNumber: number;
  createdAt: Date;
}

interface StoredChallenge {
  id: string;
  gameId: string;
  fromPlayerId: string;
  toPlayerId: string;
  fromPlayerName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

interface StoredFriend {
  id: string;
  userId: string;
  friendId: string;
  friendName: string;
  friendEmail: string;
  friendAvatar?: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
}

interface StoredNotification {
  id: string;
  userId: string;
  type: 'friend_request' | 'challenge' | 'game_finished' | 'achievement';
  fromUserId?: string;
  fromUserName?: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatar?: string;
  bio?: string;
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
    currentStreak: number;
    bestStreak: number;
    totalGuesses: number;
    averageGuesses: number;
  };
  createdAt: Date;
  lastActive: Date;
}

class GameStore {
  private games = new Map<string, StoredGame>();
  private challenges = new Map<string, StoredChallenge>();
  private friends = new Map<string, StoredFriend[]>();
  private notifications = new Map<string, StoredNotification[]>();
  private profiles = new Map<string, UserProfile>();
  private storage?: DatabaseStorage;

  setStorage(storage: DatabaseStorage) {
    this.storage = storage;
  }

  generateGameCode(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  // Games
  async createGame(game: Omit<StoredGame, 'id' | 'code' | 'createdAt' | 'moves'>): Promise<StoredGame> {
    const code = this.generateGameCode();

    if (this.storage) {
      const dbGame = await this.storage.createGame({
        player1Id: game.player1Id,
        player2Id: game.player2Id || null,
        player1Secret: game.player1Secret || null,
        player2Secret: game.player2Secret || null,
        currentTurn: game.currentTurn || null,
        status: game.status,
        winnerId: game.winnerId || null,
        gameMode: game.gameMode,
        difficulty: game.difficulty,
        startedAt: game.startedAt || null,
        finishedAt: game.endedAt || null,
      });

      const storedGame: StoredGame = {
        ...game,
        id: dbGame.id,
        code, // Note: The DB schema doesn't have 'code', we might need to add it or store it in memory for invitation
        moves: [],
        createdAt: dbGame.createdAt || new Date(),
      };
      this.games.set(dbGame.id, storedGame);
      return storedGame;
    }

    const id = 'game-' + Math.random().toString(36).substr(2, 9);
    const storedGame: StoredGame = {
      ...game,
      id,
      code,
      moves: [],
      createdAt: new Date(),
    };
    this.games.set(id, storedGame);
    return storedGame;
  }

  async getGame(id: string): Promise<StoredGame | undefined> {
    if (this.games.has(id)) return this.games.get(id);

    if (this.storage) {
      const dbGame = await this.storage.getGame(id);
      if (dbGame) {
        const moves = await this.storage.getGameMoves(id);
        const storedGame: StoredGame = {
          id: dbGame.id,
          code: '', // Logic to handle code if needed
          player1Id: dbGame.player1Id,
          player2Id: dbGame.player2Id || undefined,
          player1Secret: dbGame.player1Secret || undefined,
          player2Secret: dbGame.player2Secret || undefined,
          gameMode: dbGame.gameMode,
          difficulty: dbGame.difficulty || 'standard',
          status: dbGame.status as any,
          currentTurn: dbGame.currentTurn || undefined,
          winnerId: dbGame.winnerId || undefined,
          moves: moves.map(m => ({
            id: m.id,
            gameId: m.gameId,
            playerId: m.playerId,
            guess: m.guess,
            correctDigits: m.correctDigits,
            correctPositions: m.correctPositions,
            moveNumber: m.moveNumber,
            createdAt: m.createdAt || new Date(),
          })),
          createdAt: dbGame.createdAt || new Date(),
          startedAt: dbGame.startedAt || undefined,
          endedAt: dbGame.finishedAt || undefined,
        };
        this.games.set(id, storedGame);
        return storedGame;
      }
    }
    return undefined;
  }

  async getGameByCode(code: string): Promise<StoredGame | undefined> {
    // Search in-memory cache first
    const cached = Array.from(this.games.values()).find(g => g.code === code);
    if (cached) return cached;

    // In a real multi-server production environment, codes should be in the DB.
    // For now, we'll keep them in the memory Map which is restored on getGame calls.
    return undefined;
  }

  async updateGame(id: string, updates: Partial<StoredGame>): Promise<StoredGame> {
    const game = await this.getGame(id);
    if (!game) throw new Error('Game not found');
    const updated = { ...game, ...updates };
    this.games.set(id, updated);

    if (this.storage) {
      await this.storage.updateGame(id, {
        player2Id: updated.player2Id,
        player1Secret: updated.player1Secret,
        player2Secret: updated.player2Secret,
        status: updated.status,
        currentTurn: updated.currentTurn,
        winnerId: updated.winnerId,
        startedAt: updated.startedAt,
        finishedAt: updated.endedAt,
      });
    }

    return updated;
  }

  async addMove(gameId: string, move: Omit<StoredMove, 'id' | 'createdAt'>): Promise<StoredMove> {
    const game = await this.getGame(gameId);
    if (!game) throw new Error('Game not found');

    if (this.storage) {
      const dbMove = await this.storage.addGameMove({
        gameId,
        playerId: move.playerId,
        guess: move.guess,
        correctDigits: move.correctDigits,
        correctPositions: move.correctPositions,
        moveNumber: move.moveNumber,
      });

      const storedMove: StoredMove = {
        ...move,
        id: dbMove.id,
        createdAt: dbMove.createdAt || new Date(),
      };
      game.moves.push(storedMove);
      return storedMove;
    }

    const storedMove: StoredMove = {
      ...move,
      id: 'move-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    game.moves.push(storedMove);
    return storedMove;
  }

  getMoves(gameId: string): StoredMove[] {
    const game = this.games.get(gameId);
    return game?.moves || [];
  }

  getAllGames(): StoredGame[] {
    return Array.from(this.games.values());
  }

  getUserGames(userId: string): StoredGame[] {
    return Array.from(this.games.values())
      .filter(g => g.player1Id === userId || g.player2Id === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Challenges
  createChallenge(challenge: Omit<StoredChallenge, 'id' | 'createdAt' | 'expiresAt'>): StoredChallenge {
    const id = 'challenge-' + Math.random().toString(36).substr(2, 9);
    const now = new Date();
    const storedChallenge: StoredChallenge = {
      ...challenge,
      id,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
    };
    this.challenges.set(id, storedChallenge);
    return storedChallenge;
  }

  getChallenge(id: string): StoredChallenge | undefined {
    return this.challenges.get(id);
  }

  updateChallenge(id: string, updates: Partial<StoredChallenge>): StoredChallenge {
    const challenge = this.challenges.get(id);
    if (!challenge) throw new Error('Challenge not found');
    const updated = { ...challenge, ...updates };
    this.challenges.set(id, updated);
    return updated;
  }

  getPendingChallengesForUser(userId: string): StoredChallenge[] {
    return Array.from(this.challenges.values()).filter(
      c => c.toPlayerId === userId && c.status === 'pending' && c.expiresAt > new Date()
    );
  }

  // Friends
  addFriend(userId: string, friendId: string, friendName: string, friendEmail: string): StoredFriend {
    const id = 'friend-' + Math.random().toString(36).substr(2, 9);
    const friend: StoredFriend = {
      id,
      userId,
      friendId,
      friendName,
      friendEmail,
      status: 'pending',
      createdAt: new Date(),
    };

    if (!this.friends.has(userId)) {
      this.friends.set(userId, []);
    }
    this.friends.get(userId)!.push(friend);
    return friend;
  }

  acceptFriend(userId: string, friendId: string): void {
    const userFriends = this.friends.get(userId) || [];
    const friend = userFriends.find(f => f.friendId === friendId);
    if (friend) friend.status = 'accepted';
  }

  getFriends(userId: string): StoredFriend[] {
    return (this.friends.get(userId) || []).filter(f => f.status === 'accepted');
  }

  getPendingFriendRequests(userId: string): StoredFriend[] {
    return (this.friends.get(userId) || []).filter(f => f.status === 'pending');
  }

  // Notifications
  addNotification(notification: Omit<StoredNotification, 'id' | 'createdAt'>): StoredNotification {
    const id = 'notif-' + Math.random().toString(36).substr(2, 9);
    const stored: StoredNotification = {
      ...notification,
      id,
      createdAt: new Date(),
    };

    if (!this.notifications.has(notification.userId)) {
      this.notifications.set(notification.userId, []);
    }
    this.notifications.get(notification.userId)!.push(stored);
    return stored;
  }

  getNotifications(userId: string): StoredNotification[] {
    return (this.notifications.get(userId) || [])
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  markNotificationRead(userId: string, notificationId: string): void {
    const notifications = this.notifications.get(userId) || [];
    const notif = notifications.find(n => n.id === notificationId);
    if (notif) notif.read = true;
  }

  // Profiles - NOW PERSISTED TO DATABASE
  async getOrCreateProfile(userId: string, data: { name: string; email: string; avatar?: string }): Promise<UserProfile> {
    if (!this.storage) throw new Error('Storage not initialized');

    // Check in-memory cache first
    if (this.profiles.has(userId)) {
      return this.profiles.get(userId)!;
    }

    // Try to load from database
    let dbStats = await this.storage.getUserStats(userId);

    if (!dbStats) {
      // Create new stats in database
      dbStats = await this.storage.upsertUserStats({
        userId,
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalGuesses: 0,
      });
    }

    // Load user data
    const user = await this.storage.getUser(userId);

    const profile: UserProfile = {
      id: userId,
      name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || data.name : data.name,
      email: user?.email || data.email,
      username: user?.username || undefined,
      avatar: user?.profileImageUrl || data.avatar,
      bio: user?.bio || undefined,
      stats: {
        gamesPlayed: dbStats.gamesPlayed || 0,
        gamesWon: dbStats.gamesWon || 0,
        winRate: dbStats.gamesPlayed ? Math.round(((dbStats.gamesWon || 0) / dbStats.gamesPlayed) * 100) : 0,
        currentStreak: dbStats.currentStreak || 0,
        bestStreak: dbStats.bestStreak || 0,
        totalGuesses: dbStats.totalGuesses || 0,
        averageGuesses: dbStats.gamesPlayed ? Math.round((dbStats.totalGuesses || 0) / dbStats.gamesPlayed) : 0,
      },
      createdAt: user?.createdAt || new Date(),
      lastActive: new Date(),
    };
    this.profiles.set(userId, profile);
    return profile;
  }

  async getProfile(userId: string): Promise<UserProfile | undefined> {
    if (!this.storage) throw new Error('Storage not initialized');

    // Check cache first
    if (this.profiles.has(userId)) {
      return this.profiles.get(userId)!;
    }

    // Try to load from database
    const dbStats = await this.storage.getUserStats(userId);
    if (!dbStats) return undefined;

    // Load user data
    const user = await this.storage.getUser(userId);
    if (!user) return undefined;

    const profile: UserProfile = {
      id: userId,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Player',
      email: user.email || '',
      username: user.username || undefined,
      avatar: user.profileImageUrl || undefined,
      bio: user.bio || undefined,
      stats: {
        gamesPlayed: dbStats.gamesPlayed || 0,
        gamesWon: dbStats.gamesWon || 0,
        winRate: dbStats.gamesPlayed ? Math.round(((dbStats.gamesWon || 0) / dbStats.gamesPlayed) * 100) : 0,
        currentStreak: dbStats.currentStreak || 0,
        bestStreak: dbStats.bestStreak || 0,
        totalGuesses: dbStats.totalGuesses || 0,
        averageGuesses: dbStats.gamesPlayed ? Math.round((dbStats.totalGuesses || 0) / dbStats.gamesPlayed) : 0,
      },
      createdAt: user.createdAt || new Date(),
      lastActive: new Date(),
    };
    this.profiles.set(userId, profile);
    return profile;
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!this.storage) throw new Error('Storage not initialized');

    let profile = this.profiles.get(userId);
    if (!profile) {
      profile = await this.getProfile(userId);
    }

    if (!profile) throw new Error('Profile not found');

    const updated = { ...profile, ...updates };
    this.profiles.set(userId, updated);

    // Persist to database
    const user = await this.storage.getUser(userId);
    if (user) {
      await this.storage.upsertUserWithId(userId, {
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: updated.username,
        bio: updated.bio,
        profileImageUrl: updated.avatar,
      });
    }

    return updated;
  }

  async updateStats(userId: string, gameId: string): Promise<void> {
    if (!this.storage) throw new Error('Storage not initialized');

    // Load profile from DB if not in cache
    let profile = this.profiles.get(userId);
    if (!profile) {
      profile = await this.getProfile(userId);
    }

    const game = this.games.get(gameId);

    if (!profile || !game) {
      console.warn(`updateStats: could not find profile or game. userId=${userId}, gameId=${gameId}`);
      return;
    }

    profile.stats.gamesPlayed++;
    if (game.winnerId === userId) {
      profile.stats.gamesWon++;
      profile.stats.currentStreak++;
    } else {
      profile.stats.currentStreak = 0;
    }

    profile.stats.bestStreak = Math.max(profile.stats.bestStreak, profile.stats.currentStreak);
    profile.stats.winRate = Math.round((profile.stats.gamesWon / profile.stats.gamesPlayed) * 100);

    const playerMoves = game.moves.filter(m => m.playerId === userId).length;
    profile.stats.totalGuesses += playerMoves;
    profile.stats.averageGuesses = Math.round(profile.stats.totalGuesses / profile.stats.gamesPlayed);
    profile.lastActive = new Date();

    // PERSIST TO DATABASE
    await this.storage.upsertUserStats({
      userId,
      gamesPlayed: profile.stats.gamesPlayed,
      gamesWon: profile.stats.gamesWon,
      currentStreak: profile.stats.currentStreak,
      bestStreak: profile.stats.bestStreak,
      totalGuesses: profile.stats.totalGuesses,
    });
  }

  getLeaderboard(limit: number = 50): UserProfile[] {
    // Return from in-memory cache — populated when users play games
    return Array.from(this.profiles.values())
      .filter(p => p.stats.gamesPlayed > 0)
      .sort((a, b) => {
        if (b.stats.gamesWon !== a.stats.gamesWon) {
          return b.stats.gamesWon - a.stats.gamesWon;
        }
        return b.stats.winRate - a.stats.winRate;
      })
      .slice(0, limit);
  }

  // Get leaderboard from DB (for the /api/leaderboard endpoint that lives in routes)
  async getLeaderboardFromDB(limit: number = 50): Promise<UserProfile[]> {
    if (!this.storage) throw new Error('Storage not initialized');
    const dbLeaderboard = await this.storage.getLeaderboard(limit);
    const results: UserProfile[] = [];

    for (const entry of dbLeaderboard) {
      const profile: UserProfile = {
        id: entry.user.id,
        name: `${entry.user.firstName || ''} ${entry.user.lastName || ''}`.trim() || 'Player',
        email: entry.user.email || '',
        username: entry.user.username || undefined,
        avatar: entry.user.profileImageUrl || undefined,
        bio: entry.user.bio || undefined,
        stats: {
          gamesPlayed: entry.gamesPlayed || 0,
          gamesWon: entry.gamesWon || 0,
          winRate: entry.winRate || 0,
          currentStreak: entry.currentStreak || 0,
          bestStreak: entry.bestStreak || 0,
          totalGuesses: 0,
          averageGuesses: entry.averageGuesses || 0,
        },
        createdAt: entry.user.createdAt || new Date(),
        lastActive: entry.updatedAt || new Date(),
      };
      results.push(profile);
    }
    return results;
  }

  async searchUsers(query: string): Promise<UserProfile[]> {
    if (!this.storage) throw new Error('Storage not initialized');

    // Search users table directly — works even for users with no stats yet
    const users = await this.storage.searchUsers(query);

    const results: UserProfile[] = [];
    for (const user of users) {
      // Skip AI user from search results
      if (user.id === 'AI') continue;

      // Try to get stats if they exist, but don't require them
      const dbStats = await this.storage.getUserStats(user.id);

      const profile: UserProfile = {
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Player',
        email: user.email || '',
        username: user.username || undefined,
        avatar: user.profileImageUrl || undefined,
        bio: user.bio || undefined,
        stats: {
          gamesPlayed: dbStats?.gamesPlayed || 0,
          gamesWon: dbStats?.gamesWon || 0,
          winRate: dbStats?.gamesPlayed
            ? Math.round(((dbStats.gamesWon || 0) / dbStats.gamesPlayed) * 100)
            : 0,
          currentStreak: dbStats?.currentStreak || 0,
          bestStreak: dbStats?.bestStreak || 0,
          totalGuesses: dbStats?.totalGuesses || 0,
          averageGuesses: dbStats?.gamesPlayed
            ? Math.round((dbStats.totalGuesses || 0) / dbStats.gamesPlayed)
            : 0,
        },
        createdAt: user.createdAt || new Date(),
        lastActive: new Date(),
      };

      // Update in-memory cache
      this.profiles.set(user.id, profile);
      results.push(profile);
    }

    return results;
  }

  expireOldChallenges(): void {
    const now = new Date();
    this.challenges.forEach((challenge, id) => {
      if (challenge.expiresAt < now && challenge.status === 'pending') {
        challenge.status = 'expired';
        this.challenges.set(id, challenge);
      }
    });
  }
}

export const gameStore = new GameStore();

// Clean up expired challenges every minute
setInterval(() => {
  gameStore.expireOldChallenges();
}, 60000);
