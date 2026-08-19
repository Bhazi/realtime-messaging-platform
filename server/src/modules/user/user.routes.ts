import { Router } from "express";
import { UserController } from "./user.controllers.js";
import { uploadAvatar, uploadGroupImage } from "../../middlewares/uploads.js";
import { uploadChatAttachment } from "../../middlewares/uploads.js";

const router = Router();

router.get("/", UserController.getUsers);

// GET user by primary key ID: /api/v1/user/id/123e4567-e89b-12d3-a456-426614174000
router.get("/id/:id", UserController.getUserById);

// GET user by public UID: /api/v1/user/uid/8KX4P92M
router.get("/uid/:uid", UserController.getUserByUid);

router.post("/profile/update", UserController.updateUserProfile);

router.post("/password/change", UserController.changePassword);

router.post(
  "/avatar",
  uploadAvatar.single("avatar"), // Expects formData field name to be 'avatar'
  UserController.updateAvatar,
);

// Delete / Dissolve Group Route
router.delete("/group/:conversationId", UserController.deleteGroupConversation);

// Update Group Member Role Route
router.patch(
  "/groups/:conversationId/members/role",
  UserController.updateGroupMemberRole,
);

// Remove user from group route
router.delete(
  "/groups/:conversationId/members/:targetUserId",
  UserController.removeUserFromGroup,
);

export default router;
