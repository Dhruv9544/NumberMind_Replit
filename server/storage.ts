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
import { eq, and, or, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

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

// MemStorage: In-memory storage for development/testing
// NOTE: This is a TEMPORARY implementation. Switch to DatabaseStorage with proper PostgreSQL once database is provisioned.
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

  async getUserByEmail(email: string): Promise<(User & { passwordHash?: string; emailVerificationToken?: string; emailVerified?: boolean }) | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
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

  async upsertUser(userData: UpsertUser): Promise<User> {
    const id = userData.id || nanoid();
    const user: User = {
      id,
      email: userData.email || "",
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: userData.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async upsertUserWithId(id: string, userData: UpsertUser): Promise<User> {
    const user: User = {
      id,
      email: userData.email || "",
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: userData.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getUserStats(userId: string): Promise<UserStats | undefined> {
    return this.userStats.get(userId);
  }

  async upsertUserStats(stats: InsertUserStats): Promise<UserStats> {
    const userStats: UserStats = {
      userId: stats.userId,
      gamesPlayed: stats.gamesPlayed || 0,
      gamesWon: stats.gamesWon || 0,
      currentStreak: stats.currentStreak || 0,
      bestStreak: stats.bestStreak || 0,
      totalGuesses: stats.totalGuesses || 0,
      fastestWin: stats.fastestWin,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userStats.set(stats.userId, userStats);
    return userStats;
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
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
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
    
    return friendIds
      .map(id => this.users.get(id))
      .filter((u): u is User => !!u);
  }

  async getFriendRequests(userId: string): Promise<User[]> {
    const requesterIds = Array.from(this.friendships.values())
      .filter(f => f.friendId === userId && f.status === "pending")
      .map(f => f.userId);
    
    return requesterIds
      .map(id => this.users.get(id))
      .filter((u): u is User => !!u);
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
      description: achievement.description,
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
      rank: stats.rank,
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
    
    return stats
      .map(stat => ({
        ...stat,
        user: this.users.get(stat.userId)!,
      }))
      .filter(item => item.user);
  }

  async getUserLeaderboardRank(userId: string): Promise<LeaderboardStats | undefined> {
    return this.leaderboardStats.get(userId);
  }

  async initializeAIUser(): Promise<void> {
    if (!this.users.has('AI')) {
      this.users.set('AI', {
        id: 'AI',
        email: 'ai@numbermind.com',
        firstName: 'AI',
        lastName: 'Assistant',
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await this.upsertUserStats({ userId: 'AI' });
    }
    console.log('AI user initialized');
  }
}

export const storage = new MemStorage();
