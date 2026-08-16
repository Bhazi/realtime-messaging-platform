import { pool } from "../config/db.js";
import argon2 from "argon2";
import UserRow from "../types/types.js";

export class UserModel {
  static async findByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<UserRow[]> {
    const query = `
      SELECT * FROM users
      WHERE email = $1 OR username = $2
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [email, username]);
    return rows[0] || null;
  }

  static async create(userData: {
    uid: string;
    username: string;
    email: string;
    displayName: string;
    passwordHash: string;
  }): Promise<UserRow> {
    const query = `
      INSERT INTO users (uid, username, email, display_name, password_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, uid, username, email, display_name, avatar_url, created_at;
    `;

    const { rows } = await pool.query(query, [
      userData.uid,
      userData.username,
      userData.email,
      userData.displayName,
      userData.passwordHash,
    ]);

    return rows[0];
  }

  static async findByIdentifier(identifier: string): Promise<UserRow | null> {
    const query = `
      SELECT * FROM users 
      WHERE email = $1 OR username = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [identifier]);
    return rows[0] || null;
  }

  static async findAll(): Promise<UserRow[]> {
    const query = `
      SELECT id, uid, username, email, display_name, avatar_url, created_at 
      FROM users
      ORDER BY created_at DESC;
    `;
    const { rows } = await pool.query(query);

    return rows;
  }

  /**
   * Fetches a single user by their primary key ID.
   */
  static async getUserById(id: string): Promise<UserRow | undefined> {
    if (!id) return undefined;

    const query = `
      SELECT 
        id,
        uid,
        username,
        email,
        display_name AS "displayName",
        avatar_url AS "avatarUrl",
        created_at AS "createdAt"
      FROM users
      WHERE id = $1;
    `;

    const { rows } = await pool.query(query, [id]);
    return rows[0] || undefined;
  }

  /**
   * Fetches a single user by their public UID (e.g. 8KX4P92M).
   */
  static async getUserByUid(uid: string): Promise<UserRow | undefined> {
    if (!uid) return undefined;

    const query = `
      SELECT 
        id,
        uid,
        username,
        email,
        display_name AS "displayName",
        avatar_url AS "avatarUrl",
        created_at AS "createdAt"
      FROM users
      WHERE uid = $1;
    `;

    const { rows } = await pool.query(query, [uid]);
    return rows[0] || undefined;
  }

  static async findByUid(uid: string): Promise<UserRow> {
    const query = `
      SELECT id, uid, username, display_name, avatar_url 
      FROM users
      WHERE uid = $1
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [uid]);

    // Return the first matching row, or null if empty
    return rows[0] || null;
  }

  /**
   * Updates user profile in PostgreSQL.
   * Requires `userId` and at least one of `username` or `displayName` (or both).
   */
  static async updateUserProfile(
    userId: string,
    updates: {
      username?: string;
      displayName?: string;
    },
  ) {
    if (!userId) {
      throw new Error("userId is required.");
    }

    const { username, displayName } = updates;

    // Enforce Rule: Must provide at least username OR displayName
    if (!username && !displayName) {
      throw new Error(
        "Invalid update request: You must provide at least 'username' or 'displayName' (or both).",
      );
    }

    const setClauses: string[] = [];
    const queryParams: any[] = [];

    // Add username if provided
    if (username !== undefined) {
      if (!username.trim()) {
        throw new Error("username cannot be empty.");
      }
      queryParams.push(username.trim());
      setClauses.push(`username = $${queryParams.length}`);
    }

    // Add displayName if provided
    if (displayName !== undefined) {
      if (!displayName.trim()) {
        throw new Error("displayName cannot be empty.");
      }
      queryParams.push(displayName.trim());
      setClauses.push(`display_name = $${queryParams.length}`);
    }

    // Add userId as the last parameter for WHERE clause
    queryParams.push(userId);
    const userIdParamIndex = queryParams.length;

    const query = `
      UPDATE users
      SET ${setClauses.join(", ")}
      WHERE id = $${userIdParamIndex}
      RETURNING 
        id,
        uid,
        username,
        email,
        display_name AS "displayName",
        avatar_url AS "avatarUrl",
        created_at AS "createdAt" 
    `;

    const { rows } = await pool.query(query, queryParams);

    if (rows.length === 0) {
      throw new Error("User not found.");
    }

    return rows[0];
  }

  /**
   * Verifies old password and updates user's password with an Argon2id hash.
   */
  static async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    // 1. Fetch user's current password hash from DB
    const selectQuery = `SELECT password_hash FROM users WHERE id = $1;`;
    const { rows } = await pool.query(selectQuery, [userId]);

    if (rows.length === 0) {
      throw new Error("User not found.");
    }

    const currentHash = rows[0].password_hash;

    // 2. Verify old password using Argon2
    const isOldPasswordValid = await argon2.verify(currentHash, oldPassword);
    if (!isOldPasswordValid) {
      throw new Error("Incorrect old password.");
    }

    // 3. Hash the new password with Argon2id parameters
    const newPasswordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
    });

    // 4. Update the user's password_hash in PostgreSQL
    const updateQuery = `
      UPDATE users 
      SET password_hash = $1
      WHERE id = $2;
    `;
    await pool.query(updateQuery, [newPasswordHash, userId]);

    return true;
  }

  /**
   * Updates user's avatar_url in PostgreSQL and returns updated user profile.
   */
  static async updateAvatarUrl(userId: string, avatarUrl: string) {
    if (!userId) {
      throw new Error("userId is required.");
    }
    if (!avatarUrl) {
      throw new Error("avatarUrl is required.");
    }

    const query = `
      UPDATE users
      SET avatar_url = $1
      WHERE id = $2
      RETURNING 
        id,
        uid,
        username,
        email,
        display_name AS "displayName",
        avatar_url AS "avatarUrl",
        created_at AS "createdAt"
    `;

    const { rows } = await pool.query(query, [avatarUrl, userId]);

    if (rows.length === 0) {
      throw new Error("User not found.");
    }

    return rows[0];
  }
}
