import { Conversation, Message, MessageType } from "../types/types";
import { apiFetch } from "./apiClient";

export const chatApi = {
  createDirectConversation: async (
    currentUserId: string,
    targetUid: string,
  ): Promise<Conversation> => {
    let conversations: Conversation[] = [];

    const response = await apiFetch("/chat/direct", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
  },

  createGroupConversation: async (formData: any): Promise<Conversation> => {
    const response = await apiFetch("/chat/group", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create group conversation");
    }

    return data.conversation;
  },

  deleteMessage: async (messageId: string): Promise<boolean> => {
    const response = await apiFetch(`/chat/messages/${messageId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete message.");
    }

    const data = await response.json();
    return data.success;
  },

  getConversations: async (): Promise<Conversation[]> => {
    const response = await apiFetch(`/chat/conversations`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch conversations");
    }

    const conversations: Conversation[] = await response.json();

    return conversations;
  },

  getMessages: async (
    conversationId: string,
    options?: {
      limit?: number;
      cursor?: string | null;
    },
  ) => {
    const limit = options?.limit ?? 50;

    const params = new URLSearchParams();

    params.set("limit", String(limit));

    if (options?.cursor) {
      params.set("cursor", options.cursor);
    }

    const response = await apiFetch(
      `/chat/conversations/${conversationId}/messages?${params.toString()}`,
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
  },

  sendMessage: async (
    conversationId: string,
    type: MessageType,
    data: {
      content?: string;
      file?: File;
    },
  ): Promise<Message> => {
    const formData = new FormData();
    formData.append("conversationId", conversationId);
    formData.append("type", type);

    if (data.content) {
      formData.append("content", data.content);
    }

    if (data.file) {
      formData.append("file", data.file);
    }
    console.log("reached here");

    const response = await apiFetch(
      `/chat/conversations/${conversationId}/messages`,
      {
        method: "POST",
        // Note: Do NOT set Content-Type header when sending FormData; browser sets boundary automatically
        body: formData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to send message");
    }

    const result = await response.json();
    return result.data;
  },
};
