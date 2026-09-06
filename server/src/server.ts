import express, { Request, Response, NextFunction } from "express";

import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import presenceRoutes from "./modules/presence/presence.routes.js";

import { connectDB } from "./config/db.js";

import { connectRedis } from "./config/redis.js";

import { initializeChatSocket } from "./modules/chat/chat.socket.js";

import cookieParser from "cookie-parser";

import jwt, { type JwtPayload } from "jsonwebtoken";

import * as cookie from "cookie";

const FRONTEND_URL = "http://localhost:5173";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

/*
 * =====================================================
 * EXPRESS MIDDLEWARE
 * =====================================================
 */

app.use(
  cors({
    origin: "http://localhost:5173",
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
 * MORGAN
 * =====================================================
 */

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

/*
 * =====================================================
 * HEALTH ROUTE
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

/*
 * =====================================================
 * HTTP SERVER
 * =====================================================
 *
 * IMPORTANT:
 *
 * Do NOT use app.listen().
 *
 * Socket.IO attaches to this HTTP server.
 */

const httpServer = createServer(app);

/*
 * =====================================================
 * SOCKET.IO
 * =====================================================
 */

const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },

  transports: ["websocket"],
});

declare module "socket.io" {
  interface Socket {
    user: {
      sub: string;
      publicUid: string;
      type: string;
      iat: number;
      exp: number;
    };
  }
}

interface AuthPayload {
  sub: string;
  publicUid: string;
  type: string;
  iat: number;
  exp: number;
}

io.use((socket, next) => {
  try {
    const rawCookie = socket.handshake.headers.cookie;

    if (!rawCookie) {
      return next(new Error("No cookies found"));
    }

    const cookies = cookie.parseCookie(rawCookie);

    const token = cookies.access_token;

    if (!token) {
      return next(new Error("No access token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    socket.user = decoded as AuthPayload;

    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Unauthorized"));
  }
});

/*
 * Initialize Socket.IO events.
 */
initializeChatSocket(io);

/*
 * =====================================================
 * START SERVER
 * =====================================================
 */

httpServer.listen(PORT, async () => {
  await connectDB();

  await connectRedis();

  console.log(`🚀 Messenger backend streaming on http://localhost:${PORT}`);

  console.log(`🔌 Socket.IO running on ws://localhost:${PORT}`);
});
