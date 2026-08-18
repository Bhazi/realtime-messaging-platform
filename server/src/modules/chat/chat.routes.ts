import { Router } from "express";
import { ChatController } from "./chat.controllers.js";
// import { authMiddleware } from '../middleware/auth.middleware'; // Optional JWT verification
import { uploadGroupImage } from "../../middlewares/uploads.js";

const router = Router();

// Endpoint: POST /api/chat/direct
router.post("/direct", ChatController.createDirectConversation);

router.get(`/conversations`, ChatController.getConversations);

// router.post("/group", ChatController.createGroupConversation);

router.post(
  "/group",
  uploadGroupImage.single("groupImage"),
  ChatController.createGroupConversation,
);

// Endpoint accepting JSON body { conversationId: "..." }
router.post("/messages", ChatController.getMessages);

// Send message endpoint
router.post("/send", ChatController.sendMessage);

// GET endpoint with no required parameters or body
router.get("/messages/all", ChatController.getAllMessages);

// Add user to group endpoint
router.post("/group/add-user", ChatController.addUserToGroup);

// Soft-delete message route
router.delete("/messages/:messageId", ChatController.deleteMessage);

export default router;
