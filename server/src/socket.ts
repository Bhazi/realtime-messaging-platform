import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";

import { initializeChatSocket } from "./modules/chat/chat.socket.js";

import { createAdapter } from "@socket.io/redis-adapter";
import { pubClient, subClient } from "./config/redis.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

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

export function initializeSocket(httpServer: any, serverId: string) {
  const io = new Server(httpServer, {
    cors: {
      origin: FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },

    transports: ["websocket"],
  });

  io.adapter(createAdapter(pubClient, subClient));

  /*
   * =====================================================
   * SOCKET AUTHENTICATION
   * =====================================================
   */

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
   * =====================================================
   * CHAT SOCKET
   * =====================================================
   */

  initializeChatSocket(io, serverId);

  return io;
}
