import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User stats table
export const userStats = pgTable("user_stats", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  gamesPlayed: integer("games_played").default(0),
  gamesWon: integer("games_won").default(0),
  currentStreak: integer("current_streak").default(0),
  bestStreak: integer("best_streak").default(0),
  totalGuesses: integer("total_guesses").default(0),
  fastestWin: integer("fastest_win_seconds"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Game sessions table
export const gameSessions = pgTable("game_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  player1Id: varchar("player1_id").notNull().references(() => users.id),
  player2Id: varchar("player2_id").references(() => users.id), // null for AI games
  player1Secret: varchar("player1_secret", { length: 4 }),
  player2Secret: varchar("player2_secret", { length: 4 }),
  currentTurn: varchar("current_turn").references(() => users.id),
  status: varchar("status").notNull().default("waiting"), // waiting, setup, active, finished
  winnerId: varchar("winner_id").references(() => users.id),
  gameMode: varchar("game_mode").notNull(), // friend, random, ai, daily
  difficulty: varchar("difficulty").default("standard"), // beginner, standard, expert, master
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Game moves/guesses table
export const gameMoves = pgTable("game_moves", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull().references(() => gameSessions.id),
  playerId: varchar("player_id").notNull().references(() => users.id),
  guess: varchar("guess", { length: 4 }).notNull(),
  correctDigits: integer("correct_digits").notNull(),
  correctPositions: integer("correct_positions").notNull(),
  moveNumber: integer("move_number").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Friends table
export const friends = pgTable("friends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  friendId: varchar("friend_id").notNull().references(() => users.id),
  status: varchar("status").notNull().default("pending"), // pending, accepted, blocked
  createdAt: timestamp("created_at").defaultNow(),
});

// Achievements table
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  achievementType: varchar("achievement_type").notNull(), // code_breaker, speedster, streak_master, etc
  achievementName: varchar("achievement_name").notNull(),
  description: varchar("description"),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Leaderboard stats table (denormalized for performance)
export const leaderboardStats = pgTable("leaderboard_stats", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  rank: integer("rank"),
  gamesPlayed: integer("games_played").default(0),
  gamesWon: integer("games_won").default(0),
  winRate: integer("win_rate").default(0), // stored as percentage
  currentStreak: integer("current_streak").default(0),
  bestStreak: integer("best_streak").default(0),
  averageGuesses: integer("average_guesses").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  stats: one(userStats),
  player1Games: many(gameSessions, { relationName: "player1" }),
  player2Games: many(gameSessions, { relationName: "player2" }),
  moves: many(gameMoves),
  friends: many(friends, { relationName: "userFriends" }),
  friendOf: many(friends, { relationName: "friendOf" }),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));

export const gameSessionsRelations = relations(gameSessions, ({ one, many }) => ({
  player1: one(users, {
    fields: [gameSessions.player1Id],
    references: [users.id],
    relationName: "player1",
  }),
  player2: one(users, {
    fields: [gameSessions.player2Id],
    references: [users.id],
    relationName: "player2",
  }),
  winner: one(users, {
    fields: [gameSessions.winnerId],
    references: [users.id],
  }),
  moves: many(gameMoves),
}));

export const gameMovesRelations = relations(gameMoves, ({ one }) => ({
  game: one(gameSessions, {
    fields: [gameMoves.gameId],
    references: [gameSessions.id],
  }),
  player: one(users, {
    fields: [gameMoves.playerId],
    references: [users.id],
  }),
}));

export const friendsRelations = relations(friends, ({ one }) => ({
  user: one(users, {
    fields: [friends.userId],
    references: [users.id],
    relationName: "userFriends",
  }),
  friend: one(users, {
    fields: [friends.friendId],
    references: [users.id],
    relationName: "friendOf",
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}));

export const leaderboardStatsRelations = relations(leaderboardStats, ({ one }) => ({
  user: one(users, {
    fields: [leaderboardStats.userId],
    references: [users.id],
  }),
}));

// Achievements insert schema
export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
  unlockedAt: true,
});

export const insertLeaderboardStatsSchema = createInsertSchema(leaderboardStats).omit({
  updatedAt: true,
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({
  id: true,
  createdAt: true,
});

export const insertGameMoveSchema = createInsertSchema(gameMoves).omit({
  id: true,
  createdAt: true,
});

export const insertFriendSchema = createInsertSchema(friends).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameMove = typeof gameMoves.$inferSelect;
export type InsertGameMove = z.infer<typeof insertGameMoveSchema>;
export type Friend = typeof friends.$inferSelect;
export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type LeaderboardStats = typeof leaderboardStats.$inferSelect;
export type InsertLeaderboardStats = z.infer<typeof insertLeaderboardStatsSchema>;
