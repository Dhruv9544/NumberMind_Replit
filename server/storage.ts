import {
  users,
  userStats,
  gameSessions,
  gameMoves,
  friends,
  achievements,
  leaderboardStats,
  type User,
  type UpsertUser,
  type UserStats,
  type InsertUserStats,
  type GameSession,
  type InsertGameSession,
  type GameMove,
  type InsertGameMove,
  type Friend,
  type InsertFriend,
  type Achievement,
  type InsertAchievement,
  type LeaderboardStats,
  type InsertLeaderboardStats,
} from "@shared/schema";
import { eq, and, or, desc, ilike, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "./db";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  upsertUserWithId(id: string, user: UpsertUser): Promise<User>;
  createUserWithPassword(data: { email: string; passwordHash: string; emailVerificationToken: string }): Promise<User>;
  verifyUserEmail(userId: string): Promise<void>;
  setUsername(userId: string, username: string): Promise<void>;
  initializeAIUser(): Promise<void>;
  searchUsers(query: string): Promise<User[]>;

  // User stats operations
  getUserStats(userId: string): Promise<UserStats | undefined>;
  upsertUserStats(stats: InsertUserStats): Promise<UserStats>;

  // Game operations
  createGame(game: InsertGameSession): Promise<GameSession>;
  getGame(gameId: string): Promise<GameSession | undefined>;
  updateGame(gameId: string, updates: Partial<GameSession>): Promise<GameSession>;
  getUserGames(userId: string, limit?: number): Promise<GameSession[]>;

  // Game moves operations
  addGameMove(move: InsertGameMove): Promise<GameMove>;
  getGameMoves(gameId: string): Promise<GameMove[]>;

  // Friends operations
  addFriend(friendship: InsertFriend): Promise<Friend>;
  getFriends(userId: string): Promise<User[]>;
  getFriendRequests(userId: string): Promise<User[]>;
  updateFriendStatus(friendshipId: string, status: string): Promise<Friend>;

  // Achievements operations
  addAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getUserAchievements(userId: string): Promise<Achievement[]>;

  // Leaderboard operations
  updateLeaderboardStats(stats: InsertLeaderboardStats): Promise<LeaderboardStats>;
  getLeaderboard(limit?: number): Promise<(LeaderboardStats & { user: User })[]>;
  getUserLeaderboardRank(userId: string): Promise<LeaderboardStats | undefined>;
}

/**
 * MemStorage - In-Memory Storage for Development/Fallback
 */
