import { ChatModel } from "../../models/chat.model.js";
import { UserModel } from "../../models/user.model.js";

export class ChatService {
  static async createDirectConversation(
    currentUserId: string,
    targetUid: string,
  ) {
    // 1. Find target user by public UID
    const targetUser = await UserModel.findByUid(targetUid);

    if (!targetUser) {
      throw new Error("User not found with provided UID.");
    }

    // 2. Prevent self-chat
    if (targetUser.id === currentUserId) {
      throw new Error("You cannot start a direct chat with yourself.");
    }

    // 3. Check if a direct conversation already exists
    const existingConv = await ChatModel.findDirectConversation(
      currentUserId,
      targetUser.id,
    );

    if (existingConv) {
      // Unhide if hidden for the current user
      await ChatModel.unhideForUser(existingConv.id, currentUserId);

      // Fetch fresh member state (includes nested user details)
      const members = await ChatModel.getMembersByConversationId(
        existingConv.id,
      );

      return {
        ...existingConv,
        members,
      };
    }

    // 4. Create brand new conversation if none exists
    return await ChatModel.createDirectConversation(
      currentUserId,
      targetUser.id,
    );
  }

  static async getConversations(userId: string) {
    return await ChatModel.getConversationsForUser(userId);
  }

  static async createGroupConversation(
    currentUserId: string,
    name: string,
    memberUids: string[],
    avatarUrl: string | null = null,
  ) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new Error("Group name is required.");
    }

    // Resolve public_uids to internal user IDs asynchronously
    const memberUserIds: string[] = [];

    if (Array.isArray(memberUids) && memberUids.length > 0) {
      const userPromises = memberUids.map((uid) => UserModel.findByUid(uid));

      const resolvedUsers = await Promise.all(userPromises);

      resolvedUsers.forEach((user) => {
        if (user && user.id !== currentUserId) {
          memberUserIds.push(user.id);
        }
      });
    }

    // Create group conversation via model transaction
    return await ChatModel.createGroupConversation(
      trimmedName,
      currentUserId,
      memberUserIds,
      avatarUrl,
    );
  }

  static async getMessages(conversationId: string) {
    if (!conversationId) {
      throw new Error("Conversation ID is required.");
    }
    return await ChatModel.getMessagesByConversationId(conversationId);
  }

  // static async sendMessage(
  //   conversationId: string,
  //   senderId: string,
  //   type: string,
  //   data: {
  //     content?: string;
  //     attachmentData?: {
  //       filename: string;
  //       mimeType: string;
  //       size: number;
  //       url: string;
  //     };
  //   },
  // ) {}

  static async sendMessage(
    conversationId: string,
    senderId: string,
    type: string,
    content?: string,
    file?: Express.Multer.File,
  ) {
    if (!conversationId || !senderId) {
      throw new Error("conversationId and senderId are required.");
    }

    if (!content && !file) {
      throw new Error(
        "Message must contain either text content or an attachment.",
      );
    }

    let attachmentData: AttachmentPayload | undefined = undefined;

    if (file) {
      const storageKey = file.path.replace(/\\/g, "/"); // Normalize path separators for Linux/Windows
      const hostUrl = process.env.SERVER_URL || "http://localhost:5000";
      const fileUrl = `${hostUrl}/${storageKey}`;

      attachmentData = {
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageKey,
        url: fileUrl,
      };
    }

    return await ChatModel.sendMessage(
      conversationId,
      senderId,
      type || "TEXT",
      content,
      attachmentData,
    );
  }

  static async getAllMessages() {
    return await ChatModel.getAllMessages();
  }

  static async addUserToGroup(
    conversationId: string,
    currentUserId: string,
    targetUid: string,
  ) {
    if (!conversationId) {
      throw new Error("conversationId is required.");
    }
    if (!currentUserId) {
      throw new Error("currentUserId is required.");
    }
    if (!targetUid) {
      throw new Error("targetUid is required.");
    }

    return await ChatModel.addUserToGroup(
      conversationId,
      currentUserId,
      targetUid,
    );
  }

  static async deleteMessage(
    messageId: string,
    userId: string,
  ): Promise<boolean> {
    if (!messageId || !userId) {
      throw new Error("messageId and userId are required UUIDs.");
    }

    const result = await ChatModel.deleteMessage(messageId, userId);

    // Asynchronous background storage cleanup for physical files (e.g., S3/Cloud Storage)
    if (result.attachmentStorageKey) {
      this.deleteFromStorage(result.attachmentStorageKey).catch((err) =>
        console.error("Failed to delete file from object storage:", err),
      );
    }

    return true;
  }

  private static async deleteFromStorage(storageKey: string): Promise<void> {
    // Implement S3/Cloud Storage object removal here:
    // await s3Client.deleteObject({ Bucket: BUCKET_NAME, Key: storageKey });
  }
}
