import { redis } from "../../config/redis.js";
import UserRow from "../../types/types.js";

export class UserCache {
  static async deleteUser(userId: string): Promise<void> {
    await redis.del(this.getKey(userId));
  }

  private static getKey(userId: string): string {
    return `user:${userId}`;
  }

  static async setUser(user: UserRow, ttlSeconds = 60 * 60): Promise<void> {
    await redis.set(this.getKey(user.id), JSON.stringify(user), {
      EX: ttlSeconds,
    });
  }

  static async getUser(userId: string): Promise<UserRow | null> {
    const data = await redis.get(this.getKey(userId));

    if (!data) {
      return null;
    }

    return JSON.parse(data) as UserRow;
  }

  static async updateUser(user: UserRow, ttlSeconds = 60 * 60): Promise<void> {
    await redis.set(this.getKey(user.id), JSON.stringify(user), {
      EX: ttlSeconds,
    });
  }
}
