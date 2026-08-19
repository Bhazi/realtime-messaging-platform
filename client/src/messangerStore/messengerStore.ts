import {
  User,
  Conversation,
  Message,
  MemberRole,
  MessageType,
} from "../types/types";

import { userApi } from "../api/user.api";

// Initial Seed Users
export const SEED_USERS: User[] = [
  {
    id: "usr_john",
    uid: "8KX4P92M",
    username: "john",
    email: "john@luma.app",
    displayName: "John Doe",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "usr_sarah",
    uid: "3M9X7K2P",
    username: "sarah",
    email: "sarah@luma.app",
    displayName: "Sarah Smith",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80",
    createdAt: "2026-01-16T11:30:00Z",
  },
  {
    id: "usr_michael",
    uid: "7P2W9X4K",
    username: "michael",
    email: "michael@luma.app",
    displayName: "Michael Chen",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
    createdAt: "2026-01-18T09:15:00Z",
  },
  {
    id: "usr_david",
    uid: "9R4T8M1L",
    username: "david",
    email: "david@luma.app",
    displayName: "David Miller",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80",
    createdAt: "2026-02-01T14:20:00Z",
  },
  {
    id: "usr_elena",
    uid: "5V8L2N9Q",
    username: "elena",
    email: "elena@luma.app",
    displayName: "Elena Rostova",
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80",
    createdAt: "2026-02-05T16:45:00Z",
  },
];

// Initial Seed Conversations
export const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: "conv_john_sarah",
    type: "DIRECT",
    createdBy: "usr_john",
    createdAt: "2026-02-10T09:00:00Z",
    updatedAt: "2026-02-12T14:10:00Z",
    members: [
      {
        conversationId: "conv_john_sarah",
        userId: "usr_john",
        role: "MEMBER",
        joinedAt: "2026-02-10T09:00:00Z",
      },
      {
        conversationId: "conv_john_sarah",
        userId: "usr_sarah",
        role: "MEMBER",
        joinedAt: "2026-02-10T09:00:00Z",
      },
    ],
  },
  {
    id: "conv_john_michael",
    type: "DIRECT",
    createdBy: "usr_john",
    createdAt: "2026-02-11T11:00:00Z",
    updatedAt: "2026-02-12T13:30:00Z",
    members: [
      {
        conversationId: "conv_john_michael",
        userId: "usr_john",
        role: "MEMBER",
        joinedAt: "2026-02-11T11:00:00Z",
      },
      {
        conversationId: "conv_john_michael",
        userId: "usr_michael",
        role: "MEMBER",
        joinedAt: "2026-02-11T11:00:00Z",
      },
    ],
  },
  {
    id: "conv_group_devs",
    type: "GROUP",
    name: "Developers",
    avatarUrl:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=250&q=80",
    createdBy: "usr_john",
    createdAt: "2026-02-01T08:00:00Z",
    updatedAt: "2026-02-12T14:15:00Z",
    members: [
      {
        conversationId: "conv_group_devs",
        userId: "usr_john",
        role: "OWNER",
        joinedAt: "2026-02-01T08:00:00Z",
      },
      {
        conversationId: "conv_group_devs",
        userId: "usr_sarah",
        role: "ADMIN",
        joinedAt: "2026-02-01T08:05:00Z",
      },
      {
        conversationId: "conv_group_devs",
        userId: "usr_michael",
        role: "MEMBER",
        joinedAt: "2026-02-01T08:10:00Z",
      },
      {
        conversationId: "conv_group_devs",
        userId: "usr_david",
        role: "MEMBER",
        joinedAt: "2026-02-01T08:15:00Z",
      },
    ],
  },
  {
    id: "conv_group_friends",
    type: "GROUP",
    name: "Friends",
    avatarUrl:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=250&q=80",
    createdBy: "usr_john",
    createdAt: "2026-02-03T10:00:00Z",
    updatedAt: "2026-02-12T12:00:00Z",
    members: [
      {
        conversationId: "conv_group_friends",
        userId: "usr_john",
        role: "OWNER",
        joinedAt: "2026-02-03T10:00:00Z",
      },
      {
        conversationId: "conv_group_friends",
        userId: "usr_sarah",
        role: "MEMBER",
        joinedAt: "2026-02-03T10:05:00Z",
      },
      {
        conversationId: "conv_group_friends",
        userId: "usr_michael",
        role: "MEMBER",
        joinedAt: "2026-02-03T10:10:00Z",
      },
    ],
  },
  {
    id: "conv_group_family",
    type: "GROUP",
    name: "Family",
    avatarUrl:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=250&q=80",
    createdBy: "usr_sarah",
    createdAt: "2026-02-04T12:00:00Z",
    updatedAt: "2026-02-12T10:00:00Z",
    members: [
      {
        conversationId: "conv_group_family",
        userId: "usr_sarah",
        role: "OWNER",
        joinedAt: "2026-02-04T12:00:00Z",
      },
      {
        conversationId: "conv_group_family",
        userId: "usr_john",
        role: "MEMBER",
        joinedAt: "2026-02-04T12:05:00Z",
      },
      {
        conversationId: "conv_group_family",
        userId: "usr_elena",
        role: "MEMBER",
        joinedAt: "2026-02-04T12:10:00Z",
      },
    ],
  },
];

