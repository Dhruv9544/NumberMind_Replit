# Overview

NumberMind is a real-time multiplayer logic deduction game based on the classic "Bulls and Cows" concept. Players compete to guess each other's secret 4-digit number using strategic reasoning and feedback. The application is built as a full-stack web application with a React frontend and Express backend, featuring real-time gameplay through WebSocket connections and comprehensive user authentication via email/password with verification.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built with React 18 using TypeScript and follows a modern component-based architecture. The UI leverages shadcn/ui components with Radix UI primitives for accessibility and Tailwind CSS for styling. The application uses Wouter for client-side routing and TanStack Query for server state management. The frontend is optimized for mobile-first responsive design with a focus on touch interactions.

## Backend Architecture
The server is implemented using Express.js with TypeScript, providing RESTful API endpoints for game management and user operations. Real-time communication is handled through WebSocket connections for live gameplay features. The architecture follows a modular pattern with separate concerns for authentication, game logic, storage operations, and WebSocket handling.

## Authentication System
User authentication uses email/password with verification tokens and Passport.js LocalStrategy. Passwords are hashed with bcrypt. Sessions are managed using express-session with PostgreSQL storage via connect-pg-simple. The system maintains user profiles with game statistics and email verification state.

## Game Engine
The core game logic is encapsulated in a dedicated GameEngine class that handles number validation, feedback calculation, and win condition checking. The engine ensures game rules are consistently applied across all game modes (AI opponents and multiplayer).

## Database Design
The application includes both in-memory (MemStorage) and PostgreSQL (DatabaseStorage) storage implementations using identical IStorage interface for easy switching. DatabaseStorage uses Drizzle ORM with Neon serverless PostgreSQL.

Schema is defined in shared/schema.ts with Drizzle ORM type definitions. Tables include: users (with passwordHash, emailVerified, emailVerificationToken), user stats, game sessions, game moves, friends, achievements, and leaderboard stats.

## Real-time Communication
WebSocket connections enable real-time gameplay features including live move updates, turn notifications, and game state synchronization between players. The WebSocket server maintains client connections mapped to game sessions and user identities.

## State Management
Client-side state is managed through a combination of TanStack Query for server state caching and React's built-in state management for UI state. The application implements optimistic updates for better user experience while maintaining data consistency through proper error handling and cache invalidation.

# Implementation Status (Nov 28, 2025)

## ✅ COMPLETED
- Email/password authentication with bcrypt hashing
- Email verification system with tokens
- React Hook Form validation (onBlur mode)
- Toast notifications (top-right positioning)
- MemStorage for development (all data in memory)
- **NEW:** Complete DatabaseStorage class with full Drizzle ORM implementation
- Drizzle ORM schema with all game tables
- PostgreSQL connection pool with neon-serverless

## 🔄 TO ENABLE POSTGRESQL (PRODUCTION)

The DatabaseStorage class is **fully implemented** and ready to use!

### Simple 2-Step Setup:

**Step 1:** Edit `server/storage.ts` - Line 723
```typescript
// Change from:
export const storage = new MemStorage();

// To:
export const storage = new DatabaseStorage();
```

**Step 2:** Run in terminal:
```bash
npm run db:push
```

Then restart the application. All user data, game stats, and leaderboards will persist in PostgreSQL!

### How DatabaseStorage Works
The DatabaseStorage class implements the full IStorage interface with Drizzle ORM operations:
- **User management**: Create, verify, and retrieve users with encrypted passwords
- **Game sessions**: Create, update, and track all game states
- **Game moves**: Store and retrieve all player guesses with feedback
- **User statistics**: Track wins, streaks, fastest times across all games
- **Friend system**: Manage friend requests and accepted connections
- **Achievements**: Award and track player achievements
- **Leaderboard**: Real-time rank tracking based on win rate and performance metrics

### Verification
After enabling PostgreSQL, you can verify by:
1. Creating a user account
2. Logging out and back in - data should persist in PostgreSQL
3. Checking the database directly to see user records
4. Playing a game - all moves and stats will be stored

# External Dependencies

## Authentication
- **Passport.js**: Authentication middleware with LocalStrategy
- **bcrypt**: Password hashing
- **express-session**: Session management middleware

## Database
- **Drizzle ORM**: Type-safe database toolkit (fully implemented)
- **neon-serverless**: PostgreSQL client for serverless environments
- **connect-pg-simple**: PostgreSQL session store

## UI Framework
- **React 18**: Frontend framework with hooks
- **shadcn/ui**: Component library with Radix UI
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

## Development Tools
- **Vite**: Frontend build tool
- **TypeScript**: Static typing
- **Wouter**: Lightweight routing

## Runtime Libraries
- **WebSocket (ws)**: Real-time communication
- **TanStack Query**: Server state management
- **zod**: Schema validation
- **nanoid**: Unique ID generation
- **react-hook-form**: Form state management
