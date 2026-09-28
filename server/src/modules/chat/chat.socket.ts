import { Server, Socket } from "socket.io";

import { PresenceCache } from "../presence/presence.cache.js";
import { UserModel } from "../../models/user.model.js";

let io: Server | null = null;

export function initializeChatSocket(socketServer: Server, serverId: string) {
  io = socketServer;

  io.on("connection", async (socket: Socket) => {
    const userId = socket.user.sub;
    io = socketServer;

    try {
      const wasOnline = await PresenceCache.isOnline(userId);

      await PresenceCache.setOnline(userId, socket.id, serverId);

      if (!wasOnline) {
        const conversationIds =
          await UserModel.getConversationIdsForUser(userId);

        for (const conversationId of conversationIds) {
          io.to(`conversation:${conversationId}`).emit("presence:update", {
            userId,
            online: true,
            lastSeenAt: null,
          });
        }
      }
    } catch (error) {
      console.error("Failed to initialize user presence:", error);
    }

    // -----------------------------
    // Presence heartbeat
    // -----------------------------

    socket.on("presence:heartbeat", async () => {
      try {
        const isAlive = await PresenceCache.heartbeat(userId, socket.id);

        if (!isAlive) {
          await PresenceCache.setOnline(userId, socket.id, serverId);
        }
      } catch (error) {
        console.error("Failed to update presence heartbeat:", error);
      }
    });

    // -----------------------------
    // Join conversation
    // -----------------------------

    socket.on("join_conversation", async (conversationId: string) => {
      if (!conversationId) return;

      const isMember = await UserModel.isMember(conversationId, userId);

      if (!isMember) {
        return;
      }

      socket.join(`conversation:${conversationId}`);
    });

    // -----------------------------
    // Leave conversation
    // -----------------------------

    socket.on("leave_conversation", (conversationId: string) => {
      if (!conversationId) return;

      socket.leave(`conversation:${conversationId}`);
    });

    // -----------------------------
    // Disconnect
    // -----------------------------

    socket.on("disconnect", async () => {
      io = socketServer;
      try {
        const stillOnline = await PresenceCache.removeConnection(
          userId,
          socket.id,
        );

        if (!stillOnline) {
          await UserModel.setLastSeen(userId);

          const conversationIds =
            await UserModel.getConversationIdsForUser(userId);

          for (const conversationId of conversationIds) {
            io.to(`conversation:${conversationId}`).emit("presence:update", {
              userId,
              online: false,
              lastSeenAt: Date.now(),
            });
          }
        }
      } catch (error) {
        console.error("Failed to handle presence disconnect:", error);
      }
    });
  });
}

export function emitNewMessage(conversationId: string, message: unknown) {
  if (!io) {
    return;
  }

  const room = `conversation:${conversationId}`;

  io.to(room).emit("new_message", message);
}
