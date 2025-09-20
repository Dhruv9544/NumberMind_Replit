# Overview

NumberMind is a real-time multiplayer logic deduction game based on the classic "Bulls and Cows" concept. Players compete to guess each other's secret 4-digit number using strategic reasoning and feedback. The application is built as a full-stack web application with a React frontend and Express backend, featuring real-time gameplay through WebSocket connections and comprehensive user authentication via Replit Auth.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built with React 18 using TypeScript and follows a modern component-based architecture. The UI leverages shadcn/ui components with Radix UI primitives for accessibility and Tailwind CSS for styling. The application uses Wouter for client-side routing and TanStack Query for server state management. The frontend is optimized for mobile-first responsive design with a focus on touch interactions.

## Backend Architecture
The server is implemented using Express.js with TypeScript, providing RESTful API endpoints for game management and user operations. Real-time communication is handled through WebSocket connections for live gameplay features. The architecture follows a modular pattern with separate concerns for authentication, game logic, storage operations, and WebSocket handling.

## Authentication System
User authentication is implemented using Replit's OpenID Connect (OIDC) system with Passport.js. Sessions are managed using express-session with PostgreSQL storage via connect-pg-simple. The system supports automatic user provisioning and maintains user profiles with game statistics.

## Game Engine
The core game logic is encapsulated in a dedicated GameEngine class that handles number validation, feedback calculation, and win condition checking. The engine ensures game rules are consistently applied across all game modes (AI opponents and multiplayer).

## Database Design
The application uses PostgreSQL with Drizzle ORM for type-safe database operations. The schema includes tables for users, user statistics, game sessions, game moves, friends, and session storage. Database migrations are managed through Drizzle Kit with schema definitions in TypeScript.

## Real-time Communication
WebSocket connections enable real-time gameplay features including live move updates, turn notifications, and game state synchronization between players. The WebSocket server maintains client connections mapped to game sessions and user identities.

## State Management
Client-side state is managed through a combination of TanStack Query for server state caching and React's built-in state management for UI state. The application implements optimistic updates for better user experience while maintaining data consistency through proper error handling and cache invalidation.

# External Dependencies

## Database
- **Neon PostgreSQL**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database toolkit with schema management
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## Authentication
- **Replit Auth**: OpenID Connect authentication provider
- **Passport.js**: Authentication middleware with OpenID Connect strategy
- **express-session**: Session management middleware

## UI Framework
- **React 18**: Frontend framework with hooks and concurrent features
- **shadcn/ui**: Component library built on Radix UI primitives
- **Radix UI**: Headless UI components for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

## Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Static typing for JavaScript
- **ESBuild**: Fast bundler for production builds
- **Wouter**: Lightweight client-side routing

## Runtime Libraries
- **WebSocket (ws)**: Real-time communication library
- **TanStack Query**: Server state management and caching
- **date-fns**: Date manipulation utilities
- **zod**: Schema validation library
- **nanoid**: Unique ID generation