import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Only log DB initialization in development
if (process.env.NODE_ENV !== "production") {
  console.log("Initializing PostgreSQL connection pool...");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,              // Max connections in pool
  idleTimeoutMillis: 30000,  // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Fail fast if DB is unreachable
});

export const db = drizzle({ client: pool, schema });

if (process.env.NODE_ENV !== "production") {
  console.log("✅ PostgreSQL connection pool created successfully");
}

// Export migration runner
export { runMigrations } from "./migrations";