import { pool } from "./db";

const MIGRATIONS = `
-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- User stats table
CREATE TABLE IF NOT EXISTS user_stats (
  user_id VARCHAR PRIMARY KEY REFERENCES users(id),
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  total_guesses INTEGER DEFAULT 0,
  fastest_win_seconds INTEGER,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id VARCHAR NOT NULL REFERENCES users(id),
  player2_id VARCHAR REFERENCES users(id),
  player1_secret VARCHAR(4),
  player2_secret VARCHAR(4),
  current_turn VARCHAR REFERENCES users(id),
  status VARCHAR NOT NULL DEFAULT 'waiting',
  winner_id VARCHAR REFERENCES users(id),
  game_mode VARCHAR NOT NULL,
  difficulty VARCHAR DEFAULT 'standard',
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Game moves table
CREATE TABLE IF NOT EXISTS game_moves (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id VARCHAR NOT NULL REFERENCES game_sessions(id),
  player_id VARCHAR NOT NULL REFERENCES users(id),
  guess VARCHAR(4) NOT NULL,
  correct_digits INTEGER NOT NULL,
  correct_positions INTEGER NOT NULL,
  move_number INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Friends table
CREATE TABLE IF NOT EXISTS friends (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  friend_id VARCHAR NOT NULL REFERENCES users(id),
  status VARCHAR NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  achievement_type VARCHAR NOT NULL,
  achievement_name VARCHAR NOT NULL,
  description VARCHAR,
  unlocked_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);

-- Leaderboard stats table
CREATE TABLE IF NOT EXISTS leaderboard_stats (
  user_id VARCHAR PRIMARY KEY REFERENCES users(id),
  rank INTEGER,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  win_rate INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  average_guesses INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT now()
);
`;

export async function runMigrations(): Promise<void> {
  console.log("Running database migrations...");
  try {
    // Split migrations by semicolon and filter empty statements
    const statements = MIGRATIONS.split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await pool.query(statement);
    }
    console.log("✅ Database migrations completed successfully");
  } catch (error) {
    console.error("⚠️  Database migration skipped:", (error as any)?.message || error);
    console.error("DATABASE_URL credentials may be invalid. Using MemStorage fallback.");
    // Don't throw - allow app to start
  }
}
