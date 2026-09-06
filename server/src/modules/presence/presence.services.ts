import { PresenceCache } from "./presence.cache.js";

import { UserModel } from "../../models/user.model.js";

export class PresenceService {
  static async isParticipantOnline(targetId: string) {
    try {
      const isOnline = await PresenceCache.isOnline(targetId);

      if (isOnline) {
        return {
          userId: targetId,
          online: true,
          lastSeenAt: null,
        };
      }

      const lastSeenAt = await UserModel.getLastSeen(targetId);

      return {
        userId: targetId,
        online: false,
        lastSeenAt,
      };
    } catch (error) {
      console.error("Error checking user presence:", error);

      throw error;
    }
  }

  static async onlineParticipantsIds(userIds: string[]): Promise<string[]> {
    const onlineUsers = await PresenceCache.getOnlineUsers(userIds);

    return Object.keys(onlineUsers).filter((key) => onlineUsers[key] === true);
  }
}