// Initial Seed Messages (Text + Photo + Video + File)
export const SEED_MESSAGES: Message[] = [
  // John <-> Sarah chat messages
  {
    id: "msg_0",
    conversationId: "conv_john_sarah",
    senderId: "usr_john",
    type: "TEXT",
    content: "Hey Sarah! Are you coming to tomorrow's design review meeting?",
    createdAt: "2026-02-12T13:30:00Z",
  },
  {
    id: "msg_0b",
    conversationId: "conv_john_sarah",
    senderId: "usr_sarah",
    type: "TEXT",
    content: "Yes I'll be there! I just finished the new architecture draft.",
    createdAt: "2026-02-12T13:35:00Z",
  },
  {
    id: "msg_1",
    conversationId: "conv_john_sarah",
    senderId: "usr_sarah",
    type: "PHOTO",
    content: "Check out this architectural layout draft:",
    createdAt: "2026-02-12T13:40:00Z",
    attachment: {
      id: "att_1",
      storageKey: "photos/photo_architecture.jpg",
      filename: "photo_architecture.jpg",
      mimeType: "image/jpeg",
      size: 1845000,
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80",
    },
  },
  {
    id: "msg_2",
    conversationId: "conv_john_sarah",
    senderId: "usr_john",
    type: "VIDEO",
    content: "Awesome layout! Here is the video demo of the app preview:",
    createdAt: "2026-02-12T13:55:00Z",
    attachment: {
      id: "att_2",
      storageKey: "videos/app_demo_preview.mp4",
      filename: "app_demo_preview.mp4",
      mimeType: "video/mp4",
      size: 8420000,
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    },
  },
  {
    id: "msg_3",
    conversationId: "conv_john_sarah",
    senderId: "usr_sarah",
    type: "FILE",
    content: "And here is the complete design system PDF document.",
    createdAt: "2026-02-12T14:10:00Z",
    attachment: {
      id: "att_3",
      storageKey: "docs/luma_design_system_v2.pdf",
      filename: "luma_design_system_v2.pdf",
      mimeType: "application/pdf",
      size: 3450000,
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    },
  },

  // Developers Group messages
  {
    id: "msg_4a",
    conversationId: "conv_group_devs",
    senderId: "usr_john",
    type: "TEXT",
    content: "Hey everyone, welcome to the Developers project workspace! 🚀",
    createdAt: "2026-02-12T10:45:00Z",
  },
  {
    id: "msg_4",
    conversationId: "conv_group_devs",
    senderId: "usr_sarah",
    type: "FILE",
    content: "Here is the v3 database schema file for PostgreSQL:",
    createdAt: "2026-02-12T11:00:00Z",
    attachment: {
      id: "att_4",
      storageKey: "docs/database_schema_v3.sql",
      filename: "database_schema_v3.sql",
      mimeType: "text/x-sql",
      size: 142000,
      url: "https://raw.githubusercontent.com/prisma/prisma/main/README.md",
    },
  },
  {
    id: "msg_5a",
    conversationId: "conv_group_devs",
    senderId: "usr_michael",
    type: "TEXT",
    content: "Thanks Sarah, schema looks super clean! 👍",
    createdAt: "2026-02-12T12:00:00Z",
  },
  {
    id: "msg_5",
    conversationId: "conv_group_devs",
    senderId: "usr_michael",
    type: "PHOTO",
    content: "Here is the matching UI dashboard mockup:",
    createdAt: "2026-02-12T12:30:00Z",
    attachment: {
      id: "att_5",
      storageKey: "photos/ui_dashboard_mockup.png",
      filename: "ui_dashboard_mockup.png",
      mimeType: "image/png",
      size: 2150000,
      url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80",
    },
  },
  {
    id: "msg_6",
    conversationId: "conv_group_devs",
    senderId: "usr_john",
    type: "FILE",
    content: "Great work team. Here is the full v1.0 release bundle zip:",
    createdAt: "2026-02-12T14:15:00Z",
    attachment: {
      id: "att_6",
      storageKey: "archives/luma_release_bundle_v1.0.zip",
      filename: "luma_release_bundle_v1.0.zip",
      mimeType: "application/zip",
      size: 15400000,
      url: "#",
    },
  },

  // Friends Group messages
  {
    id: "msg_7a",
    conversationId: "conv_group_friends",
    senderId: "usr_john",
    type: "TEXT",
    content: "Who's free for dinner this Friday?",
    createdAt: "2026-02-12T11:30:00Z",
  },
  {
    id: "msg_7",
    conversationId: "conv_group_friends",
    senderId: "usr_michael",
    type: "PHOTO",
    content: "I'm in! Throwback to last weekend:",
    createdAt: "2026-02-12T12:00:00Z",
    attachment: {
      id: "att_7",
      storageKey: "photos/weekend_hangout.jpg",
      filename: "weekend_hangout.jpg",
      mimeType: "image/jpeg",
      size: 3200000,
      url: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1000&q=80",
    },
  },
];

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
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/user/id/${id}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.status === 404) return undefined;
      if (!response.ok) throw new Error("Failed to fetch user by ID");

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      return undefined;
    }
  }

  async getUserByUid(uid: string): Promise<User | undefined> {
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/users/uid/${uid}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.status === 404) return undefined;
      if (!response.ok) throw new Error("Failed to fetch user by UID");

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error fetching user by UID:", error);
      return undefined;
    }
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

  async updateUserProfile(
    userId: string,
    updates: Partial<User>,
  ): Promise<User> {
    console.log(userId, updates);
    const response = await fetch(
      "http://localhost:5000/api/v1/users/profile/update",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          updates,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update profile");
    }

    const result = await response.json();
    const updatedUser: User = result.user;

    console.log(updatedUser, "from the messenger updateProfile");

    // Sync current user state if updating logged-in user
    if (this.getCurrentUser()?.id === userId) {
      localStorage.setItem(this.currentUserKey, JSON.stringify(updatedUser));
    }

    return updatedUser;
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
  ): Promise<Conversation> {
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

    console.log(newConv, "messengerStore create direct conversation");

    return newConv;
  }

  async createGroupConversation(formData: any): Promise<Conversation> {
    const response = await fetch("http://localhost:5000/api/v1/chat/group", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create group conversation");
    }

    return data.conversation;
  }

  // Messages
  async getMessagesAll(): Promise<Message[]> {
    try {
      const response = await fetch(
        "http://localhost:5000/api/v1/chat/messages/all",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch all messages");
      }

      const messages: Message[] = await response.json();
      return messages;
    } catch (error) {
      console.error("Error fetching all messages:", error);
      return [];
    }
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const allMessages = await this.getMessagesAll();
    const allUsers = await this.getUsers();

    return allMessages
      .filter((m) => m.conversationId === conversationId)
      .map((m) => ({
        ...m,
        sender: allUsers.find((u) => u.id === m.senderId),
      }));
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    type: MessageType,
    data: {
      content?: string;
      file?: File;
    },
  ): Promise<Message> {
    const formData = new FormData();
    formData.append("conversationId", conversationId);
    formData.append("senderId", senderId);
    formData.append("type", type);

    if (data.content) {
      formData.append("content", data.content);
    }

    if (data.file) {
      formData.append("file", data.file);
    }

    const response = await fetch("http://localhost:5000/api/v1/chat/send", {
      method: "POST",
      // Note: Do NOT set Content-Type header when sending FormData; browser sets boundary automatically
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to send message");
    }

    const result = await response.json();
    return result.data;
  }

  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    const response = await fetch(
      `http://localhost:5000/api/v1/chat/messages/${messageId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete message.");
    }

    const data = await response.json();
    return data.success;
  }

  async removeUserFromGroup(
    conversationId: string,
    actorUserId: string,
    targetUserId: string,
  ): Promise<void> {
    const response = await fetch(
      `http://localhost:5000/api/v1/users/groups/${conversationId}/members/${targetUserId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorUserId }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to remove user from group.");
    }
  }

  async updateGroupMemberRole(
    conversationId: string,
    actorUserId: string,
    targetUserId: string,
    newRole: MemberRole,
  ): Promise<void> {
    const response = await fetch(
      `http://localhost:5000/api/v1/users/groups/${conversationId}/members/role`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorUserId, targetUserId, newRole }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update member role.");
    }
  }

  async addUserToGroup(
    conversationId: string,
    currentUserId: string,
    targetUid: string,
  ): Promise<void> {
    const response = await fetch(
      "http://localhost:5000/api/v1/chat/group/add-user",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          currentUserId,
          targetUid,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to add user to group.");
    }
  }

  async deleteGroupConversation(
    conversationId: string,
    currentUserId: string,
  ): Promise<void> {
    const response = await fetch(
      `http://localhost:5000/api/v1/users/group/${conversationId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentUserId }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to delete group conversation.",
      );
    }
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const response = await fetch(
      "http://localhost:5000/api/v1/users/password/change",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          oldPassword,
          newPassword,
        }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to change password");
    }

    return result.success; // Returns true
  }
}

export const messengerStore = new MessengerStore();
