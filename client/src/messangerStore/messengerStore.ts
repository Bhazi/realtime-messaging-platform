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
  private token = "auth_token";
  private currentUserKey = "luma_user";

  constructor() {}

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

  getCurrentUser(): User | null {
    const item = localStorage.getItem(this.currentUserKey);

    if (item) {
      const data = JSON.parse(item);

      if (Date.now() > data.expiresAt) {
        // Expired
        localStorage.removeItem(this.currentUserKey);
        localStorage.removeItem(this.token);
        return null;
      } else {
        return data.user;
      }
    }
    return null;
  }

  setCurrentUser(user: User): void {
    // Save for 5 minutes
    const expiresIn = 5 * 60 * 1000;

    localStorage.setItem(
      this.currentUserKey,
      JSON.stringify({
        user,
        expiresAt: Date.now() + expiresIn,
      }),
    );
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

  async getMessages(
    conversationId: string,
    options?: {
      limit?: number;
      cursor?: string | null;
    },
  ): Promise<MessagesPage> {
    const limit = options?.limit ?? 50;

    const params = new URLSearchParams();

    params.set("limit", String(limit));

    if (options?.cursor) {
      params.set("cursor", options.cursor);
    }

    const response = await fetch(
      `http://localhost:5000/api/v1/chat/conversations/${conversationId}/messages?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }

    return await response.json();
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
