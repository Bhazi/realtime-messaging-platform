import { Router } from "express";
import { UserController } from "./user.controllers.js";
import { uploadAvatar } from "../../middlewares/uploads.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

// Add user to group endpoint
router.post("/group/add-user", authMiddleware, UserController.addUserToGroup);

router.post("/password/change", authMiddleware, UserController.changePassword);

// Delete / Dissolve Group Route
router.delete(
  "/group/:conversationId",
  authMiddleware,
  UserController.deleteGroupConversation,
);

// Delete / Dissolve Group Route
router.delete(
  "/direct/:conversationId",
  authMiddleware,
  UserController.deleteDirectConversation,
);

router.get("/", authMiddleware, UserController.getUsers);

// GET user by primary key ID: /api/v1/user/id/123e4567-e89b-12d3-a456-426614174000
router.get("/id/:id", authMiddleware, UserController.getUserById);

// GET user by public UID: /api/v1/user/uid/8KX4P92M
router.get("/uid/:uid", authMiddleware, UserController.getUserByUid);

router.get("/me", authMiddleware, UserController.me);

// Remove user from group route
router.delete(
  "/groups/:conversationId/members/:targetUserId",
  authMiddleware,
  UserController.removeUserFromGroup,
);

router.post(
  "/profile/avatar",
  authMiddleware,
  uploadAvatar.single("avatar"), // Expects formData field name to be 'avatar'
  UserController.updateAvatar,
);

// Update Group Member Role Route
router.patch(
  "/groups/:conversationId/members/role",
  authMiddleware,
  UserController.updateGroupMemberRole,
);

router.post(
  "/profile/update",
  authMiddleware,
  UserController.updateUserProfile,
);

export default router;
