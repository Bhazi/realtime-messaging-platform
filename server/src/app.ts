import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";

import cors from "cors";
import morgan from "morgan";
import path from "path";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import presenceRoutes from "./modules/presence/presence.routes.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const app = express();

/*
 * =====================================================
 * EXPRESS MIDDLEWARE
 * =====================================================
 */

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json());

app.use(cookieParser());

/*
 * Serve uploaded files.
 *
 * Example:
 *
 * /uploads/chat/image.jpg
 *
 * becomes:
 *
 * http://localhost:5000/uploads/chat/image.jpg
 */

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

/*
 * =====================================================
 * API ROUTES
 * =====================================================
 */

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/presence", presenceRoutes);

/*
 * =====================================================
 * HEALTH
 * =====================================================
 */

app.get("/api/v1", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "messenger-backend",
    timestamp: new Date().toISOString(),
  });
});

/*
 * =====================================================
 * ERROR HANDLER
 * =====================================================
 */

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`💥 Server Error: ${err.message}`);

  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

export default app;
