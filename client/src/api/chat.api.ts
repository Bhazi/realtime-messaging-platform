// messengerStore.ts
import { Conversation } from "../types/types";

export class MessengerStore {
  private conversations: Conversation[] = [];

  /**
   * Creates or retrieves a direct conversation from the Express backend
   */
  async createDirectConversation(targetUid: string): Promise {
    const token = localStorage.getItem("auth_token"); // Get auth token if using JWT

    const response = await fetch("http://localhost:5000/api/chat/direct", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ targetUid }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handles "User not found", "Cannot chat with yourself", etc.
      throw new Error(data.error || "Failed to create conversation");
    }

    const newConv: Conversation = data.conversation;

    // Update local state in memory so UI re-renders instantly
    const existingIndex = this.conversations.findIndex(
      (c) => c.id === newConv.id,
    );

    if (existingIndex !== -1) {
      // Replace existing conversation (unhidden state)
      this.conversations[existingIndex] = newConv;
    } else {
      // Prepend new conversation to top of list
      this.conversations.unshift(newConv);
    }

    return newConv;
  }
}

export const messengerStore = new MessengerStore();
