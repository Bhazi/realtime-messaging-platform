import { Request, Response } from "express";
import { ChatService } from "./chat.services.js";
import { emitNewMessage } from "./chat.socket.js";

export class ChatController {
  static async createDirectConversation(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { targetUid } = req.body;
      const currentUserId = (req as any).user?.id || req.body.currentUserId;

      if (!currentUserId) {
        res.status(401).json({ error: "Unauthorized: User ID is required." });
        return;
      }

      if (!targetUid) {
        res.status(400).json({ error: "targetUid is required." });
        return;
      }

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

  static async getConversations(req: Request, res: Response): Promise<void> {
    try {
      let currentUserId = (req as any).user?.id || req.query.id;

      if (!currentUserId) {
        res.status(401).json({ error: "Unauthorized: User ID is required." });
        return;
      }

      const conversations = await ChatService.getConversations(
        currentUserId as string,
      );

      res.status(200).json(conversations);
    } catch (err: any) {
      console.log("reached the error ", err);

      res
        .status(500)
        .json({ error: err.message || "Failed to fetch conversations." });
    }
  }

  static async createGroupConversation(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const {
        groupName: name,
        addedUids: bodyMemberUids,
        userId: bodyUserId,
      } = req.body;

      const currentUserId = (req as any).user?.id || bodyUserId;

      if (!currentUserId) {
        res.status(401).json({
          error: "Unauthorized: currentUserId is required.",
        });
        return;
      }

      if (!name || typeof name !== "string") {
        res.status(400).json({
          error: "Group name is required.",
        });
        return;
      }

      let memberUids: string[] = [];

      if (bodyMemberUids) {
        try {
          memberUids =
            typeof bodyMemberUids === "string"
              ? JSON.parse(bodyMemberUids)
              : bodyMemberUids;
        } catch {
          res.status(400).json({
            error: "Invalid memberUids format.",
          });
          return;
        }
      }

      // Make sure it is actually an array
      if (!Array.isArray(memberUids)) {
        res.status(400).json({
          error: "memberUids must be an array.",
        });
        return;
      }

      const file = req.file;

      let avatarUrl: string | null = null;

      if (file) {
        avatarUrl = `/uploads/group-images/${file.filename}`;
      }

      const conversation = await ChatService.createGroupConversation(
        currentUserId,
        name,
        memberUids,
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

  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const {
        conversationId,
        senderId: bodySenderId,
        type,
        content,
      } = req.body;

      const senderId = (req as any).user?.id || bodySenderId;
      const file = req.file;

      if (!senderId) {
        res.status(401).json({
          error: "Unauthorized: senderId is required.",
        });
        return;
      }

      if (!conversationId) {
        res.status(400).json({
          error: "conversationId is required.",
        });
        return;
      }

      const message = await ChatService.sendMessage(
        conversationId,
        senderId,
        type,
        content,
        file,
      );

      // Notify everyone in this conversation
      emitNewMessage(conversationId, message);

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

  static async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params as { conversationId: string };

      const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

      const cursorParam = req.query.cursor as string | undefined;

      let cursor;

      if (cursorParam) {
        try {
          cursor = JSON.parse(
            Buffer.from(cursorParam, "base64").toString("utf8"),
          );
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

  static async getAllMessages(_req: Request, res: Response): Promise<void> {
    try {
      const messages = await ChatService.getAllMessages();
      res.status(200).json(messages);
    } catch (err: any) {
      res.status(500).json({
        error: err.message || "Failed to fetch all messages.",
      });
    }
  }

  static async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params as { messageId: string };
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({ error: "userId is required." });
        return;
      }

      const success = await ChatService.deleteMessage(messageId, userId);

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
}
