import { Request, Response } from "express";
import { ChatService } from "./chat.services.js";
import { emitNewMessage } from "./chat.socket.js";

import { messageCursorSchema } from "./chat.schema.js";

export class ChatController {
  static async createDirectConversation(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { targetUid } = req.body;

      const currentUserId = req.auth.userId;

      const conversation = await ChatService.createDirectConversation(
        currentUserId,
        targetUid,
      );

      // Return conversation directly (keys already match React's Conversation interface)
      res.status(200).json({
        message: "Conversation ready",
        conversation,
      });
    } catch (err: any) {
      res
        .status(400)
        .json({ error: err.message || "Failed to create conversation." });
    }
  }

  static async createGroupConversation(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const currentUserId = req.auth.userId;

      // Already validated and transformed by Zod middleware
      const { groupName, addedUids } = req.body;

      const avatarUrl = req.file
        ? `/uploads/group-images/${req.file.filename}`
        : null;

      const conversation = await ChatService.createGroupConversation(
        currentUserId,
        groupName,
        addedUids,
        avatarUrl,
      );

      res.status(201).json({
        message: "Group conversation created successfully.",
        conversation,
      });
    } catch (err: any) {
      console.error("Create group conversation error:", err);

      res.status(400).json({
        error: err.message || "Failed to create group conversation.",
      });
    }
  }

  static async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params as { messageId: string };

      const currentUserId = req.auth?.userId;

      if (!currentUserId) {
        res.status(401).json({
          success: false,
          error: "Authentication required.",
        });
        return;
      }

      const success = await ChatService.deleteMessage(messageId, currentUserId);

      res.status(200).json({
        success,
        message: "Message deleted successfully.",
      });
    } catch (err: any) {
      let statusCode = 400;
      if (err.message.includes("Permission denied")) {
        statusCode = 403;
      } else if (err.message.includes("not found")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: err.message || "Failed to delete message.",
      });
    }
  }

  static async getConversations(req: Request, res: Response): Promise<void> {
    try {
      const currentUserId = req.auth.userId;

      const conversations = await ChatService.getConversations(currentUserId);

      res.status(200).json(conversations);
    } catch (err: any) {
      console.error("reached the error ", err);

      res
        .status(500)
        .json({ error: err.message || "Failed to fetch conversations." });
    }
  }

  static async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params as { conversationId: string };

      const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

      const cursorParam =
        typeof req.query.cursor === "string" ? req.query.cursor : undefined;

      let cursor;

      if (cursorParam) {
        try {
          const decoded: unknown = JSON.parse(
            Buffer.from(cursorParam, "base64").toString("utf8"),
          );

          const parsed = messageCursorSchema.safeParse(decoded);

          if (!parsed.success) {
            res.status(400).json({ error: "Invalid cursor." });
            return;
          }

          cursor = parsed.data;
        } catch {
          res.status(400).json({
            error: "Invalid cursor.",
          });
          return;
        }
      }

      const result = await ChatService.getMessages(
        conversationId,
        limit,
        cursor,
      );

      const nextCursor = result.nextCursor
        ? Buffer.from(JSON.stringify(result.nextCursor)).toString("base64")
        : null;

      res.status(200).json({
        messages: result.messages,
        nextCursor,
        hasMore: result.hasMore,
      });
    } catch (err: any) {
      res.status(500).json({
        error: err.message || "Failed to fetch messages.",
      });
    }
  }

  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params as { conversationId: string };
      const { type, content } = req.body as {
        type: string;
        content: string;
      };
      const senderId = req.auth.userId;
      const file = req.file;

      const message = await ChatService.sendMessage(
        conversationId,
        senderId,
        type,
        content,
        file,
      );

      // Notify everyone in this conversation
      emitNewMessage(conversationId, senderId, message);

      // Normal REST response to the sender
      res.status(201).json({
        message: "Message sent successfully",
        data: message,
      });
    } catch (err: any) {
      res.status(400).json({
        error: err.message || "Failed to send message.",
      });
    }
  }
}
