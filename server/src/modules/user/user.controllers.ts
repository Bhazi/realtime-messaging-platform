// server/src/controllers/user.controller.ts
import { Request, Response } from "express";
import { UserService } from "./user.services.js";

import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";

export class UserController {
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await UserService.getAllUsers();

      res.status(200).json({ users });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch users." });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.auth;

      const user = await UserService.getUser(userId);

      if (!user) {
        res.status(404).json({
          message: "User not found.",
        });
        return;
      }

      res.status(200).json({
        user,
      });
    } catch (error) {
      console.error("UserController.me error:", error);

      res.status(500).json({
        message: "Internal server error.",
      });
    }
  }

  /**
   * GET /api/v1/user/id/:id
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };

      if (!id) {
        res.status(400).json({ error: "User ID parameter is required." });
        return;
      }

      const user = await UserService.getUserById(id);

      if (!user) {
        res.status(404).json({ error: "User not found." });
        return;
      }

      res.status(200).json({ data: user });
    } catch (err: any) {
      res
        .status(500)
        .json({ error: err.message || "Failed to fetch user by ID." });
    }
  }

  /**
   * GET /api/v1/user/uid/:uid
   */
  static async getUserByUid(req: Request, res: Response): Promise<void> {
    try {
      const { uid } = req.params as { uid: string };

      if (!uid) {
        res.status(400).json({ error: "Public UID parameter is required." });
        return;
      }

      const user = await UserService.getUserByUid(uid);

      if (!user) {
        res.status(404).json({ error: "User not found." });
        return;
      }

      res.status(200).json({ data: user });
    } catch (err: any) {
      res
        .status(500)
        .json({ error: err.message || "Failed to fetch user by UID." });
    }
  }

  static async updateUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.body.userId;
      const updates = req.body.updates;

      if (!userId) {
        res.status(401).json({ error: "userId is required in request body." });
        return;
      }

      if (!updates || typeof updates !== "object") {
        res.status(400).json({ error: "updates object is required." });
        return;
      }

      const updatedUser = await UserService.updateUserProfile(userId, updates);

      res.status(200).json({
        message: "User profile updated successfully.",
        user: updatedUser,
      });
    } catch (err: any) {
      const statusCode = err.message === "User not found" ? 404 : 400;
      res.status(statusCode).json({
        error: err.message || "Failed to update user profile.",
      });
    }
  }

  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { userId: bodyUserId, oldPassword, newPassword } = req.body;
      const userId = (req as any).user?.id || bodyUserId;

      if (!userId) {
        res.status(400).json({ success: false, error: "userId is required." });
        return;
      }

      await UserService.changePassword(userId, oldPassword, newPassword);

      res.status(200).json({
        success: true,
        message: "Password changed successfully.",
      });
    } catch (err: any) {
      const isPasswordError = err.message === "Incorrect old password.";
      const statusCode = isPasswordError ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: err.message || "Failed to change password.",
      });
    }
  }

  static async updateAvatar(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;
      const { userId: bodyUserId } = req.body;
      const userId = (req as any).user?.id || bodyUserId;

      if (!userId) {
        res.status(400).json({ error: "userId is required in formData." });
        return;
      }

      if (!file) {
        res.status(400).json({ error: "No image file provided in request." });
        return;
      }

      // Construct accessible image URL path
      const avatarUrl = `/uploads/avatars/${file.filename}`;

      const updatedUser = await UserService.updateAvatar(userId, avatarUrl);

      res.status(200).json({
        message: "Avatar updated successfully.",
        user: updatedUser,
      });
    } catch (err: any) {
      const statusCode = err.message === "User not found." ? 404 : 400;
      res.status(statusCode).json({
        error: err.message || "Failed to update avatar.",
      });
    }
  }

  /**
   * DELETE /api/v1/chat/group/:conversationId
   */
  static async deleteGroupConversation(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { conversationId } = req.params;
      const currentUserId = (req as any).user?.id || req.body?.currentUserId;

      if (!currentUserId) {
        res.status(400).json({ error: "currentUserId is required." });
        return;
      }

      const result = await UserService.deleteGroupConversation(
        conversationId,
        currentUserId,
      );

      // Socket event emission if real-time notifications are enabled
      // if (result.dissolved) {
      //   io.to(conversationId).emit("group_dissolved", { conversationId });
      // }

      res.status(200).json({
        message: result.message,
        data: result,
      });
    } catch (err: any) {
      let statusCode = 400;
      if (err.message.includes("not found")) statusCode = 404;

      res
        .status(statusCode)
        .json({ error: err.message || "Failed to delete group." });
    }
  }

  /**
   * PATCH /api/v1/chat/groups/:conversationId/members/role
   */
  static async updateGroupMemberRole(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { currentUserId, targetUserId, newRole } = req.body;

      // Alternatively, extract currentUserId from authenticated session/JWT middleware:
      // const currentUserId = (req as any).user?.id;

      const updatedMember = await UserService.updateGroupMemberRole(
        conversationId,
        currentUserId,
        targetUserId,
        newRole,
      );

      res.status(200).json({
        message: `Role updated to ${newRole} successfully.`,
        data: updatedMember,
      });
    } catch (err: any) {
      let statusCode = 400;
      if (err.message.includes("owner")) statusCode = 403;
      if (err.message.includes("not found")) statusCode = 404;

      res
        .status(statusCode)
        .json({ error: err.message || "Failed to update role." });
    }
  }

  static async addUserToGroup(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId, currentUserId: bodyUserId, targetUid } = req.body;
      const currentUserId = (req as any).user?.id || bodyUserId;

      if (!currentUserId) {
        res.status(400).json({ error: "currentUserId is required." });
        return;
      }

      const result = await UserService.addUserToGroup(
        conversationId,
        currentUserId,
        targetUid,
      );

      res.status(200).json({
        message: "User successfully added to group.",
        data: result,
      });
    } catch (err: any) {
      const msg = err.message || "Failed to add user to group.";
      let statusCode = 400;

      if (msg.includes("does not exist")) statusCode = 404;
      if (msg.includes("Conversation not found")) statusCode = 404;
      if (msg.includes("Only admins or owners")) statusCode = 403;

      res.status(statusCode).json({ error: msg });
    }
  }

  /**
   * DELETE /api/v1/chat/groups/:conversationId/members/:targetUserId
   */
  static async removeUserFromGroup(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId, targetUserId } = req.params;
      const { currentUserId } = req.body;

      // Alternatively, extract currentUserId from authenticated request context:
      // const currentUserId = (req as any).user?.id;

      const removedMember = await UserService.removeUserFromGroup(
        conversationId,
        currentUserId,
        targetUserId,
      );

      res.status(200).json({
        message: "User removed from group successfully.",
        data: removedMember,
      });
    } catch (err: any) {
      let statusCode = 400;
      if (
        err.message.includes("admins or owners") ||
        err.message.includes("cannot remove")
      ) {
        statusCode = 403;
      }
      if (err.message.includes("not found")) {
        statusCode = 404;
      }

      res
        .status(statusCode)
        .json({ error: err.message || "Failed to remove member." });
    }
  }
}
