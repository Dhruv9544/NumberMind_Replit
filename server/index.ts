import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { runMigrations } from "./db";

const app = express();

// Trust proxy for production (needed for secure cookies behind reverse proxy)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// Initialize memory store for sessions
const memoryStore = MemoryStore(session);

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET && process.env.NODE_ENV === "production") {
  console.error("❌ SESSION_SECRET environment variable is required in production!");
  process.exit(1);
}

// Session configuration - MUST come before routes
app.use(session({
  store: new memoryStore({
    checkPeriod: 86400000, // prune expired entries every 24h
  }),
  secret: SESSION_SECRET || "dev-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  },
}));

// Session middleware - inject req.user from session
const sessionMiddleware = (req: any, _res: any, next: any) => {
  req.user = req.session?.userId ? { id: req.session.userId } : null;
  next();
};

app.use(sessionMiddleware);

// Request logging middleware (API routes only)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 120) {
        logLine = logLine.slice(0, 119) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  // Run database migrations first
  await runMigrations();

  // Initialize AI user for AI game functionality
  try {
    await storage.initializeAIUser();
  } catch (error) {
    console.warn("⚠️  Could not initialize AI user:", (error as any)?.message);
  }

  const server = await registerRoutes(app);

  // Global error handler - must be defined AFTER routes
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`[Error] ${status} - ${message}`, err.stack);
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // Serve frontend - only setup Vite in development
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({ port, host: "0.0.0.0" }, () => {
    log(`serving on port ${port}`);
  });
})();
