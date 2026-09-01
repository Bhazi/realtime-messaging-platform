import { redis } from "../../config/redis.js";

export interface AuthSession {
  userId: string;
  refreshTokenHash: string;
  expiresAt: number;
  revoked: boolean;
}

export class AuthSessionCache {
  private static getKey(sessionId: string): string {
    return `auth:session:${sessionId}`;
  }

  /**
   * Create a new authentication session.
   */
  static async createSession(
    sessionId: string,
    session: AuthSession,
    ttlSeconds: number,
  ): Promise<void> {
    const key = this.getKey(sessionId);

    await redis.set(key, JSON.stringify(session), {
      EX: ttlSeconds,
    });
  }

  /**
   * Get an authentication session by session ID.
   */
  static async getSession(sessionId: string): Promise<AuthSession | null> {
    const key = this.getKey(sessionId);

    const data = await redis.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as AuthSession;
  }

  /**
   * Update an existing authentication session.
   *
   * Used during refresh-token rotation.
   */
  static async updateSession(
    sessionId: string,
    session: AuthSession,
    ttlSeconds: number,
  ): Promise<void> {
    const key = this.getKey(sessionId);

    await redis.set(key, JSON.stringify(session), {
      EX: ttlSeconds,
    });
  }

  /**
   * Revoke an authentication session.
   */
  static async revokeSession(sessionId: string): Promise<void> {
    const key = this.getKey(sessionId);

    const session = await this.getSession(sessionId);

    if (!session) {
      return;
    }

    session.revoked = true;

    await redis.set(key, JSON.stringify(session), {
      EX: 60 * 60 * 24, // Keep revoked session for 1 day
    });
  }

  /**
   * Completely delete a session.
   */
  static async deleteSession(sessionId: string): Promise<void> {
    const key = this.getKey(sessionId);

    await redis.del(key);
  }
}
