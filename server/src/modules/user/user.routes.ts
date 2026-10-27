import { Router } from "express";

import { UserController } from "./user.controllers.js";

import { uploadAvatar } from "../../middlewares/uploads.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";

import {
  addUserToGroupBodySchema,
  changePasswordBodySchema,
  conversationIdParamsSchema,
  getUserByIdParamsSchema,
  getUserByUidParamsSchema,
  removeUserFromGroupParamsSchema,
  updateGroupMemberRoleParamsSchema,
  updateGroupMemberRoleBodySchema,
  updateUserProfileBodySchema,
} from "./user.schema.js";

const router = Router();

// Add user to group endpoint
router.post(
  "/group/add-user",
  authMiddleware,
  validate(addUserToGroupBodySchema),
  UserController.addUserToGroup,
);

router.post(
  "/password/change",
  authMiddleware,
  validate(changePasswordBodySchema),
  UserController.changePassword,
);

// Delete / Dissolve Group Route
router.delete(
  "/group/:conversationId",
  authMiddleware,
  validate(conversationIdParamsSchema, "params"),
  UserController.deleteGroupConversation,
);

// Delete / Dissolve Group Route
router.delete(
  "/direct/:conversationId",
  authMiddleware,
  validate(conversationIdParamsSchema, "params"),
  UserController.deleteDirectConversation,
);

router.get("/", authMiddleware, UserController.getUsers);

// GET user by primary key ID: /api/v1/user/id/123e4567-e89b-12d3-a456-426614174000
router.get(
  "/id/:id",
  authMiddleware,
  validate(getUserByIdParamsSchema, "params"),
  UserController.getUserById,
);

// GET user by public UID: /api/v1/user/uid/8KX4P92M
router.get(
  "/uid/:uid",
  authMiddleware,
  validate(getUserByUidParamsSchema, "params"),
  UserController.getUserByUid,
);

router.get("/me", authMiddleware, UserController.me);

// Remove user from group route
router.delete(
  "/groups/:conversationId/members/:targetUserId",
  authMiddleware,
  validate(removeUserFromGroupParamsSchema, "params"),
  UserController.removeUserFromGroup,
);

router.post(
  "/profile/avatar",
  authMiddleware,
  uploadAvatar.single("avatar"), // Expects formData field name to be 'avatar'
  UserController.updateAvatar,
);

router.patch(
  "/groups/:conversationId/members/role",
  authMiddleware,
  validate(updateGroupMemberRoleParamsSchema, "params"),
  validate(updateGroupMemberRoleBodySchema),
  UserController.updateGroupMemberRole,
);

router.post(
  "/profile/update",
  authMiddleware,
  validate(updateUserProfileBodySchema),
  UserController.updateUserProfile,
);

export default router;
