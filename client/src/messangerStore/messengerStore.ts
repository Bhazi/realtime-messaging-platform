import {
  User,
  Conversation,
  Message,
  MemberRole,
  MessageType,
} from "../types/types";

import { userApi } from "../api/user.api";

// Helper for local storage persistence
class MessengerStore {
  private usersKey = "luma_messenger_users";
  private conversationsKey = "luma_messenger_conversations";
  private messagesKey = "luma_messenger_messages";
  private currentUserKey = "luma_user";

  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(this.usersKey)) {
      localStorage.setItem(this.usersKey, JSON.stringify(SEED_USERS));
    }
    if (!localStorage.getItem(this.conversationsKey)) {
      localStorage.setItem(
        this.conversationsKey,
        JSON.stringify(SEED_CONVERSATIONS),
      );
    }
    if (!localStorage.getItem(this.messagesKey)) {
      localStorage.setItem(this.messagesKey, JSON.stringify(SEED_MESSAGES));
    }
    if (!localStorage.getItem(this.currentUserKey)) {
      localStorage.setItem(this.currentUserKey, JSON.stringify(SEED_USERS[0]));
    }
  }

  // Users

  async getUsers(): Promise<User[]> {
    try {
      const data = await userApi.getUsers();

      return data ? data : [];
    } catch {
      return [];
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    const users = await this.getUsers();

    return users.find((u) => u.id === id);
  }

  async getUserByUid(uid: string): Promise<User | undefined> {
    const cleanUid = uid.trim().toUpperCase();

    const users = await this.getUsers();

    return users.find((u) => u.uid.toUpperCase() === cleanUid);
  }

  getCurrentUser(): User {
    try {
      const data = localStorage.getItem(this.currentUserKey);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return SEED_USERS[0];
  }

  async setCurrentUser(user: User): Promise<void> {
    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
    // also ensure user exists in users table
    const users = await this.getUsers();

    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  updateUserProfile(userId: string, updates: Partial<User>): User {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      localStorage.setItem(this.usersKey, JSON.stringify(users));
      if (this.getCurrentUser().id === userId) {
        localStorage.setItem(this.currentUserKey, JSON.stringify(users[idx]));
      }
      return users[idx];
    }
    throw new Error("User not found");
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    const response = await fetch(
      `http://localhost:5000/api/v1/chat/conversations?id=${encodeURIComponent(userId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch conversations");
    }

    const conversations: Conversation[] = await response.json();

    // this.conversations = conversations;

    // console.log(conversations, "the conversation");

    return conversations;
  }

  async getConversationById(id: string): Promise<Conversation | undefined> {
    const current = this.getCurrentUser();
    const convs = await this.getConversations(current.id);
    return convs.find((c) => c.id === id);
  }

  async createDirectConversation(
    currentUserId: string,
    targetUid: string,
  ): Promise {
    let conversations: Conversation[] = [];

    const token = localStorage.getItem("auth_token"); // Get auth token if using JWT

    const response = await fetch("http://localhost:5000/api/v1/chat/direct", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ currentUserId, targetUid }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handles "User not found", "Cannot chat with yourself", etc.
      throw new Error(data.error || "Failed to create conversation");
    }

    const newConv: Conversation = data.conversation;

    // Update local state in memory so UI re-renders instantly
    const existingIndex = conversations.findIndex((c) => c.id === newConv.id);

    if (existingIndex !== -1) {
      // Replace existing conversation (unhidden state)
      conversations[existingIndex] = newConv;
    } else {
      // Prepend new conversation to top of list
      conversations.unshift(newConv);
    }

    return newConv;
  }

  createGroupConversation(
    currentUserId: string,
    name: string,
    memberUids: string[],
  ): Conversation {
    if (!name.trim()) {
      throw new Error("Group name is required.");
    }

    const allUsers = this.getUsers();
    const memberUserIds = new Set<string>([currentUserId]);

    memberUids.forEach((uid) => {
      const u = this.getUserByUid(uid);
      if (u) {
        memberUserIds.add(u.id);
      }
    });

    const conversationId = `conv_group_${Date.now()}`;
    const members = Array.from(memberUserIds).map((uid) => ({
      conversationId,
      userId: uid,
      role: (uid === currentUserId ? "OWNER" : "MEMBER") as MemberRole,
      joinedAt: new Date().toISOString(),
    }));

    const newGroup: Conversation = {
      id: conversationId,
      type: "GROUP",
      name: name.trim(),
      avatarUrl: `https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=250&q=80`,
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members,
    };

    const allConvs: Conversation[] = JSON.parse(
      localStorage.getItem(this.conversationsKey) || "[]",
    );
    allConvs.unshift(newGroup);
    localStorage.setItem(this.conversationsKey, JSON.stringify(allConvs));
    return newGroup;
  }

  // Messages
  private getMessagesAll(): Message[] {
    try {
      const data = localStorage.getItem(this.messagesKey);
      return data ? JSON.parse(data) : SEED_MESSAGES;
    } catch {
      return SEED_MESSAGES;
    }
  }

  getMessages(conversationId: string): Message[] {
    const allMessages = this.getMessagesAll();
    const allUsers = this.getUsers();

    return allMessages
      .filter((m) => m.conversationId === conversationId)
      .map((m) => ({
        ...m,
        sender: allUsers.find((u) => u.id === m.senderId),
      }));
  }

  sendMessage(
    conversationId: string,
    senderId: string,
    type: MessageType,
    data: {
      content?: string;
      attachmentData?: {
        filename: string;
        mimeType: string;
        size: number;
        url: string;
      };
    },
  ): Message {
    const allMessages = this.getMessagesAll();
    const messageId = `msg_${Date.now()}`;

    let attachment = undefined;
    if (data.attachmentData) {
      const attachmentId = `att_${Date.now()}`;
      attachment = {
        id: attachmentId,
        storageKey: `uploads/${data.attachmentData.filename}`,
        filename: data.attachmentData.filename,
        mimeType: data.attachmentData.mimeType,
        size: data.attachmentData.size,
        url: data.attachmentData.url,
      };
    }

    const newMessage: Message = {
      id: messageId,
      conversationId,
      senderId,
      type,
      content: data.content || null,
      createdAt: new Date().toISOString(),
      attachment: attachment || null,
    };

    allMessages.push(newMessage);
    localStorage.setItem(this.messagesKey, JSON.stringify(allMessages));

    // Update conversation timestamp
    const convs: Conversation[] = JSON.parse(
      localStorage.getItem(this.conversationsKey) || "[]",
    );
    const convIdx = convs.findIndex((c) => c.id === conversationId);
    if (convIdx !== -1) {
      convs[convIdx].updatedAt = new Date().toISOString();
      localStorage.setItem(this.conversationsKey, JSON.stringify(convs));
    }

    const allUsers = this.getUsers();
    return {
      ...newMessage,
      sender: allUsers.find((u) => u.id === senderId),
    };
  }

  deleteMessage(messageId: string, userId: string): boolean {
    const allMessages = this.getMessagesAll();
    const msgIdx = allMessages.findIndex((m) => m.id === messageId);
    if (msgIdx === -1) return false;

    const message = allMessages[msgIdx];
    const convs = JSON.parse(
      localStorage.getItem(this.conversationsKey) || "[]",
    );
    const conv = convs.find(
      (c: Conversation) => c.id === message.conversationId,
    );

    if (!conv) return false;

    // Check permission: sender or group ADMIN/OWNER
    const member = conv.members.find((m: any) => m.userId === userId);
    const isSender = message.senderId === userId;
    const isAdminOrOwner =
      member && (member.role === "ADMIN" || member.role === "OWNER");

    if (!isSender && !isAdminOrOwner) {
      throw new Error("Permission denied to delete this message.");
    }

    // Soft deletion
    allMessages[msgIdx].deletedAt = new Date().toISOString();
    localStorage.setItem(this.messagesKey, JSON.stringify(allMessages));
    return true;
  }

  // Member Management & Roles
  removeUserFromGroup(
    conversationId: string,
    actorUserId: string,
    targetUserId: string,
  ): void {
    const convs: Conversation[] = JSON.parse(
      localStorage.getItem(this.conversationsKey) || "[]",
    );
    const convIdx = convs.findIndex((c) => c.id === conversationId);
    if (convIdx === -1) throw new Error("Conversation not found");

    const conv = convs[convIdx];
    const actorMember = conv.members.find((m) => m.userId === actorUserId);
    const targetMember = conv.members.find((m) => m.userId === targetUserId);

    if (!actorMember) throw new Error("You are not a member of this group");
    if (!targetMember) throw new Error("Target user is not in this group");

    // Only OWNER or ADMIN can remove users
    if (actorMember.role !== "OWNER" && actorMember.role !== "ADMIN") {
      throw new Error("Only admins or owners can remove members.");
    }

    // Admins cannot remove owners or other admins
    if (actorMember.role === "ADMIN") {
      if (targetMember.role === "OWNER" || targetMember.role === "ADMIN") {
        throw new Error("Admins cannot remove owners or other admins.");
      }
    }

    targetMember.leftAt = new Date().toISOString();
    localStorage.setItem(this.conversationsKey, JSON.stringify(convs));
  }

  updateGroupMemberRole(
    conversationId: string,
    actorUserId: string,
    targetUserId: string,
    newRole: MemberRole,
  ): void {
    const convs: Conversation[] = JSON.parse(
      localStorage.getItem(this.conversationsKey) || "[]",
    );
    const convIdx = convs.findIndex((c) => c.id === conversationId);
    if (convIdx === -1) throw new Error("Conversation not found");

    const conv = convs[convIdx];
    const actorMember = conv.members.find((m) => m.userId === actorUserId);
    const targetMember = conv.members.find((m) => m.userId === targetUserId);

    if (!actorMember || actorMember.role !== "OWNER") {
      throw new Error("Only the group owner can manage member roles.");
    }

    if (!targetMember) throw new Error("Target user is not in this group");

    targetMember.role = newRole;
    localStorage.setItem(this.conversationsKey, JSON.stringify(convs));
  }

  addUserToGroup(
    conversationId: string,
    actorUserId: string,
    targetUid: string,
  ): void {
    const targetUser = this.getUserByUid(targetUid);
    if (!targetUser) throw new Error("User with this UID does not exist.");

    const convs: Conversation[] = JSON.parse(
      localStorage.getItem(this.conversationsKey) || "[]",
    );
    const convIdx = convs.findIndex((c) => c.id === conversationId);
    if (convIdx === -1) throw new Error("Conversation not found");

    const conv = convs[convIdx];
    const actorMember = conv.members.find((m) => m.userId === actorUserId);

    if (
      !actorMember ||
      (actorMember.role !== "OWNER" && actorMember.role !== "ADMIN")
    ) {
      throw new Error("Only admins or owners can add new members.");
    }

    const existingMember = conv.members.find((m) => m.userId === targetUser.id);
    if (existingMember) {
      existingMember.leftAt = undefined;
    } else {
      conv.members.push({
        conversationId,
        userId: targetUser.id,
        role: "MEMBER",
        joinedAt: new Date().toISOString(),
      });
    }

    localStorage.setItem(this.conversationsKey, JSON.stringify(convs));
  }

  deleteConversationForUser(conversationId: string, userId: string): void {
    const convs: Conversation[] = JSON.parse(
      localStorage.getItem(this.conversationsKey) || "[]",
    );
    const convIdx = convs.findIndex((c) => c.id === conversationId);
    if (convIdx === -1) return;

    const member = convs[convIdx].members.find((m) => m.userId === userId);
    if (member) {
      member.hiddenAt = new Date().toISOString();
      member.leftAt = new Date().toISOString();
      localStorage.setItem(this.conversationsKey, JSON.stringify(convs));
    }
  }
}

export const messengerStore = new MessengerStore();
