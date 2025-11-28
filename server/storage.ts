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
import { eq, and, or, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "./db";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<(User & { passwordHash?: string; emailVerificationToken?: string; emailVerified?: boolean }) | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  upsertUserWithId(id: string, user: UpsertUser): Promise<User>;
  createUserWithPassword(data: { email: string; passwordHash: string; emailVerificationToken: string }): Promise<User>;
  verifyUserEmail(userId: string): Promise<void>;
  initializeAIUser(): Promise<void>;
  
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

  async getUserByEmail(email: string): Promise<(User & { passwordHash?: string; emailVerificationToken?: string; emailVerified?: boolean }) | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0];
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

  async upsertUser(userData: UpsertUser): Promise<User> {
    const id = userData.id || nanoid();
    await db
      .insert(users)
      .values({
        id,
        email: userData.email || "",
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        profileImageUrl: userData.profileImageUrl || null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email || undefined,
          firstName: userData.firstName || undefined,
          lastName: userData.lastName || undefined,
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
    await db
      .insert(userStats)
      .values({
        userId: stats.userId,
        gamesPlayed: stats.gamesPlayed || 0,
        gamesWon: stats.gamesWon || 0,
        currentStreak: stats.currentStreak || 0,
        bestStreak: stats.bestStreak || 0,
        totalGuesses: stats.totalGuesses || 0,
        fastestWin: stats.fastestWin,
      })
      .onConflictDoUpdate({
        target: userStats.userId,
        set: {
          gamesPlayed: stats.gamesPlayed || undefined,
          gamesWon: stats.gamesWon || undefined,
          currentStreak: stats.currentStreak || undefined,
          bestStreak: stats.bestStreak || undefined,
          totalGuesses: stats.totalGuesses || undefined,
          fastestWin: stats.fastestWin,
        },
      });
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
    await db
      .update(gameSessions)
      .set(updates)
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
      .where(eq(users.id, friendIds[0]));
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
      .where(eq(users.id, userIds[0]));
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
    const stats = await db
      .select()
      .from(leaderboardStats)
      .orderBy(desc(leaderboardStats.rank))
      .limit(limit);
    
    const results = await Promise.all(
      stats.map(async (stat) => {
        const user = await this.getUser(stat.userId);
        return { ...stat, user: user! };
      })
    );
    
    return results.filter(item => item.user);
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

// PostgreSQL only - all data persists
export const storage = new DatabaseStorage();
