import { Server, Socket } from "socket.io";

let io: Server | null = null;

export function initializeChatSocket(socketServer: Server) {
  io = socketServer;

  io.on("connection", (socket: Socket) => {
    socket.on("join_conversation", (conversationId: string) => {
      if (!conversationId) {
        return;
      }

      const room = `conversation:${conversationId}`;

      socket.join(room);
    });

    socket.on("leave_conversation", (conversationId: string) => {
      if (!conversationId) {
        return;
      }

      const room = `conversation:${conversationId}`;

      socket.leave(room);
    });

    socket.on("disconnect", (reason) => {});
  });
}

export function emitNewMessage(conversationId: string, message: unknown) {
  if (!io) {
    return;
  }

  const room = `conversation:${conversationId}`;

  io.to(room).emit("new_message", message);
}
