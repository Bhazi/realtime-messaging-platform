import { Router } from "express";

import { ChatController } from "./chat.controllers.js";

import { authMiddleware } from "../../middlewares/auth.middleware.js";

import {
  createDirectConversationBodySchema,
  createGroupConversationBodySchema,
  deleteMessageParamsSchema,
  getMessagesParamsSchema,
  getMessagesQuerySchema,
  sendMessageParamsSchema,
  sendMessageBodySchema,
} from "./chat.schema.js";

import {
  uploadGroupImage,
  uploadChatAttachment,
} from "../../middlewares/uploads.js";
import { validate } from "../../middlewares/validate.js";

const router = Router();

// Endpoint: POST /api/chat/direct
router.post(
  "/direct",
  authMiddleware,
  validate(createDirectConversationBodySchema),
  ChatController.createDirectConversation,
);

router.post(
  "/group",
  authMiddleware,
  uploadGroupImage.single("groupImage"),
  validate(createGroupConversationBodySchema),
  ChatController.createGroupConversation,
);

// Soft-delete message route
router.delete(
  "/messages/:messageId",
  authMiddleware,
  validate(deleteMessageParamsSchema, "params"),
  ChatController.deleteMessage,
);

router.get(`/conversations`, authMiddleware, ChatController.getConversations);

router.get(
  "/conversations/:conversationId/messages",
  authMiddleware,
  validate(getMessagesParamsSchema, "params"),
  validate(getMessagesQuerySchema, "query"),
  ChatController.getMessages,
);

// Send message endpoint
router.post(
  "/conversations/:conversationId/messages",
  authMiddleware,
  uploadChatAttachment.single("file"), // Middleware processes 'file' field in FormData
  validate(sendMessageParamsSchema, "params"),
  validate(sendMessageBodySchema),
  ChatController.sendMessage,
);

export default router;
