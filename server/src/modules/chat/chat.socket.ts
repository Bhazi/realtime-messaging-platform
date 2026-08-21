// import { Server } from "socket.io";

// export function registerChatSocket(io: Server) {
//   io.on("connection", (socket) => {
//     console.log("🔌 User connected:", socket.id);

//     socket.on("join_conversation", (conversationId: string) => {
//       const room = `conversation:${conversationId}`;

//       socket.join(room);

//       console.log(`👤 ${socket.id} joined ${room}`);
//     });

//     socket.on("leave_conversation", (conversationId: string) => {
//       const room = `conversation:${conversationId}`;

//       socket.leave(room);

//       console.log(`👤 ${socket.id} left ${room}`);
//     });

//     socket.on("disconnect", () => {
//       console.log("🔌 User disconnected:", socket.id);
//     });
//   });
// }

// let io: Server;

// export function initializeChatSocket(socketServer: Server) {
//   io = socketServer;

//   io.on("connection",...);
// }

// export function emitNewMessage(
//   conversationId: string,
//   message: Message
// ) {
//   io
//     .to(`conversation:${conversationId}`)
//     .emit("new_message", message);
// }

// import { Server } from "socket.io";

// let io: Server;

// export function initializeChatSocket(socketServer: Server) {
//   io = socketServer;

//   io.on("connection", (socket) => {
//     console.log("🔌 Socket connected:", socket.id);

//     socket.on("join_conversation", (conversationId: string) => {
//       const room = `conversation:${conversationId}`;

//       socket.join(room);

//       console.log(`🔌 ${socket.id} joined ${room}`);
//     });

//     socket.on("leave_conversation", (conversationId: string) => {
//       const room = `conversation:${conversationId}`;

//       socket.leave(room);

//       console.log(`🔌 ${socket.id} left ${room}`);
//     });

//     socket.on("disconnect", () => {
//       console.log("🔌 Socket disconnected:", socket.id);
//     });
//   });
// }

// export function emitNewMessage(conversationId: string, message: any) {
//   if (!io) {
//     console.warn("Socket.IO has not been initialized.");
//     return;
//   }

//   io.to(`conversation:${conversationId}`).emit("new_message", message);
// }

import { Server, Socket } from "socket.io";

let io: Server | null = null;

/*
 * =====================================================
 * INITIALIZE SOCKET.IO
 * =====================================================
 */

export function initializeChatSocket(socketServer: Server) {
  io = socketServer;

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    /*
     * ===============================================
     * JOIN CONVERSATION
     * ===============================================
     */

    socket.on("join_conversation", (conversationId: string) => {
      if (!conversationId) {
        return;
      }

      const room = `conversation:${conversationId}`;

      socket.join(room);

      console.log(`🔌 ${socket.id} joined ${room}`);
    });

    /*
     * ===============================================
     * LEAVE CONVERSATION
     * ===============================================
     */

    socket.on("leave_conversation", (conversationId: string) => {
      if (!conversationId) {
        return;
      }

      const room = `conversation:${conversationId}`;

      socket.leave(room);

      console.log(`🔌 ${socket.id} left ${room}`);
    });

    /*
     * ===============================================
     * DISCONNECT
     * ===============================================
     */

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id}`, reason);
    });
  });
}

/*
 * =====================================================
 * EMIT NEW MESSAGE
 * =====================================================
 *
 * This is called by ChatController after the
 * message has successfully been created in DB.
 */

export function emitNewMessage(conversationId: string, message: unknown) {
  if (!io) {
    console.warn("⚠️ Socket.IO has not been initialized.");

    return;
  }

  const room = `conversation:${conversationId}`;

  io.to(room).emit("new_message", message);

  console.log(`📨 new_message emitted to ${room}`);
}
