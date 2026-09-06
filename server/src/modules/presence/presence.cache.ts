import { redis } from "../../config/redis.js";

export class PresenceCache {
  private static readonly TTL_SECONDS = 60;

  private static getConnectionsKey(userId: string): string {
    return `user:${userId}:connections`;
  }

  private static getConnectionKey(connectionId: string): string {
    return `presence:connection:${connectionId}`;
  }

  /**
   * Mark a browser connection as online.
   *
   * Example:
   *
   * user:alice:connections
   *   connection-123 -> node-a
   */
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
      .exec();
  }

  /**
   * Refresh the browser connection TTL.
   *
   * The Node process handling the WebSocket should call this
   * periodically while the connection is alive.
   */
  static async heartbeat(
    userId: string,
    connectionId: string,
    ttlSeconds = this.TTL_SECONDS,
  ): Promise<boolean> {
    const connectionKey = this.getConnectionKey(connectionId);

    const exists = await redis.exists(connectionKey);

    if (!exists) {
      // Connection is no longer considered alive.
      await redis.hDel(this.getConnectionsKey(userId), connectionId);

      return false;
    }

    await redis.expire(connectionKey, ttlSeconds);

    return true;
  }

  /**
   * Remove a browser connection.
   *
   * Called when the WebSocket closes/disconnects.
   */
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

    // Remove the user's hash when there are no connections.
    const remaining = await redis.hLen(connectionsKey);

    if (remaining === 0) {
      await redis.del(connectionsKey);
      return false;
    }

    return true;
  }

  /**
   * Check whether the user currently has an active browser connection.
   */
  static async isOnline(userId: string): Promise<boolean> {
    const connectionsKey = this.getConnectionsKey(userId);

    const connections = await redis.hKeys(connectionsKey);

    if (connections.length === 0) {
      return false;
    }

    // Check whether at least one connection is still alive.
    for (const connectionId of connections) {
      const exists = await redis.exists(this.getConnectionKey(connectionId));

      if (exists) {
        return true;
      }

      // Clean up expired connection.
      await redis.hDel(connectionsKey, connectionId);
    }

    // No active connections remain.
    await redis.del(connectionsKey);

    return false;
  }

  /**
   * Get online status for multiple users.
   *
   * Example:
   *
   * {
   *   alice: true,
   *   bob: false,
   *   charlie: true
   * }
   */
  static async getOnlineUsers(
    userIds: string[],
  ): Promise<Record<string, boolean>> {
    if (userIds.length === 0) {
      return {};
    }

    const result: Record<string, boolean> = {};

    await Promise.all(
      userIds.map(async (userId) => {
        result[userId] = await this.isOnline(userId);
      }),
    );

    return result;
  }
}
