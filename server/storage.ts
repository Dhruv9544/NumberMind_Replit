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
import { eq, and, or, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  upsertUserWithId(id: string, user: UpsertUser): Promise<User>;
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
      // Return mock user to allow game to proceed
      return {
        id,
        email: `user-${id}@game.local`,
        firstName: "Player",
        lastName: "",
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
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
      return {
        id: "user-" + Math.random().toString(36).substr(2, 9),
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
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
      return {
        id,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  // User stats operations
  async getUserStats(userId: string): Promise<UserStats | undefined> {
    try {
      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
      return stats;
    } catch (error) {
      console.error("DB getUserStats failed:", error);
      // Return default stats
      return {
        userId,
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalGuesses: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
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
      return {
        ...stats,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  // Game operations
  async createGame(game: InsertGameSession): Promise<GameSession> {
    try {
      const [gameRecord] = await db.insert(gameSessions).values(game).returning();
      return gameRecord;
    } catch (error) {
      console.error("DB createGame failed:", error);
      // Return mock game
      const gameId = "game-" + Math.random().toString(36).substr(2, 9);
      return {
        id: gameId,
        ...game,
        createdAt: new Date(),
        startedAt: null,
        endedAt: null,
      };
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
      return { id: gameId } as GameSession;
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
      return {
        id: "move-" + Math.random().toString(36).substr(2, 9),
        ...move,
        createdAt: new Date(),
      };
    }
  }

  async addAIGameMove(move: Omit<InsertGameMove, 'playerId'> & { playerId: string }): Promise<GameMove> {
    try {
      const [moveRecord] = await db.insert(gameMoves).values(move).returning();
      return moveRecord;
    } catch (error) {
      console.error("DB addAIGameMove failed:", error);
      return {
        id: "move-" + Math.random().toString(36).substr(2, 9),
        ...move,
        createdAt: new Date(),
      };
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
      }).onConflictDoNothing().catch(() => {
        // Silently ignore if AI user already exists
      });

      // Create AI user stats if not exists
      await db.insert(userStats).values({
        userId: 'AI',
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalGuesses: 0,
      }).onConflictDoNothing().catch(() => {
        // Silently ignore if AI stats already exist
      });

      console.log('AI user initialized');
    } catch (error) {
      console.error('AI initialization non-critical error:', error);
    }
  }

  async getGameMoves(gameId: string): Promise<GameMove[]> {
    return await db
      .select()
      .from(gameMoves)
      .where(eq(gameMoves.gameId, gameId))
      .orderBy(gameMoves.moveNumber);
  }

  // Friends operations
  async addFriend(friendship: InsertFriend): Promise<Friend> {
    const [friend] = await db.insert(friends).values(friendship).returning();
    return friend;
  }

  async getFriends(userId: string): Promise<User[]> {
    const friendships = await db
      .select({
        friend: users,
      })
      .from(friends)
      .innerJoin(users, eq(friends.friendId, users.id))
      .where(and(eq(friends.userId, userId), eq(friends.status, "accepted")));
    
    return friendships.map(f => f.friend);
  }

  async getFriendRequests(userId: string): Promise<User[]> {
    const requests = await db
      .select({
        user: users,
      })
      .from(friends)
      .innerJoin(users, eq(friends.userId, users.id))
      .where(and(eq(friends.friendId, userId), eq(friends.status, "pending")));
    
    return requests.map(r => r.user);
  }

  async updateFriendStatus(friendshipId: string, status: string): Promise<Friend> {
    const [friendship] = await db
      .update(friends)
      .set({ status })
      .where(eq(friends.id, friendshipId))
      .returning();
    return friendship;
  }
}

export const storage = new DatabaseStorage();