export class MemStorage implements IStorage {
  private users = new Map<string, any>();
  private userStats = new Map<string, UserStats>();
  private gameSessions = new Map<string, GameSession>();
  private gameMoves = new Map<string, GameMove[]>();
  private friendships = new Map<string, Friend>();
  private achievements = new Map<string, Achievement[]>();
  private leaderboardStats = new Map<string, LeaderboardStats>();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.email === email) {
        return user as User;
      }
    }
    return undefined;
  }

  async createUserWithPassword(data: { email: string; passwordHash: string; emailVerificationToken: string }): Promise<User> {
    const id = nanoid();
    const user: User & { passwordHash?: string; emailVerificationToken?: string; emailVerified?: boolean } = {
      id,
      email: data.email,
      passwordHash: data.passwordHash,
      emailVerified: false,
      emailVerificationToken: data.emailVerificationToken,
      firstName: "",
      lastName: "",
      username: null,
      bio: null,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    await this.upsertUserStats({ userId: id });
    return user;
  }

  async verifyUserEmail(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.emailVerified = true;
      user.emailVerificationToken = null;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.username && user.username.toLowerCase() === username.toLowerCase()) {
        return user as User;
      }
    }
    return undefined;
  }

  async setUsername(userId: string, username: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.username = username;
    }
  }

  async searchUsers(query: string): Promise<User[]> {
    const q = (query.startsWith('@') ? query.slice(1) : query).toLowerCase();
    return Array.from(this.users.values())
      .filter((user: User) =>
        (user.email && user.email.toLowerCase().includes(q)) ||
        (user.firstName && user.firstName.toLowerCase().includes(q)) ||
        (user.lastName && user.lastName.toLowerCase().includes(q)) ||
        (user.username && user.username.toLowerCase().includes(q))
      )
      .slice(0, 20);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const id = (userData as any).id || nanoid();
    const user: User = {
      id,
      email: userData.email || null,
      passwordHash: (userData as any).passwordHash || null,
      emailVerified: (userData as any).emailVerified || null,
      emailVerificationToken: (userData as any).emailVerificationToken || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      username: (userData as any).username || null,
      bio: (userData as any).bio || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: (userData as any).createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async upsertUserWithId(id: string, userData: UpsertUser): Promise<User> {
    const user: User = {
      id,
      email: userData.email || null,
      passwordHash: (userData as any).passwordHash || null,
      emailVerified: (userData as any).emailVerified || null,
      emailVerificationToken: (userData as any).emailVerificationToken || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      username: (userData as any).username || null,
      bio: (userData as any).bio || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: (userData as any).createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getUserStats(userId: string): Promise<UserStats | undefined> {
    return this.userStats.get(userId);
  }

  async upsertUserStats(stats: InsertUserStats): Promise<UserStats> {
    const userStatsRecord: UserStats = {
      userId: stats.userId,
      gamesPlayed: stats.gamesPlayed || 0,
      gamesWon: stats.gamesWon || 0,
      currentStreak: stats.currentStreak || 0,
      bestStreak: stats.bestStreak || 0,
      totalGuesses: stats.totalGuesses || 0,
      fastestWin: stats.fastestWin ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userStats.set(stats.userId, userStatsRecord);
    return userStatsRecord;
  }

  async createGame(game: InsertGameSession): Promise<GameSession> {
    const id = nanoid();
    const gameSession: GameSession = {
      id,
      player1Id: game.player1Id,
      player2Id: game.player2Id || null,
      player1Secret: game.player1Secret || null,
      player2Secret: game.player2Secret || null,
      currentTurn: game.currentTurn || null,
      status: game.status || "waiting",
      winnerId: game.winnerId || null,
      gameMode: game.gameMode,
      difficulty: game.difficulty || "standard",
      startedAt: game.startedAt || null,
      finishedAt: game.finishedAt || null,
      createdAt: new Date(),
    };
    this.gameSessions.set(id, gameSession);
    return gameSession;
  }

  async getGame(gameId: string): Promise<GameSession | undefined> {
    return this.gameSessions.get(gameId);
  }

  async updateGame(gameId: string, updates: Partial<GameSession>): Promise<GameSession> {
    const game = this.gameSessions.get(gameId);
    if (game) {
      const updated = { ...game, ...updates };
      this.gameSessions.set(gameId, updated);
      return updated;
    }
    return { id: gameId } as GameSession;
  }

  async getUserGames(userId: string, limit = 10): Promise<GameSession[]> {
    const games = Array.from(this.gameSessions.values())
      .filter(g => g.player1Id === userId || g.player2Id === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
    return games;
  }

  async addGameMove(move: InsertGameMove): Promise<GameMove> {
    const id = nanoid();
    const gameMove: GameMove = {
      id,
      gameId: move.gameId,
      playerId: move.playerId,
      guess: move.guess,
      correctDigits: move.correctDigits,
      correctPositions: move.correctPositions,
      moveNumber: move.moveNumber,
      createdAt: new Date(),
    };
    if (!this.gameMoves.has(move.gameId)) {
      this.gameMoves.set(move.gameId, []);
    }
    this.gameMoves.get(move.gameId)!.push(gameMove);
    return gameMove;
  }

  async addAIGameMove(move: Omit<InsertGameMove, 'playerId'> & { playerId: string }): Promise<GameMove> {
    return this.addGameMove(move);
  }

  async getGameMoves(gameId: string): Promise<GameMove[]> {
    return this.gameMoves.get(gameId) || [];
  }

  async addFriend(friendship: InsertFriend): Promise<Friend> {
    const id = nanoid();
    const friend: Friend = {
      id,
      userId: friendship.userId,
      friendId: friendship.friendId,
      status: friendship.status || "pending",
      createdAt: new Date(),
    };
    this.friendships.set(id, friend);
    return friend;
  }

  async getFriends(userId: string): Promise<User[]> {
    const friendIds = Array.from(this.friendships.values())
      .filter(f => f.userId === userId && f.status === "accepted")
      .map(f => f.friendId);
    return friendIds.map(id => this.users.get(id)).filter((u): u is User => !!u);
  }

  async getFriendRequests(userId: string): Promise<User[]> {
    const requesterIds = Array.from(this.friendships.values())
      .filter(f => f.friendId === userId && f.status === "pending")
      .map(f => f.userId);
    return requesterIds.map(id => this.users.get(id)).filter((u): u is User => !!u);
  }

  async updateFriendStatus(friendshipId: string, status: string): Promise<Friend> {
    const friendship = this.friendships.get(friendshipId);
    if (friendship) {
      friendship.status = status;
    }
    return friendship!;
  }

  async addAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const id = nanoid();
    const ach: Achievement = {
      id,
      userId: achievement.userId,
      achievementType: achievement.achievementType,
      achievementName: achievement.achievementName,
      description: achievement.description ?? null,
      unlockedAt: new Date(),
      createdAt: new Date(),
    };
    if (!this.achievements.has(achievement.userId)) {
      this.achievements.set(achievement.userId, []);
    }
    this.achievements.get(achievement.userId)!.push(ach);
    return ach;
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return this.achievements.get(userId) || [];
  }

  async updateLeaderboardStats(stats: InsertLeaderboardStats): Promise<LeaderboardStats> {
    const leaderboard: LeaderboardStats = {
      userId: stats.userId,
      rank: stats.rank ?? null,
      gamesPlayed: stats.gamesPlayed || 0,
      gamesWon: stats.gamesWon || 0,
      winRate: stats.winRate || 0,
      currentStreak: stats.currentStreak || 0,
      bestStreak: stats.bestStreak || 0,
      averageGuesses: stats.averageGuesses || 0,
      updatedAt: new Date(),
    };
    this.leaderboardStats.set(stats.userId, leaderboard);
    return leaderboard;
  }

  async getLeaderboard(limit = 100): Promise<(LeaderboardStats & { user: User })[]> {
    const stats = Array.from(this.leaderboardStats.values())
      .sort((a, b) => (b.rank || 999999) - (a.rank || 999999))
      .slice(0, limit);
    return stats.map(stat => ({ ...stat, user: this.users.get(stat.userId)! })).filter(item => item.user);
  }

  async getUserLeaderboardRank(userId: string): Promise<LeaderboardStats | undefined> {
    return this.leaderboardStats.get(userId);
  }

  async initializeAIUser(): Promise<void> {
    if (!this.users.has('AI')) {
      this.users.set('AI', { id: 'AI', email: 'ai@numbermind.com', firstName: 'AI', lastName: 'Assistant', profileImageUrl: null, createdAt: new Date(), updatedAt: new Date() });
      await this.upsertUserStats({ userId: 'AI' });
    }
    console.log('AI user initialized');
  }
}

/**
 * DatabaseStorage - PostgreSQL with Drizzle ORM
 * Uses Neon serverless PostgreSQL for production data persistence
 */
export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0] as User | undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Exact, case-insensitive match using ilike without wildcards
    const result = await db
      .select()
      .from(users)
      .where(
        and(
          sql`${users.username} IS NOT NULL`,
          sql`lower(${users.username}) = lower(${username})`
        )
      )
      .limit(1);
    return result[0];
  }

  async setUsername(userId: string, username: string): Promise<void> {
    // Write directly to the users table — single, authoritative update
    await db
      .update(users)
      .set({ username, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async createUserWithPassword(data: { email: string; passwordHash: string; emailVerificationToken: string }): Promise<User> {
    const id = nanoid();
    await db.insert(users).values({
      id,
      email: data.email,
      passwordHash: data.passwordHash,
      emailVerified: false,
      emailVerificationToken: data.emailVerificationToken,
      firstName: "",
      lastName: "",
      username: null,
      bio: null,
      profileImageUrl: null,
    });
    await this.upsertUserStats({ userId: id });
    const user = await this.getUser(id);
    return user!;
  }

  async verifyUserEmail(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ emailVerified: true, emailVerificationToken: null })
      .where(eq(users.id, userId));
  }

  async searchUsers(query: string): Promise<User[]> {
    // Strip a leading @ if user typed @username, but keep @ inside email addresses
    const cleanQuery = query.startsWith('@') ? query.slice(1) : query;
    const q = `%${cleanQuery.toLowerCase()}%`;

    return await db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.email, q),
          ilike(users.firstName, q),
          ilike(users.lastName, q),
          // Only match username when it's not null — ilike(null, q) returns NULL in Postgres
          // which silently breaks OR logic. Use `and` to guard it.
          and(
            sql`${users.username} IS NOT NULL`,
            ilike(users.username, q)
          )
        )
      )
      .limit(20);
  }

  async upsertUser(userData: UpsertUser & { id?: string }): Promise<User> {
    const id = userData.id || nanoid();
    await db
      .insert(users)
      .values({
        id,
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        username: userData.username || null,
        bio: userData.bio || null,
        profileImageUrl: userData.profileImageUrl || null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email || undefined,
          firstName: userData.firstName || undefined,
          lastName: userData.lastName || undefined,
          username: userData.username || undefined,
          bio: userData.bio || undefined,
          profileImageUrl: userData.profileImageUrl || undefined,
        },
      });
    const user = await this.getUser(id);
    return user!;
  }

  async upsertUserWithId(id: string, userData: UpsertUser): Promise<User> {
    return this.upsertUser({ ...userData, id });
  }

  async getUserStats(userId: string): Promise<UserStats | undefined> {
    const result = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1);
    return result[0];
  }

  async upsertUserStats(stats: InsertUserStats): Promise<UserStats> {
    // Try to get existing stats
    const existing = await this.getUserStats(stats.userId);

    if (existing) {
      // Update existing
      await db
        .update(userStats)
        .set({
          gamesPlayed: stats.gamesPlayed ?? existing.gamesPlayed,
          gamesWon: stats.gamesWon ?? existing.gamesWon,
          currentStreak: stats.currentStreak ?? existing.currentStreak,
          bestStreak: stats.bestStreak ?? existing.bestStreak,
          totalGuesses: stats.totalGuesses ?? existing.totalGuesses,
          fastestWin: stats.fastestWin ?? existing.fastestWin,
        })
        .where(eq(userStats.userId, stats.userId));
    } else {
      // Insert new
      await db.insert(userStats).values({
        userId: stats.userId,
        gamesPlayed: stats.gamesPlayed || 0,
        gamesWon: stats.gamesWon || 0,
        currentStreak: stats.currentStreak || 0,
        bestStreak: stats.bestStreak || 0,
        totalGuesses: stats.totalGuesses || 0,
        fastestWin: stats.fastestWin,
      });
    }

    const result = await this.getUserStats(stats.userId);
    return result!;
  }

  async createGame(game: InsertGameSession): Promise<GameSession> {
    const id = nanoid();
    await db.insert(gameSessions).values({
      id,
      player1Id: game.player1Id,
      player2Id: game.player2Id || null,
      player1Secret: game.player1Secret || null,
      player2Secret: game.player2Secret || null,
      currentTurn: game.currentTurn || null,
      status: game.status || "waiting",
      winnerId: game.winnerId || null,
      gameMode: game.gameMode,
      difficulty: game.difficulty || "standard",
      startedAt: game.startedAt || null,
      finishedAt: game.finishedAt || null,
    });
    const gameResult = await this.getGame(id);
    return gameResult!;
  }

  async getGame(gameId: string): Promise<GameSession | undefined> {
    const result = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.id, gameId))
      .limit(1);
    return result[0];
  }

  async updateGame(gameId: string, updates: Partial<GameSession>): Promise<GameSession> {
    // Strip non-updatable/primary key fields before sending to DB
    const { id: _id, createdAt: _createdAt, ...safeUpdates } = updates as any;
    await db
      .update(gameSessions)
      .set(safeUpdates)
      .where(eq(gameSessions.id, gameId));
    const game = await this.getGame(gameId);
    return game!;
  }

  async getUserGames(userId: string, limit = 10): Promise<GameSession[]> {
    return await db
      .select()
      .from(gameSessions)
      .where(or(eq(gameSessions.player1Id, userId), eq(gameSessions.player2Id, userId)))
      .orderBy(desc(gameSessions.createdAt))
      .limit(limit);
  }

  async addGameMove(move: InsertGameMove): Promise<GameMove> {
    const id = nanoid();
    await db.insert(gameMoves).values({
      id,
      gameId: move.gameId,
      playerId: move.playerId,
      guess: move.guess,
      correctDigits: move.correctDigits,
      correctPositions: move.correctPositions,
      moveNumber: move.moveNumber,
    });
    const result = await db
      .select()
      .from(gameMoves)
      .where(eq(gameMoves.id, id))
      .limit(1);
    return result[0]!;
  }

  async addAIGameMove(move: Omit<InsertGameMove, 'playerId'> & { playerId: string }): Promise<GameMove> {
    return this.addGameMove(move);
  }

  async getGameMoves(gameId: string): Promise<GameMove[]> {
    return await db
      .select()
      .from(gameMoves)
      .where(eq(gameMoves.gameId, gameId))
      .orderBy(gameMoves.createdAt);
  }

  async addFriend(friendship: InsertFriend): Promise<Friend> {
    const id = nanoid();
    await db.insert(friends).values({
      id,
      userId: friendship.userId,
      friendId: friendship.friendId,
      status: friendship.status || "pending",
    });
    const result = await db
      .select()
      .from(friends)
      .where(eq(friends.id, id))
      .limit(1);
    return result[0]!;
  }

  async getFriends(userId: string): Promise<User[]> {
    const friendships = await db
      .select({ friendId: friends.friendId })
      .from(friends)
      .where(and(eq(friends.userId, userId), eq(friends.status, "accepted")));

    if (friendships.length === 0) return [];

    const friendIds = friendships.map(f => f.friendId);
    return await db
      .select()
      .from(users)
      .where(inArray(users.id, friendIds));
  }

  async getFriendRequests(userId: string): Promise<User[]> {
    const friendships = await db
      .select({ userId: friends.userId })
      .from(friends)
      .where(and(eq(friends.friendId, userId), eq(friends.status, "pending")));

    if (friendships.length === 0) return [];

    const userIds = friendships.map(f => f.userId);
    return await db
      .select()
      .from(users)
      .where(inArray(users.id, userIds));
  }

  async updateFriendStatus(friendshipId: string, status: string): Promise<Friend> {
    await db
      .update(friends)
      .set({ status })
      .where(eq(friends.id, friendshipId));
    const result = await db
      .select()
      .from(friends)
      .where(eq(friends.id, friendshipId))
      .limit(1);
    return result[0]!;
  }

  async addAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const id = nanoid();
    await db.insert(achievements).values({
      id,
      userId: achievement.userId,
      achievementType: achievement.achievementType,
      achievementName: achievement.achievementName,
      description: achievement.description,
    });
    const result = await db
      .select()
      .from(achievements)
      .where(eq(achievements.id, id))
      .limit(1);
    return result[0]!;
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.unlockedAt));
  }

  async updateLeaderboardStats(stats: InsertLeaderboardStats): Promise<LeaderboardStats> {
    await db
      .insert(leaderboardStats)
      .values({
        userId: stats.userId,
        rank: stats.rank,
        gamesPlayed: stats.gamesPlayed || 0,
        gamesWon: stats.gamesWon || 0,
        winRate: stats.winRate || 0,
        currentStreak: stats.currentStreak || 0,
        bestStreak: stats.bestStreak || 0,
        averageGuesses: stats.averageGuesses || 0,
      })
      .onConflictDoUpdate({
        target: leaderboardStats.userId,
        set: {
          rank: stats.rank,
          gamesPlayed: stats.gamesPlayed,
          gamesWon: stats.gamesWon,
          winRate: stats.winRate,
          currentStreak: stats.currentStreak,
          bestStreak: stats.bestStreak,
          averageGuesses: stats.averageGuesses,
        },
      });
    const result = await db
      .select()
      .from(leaderboardStats)
      .where(eq(leaderboardStats.userId, stats.userId))
      .limit(1);
    return result[0]!;
  }

  async getLeaderboard(limit = 100): Promise<(LeaderboardStats & { user: User })[]> {
    // Single JOIN query instead of N+1
    const results = await db
      .select({
        userId: leaderboardStats.userId,
        rank: leaderboardStats.rank,
        gamesPlayed: leaderboardStats.gamesPlayed,
        gamesWon: leaderboardStats.gamesWon,
        winRate: leaderboardStats.winRate,
        currentStreak: leaderboardStats.currentStreak,
        bestStreak: leaderboardStats.bestStreak,
        averageGuesses: leaderboardStats.averageGuesses,
        updatedAt: leaderboardStats.updatedAt,
        user: users,
      })
      .from(leaderboardStats)
      .innerJoin(users, eq(leaderboardStats.userId, users.id))
      .orderBy(desc(leaderboardStats.gamesWon), desc(leaderboardStats.winRate))
      .limit(limit);

    return results as (LeaderboardStats & { user: User })[];
  }

  async getUserLeaderboardRank(userId: string): Promise<LeaderboardStats | undefined> {
    const result = await db
      .select()
      .from(leaderboardStats)
      .where(eq(leaderboardStats.userId, userId))
      .limit(1);
    return result[0];
  }

  async initializeAIUser(): Promise<void> {
    const existingAI = await this.getUser("AI");
    if (!existingAI) {
      await db.insert(users).values({
        id: "AI",
        email: "ai@numbermind.com",
        firstName: "AI",
        lastName: "Assistant",
        profileImageUrl: null,
      });
      await this.upsertUserStats({ userId: "AI" });
    }
    console.log("AI user initialized");
  }
}

// PostgreSQL with Neon - all user data persists permanently
export const storage = new DatabaseStorage();
