// import { Request, Response } from "express";
// import { ChatService } from "./chat.services.js";

// export class ChatController {
//   static async createDirectConversation(req: Request, res: Response): Promise {
//     try {
//       const { targetUid } = req.body;
//       // Extract logged-in user ID from JWT middleware (or request body during local testing)
//       const currentUserId = (req as any).user?.id || req.body.currentUserId;

//       console.log(currentUserId, "current", targetUid, "targetUID");

//       if (!targetUid) {
//         res.status(400).json({ error: "targetUid is required." });
//         return;
//       }

//       const conversation = await ChatService.createDirectConversation(
//         currentUserId,
//         targetUid,
//       );

//       res.status(200).json({
//         message: "Conversation ready",
//         conversation: {
//           id: conversation.id,
//           type: conversation.type,
//           createdBy: conversation.created_by,
//           createdAt: conversation.created_at,
//           updatedAt: conversation.updated_at,
//           members: conversation.members.map((m) => ({
//             conversationId: m.conversation_id,
//             userId: m.user_id,
//             role: m.role,
//             joinedAt: m.joined_at,
//             hiddenAt: m.hidden_at,
//           })),
//         },
//       });
//     } catch (err: any) {
//       res
//         .status(400)
//         .json({ error: err.message || "Failed to create conversation." });
//     }
//   }
// }

import { Request, Response } from "express";
import { ChatService } from "./chat.services.js";

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
      const { name, memberUids, currentUserId: bodyUserId } = req.body;
      const currentUserId = (req as any).user?.id || bodyUserId;

      if (!currentUserId) {
        res
          .status(401)
          .json({ error: "Unauthorized: currentUserId is required." });
        return;
      }

      if (!name || typeof name !== "string") {
        res.status(400).json({ error: "Group name is required." });
        return;
      }

      const conversation = await ChatService.createGroupConversation(
        currentUserId,
        name,
        memberUids || [],
      );

      res.status(201).json({
        message: "Group conversation created successfully.",
        conversation,
      });
    } catch (err: any) {
      res.status(400).json({
        error: err.message || "Failed to create group conversation.",
      });
    }
  }

  static async getMessages(req: Request, res: Response): Promise<void> {
    try {
      // Allow passing conversationId via body or query param
      const { conversationId } = req.body;
      const targetConvId =
        conversationId || (req.query.conversationId as string);

      if (!targetConvId) {
        res.status(400).json({ error: "conversationId is required." });
        return;
      }

      const messages = await ChatService.getMessages(targetConvId);

      res.status(200).json(messages);
    } catch (err: any) {
      res.status(500).json({
        error: err.message || "Failed to fetch messages.",
      });
    }
  }

  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId, senderId: bodySenderId, type, data } = req.body;
      const senderId = (req as any).user?.id || bodySenderId;

      if (!senderId) {
        res.status(401).json({ error: "Unauthorized: senderId is required." });
        return;
      }

      if (!conversationId) {
        res.status(400).json({ error: "conversationId is required." });
        return;
      }

      const message = await ChatService.sendMessage(
        conversationId,
        senderId,
        type,
        data || {},
      );

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
}
