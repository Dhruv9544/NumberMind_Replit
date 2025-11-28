# PostgreSQL Setup Guide for NumberMind

## Current Status
- **App is running with MemStorage** (in-memory data)
- **DatabaseStorage fully implemented** with Drizzle ORM
- **PostgreSQL credentials issue**: `password authentication failed for user 'neondb_owner'`

## PostgreSQL Error Explanation

**Error:** `password authentication failed for user 'neondb_owner'`

**Root Cause:** The DATABASE_URL environment variable contains invalid credentials that don't match your actual PostgreSQL database.

This happens when:
1. Neon database credentials were regenerated but DATABASE_URL wasn't updated
2. The connection string is malformed or expired
3. sslmode is missing (required for Neon)

## How to Fix: Step-by-Step

### Step 1: Get Fresh PostgreSQL Credentials

**Option A: Using Replit's Built-in Database (RECOMMENDED)**
1. Go to your Replit project
2. Click **Secrets** tab on the left
3. Look for `DATABASE_URL` secret
4. Check if it's a Neon URL or Render URL
5. If invalid, delete the `DATABASE_URL` secret
6. Open **Database** tab and create a new PostgreSQL database
7. Replit will auto-populate fresh `DATABASE_URL` credentials

**Option B: Using Neon**
1. Go to https://console.neon.tech
2. Create new project or reset credentials
3. Copy connection string (format): `postgresql://user:password@host/database?sslmode=require`
4. **IMPORTANT:** Include `?sslmode=require` at the end

**Option C: Using Render**
1. Go to https://dashboard.render.com
2. Find your PostgreSQL database
3. Copy connection string
4. Ensure format: `postgresql://user:password@host/database?sslmode=require`

### Step 2: Update DATABASE_URL Secret

1. In Replit, go to **Secrets** tab
2. Update `DATABASE_URL` with the fresh connection string
3. Verify the string includes `?sslmode=require`
4. Ensure format is: `postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require`

### Step 3: Verify Other Environment Variables

Check these are also set:
- `PGHOST` - hostname (e.g., ep-raspy-dew-a56gw4n5.us-east-2.aws.neon.tech)
- `PGPORT` - port (usually 5432)
- `PGUSER` - username (e.g., neondb_owner)
- `PGPASSWORD` - password
- `PGDATABASE` - database name (e.g., neondb)

### Step 4: Enable PostgreSQL in App

Edit `server/storage.ts` line 685:

```typescript
// Change from:
export const storage = new MemStorage();

// To:
export const storage = new DatabaseStorage();
```

### Step 5: Restart App

The app will:
1. Auto-run database migrations (create tables)
2. Initialize AI user
3. Start using PostgreSQL for all data persistence

## Testing PostgreSQL Connection

After making changes:
1. Restart the workflow
2. Check terminal logs for: `✅ PostgreSQL connection pool created successfully`
3. Check logs for: `✅ Database migrations completed successfully`
4. Signup with test account
5. Verify email works
6. Login - data should persist in PostgreSQL

## Troubleshooting

### Still Getting "password authentication failed"?
- Check DATABASE_URL has correct password (no typos)
- Ensure URL ends with `?sslmode=require`
- Test credentials manually using psql or pgAdmin
- Regenerate database credentials in your provider (Neon/Render)

### Migrations not running?
- Check connection pool logs: "✅ PostgreSQL connection pool created successfully"
- Check migration logs for specific SQL errors
- Ensure database user has CREATE TABLE permissions

### Data not persisting?
- Confirm DatabaseStorage is exported: `export const storage = new DatabaseStorage();`
- Check `server/storage.ts` line 685
- Verify migrations ran successfully
- Check database for tables: users, user_stats, game_sessions, etc.

## File Reference

- **Storage layer:** `server/storage.ts` (line 685)
- **Database config:** `server/db.ts`
- **Auto-migrations:** `server/migrations.ts`
- **Schema:** `shared/schema.ts`
- **Auth setup:** `server/replitAuth.ts`
