// server/src/services/user.service.ts
import { UserModel } from "../../models/user.model.js";
import UserRow from "../../types/types.js";

import { UserCache } from "../user/user.cache.js";

import { PresenceCache } from "../presence/presence.cache.js";

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

    const user: UserRow = await UserModel.updateUserProfile(userId, updates);

    UserCache.updateUser(user);

    return user;
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
    const user: UserRow = await UserModel.updateAvatarUrl(userId, avatarUrl);

    UserCache.updateUser(user);

    return user;
  }

  static async deleteGroupConversation(conversationId: string, userId: string) {
    if (!conversationId || !userId) {
      throw new Error("conversationId and userId are required.");
    }

    return await UserModel.deleteGroupConversation(conversationId, userId);
  }

  static async deleteDirectConversation(
    conversationId: string,
    userId: string,
  ) {
    if (!conversationId || !userId) {
      throw new Error("conversationId and userId are required.");
    }

    return await UserModel.deleteDirectConversation(conversationId, userId);
  }

  static async addUserToGroup(
    conversationId: string,
    currentUserId: string,
    targetUserUid: string,
  ) {
    if (!conversationId) {
      throw new Error("conversationId is required.");
    }

    if (!currentUserId) {
      throw new Error("currentUserId is required.");
    }

    if (!targetUserUid) {
      throw new Error("targetUserUid is required.");
    }

    const dbResult = await UserModel.addUserToGroup(
      conversationId,
      currentUserId,
      targetUserUid,
    );

    await PresenceCache.addConversationMember(conversationId, targetUserUid);

    return dbResult;
  }

  static async updateGroupMemberRole(
    conversationId: string,
    currentUserId: string,
    targetUserId: string,
    newRole: string,
  ) {
    if (!conversationId || !currentUserId || !targetUserId || !newRole) {
      throw new Error(
        "conversationId, currentUserId, targetUserId, and newRole are required.",
      );
    }

    // Optional validation for accepted enums if applicable
    const validRoles = ["ADMIN", "MEMBER"];
    if (!validRoles.includes(newRole)) {
      throw new Error("Invalid role specified.");
    }

    return await UserModel.updateGroupMemberRole(
      conversationId,
      currentUserId,
      targetUserId,
      newRole,
    );
  }

  static async removeUserFromGroup(
    conversationId: string,
    currentUserId: string,
    targetUserId: string,
  ) {
    if (!conversationId || !currentUserId || !targetUserId) {
      throw new Error(
        "conversationId, currentUserId, and targetUserId are required.",
      );
    }

    if (currentUserId === targetUserId) {
      throw new Error("Use the leave group endpoint to remove yourself.");
    }

    const dbResult = await UserModel.removeUserFromGroup(
      conversationId,
      currentUserId,
      targetUserId,
    );

    await PresenceCache.removeConversationMember(conversationId, targetUserId);

    return dbResult;
  }

  static async getUser(userId: string) {
    // 1. Check Redis first
    const cachedUserResult = await UserCache.getUser(userId);

    if (cachedUserResult) {
      return cachedUserResult;
    }

    // 2. Redis miss → check database
    const user = await this.getUserById(userId);

    if (!user) {
      return null;
    }

    // 3. Database hit → populate Redis
    await UserCache.setUser(user, 60 * 60);

    // 4. Return user
    return user;
  }
}
