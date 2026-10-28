// server/src/controllers/user.controller.ts
import { Request, Response } from "express";

import { UserService } from "./user.services.js";

export class UserController {
  static async addUserToGroup(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId, targetUid } = req.body;

      const currentUserId = req.auth.userId;

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

  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { oldPassword, newPassword } = req.body;

      const userId = req.auth.userId;

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

  /**
   * DELETE /api/v1/chat/group/:conversationId
   */
  static async deleteGroupConversation(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { conversationId } = req.params as { conversationId: string };

      const currentUserId = req.auth.userId;

      const result = await UserService.deleteGroupConversation(
        conversationId,
        currentUserId,
      );

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
   * DELETE /api/v1/chat/direct/:conversationId
   */
  static async deleteDirectConversation(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { conversationId } = req.params as {
        conversationId: string;
      };

      const currentUserId = req.auth.userId;

      const result = await UserService.deleteDirectConversation(
        conversationId,
        currentUserId,
      );

      res.status(200).json({
        message: result.message,
        data: result,
      });
    } catch (err: any) {
      let statusCode = 400;

      if (err.message?.includes("not found")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: err.message || "Failed to delete direct chat.",
      });
    }
  }

  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await UserService.getAllUsers();

      res.status(200).json({ users });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch users." });
    }
  }

  /**
   * GET /api/v1/user/id/:id
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };

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

  static async me(req: Request, res: Response): Promise<void> {
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
   * DELETE /api/v1/chat/groups/:conversationId/members/:targetUserId
   */
  static async removeUserFromGroup(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId, targetUserId } = req.params as {
        conversationId: string;
        targetUserId: string;
      };

      const currentUserId = req.auth.userId;

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

  static async updateAvatar(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.auth.userId;

      const file = req.file;

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
   * PATCH /api/v1/chat/groups/:conversationId/members/role
   */
  static async updateGroupMemberRole(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { conversationId } = req.params as { conversationId: string };

      const { targetUserId, newRole } = req.body;

      const currentUserId = req.auth.userId;

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

  static async updateUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.auth.userId;

      const { updates } = req.body;

      const updatedUser = await UserService.updateUserProfile(userId, updates);

      res.status(200).json({
        message: "User profile updated successfully.",
        user: updatedUser,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update user profile.";

      let statusCode = 400;

      if (message === "User not found") {
        statusCode = 404;
      } else if (message === "Username already exists") {
        statusCode = 409;
      }

      res.status(statusCode).json({
        error: message,
      });
    }
  }
}
