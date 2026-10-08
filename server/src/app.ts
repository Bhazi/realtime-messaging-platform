import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";

import authRoutes from "./modules/auth/auth.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import presenceRoutes from "./modules/presence/presence.routes.js";
import userRoutes from "./modules/user/user.routes.js";

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

/**
 * Middleware
 */
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

/**
 * Static files
 */
app.use("/uploads", express.static(UPLOADS_DIR));

/**
 * Health check
 */
app.get("/api/v1", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "messenger-backend",
    timestamp: new Date().toISOString(),
  });
});

/**
 * API routes
 */
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/presence", presenceRoutes);

/**
 * 404 handler
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource was not found.",
  });
});

/**
 * Global error handler
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Server error:", err);

  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(500).json({
    error: "Internal Server Error",
    ...(isDevelopment && {
      message: err.message,
    }),
  });
});

export default app;
