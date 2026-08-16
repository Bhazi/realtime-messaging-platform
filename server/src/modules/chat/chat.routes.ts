import { Router } from "express";
import { ChatController } from "./chat.controllers.js";
// import { authMiddleware } from '../middleware/auth.middleware'; // Optional JWT verification

const router = Router();

// Endpoint: POST /api/chat/direct
router.post("/direct", ChatController.createDirectConversation);

router.get(`/conversations`, ChatController.getConversations);

router.post("/group", ChatController.createGroupConversation);

// Endpoint accepting JSON body { conversationId: "..." }
router.post("/messages", ChatController.getMessages);

// Send message endpoint
router.post("/send", ChatController.sendMessage);

// GET endpoint with no required parameters or body
router.get("/messages/all", ChatController.getAllMessages);

export default router;
