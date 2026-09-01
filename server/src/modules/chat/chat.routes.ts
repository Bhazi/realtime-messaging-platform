import { Router } from "express";
import { ChatController } from "./chat.controllers.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  uploadGroupImage,
  uploadChatAttachment,
} from "../../middlewares/uploads.js";

const router = Router();

// Endpoint: POST /api/chat/direct
router.post("/direct", authMiddleware, ChatController.createDirectConversation);

router.post(
  "/group",
  authMiddleware,
  uploadGroupImage.single("groupImage"),
  ChatController.createGroupConversation,
);

// Soft-delete message route
router.delete(
  "/messages/:messageId",
  authMiddleware,
  ChatController.deleteMessage,
);

router.get(`/conversations`, authMiddleware, ChatController.getConversations);

router.get(
  "/conversations/:conversationId/messages",
  authMiddleware,
  ChatController.getMessages,
);

// Endpoint accepting JSON body { conversationId: "..." }
router.post("/messages", authMiddleware, ChatController.getMessages);

// GET endpoint with no required parameters or body
router.get("/messages/all", authMiddleware, ChatController.getAllMessages);

// Send message endpoint
router.post(
  "/send",
  authMiddleware,
  uploadChatAttachment.single("file"), // Middleware processes 'file' field in FormData
  ChatController.sendMessage,
);

export default router;
