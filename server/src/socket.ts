import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";

import { createAdapter } from "@socket.io/redis-adapter";

import { pubClient, subClient } from "./config/redis.js";
import { initializeChatSocket } from "./modules/chat/chat.socket.js";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET;

interface AuthPayload {
  sub: string;
  publicUid: string;
  type: string;
  iat: number;
  exp: number;
}

declare module "socket.io" {
  interface Socket {
    user: AuthPayload;
  }
}

export function initializeSocket(
  httpServer: HttpServer,
  serverId: string,
): Server {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not configured");
  }

  const io = new Server(httpServer, {
    cors: {
      origin: FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket"],
  });

  io.adapter(createAdapter(pubClient, subClient));

  io.use((socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;

      if (!rawCookie) {
        return next(new Error("Unauthorized"));
      }

      const cookies = cookie.parseCookie(rawCookie);
      const accessToken = cookies.access_token;

      if (!accessToken) {
        return next(new Error("Unauthorized"));
      }

      const payload = jwt.verify(accessToken, JWT_SECRET);

      if (typeof payload === "string") {
        return next(new Error("Unauthorized"));
      }

      socket.user = payload as AuthPayload;

      next();
    } catch (error) {
      console.error("Socket authentication failed:", error);
      next(new Error("Unauthorized"));
    }
  });

  initializeChatSocket(io, serverId);

  return io;
}
