// server/src/services/user.service.ts
import { UserModel } from "../../models/user.model.js";
import UserRow from "../../types/types.js";

export class UserService {
  static async getAllUsers() {
    return await UserModel.findAll();
  }

  static async getUserById(id: string): Promise<UserRow | undefined> {
    return await UserModel.getUserById(id);
  }

  static async getUserByUid(uid: string): Promise<UserRow | undefined> {
    return await UserModel.getUserByUid(uid);
  }

  static async updateUserProfile(userId: string, updates: Record<string, any>) {
    if (!userId) {
      throw new Error("userId is required.");
    }

    return await UserModel.updateUserProfile(userId, updates);
  }

  static async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    if (!userId) {
      throw new Error("userId is required.");
    }
    if (!oldPassword || !newPassword) {
      throw new Error("Both old and new passwords are required.");
    }
    if (oldPassword === newPassword) {
      throw new Error("New password must be different from old password.");
    }

    return await UserModel.changePassword(userId, oldPassword, newPassword);
  }

  static async updateAvatar(userId: string, avatarUrl: string) {
    return await UserModel.updateAvatarUrl(userId, avatarUrl);
  }

  static async deleteGroupConversation(conversationId: string, userId: string) {
    if (!conversationId || !userId) {
      throw new Error("conversationId and userId are required.");
    }

    return await UserModel.deleteGroupConversation(conversationId, userId);
  }

  static async updateGroupMemberRole(
    conversationId: string,
    actorUserId: string,
    targetUserId: string,
    newRole: string,
  ) {
    if (!conversationId || !actorUserId || !targetUserId || !newRole) {
      throw new Error(
        "conversationId, actorUserId, targetUserId, and newRole are required.",
      );
    }

    // Optional validation for accepted enums if applicable
    const validRoles = ["ADMIN", "MEMBER"];
    if (!validRoles.includes(newRole)) {
      throw new Error("Invalid role specified.");
    }

    return await UserModel.updateGroupMemberRole(
      conversationId,
      actorUserId,
      targetUserId,
      newRole,
    );
  }

  static async removeUserFromGroup(
    conversationId: string,
    actorUserId: string,
    targetUserId: string,
  ) {
    if (!conversationId || !actorUserId || !targetUserId) {
      throw new Error(
        "conversationId, actorUserId, and targetUserId are required.",
      );
    }

    if (actorUserId === targetUserId) {
      throw new Error("Use the leave group endpoint to remove yourself.");
    }

    return await UserModel.removeUserFromGroup(
      conversationId,
      actorUserId,
      targetUserId,
    );
  }
}
