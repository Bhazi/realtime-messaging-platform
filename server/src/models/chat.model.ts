import { pool } from "../config/db.js";

// Interfaces matching your database row types
export interface ConversationRow {
  id: string;
  type: "DIRECT" | "GROUP";
  name?: string | null;
  avatar_url?: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface ConversationMemberRow {
  conversation_id: string;
  user_id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joined_at: Date;
  left_at?: Date | null;
  hidden_at?: Date | null;
  user?: any;
}

export class ChatModel {
  /**
   * Find an existing DIRECT conversation between two specific users
   */
  static async findDirectConversation(userId1: string, userId2: string) {
    const query = `
      SELECT 
        c.id, 
        c.type, 
        c.name, 
        c.avatar_url AS "avatarUrl", 
        c.created_by AS "createdBy", 
        c.created_at AS "createdAt", 
        c.updated_at AS "updatedAt"
      FROM conversations c
      JOIN conversation_members cm1 ON c.id = cm1.conversation_id
      JOIN conversation_members cm2 ON c.id = cm2.conversation_id
      WHERE c.type = 'DIRECT'
        AND cm1.user_id = $1
        AND cm2.user_id = $2
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [userId1, userId2]);
    return rows[0] || null;
  }

  /**
   * Fetch all members belonging to a conversation, joined with User details
   */
  static async getMembersByConversationId(
    conversationId: string,
  ): Promise<any[]> {
    const query = `
      SELECT 
        cm.conversation_id AS "conversationId",
        cm.user_id AS "userId",
        cm.role,
        cm.joined_at AS "joinedAt",
        cm.left_at AS "leftAt",
        cm.hidden_at AS "hiddenAt",
        json_build_object(
          'id', u.id,
          'uid', u.uid,
          'username', u.username,
          'email', u.email,
          'displayName', u.display_name,
          'avatarUrl', u.avatar_url,
          'createdAt', u.created_at
        ) AS "user"
      FROM conversation_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.conversation_id = $1;
    `;
    const { rows } = await pool.query(query, [conversationId]);
    return rows;
  }

  /**
   * Unhide a conversation for a specific user if it was hidden
   */
  static async unhideForUser(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    const query = `
      UPDATE conversation_members
      SET hidden_at = NULL
      WHERE conversation_id = $1 AND user_id = $2;
    `;
    await pool.query(query, [conversationId, userId]);
  }

  /**
   * Create a new DIRECT conversation and insert both users into conversation_members atomically
   */
  static async createDirectConversation(
    currentUserId: string,
    targetUserId: string,
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. Insert Conversation
      const convQuery = `
        INSERT INTO conversations (type, created_by)
        VALUES ('DIRECT', $1)
        RETURNING 
          id, 
          type, 
          name, 
          avatar_url AS "avatarUrl", 
          created_by AS "createdBy", 
          created_at AS "createdAt", 
          updated_at AS "updatedAt";
      `;
      const convRes = await client.query(convQuery, [currentUserId]);
      const newConv = convRes.rows[0];

      // 2. Insert both members
      const memberQuery = `
        INSERT INTO conversation_members (conversation_id, user_id, role)
        VALUES ($1, $2, 'MEMBER'), ($1, $3, 'MEMBER');
      `;
      await client.query(memberQuery, [
        newConv.id,
        currentUserId,
        targetUserId,
      ]);

      await client.query("COMMIT");

      // 3. Get members complete with user object attached
      const members = await this.getMembersByConversationId(newConv.id);

      return {
        ...newConv,
        members,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Fetch all active conversations for a given user, including:
   * - Dynamically derived name & avatar for DIRECT chats (from the other user)
   * - Enriched members list with embedded User objects
   * - The single most recent message (with optional attachment)
   */
  static async getConversationsForUser(userId: string) {
    const query = ` WITH user_conversations AS (
        -- 1. Find all active conversations for the current user
        SELECT cm.conversation_id
        FROM conversation_members AS cm
        WHERE cm.user_id = $1
          AND cm.left_at IS NULL
          AND cm.hidden_at IS NULL
    ),

  last_messages AS (
      -- 2. Get the latest non-deleted message per conversation
      SELECT DISTINCT ON (m.conversation_id)
          m.id,
          m.conversation_id AS "conversationId",
          m.sender_id AS "senderId",
          m.type,
          m.content,
          m.created_at AS "createdAt",
          m.updated_at AS "updatedAt",
          CASE
              WHEN ma.id IS NOT NULL THEN json_build_object(
                  'id', ma.id,
                  'storageKey', ma.storage_key,
                  'filename', ma.filename,
                  'mimeType', ma.mime_type,
                  'size', ma.size,
                  'url', ma.url
              )
            ELSE NULL 
          END AS attachment
      FROM messages AS m
      LEFT JOIN message_attachments AS ma
          ON ma.id = m.attachment_id
      WHERE m.conversation_id IN (
          SELECT conversation_id
          FROM user_conversations
      )
        AND m.deleted_at IS NULL
      ORDER BY
          m.conversation_id,
          m.created_at DESC,
          m.id DESC
  ),

  conversation_members_data AS (
      -- 3. Get active members with their user data
      SELECT
          cm.conversation_id,
          json_agg(
              json_build_object(
                  'conversationId', cm.conversation_id,
                  'userId', cm.user_id,
                  'role', cm.role,
                  'joinedAt', cm.joined_at,
                  'leftAt', cm.left_at,
                  'hiddenAt', cm.hidden_at,
                  'user', json_build_object(
                      'id', u.id,
                      'uid', u.uid,
                      'username', u.username,
                      'email', u.email,
                      'displayName', u.display_name,
                      'avatarUrl', u.avatar_url,
                      'createdAt', u.created_at
                  )
              )
              ORDER BY cm.joined_at ASC
          ) AS members
      FROM conversation_members AS cm
      INNER JOIN users AS u
          ON u.id = cm.user_id
      WHERE cm.conversation_id IN (
          SELECT conversation_id
          FROM user_conversations
      )
        AND cm.left_at IS NULL
        AND cm.hidden_at IS NULL
      GROUP BY cm.conversation_id
  )

-- 4. Combine conversations with members and latest message
    SELECT
        c.id,
        c.type,

        CASE
            WHEN c.type = 'DIRECT' THEN (
                SELECT u2.display_name
                FROM conversation_members AS cm2
                INNER JOIN users AS u2
                    ON u2.id = cm2.user_id
                WHERE cm2.conversation_id = c.id
                  AND cm2.user_id != $1
                  AND cm2.left_at IS NULL
                  AND cm2.hidden_at IS NULL
                ORDER BY cm2.joined_at ASC
                LIMIT 1
            )
            ELSE c.name
        END AS name,

        CASE
            WHEN c.type = 'DIRECT' THEN (
                SELECT u2.avatar_url
                FROM conversation_members AS cm2
                INNER JOIN users AS u2
                    ON u2.id = cm2.user_id
                WHERE cm2.conversation_id = c.id
                  AND cm2.user_id != $1
                  AND cm2.left_at IS NULL
                  AND cm2.hidden_at IS NULL
                ORDER BY cm2.joined_at ASC
                LIMIT 1
            )
            ELSE c.avatar_url
        END AS "avatarUrl",

        c.created_by AS "createdBy",
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt",

        COALESCE(
            cmd.members,
            '[]'::json
        ) AS members,

        to_jsonb(lm) - 'conversationId' AS "lastMessage"

    FROM conversations AS c

    INNER JOIN user_conversations AS uc
        ON uc.conversation_id = c.id

    LEFT JOIN conversation_members_data AS cmd
        ON cmd.conversation_id = c.id

    LEFT JOIN last_messages AS lm
        ON lm."conversationId" = c.id

    ORDER BY
        COALESCE(lm."createdAt", c.created_at) DESC;
      `;

    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  /**
   * Creates a GROUP conversation and inserts all members within a single transaction.
   */

  static async createGroupConversation(
    name: string,
    createdBy: string,
    memberUserIds: string[],
    avatarUrl: string | null = null,
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const insertConvQuery = `
      INSERT INTO conversations (
        type,
        name,
        avatar_url,
        created_by
      )
      VALUES ('GROUP', $1, $2, $3)
      RETURNING
        id,
        type,
        name,
        avatar_url AS "avatarUrl",
        created_by AS "createdBy",
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `;

      const convRes = await client.query(insertConvQuery, [
        name,
        avatarUrl,
        createdBy,
      ]);

      const conversation = convRes.rows[0];

      const uniqueMemberIds = Array.from(
        new Set([createdBy, ...memberUserIds]),
      );

      const memberValues: string[] = [];
      const queryParams: any[] = [conversation.id];

      uniqueMemberIds.forEach((userId) => {
        const paramIndex = queryParams.length + 1;

        const role = userId === createdBy ? "OWNER" : "MEMBER";

        memberValues.push(`($1, $${paramIndex}, $${paramIndex + 1})`);

        queryParams.push(userId, role);
      });

      const insertMembersQuery = `
      INSERT INTO conversation_members (
        conversation_id,
        user_id,
        role
      )
      VALUES ${memberValues.join(", ")}
      RETURNING
        conversation_id AS "conversationId",
        user_id AS "userId",
        role,
        joined_at AS "joinedAt",
        left_at AS "leftAt",
        hidden_at AS "hiddenAt";
    `;

      const membersRes = await client.query(insertMembersQuery, queryParams);

      await client.query("COMMIT");

      return {
        ...conversation,
        members: membersRes.rows,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Fetch all non-deleted messages for a given conversation ID,
   * populated with attachment details and sender info.
   */
  static async getMessagesByConversationId(conversationId: string) {
    const query = `
      SELECT 
        m.id,
        m.conversation_id AS "conversationId",
        m.sender_id AS "senderId",
        m.type,
        m.content,
        m.created_at AS "createdAt",
        m.updated_at AS "updatedAt",
        -- Build attachment object if present
        CASE 
          WHEN ma.id IS NOT NULL THEN json_build_object(
            'id', ma.id,
            'storageKey', ma.storage_key,
            'filename', ma.filename,
            'mimeType', ma.mime_type,
            'size', ma.size,
            'url', ma.url
          )
          ELSE NULL
        END AS attachment,
        -- Build sender details object
        json_build_object(
          'id', u.id,
          'uid', u.uid,
          'username', u.username,
          'displayName', u.display_name,
          'avatarUrl', u.avatar_url
        ) AS sender
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN message_attachments ma ON m.attachment_id = ma.id
      WHERE m.conversation_id = $1 
        AND m.deleted_at IS NULL
      ORDER BY m.created_at ASC;
    `;

    const { rows } = await pool.query(query, [conversationId]);
    return rows;
  }

  /**
   * Inserts a message (and optional attachment) into PostgreSQL within a transaction,
   * updates the conversation's updated_at timestamp, and returns the full message object.
   */
  static async sendMessage(
    conversationId: string,
    senderId: string,
    type: string,
    content?: string,
    attachmentData?: {
      filename: string;
      mimeType: string;
      size: number;
      url: string;
    },
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      let attachmentId: string | null = null;

      // 1. Insert attachment if provided
      if (attachmentData) {
        const storageKey = `uploads/${attachmentData.filename}`;
        const insertAttachmentQuery = `
          INSERT INTO message_attachments (storage_key, filename, mime_type, size, url)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id;
        `;
        const attRes = await client.query(insertAttachmentQuery, [
          storageKey,
          attachmentData.filename,
          attachmentData.mimeType,
          attachmentData.size,
          attachmentData.url,
        ]);
        attachmentId = attRes.rows[0].id;
      }

      // 2. Insert message
      const insertMessageQuery = `
        INSERT INTO messages (conversation_id, sender_id, type, content, attachment_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `;
      const msgRes = await client.query(insertMessageQuery, [
        conversationId,
        senderId,
        type,
        content || null,
        attachmentId,
      ]);
      const messageId = msgRes.rows[0].id;

      // 3. Update parent conversation updated_at
      await client.query(
        `UPDATE conversations SET updated_at = NOW() WHERE id = $1;`,
        [conversationId],
      );

      // 4. Unhide conversation for all members on new message
      await client.query(
        `UPDATE conversation_members SET hidden_at = NULL WHERE conversation_id = $1;`,
        [conversationId],
      );

      await client.query("COMMIT");

      // 5. Fetch fully formatted message with sender & attachment JSON
      const fetchMessageQuery = `
        SELECT 
          m.id,
          m.conversation_id AS "conversationId",
          m.sender_id AS "senderId",
          m.type,
          m.content,
          m.created_at AS "createdAt",
          m.updated_at AS "updatedAt",
          CASE 
            WHEN ma.id IS NOT NULL THEN json_build_object(
              'id', ma.id,
              'storageKey', ma.storage_key,
              'filename', ma.filename,
              'mimeType', ma.mime_type,
              'size', ma.size,
              'url', ma.url
            )
            ELSE NULL
          END AS attachment,
          json_build_object(
            'id', u.id,
            'uid', u.uid,
            'username', u.username,
            'displayName', u.display_name,
            'avatarUrl', u.avatar_url
          ) AS sender
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        LEFT JOIN message_attachments ma ON m.attachment_id = ma.id
        WHERE m.id = $1;
      `;

      const { rows } = await pool.query(fetchMessageQuery, [messageId]);
      return rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async getAllMessages() {
    const query = `
      SELECT 
        m.id,
        m.conversation_id AS "conversationId",
        m.sender_id AS "senderId",
        m.type,
        m.content,
        m.created_at AS "createdAt",
        m.updated_at AS "updatedAt",
        CASE 
          WHEN ma.id IS NOT NULL THEN json_build_object(
            'id', ma.id,
            'storageKey', ma.storage_key,
            'filename', ma.filename,
            'mimeType', ma.mime_type,
            'size', ma.size,
            'url', ma.url
          )
          ELSE NULL
        END AS attachment,
        json_build_object(
          'id', u.id,
          'uid', u.uid,
          'username', u.username,
          'displayName', u.display_name,
          'avatarUrl', u.avatar_url
        ) AS sender
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN message_attachments ma ON m.attachment_id = ma.id
      WHERE m.deleted_at IS NULL
      ORDER BY m.created_at ASC;
    `;

    const { rows } = await pool.query(query);
    return rows;
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

  /**
   * Soft-deletes a message and handles optional attachment cleanup.
   * Permissions: Original sender OR Group ADMIN/OWNER.
   */
  static async deleteMessage(messageId: string, userId: string) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. Fetch message and verify caller's membership & role
      const checkQuery = `
        SELECT 
          m.id,
          m.sender_id,
          m.conversation_id,
          m.deleted_at,
          m.attachment_id,
          ma.storage_key,
          cm.role AS member_role,
          cm.left_at
        FROM messages m
        JOIN conversation_members cm 
          ON m.conversation_id = cm.conversation_id AND cm.user_id = $2
        LEFT JOIN message_attachments ma ON m.attachment_id = ma.id
        WHERE m.id = $1;
      `;
      const checkRes = await client.query(checkQuery, [messageId, userId]);

      if (checkRes.rows.length === 0) {
        throw new Error(
          "Message not found or you are not a member of this conversation.",
        );
      }

      const msg = checkRes.rows[0];

      if (msg.left_at !== null) {
        throw new Error(
          "You are no longer an active member of this conversation.",
        );
      }

      if (msg.deleted_at !== null) {
        throw new Error("Message is already deleted.");
      }

      // 2. Permission check: Original Sender OR Group Admin/Owner
      const isSender = msg.sender_id === userId;
      const isAdminOrOwner =
        msg.member_role === "ADMIN" || msg.member_role === "OWNER";

      if (!isSender && !isAdminOrOwner) {
        throw new Error("Permission denied to delete this message.");
      }

      // 3. Soft-delete the message and un-link attachment
      const updateMessageQuery = `
        UPDATE messages
        SET 
          deleted_at = CURRENT_TIMESTAMP,
          content = 'This message was deleted',
          attachment_id = NULL
        WHERE id = $1
        RETURNING id, conversation_id, updated_at, deleted_at;
      `;
      const updateRes = await client.query(updateMessageQuery, [messageId]);

      // 4. Delete the message attachment record from DB if present
      if (msg.attachment_id) {
        await client.query(`DELETE FROM message_attachments WHERE id = $1;`, [
          msg.attachment_id,
        ]);
      }

      await client.query("COMMIT");

      return {
        deletedMessage: updateRes.rows[0],
        attachmentStorageKey: msg.storage_key || null, // Returned for object storage cleanup
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
