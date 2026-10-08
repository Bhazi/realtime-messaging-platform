import { Server, Socket } from "socket.io";

import { PresenceCache } from "../presence/presence.cache.js";

import { UserModel } from "../../models/user.model.js";

let io: Server | null = null;

export function initializeChatSocket(socketServer: Server, serverId: string) {
  io = socketServer;

  io.on("connection", async (socket: Socket) => {
    io = socketServer;
    const userId = socket.user.sub;

    // ------------------------------------------------
    // Personal room
    // ------------------------------------------------

    socket.join(`user:${userId}`);

    // ------------------------------------------------
    // Track which conversations this socket is viewing
    // ------------------------------------------------

    socket.data.viewingConversations = new Set<string>();

    // ------------------------------------------------
    // Presence
    // ------------------------------------------------

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

    // ------------------------------------------------
    // Presence heartbeat
    // ------------------------------------------------

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

    // ------------------------------------------------
    // JOIN CONVERSATION
    // ------------------------------------------------

    socket.on("join_conversation", async (conversationId: string) => {
      try {
        if (!conversationId) {
          return;
        }

        const isMember = await UserModel.isMember(conversationId, userId);

        if (!isMember) {
          return;
        }

        // If this user was viewing another
        // conversation, remove them from it.
        const previousConversation = Array.from(
          socket.data.viewingConversations ?? [],
        )[0];

        if (previousConversation && previousConversation !== conversationId) {
          await PresenceCache.removeConversationViewer(
            previousConversation,
            userId,
          );

          socket.leave(`conversation:${previousConversation}`);

          socket.data.viewingConversations.delete(previousConversation);
        }

        // Join Socket.IO room
        socket.join(`conversation:${conversationId}`);

        // Add user to Redis viewers
        await PresenceCache.addConversationViewer(conversationId, userId);

        socket.data.viewingConversations.add(conversationId);
      } catch (error) {
        console.error("Failed to join conversation:", error);
      }
    });

    // ------------------------------------------------
    // READ MESSAGE
    // ------------------------------------------------

    socket.on(
      "conversation:read_up_to",
      async ({ conversationId, lastReadSeq }) => {
        try {
          if (!conversationId || lastReadSeq == null) {
            return;
          }

          await UserModel.setLastReadSeq(conversationId, lastReadSeq, userId);
        } catch (error) {
          console.error("Failed to update last read seq:", error);
        }
      },
    );

    // ------------------------------------------------
    // LEAVE CONVERSATION
    // ------------------------------------------------

    socket.on("leave_conversation", async (conversationId: string) => {
      try {
        if (!conversationId) {
          return;
        }

        socket.leave(`conversation:${conversationId}`);

        await PresenceCache.removeConversationViewer(conversationId, userId);

        socket.data.viewingConversations.delete(conversationId);

        await UserModel.setLastSeenForChat(conversationId, userId); // It is clear up to this point.
      } catch (error) {
        console.error("Failed to leave conversation:", error);
      }
    });

    socket.on("message:delivered", async ({ messageId, conversationId }) => {
      const result = await UserModel.markDelivered(messageId, userId);

      if (!result) return;

      if (!io) {
        return;
      }

      io.to(`user:${userId}`).emit("message:delivered", {
        messageId,
        conversationId,
        receipt: result,
      });
    });

    socket.on("message:read", async ({ messageId, conversationId }) => {
      const result = await UserModel.markRead(messageId, userId);

      if (!result) return;

      if (!io) {
        return;
      }

      io.to(`user:${userId}`).emit("message:read", {
        messageId,
        conversationId,
        receipt: result,
      });
    });

    // ------------------------------------------------
    // DISCONNECT
    // ------------------------------------------------

    socket.on("disconnect", async () => {
      try {
        // Remove user from every conversation
        // this socket was viewing.
        const viewingConversations: string[] = Array.from(
          socket.data.viewingConversations ?? [],
        );

        for (const conversationId of viewingConversations) {
          await PresenceCache.removeConversationViewer(conversationId, userId);
        }

        // Remove socket connection
        const stillOnline = await PresenceCache.removeConnection(
          userId,
          socket.id,
        );

        // Only do offline logic when the
        // user has NO remaining connections.
        if (!stillOnline) {
          await UserModel.setLastSeen(userId);

          const conversationIds =
            await UserModel.getConversationIdsForUser(userId);

          for (const conversationId of conversationIds) {
            io?.to(`conversation:${conversationId}`).emit("presence:update", {
              userId,
              online: false,
              lastSeenAt: Date.now(),
            });
          }
        }
      } catch (error) {
        console.error("Failed to handle disconnect:", error);
      }
    });
  });
}

export async function emitNewMessage(
  conversationId: string,
  senderId: string,
  message: unknown,
) {
  if (!io) {
    return;
  }

  // -----------------------------------------
  // 1. Users currently viewing the conversation
  // -----------------------------------------

  io.to(`conversation:${conversationId}`).emit("new_message", {
    conversationId,
    message,
    senderId,
  });

  // -----------------------------------------
  // 2. Online members NOT viewing the chat
  // -----------------------------------------

  const recipients = await PresenceCache.getOnlineNonViewingMembers(
    conversationId,
    senderId,
  );

  // -----------------------------------------
  // 3. Send sidebar notification
  // -----------------------------------------

  for (const recipientId of recipients) {
    io.to(`user:${recipientId}`).emit("conversation:new_message", {
      conversationId,
      message,
    });
  }
}
