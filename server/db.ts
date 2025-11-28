import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log("DATABASE_URL set:", process.env.DATABASE_URL.substring(0, 50) + "...");
console.log("Initializing PostgreSQL connection pool...");

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

console.log("✅ PostgreSQL connection pool created successfully");

// Export migration runner
export { runMigrations } from "./migrations";