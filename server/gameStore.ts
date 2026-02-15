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
  createGame(game: Omit<StoredGame, 'id' | 'code' | 'createdAt' | 'moves'>): StoredGame {
    const id = 'game-' + Math.random().toString(36).substr(2, 9);
    const storedGame: StoredGame = {
      ...game,
      id,
      code: this.generateGameCode(),
      moves: [],
      createdAt: new Date(),
    };
    this.games.set(id, storedGame);
    return storedGame;
  }

  getGame(id: string): StoredGame | undefined {
    return this.games.get(id);
  }

  getGameByCode(code: string): StoredGame | undefined {
    return Array.from(this.games.values()).find(g => g.code === code);
  }

  updateGame(id: string, updates: Partial<StoredGame>): StoredGame {
    const game = this.games.get(id);
    if (!game) throw new Error('Game not found');
    const updated = { ...game, ...updates };
    this.games.set(id, updated);
    return updated;
  }

  addMove(gameId: string, move: Omit<StoredMove, 'id' | 'createdAt'>): StoredMove {
    const game = this.games.get(gameId);
    if (!game) throw new Error('Game not found');

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

    const profile = this.profiles.get(userId);
    const game = this.games.get(gameId);

    if (!profile || !game) return;

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

  async searchUsers(query: string): Promise<UserProfile[]> {
    if (!this.storage) throw new Error('Storage not initialized');

    // Search in database
    const users = await this.storage.searchUsers(query);

    // Convert to profiles
    const results: UserProfile[] = [];
    for (const user of users) {
      const profile = await this.getProfile(user.id);
      if (profile) {
        results.push(profile);
      }
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
