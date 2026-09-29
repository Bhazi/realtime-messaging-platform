import { redis } from "../../config/redis.js";
import { UserModel } from "../../models/user.model.js";

export class PresenceCache {
  private static readonly TTL_SECONDS = 6000000;

  private static readonly ONLINE_KEY = "presence:online";

  private static getConnectionsKey(userId: string): string {
    return `user:${userId}:connections`;
  }

  private static getConnectionKey(connectionId: string): string {
    return `presence:connection:${connectionId}`;
  }

  private static getConversationMembersKey(conversationId: string): string {
    return `conversation:${conversationId}:members`;
  }

  private static getConversationViewersKey(conversationId: string): string {
    return `conversation:${conversationId}:viewers`;
  }

  // =========================================================
  // ONLINE
  // =========================================================

  static async setOnline(
    userId: string,
    connectionId: string,
    serverId: string,
    ttlSeconds = this.TTL_SECONDS,
  ): Promise<void> {
    const connectionsKey = this.getConnectionsKey(userId);

    const connectionKey = this.getConnectionKey(connectionId);

    await redis
      .multi()
      .hSet(connectionsKey, connectionId, serverId)
      .set(connectionKey, serverId, {
        EX: ttlSeconds,
      })
      .sAdd(this.ONLINE_KEY, userId)
      .exec();
  }

  // =========================================================
  // HEARTBEAT
  // =========================================================

  static async heartbeat(
    userId: string,
    connectionId: string,
    ttlSeconds = this.TTL_SECONDS,
  ): Promise<boolean> {
    const connectionKey = this.getConnectionKey(connectionId);

    const exists = await redis.exists(connectionKey);

    if (!exists) {
      const connectionsKey = this.getConnectionsKey(userId);

      await redis.hDel(connectionsKey, connectionId);

      // Check whether another connection
      // is still alive.
      const remaining = await this.hasActiveConnection(userId);

      if (!remaining) {
        await redis
          .multi()
          .del(connectionsKey)
          .sRem(this.ONLINE_KEY, userId)
          .exec();
      }

      return false;
    }

    await redis.expire(connectionKey, ttlSeconds);

    return true;
  }

  // =========================================================
  // REMOVE CONNECTION
  // =========================================================

  static async removeConnection(
    userId: string,
    connectionId: string,
  ): Promise<boolean> {
    const connectionsKey = this.getConnectionsKey(userId);

    const connectionKey = this.getConnectionKey(connectionId);

    await redis
      .multi()
      .del(connectionKey)
      .hDel(connectionsKey, connectionId)
      .exec();

    const remaining = await this.hasActiveConnection(userId);

    if (!remaining) {
      await redis
        .multi()
        .del(connectionsKey)
        .sRem(this.ONLINE_KEY, userId)
        .exec();

      return false;
    }

    return true;
  }

  // =========================================================
  // CHECK ACTIVE CONNECTION
  // =========================================================

  private static async hasActiveConnection(userId: string): Promise<boolean> {
    const connectionsKey = this.getConnectionsKey(userId);

    const connections = await redis.hKeys(connectionsKey);

    if (connections.length === 0) {
      return false;
    }

    for (const connectionId of connections) {
      const exists = await redis.exists(this.getConnectionKey(connectionId));

      if (exists) {
        return true;
      }

      // Remove expired connection
      await redis.hDel(connectionsKey, connectionId);
    }

    return false;
  }

  // =========================================================
  // IS ONLINE
  // =========================================================

  static async isOnline(userId: string): Promise<boolean> {
    const online = await this.hasActiveConnection(userId);

    if (!online) {
      await redis
        .multi()
        .del(this.getConnectionsKey(userId))
        .sRem(this.ONLINE_KEY, userId)
        .exec();

      return false;
    }

    // Make sure the index exists.
    await redis.sAdd(this.ONLINE_KEY, userId);

    return true;
  }

  // =========================================================
  // GET ONLINE USERS
  // =========================================================

  static async getOnlineUsers(
    userIds: string[],
  ): Promise<Record<string, boolean>> {
    if (userIds.length === 0) {
      return {};
    }

    const result: Record<string, boolean> = {};

    for (const userId of userIds) {
      result[userId] = await this.isOnline(userId);
    }

    return result;
  }

  // =========================================================
  // CONVERSATION MEMBERS
  // =========================================================

  static async addConversationMember(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await redis.sAdd(this.getConversationMembersKey(conversationId), userId);
  }

  static async removeConversationMember(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await redis.sRem(this.getConversationMembersKey(conversationId), userId);
  }

  static async getConversationMembers(
    conversationId: string,
  ): Promise<string[]> {
    return redis.sMembers(this.getConversationMembersKey(conversationId));
  }

  // =========================================================
  // CONVERSATION VIEWERS
  // =========================================================

  static async addConversationViewer(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await redis.sAdd(this.getConversationViewersKey(conversationId), userId);
  }

  static async removeConversationViewer(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await redis.sRem(this.getConversationViewersKey(conversationId), userId);
  }

  static async getConversationViewers(
    conversationId: string,
  ): Promise<string[]> {
    return redis.sMembers(this.getConversationViewersKey(conversationId));
  }

  // =========================================================
  // GET ONLINE NON-VIEWING MEMBERS
  // =========================================================

  static async rebuildConversationMembersCache(): Promise<void> {
    const allConversationIds = await UserModel.AllConversationIds();

    for (const id of allConversationIds) {
      const userIds = await UserModel.getAllUserIdsInConversation(id);

      for (const userId of userIds) {
        await this.addConversationMember(id, userId);
      }
    }
  }

  static async getOnlineNonViewingMembers(
    conversationId: string,
    senderId: string,
  ): Promise<string[]> {
    // await this.rebuildConversationMembersCache();

    const membersKey = this.getConversationMembersKey(conversationId);

    const viewersKey = this.getConversationViewersKey(conversationId);

    // members ∩ online
    const onlineMembers = await redis.sInter([membersKey, this.ONLINE_KEY]);

    if (onlineMembers.length === 0) {
      return [];
    }

    // Remove users currently viewing
    const viewers = await redis.sMembers(viewersKey);

    const viewerSet = new Set(viewers);

    return onlineMembers.filter(
      (userId) => userId !== senderId && !viewerSet.has(userId),
    );
  }
}
