import { pool } from "../config/db.js";
import argon2 from "argon2";
import UserRow from "../types/types.js";

export class UserModel {
  static async findByEmail(email: string): Promise<UserRow[] | null> {
    const query = `
      SELECT * FROM users
      WHERE email = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [email]);
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
      RETURNING id, uid, username, email, display_name AS "displayName", avatar_url AS "avatarUrl", created_at AS "createdAt";
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
    SELECT
      id,
      uid,
      username,
      email,
      password_hash AS "passwordHash",
      display_name AS "displayName",
      avatar_url AS "avatarUrl",
      created_at AS "createdAt"
    FROM users
    WHERE email = $1 OR username = $1
    LIMIT 1
  `;

    const { rows } = await pool.query<UserRow>(query, [identifier]);

    return rows[0] ?? null;
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

  /**
   * Deletes / Dissolves a group conversation.
   * - If the requester is the OWNER, the group is dissolved for all members.
   * - If the requester is a MEMBER or ADMIN, they leave the group and soft-delete local view.
   */
  static async deleteGroupConversation(conversationId: string, userId: string) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. Fetch conversation & verify it is a GROUP
      const convQuery = `
        SELECT id, type, created_by 
        FROM conversations 
        WHERE id = $1;
      `;
      const convRes = await client.query(convQuery, [conversationId]);

      if (convRes.rows.length === 0) {
        throw new Error("Conversation not found.");
      }

      const conversation = convRes.rows[0];

      if (conversation.type !== "GROUP") {
        throw new Error(
          "This operation is only valid for GROUP conversations.",
        );
      }

      // 2. Fetch actor membership details
      const memberQuery = `
        SELECT role, left_at 
        FROM conversation_members
        WHERE conversation_id = $1 AND user_id = $2;
      `;
      const memberRes = await client.query(memberQuery, [
        conversationId,
        userId,
      ]);

      if (memberRes.rows.length === 0) {
        throw new Error("User is not a member of this conversation.");
      }

      const actor = memberRes.rows[0];

      // Check if user is the OWNER or Creator
      const isOwner =
        actor.role === "OWNER" || conversation.created_by === userId;

      if (isOwner) {
        // --- OWNER SCENARIO: Dissolve Group for Everyone ---

        // Mark all active members as having left and hidden the chat
        await client.query(
          `
            UPDATE conversation_members
            SET 
              left_at = CURRENT_TIMESTAMP,
              hidden_at = CURRENT_TIMESTAMP
            WHERE conversation_id = $1;
          `,
          [conversationId],
        );

        // Update conversation state (optional: add a metadata field or timestamp)
        await client.query(
          `UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1;`,
          [conversationId],
        );

        await client.query("COMMIT");

        return {
          conversationId,
          dissolved: true,
          message: "Group dissolved successfully for all members.",
        };
      } else {
        // --- MEMBER / ADMIN SCENARIO: Leave & Clear for Self ---
        await client.query(
          `
            UPDATE conversation_members
            SET 
              left_at = CURRENT_TIMESTAMP,
              hidden_at = CURRENT_TIMESTAMP
              WHERE conversation_id = $1 AND user_id = $2;
          `,
          [conversationId, userId],
        );

        await client.query("COMMIT");

        return {
          conversationId,
          dissolved: false,
          message: "You have left and deleted the group for yourself.",
        };
      }
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Deletes / Dissolves a direct conversation.
   * Current user can delete direct conversation
   */
  static async deleteDirectConversation(
    conversationId: string,
    userId: string,
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. Fetch conversation & verify it is a Direct
      const convQuery = `
        SELECT type 
        FROM conversations 
        WHERE id = $1;
      `;
      const convRes = await client.query(convQuery, [conversationId]);

      if (convRes.rows.length === 0) {
        throw new Error("Conversation not found.");
      }

      const conversation = convRes.rows[0];

      if (conversation.type !== "DIRECT") {
        throw new Error(
          "This operation is only valid for DIRECT conversations.",
        );
      }

      // 2. Fetch actor membership details
      const memberQuery = `
        SELECT role, left_at 
        FROM conversation_members
        WHERE conversation_id = $1 AND user_id = $2;
      `;
      const memberRes = await client.query(memberQuery, [
        conversationId,
        userId,
      ]);

      if (memberRes.rows.length === 0) {
        throw new Error("User is not a member of this conversation.");
      }

      // Mark all active members as having left and hidden the chat
      await client.query(
        `UPDATE conversation_members
            SET 
              left_at = CURRENT_TIMESTAMP,
              hidden_at = CURRENT_TIMESTAMP
            WHERE conversation_id = $1 AND user_id = $2;
          `,
        [conversationId, userId],
      );

      // Update conversation state (optional: add a metadata field or timestamp)
      await client.query(
        `UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1;`,
        [conversationId],
      );

      await client.query("COMMIT");

      return {
        conversationId,
        dissolved: true,
        message: "Direct chat dissolved successfully for all members.",
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Updates a member's role in a group conversation.
   * Only the OWNER can change roles.
   */
  static async updateGroupMemberRole(
    conversationId: string,
    currentUserId: string,
    targetUserId: string,
    newRole: string,
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. Verify the conversation is a GROUP
      const convQuery = `SELECT type FROM conversations WHERE id = $1;`;
      const convRes = await client.query(convQuery, [conversationId]);

      if (convRes.rows.length === 0) {
        throw new Error("Conversation not found.");
      }
      if (convRes.rows[0].type !== "GROUP") {
        throw new Error(
          "Role management is only valid for GROUP conversations.",
        );
      }

      // 2. Fetch actor's membership and role
      const actorQuery = `
        SELECT role, left_at 
        FROM conversation_members 
        WHERE conversation_id = $1 AND user_id = $2;
      `;
      const actorRes = await client.query(actorQuery, [
        conversationId,
        currentUserId,
      ]);

      if (actorRes.rows.length === 0 || actorRes.rows[0].left_at !== null) {
        throw new Error("Actor is not an active member of this conversation.");
      }

      const actorRole = actorRes.rows[0].role;
      if (actorRole !== "OWNER") {
        throw new Error("Only the group owner can manage member roles.");
      }

      // 3. Fetch target user's membership
      const targetQuery = `
        SELECT role, left_at 
        FROM conversation_members 
        WHERE conversation_id = $1 AND user_id = $2;
      `;
      const targetRes = await client.query(targetQuery, [
        conversationId,
        targetUserId,
      ]);

      if (targetRes.rows.length === 0 || targetRes.rows[0].left_at !== null) {
        throw new Error("Target user is not an active member of this group.");
      }

      // 4. Update the target member's role
      const updateQuery = `
        UPDATE conversation_members
        SET role = $1
        WHERE conversation_id = $2 AND user_id = $3
        RETURNING conversation_id, user_id, role, joined_at;
      `;
      const updateRes = await client.query(updateQuery, [
        newRole,
        conversationId,
        targetUserId,
      ]);

      await client.query("COMMIT");

      return updateRes.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Removes a user from a group conversation.
   * Enforces role permissions:
   * - Actor must be OWNER or ADMIN.
   * - ADMINs cannot remove OWNERs or other ADMINs.
   */
  static async removeUserFromGroup(
    conversationId: string,
    currentUserId: string,
    targetUserId: string,
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. Verify the conversation is a GROUP
      const convQuery = `SELECT type FROM conversations WHERE id = $1;`;
      const convRes = await client.query(convQuery, [conversationId]);

      if (convRes.rows.length === 0) {
        throw new Error("Conversation not found.");
      }
      if (convRes.rows[0].type !== "GROUP") {
        throw new Error(
          "Removing members is only valid for GROUP conversations.",
        );
      }

      // 2. Fetch actor's membership and role
      const actorQuery = `
        SELECT role, left_at 
        FROM conversation_members 
        WHERE conversation_id = $1 AND user_id = $2;
      `;
      const actorRes = await client.query(actorQuery, [
        conversationId,
        currentUserId,
      ]);

      if (actorRes.rows.length === 0 || actorRes.rows[0].left_at !== null) {
        throw new Error("You are not an active member of this group.");
      }

      const actorRole = actorRes.rows[0].role;

      // Only OWNER or ADMIN can remove users
      if (actorRole !== "OWNER" && actorRole !== "ADMIN") {
        throw new Error("Only admins or owners can remove members.");
      }

      // 3. Fetch target user's membership and role
      const targetQuery = `
        SELECT role, left_at 
        FROM conversation_members 
        WHERE conversation_id = $1 AND user_id = $2;
      `;
      const targetRes = await client.query(targetQuery, [
        conversationId,
        targetUserId,
      ]);

      if (targetRes.rows.length === 0 || targetRes.rows[0].left_at !== null) {
        throw new Error("Target user is not an active member of this group.");
      }

      const targetRole = targetRes.rows[0].role;

      // Admins cannot remove owners or other admins
      if (actorRole === "ADMIN") {
        if (targetRole === "OWNER" || targetRole === "ADMIN") {
          throw new Error("Admins cannot remove owners or other admins.");
        }
      }

      // 4. Update left_at timestamp for target user
      const removeQuery = `
        UPDATE conversation_members
        SET left_at = CURRENT_TIMESTAMP
        WHERE conversation_id = $1 AND user_id = $2
        RETURNING conversation_id, user_id, role, left_at;
      `;
      const removeRes = await client.query(removeQuery, [
        conversationId,
        targetUserId,
      ]);

      // 5. Update conversation timestamp
      await client.query(
        `UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1;`,
        [conversationId],
      );

      await client.query("COMMIT");

      return removeRes.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Adds a user (by public UID) to a GROUP conversation.
   * Enforces that actor (currentUserId) is an active OWNER or ADMIN.
   */
  static async addUserToGroup(
    conversationId: string,
    currentUserId: string,
    targetUid: string,
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. Resolve target user by public UID
      const targetUserQuery = `
        SELECT id, uid, username, display_name AS "displayName", avatar_url AS "avatarUrl"
        FROM users
        WHERE uid = $1;
      `;
      const targetUserRes = await client.query(targetUserQuery, [targetUid]);

      if (targetUserRes.rows.length === 0) {
        throw new Error("User with this UID does not exist.");
      }

      const targetUser = targetUserRes.rows[0];
      const targetUserId = targetUser.id;

      // 2. Fetch conversation & verify it is a GROUP chat
      const convQuery = `
        SELECT id, type 
        FROM conversations 
        WHERE id = $1;
      `;
      const convRes = await client.query(convQuery, [conversationId]);

      if (convRes.rows.length === 0) {
        throw new Error("Conversation not found.");
      }

      if (convRes.rows[0].type !== "GROUP") {
        throw new Error("Cannot add members to a DIRECT conversation.");
      }

      // 3. Verify actor is an active OWNER or ADMIN in the conversation
      const actorQuery = `
        SELECT role, left_at 
        FROM conversation_members
        WHERE conversation_id = $1 AND user_id = $2;
      `;
      const actorRes = await client.query(actorQuery, [
        conversationId,
        currentUserId,
      ]);

      if (actorRes.rows.length === 0 || actorRes.rows[0].left_at !== null) {
        throw new Error("You are not an active member of this conversation.");
      }

      const actorRole = actorRes.rows[0].role;
      if (actorRole !== "OWNER" && actorRole !== "ADMIN") {
        throw new Error("Only admins or owners can add new members.");
      }

      // 4. Check target user's existing membership state
      const targetMemberQuery = `
        SELECT conversation_id, user_id, role, left_at, hidden_at 
        FROM conversation_members
        WHERE conversation_id = $1 AND user_id = $2;
      `;
      const targetMemberRes = await client.query(targetMemberQuery, [
        conversationId,
        targetUserId,
      ]);

      if (targetMemberRes.rows.length > 0) {
        const existingMember = targetMemberRes.rows[0];

        if (existingMember.left_at === null) {
          throw new Error("User is already an active member of this group.");
        }

        // Reactivate previously left member
        await client.query(
          `
            UPDATE conversation_members
            SET left_at = NULL, 
                hidden_at = NULL, 
                joined_at = CURRENT_TIMESTAMP, 
                role = 'MEMBER'
            WHERE conversation_id = $1 AND user_id = $2;
          `,
          [conversationId, targetUserId],
        );
      } else {
        // Insert new member entry
        await client.query(
          `
            INSERT INTO conversation_members (conversation_id, user_id, role, joined_at)
            VALUES ($1, $2, 'MEMBER', CURRENT_TIMESTAMP);
          `,
          [conversationId, targetUserId],
        );
      }

      // 5. Update conversation activity timestamp
      await client.query(
        `UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1;`,
        [conversationId],
      );

      await client.query("COMMIT");

      return {
        conversationId,
        addedUser: targetUser,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async setLastSeen(userId: string): Promise<void> {
    await pool.query(
      `
      UPDATE users
      SET last_seen_at = NOW()
      WHERE id = $1
    `,
      [userId],
    );
  }

  static async getLastSeen(userId: string): Promise<void> {
    const query = `
      SELECT last_seen_at
      FROM users
      WHERE id = $1
    `;

    const { rows } = await pool.query(query, [userId]);

    return rows[0].last_seen_at;
  }

  static async isMember(
    conversation_id: string,
    user_id: string,
  ): Promise<boolean> {
    const query = `
    SELECT 1
    FROM conversation_members
    WHERE conversation_id = $1
      AND user_id = $2
    LIMIT 1;
  `;

    const { rows } = await pool.query(query, [conversation_id, user_id]);

    return rows.length > 0;
  }

  static async getConversationIdsForUser(userId: string): Promise<string[]> {
    const query = `
    SELECT conversation_id
    FROM conversation_members
    WHERE user_id = $1
  `;

    const { rows } = await pool.query(query, [userId]);

    return rows.map((row) => row.conversation_id);
  }

  static async setLastReadSeq(
    conversationId: string,
    seq: number,
    userId: string,
  ) {
    const query = `
    UPDATE conversation_members
    SET last_read_seq = GREATEST(last_read_seq, $1)
    WHERE user_id = $2
      AND conversation_id = $3
      AND left_at IS NULL
  `;

    await pool.query(query, [seq, userId, conversationId]);
  }

  static async setLastSeenForChat(conversationId: string, userId: string) {
    const query = `
    UPDATE conversation_members
    SET last_seen_at = NOW()
    WHERE user_id = $1
      AND conversation_id = $2
      AND left_at IS NULL
  `;

    await pool.query(query, [userId, conversationId]);
  }

  static async AllConversationIds(): Promise<string[]> {
    const query = `
    SELECT id
    FROM conversations
  `;

    const result = await pool.query(query);

    return result.rows.map((conversation) => conversation.id);
  }

  static async getAllUserIdsInConversation(
    conversationId: string,
  ): Promise<string[]> {
    const query = `
    SELECT user_id
    FROM conversation_members
    WHERE conversation_id = $1
  `;

    const result = await pool.query(query, [conversationId]);

    return result.rows.map((member) => member.user_id);
  }
}
