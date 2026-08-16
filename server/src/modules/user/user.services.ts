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
}
