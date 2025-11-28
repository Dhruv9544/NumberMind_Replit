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
import { db } from "./db";
import { eq, and, or, desc } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("DB getUser failed:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<(User & { passwordHash?: string; emailVerificationToken?: string; emailVerified?: boolean }) | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("DB getUserByEmail failed:", error);
      return undefined;
    }
  }

  async createUserWithPassword(data: { email: string; passwordHash: string; emailVerificationToken: string }): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values({
          email: data.email,
          passwordHash: data.passwordHash,
          emailVerificationToken: data.emailVerificationToken,
          emailVerified: false,
        })
        .returning();
      await this.upsertUserStats({ userId: user.id }).catch(() => {});
      return user;
    } catch (error) {
      console.error("DB createUserWithPassword failed:", error);
      throw error;
    }
  }

  async verifyUserEmail(userId: string): Promise<void> {
    try {
      await db.update(users).set({ emailVerified: true, emailVerificationToken: null }).where(eq(users.id, userId));
    } catch (error) {
      console.error("DB verifyUserEmail failed:", error);
      throw error;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      
      await this.upsertUserStats({ userId: user.id }).catch(() => {});
      return user;
    } catch (error) {
      console.error("DB upsertUser failed:", error);
      throw error;
    }
  }

  async upsertUserWithId(id: string, userData: UpsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values({
          id,
          ...userData,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      
      await this.upsertUserStats({ userId: user.id }).catch(() => {});
      return user;
    } catch (error) {
      console.error("DB upsertUserWithId failed:", error);
      throw error;
    }
  }

  // User stats operations
  async getUserStats(userId: string): Promise<UserStats | undefined> {
    try {
      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
      return stats;
    } catch (error) {
      console.error("DB getUserStats failed:", error);
      return undefined;
    }
  }

  async upsertUserStats(stats: InsertUserStats): Promise<UserStats> {
    try {
      const [userStatsRecord] = await db
        .insert(userStats)
        .values(stats)
        .onConflictDoUpdate({
          target: userStats.userId,
          set: {
            ...stats,
            updatedAt: new Date(),
          },
        })
        .returning();
      return userStatsRecord;
    } catch (error) {
      console.error("DB upsertUserStats failed:", error);
      throw error;
    }
  }

  // Game operations
  async createGame(game: InsertGameSession): Promise<GameSession> {
    try {
      const [gameRecord] = await db.insert(gameSessions).values(game).returning();
      return gameRecord;
    } catch (error) {
      console.error("DB createGame failed:", error);
      throw error;
    }
  }

  async getGame(gameId: string): Promise<GameSession | undefined> {
    try {
      const [game] = await db.select().from(gameSessions).where(eq(gameSessions.id, gameId));
      return game;
    } catch (error) {
      console.error("DB getGame failed:", error);
      return undefined;
    }
  }

  async updateGame(gameId: string, updates: Partial<GameSession>): Promise<GameSession> {
    try {
      const [game] = await db
        .update(gameSessions)
        .set(updates)
        .where(eq(gameSessions.id, gameId))
        .returning();
      return game;
    } catch (error) {
      console.error("DB updateGame failed:", error);
      throw error;
    }
  }

  async getUserGames(userId: string, limit = 10): Promise<GameSession[]> {
    try {
      return await db
        .select()
        .from(gameSessions)
        .where(or(eq(gameSessions.player1Id, userId), eq(gameSessions.player2Id, userId)))
        .orderBy(desc(gameSessions.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("DB getUserGames failed:", error);
      return [];
    }
  }

  // Game moves operations
  async addGameMove(move: InsertGameMove): Promise<GameMove> {
    try {
      const [moveRecord] = await db.insert(gameMoves).values(move).returning();
      return moveRecord;
    } catch (error) {
      console.error("DB addGameMove failed:", error);
      throw error;
    }
  }

  async addAIGameMove(move: Omit<InsertGameMove, 'playerId'> & { playerId: string }): Promise<GameMove> {
    try {
      const [moveRecord] = await db.insert(gameMoves).values(move).returning();
      return moveRecord;
    } catch (error) {
      console.error("DB addAIGameMove failed:", error);
      throw error;
    }
  }

  async getGameMoves(gameId: string): Promise<GameMove[]> {
    try {
      return await db
        .select()
        .from(gameMoves)
        .where(eq(gameMoves.gameId, gameId))
        .orderBy(gameMoves.moveNumber);
    } catch (error) {
      console.error("DB getGameMoves failed:", error);
      return [];
    }
  }

  // Friends operations
  async addFriend(friendship: InsertFriend): Promise<Friend> {
    try {
      const [friend] = await db.insert(friends).values(friendship).returning();
      return friend;
    } catch (error) {
      console.error("DB addFriend failed:", error);
      throw error;
    }
  }

  async getFriends(userId: string): Promise<User[]> {
    try {
      const friendships = await db
        .select({
          friend: users,
        })
        .from(friends)
        .innerJoin(users, eq(friends.friendId, users.id))
        .where(and(eq(friends.userId, userId), eq(friends.status, "accepted")));
      
      return friendships.map(f => f.friend);
    } catch (error) {
      console.error("DB getFriends failed:", error);
      return [];
    }
  }

  async getFriendRequests(userId: string): Promise<User[]> {
    try {
      const requests = await db
        .select({
          user: users,
        })
        .from(friends)
        .innerJoin(users, eq(friends.userId, users.id))
        .where(and(eq(friends.friendId, userId), eq(friends.status, "pending")));
      
      return requests.map(r => r.user);
    } catch (error) {
      console.error("DB getFriendRequests failed:", error);
      return [];
    }
  }

  async updateFriendStatus(friendshipId: string, status: string): Promise<Friend> {
    try {
      const [friendship] = await db
        .update(friends)
        .set({ status })
        .where(eq(friends.id, friendshipId))
        .returning();
      return friendship;
    } catch (error) {
      console.error("DB updateFriendStatus failed:", error);
      throw error;
    }
  }

  // Achievements operations
  async addAchievement(achievement: InsertAchievement): Promise<Achievement> {
    try {
      const [ach] = await db.insert(achievements).values(achievement).returning();
      return ach;
    } catch (error) {
      console.error("DB addAchievement failed:", error);
      throw error;
    }
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      return await db.select().from(achievements).where(eq(achievements.userId, userId));
    } catch (error) {
      console.error("DB getUserAchievements failed:", error);
      return [];
    }
  }

  // Leaderboard operations
  async updateLeaderboardStats(stats: InsertLeaderboardStats): Promise<LeaderboardStats> {
    try {
      const [leaderboard] = await db
        .insert(leaderboardStats)
        .values(stats)
        .onConflictDoUpdate({
          target: leaderboardStats.userId,
          set: {
            ...stats,
            updatedAt: new Date(),
          },
        })
        .returning();
      return leaderboard;
    } catch (error) {
      console.error("DB updateLeaderboardStats failed:", error);
      throw error;
    }
  }

  async getLeaderboard(limit = 100): Promise<(LeaderboardStats & { user: User })[]> {
    try {
      const stats = await db
        .select()
        .from(leaderboardStats)
        .orderBy(leaderboardStats.rank)
        .limit(limit);
      
      const results = await Promise.all(
        stats.map(async (stat) => ({
          ...stat,
          user: (await db.select().from(users).where(eq(users.id, stat.userId)))[0]!,
        }))
      );
      
      return results.filter(item => item.user);
    } catch (error) {
      console.error("DB getLeaderboard failed:", error);
      return [];
    }
  }

  async getUserLeaderboardRank(userId: string): Promise<LeaderboardStats | undefined> {
    try {
      const [stats] = await db.select().from(leaderboardStats).where(eq(leaderboardStats.userId, userId));
      return stats;
    } catch (error) {
      console.error("DB getUserLeaderboardRank failed:", error);
      return undefined;
    }
  }

  async initializeAIUser(): Promise<void> {
    try {
      // Create AI user record if not exists
      await db.insert(users).values({
        id: 'AI',
        email: 'ai@numbermind.com',
        firstName: 'AI',
        lastName: 'Assistant',
        profileImageUrl: null,
      }).onConflictDoNothing().catch(() => {});

      // Create AI user stats if not exists
      await db.insert(userStats).values({
        userId: 'AI',
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalGuesses: 0,
      }).onConflictDoNothing().catch(() => {});

      console.log('AI user initialized');
    } catch (error) {
      console.error('AI initialization non-critical error:', error);
    }
  }
}

export const storage = new DatabaseStorage();
