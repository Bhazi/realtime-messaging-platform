export type MemberRole = "OWNER" | "ADMIN" | "MEMBER";
export type ConversationType = "DIRECT" | "GROUP";
export type MessageType = "TEXT" | "PHOTO" | "VIDEO" | "FILE";

export interface User {
  id: string;
  uid: string; // Public UID e.g. 8KX4P92M
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  createdAt: string;
}

export interface ConversationMember {
  conversationId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
  leftAt?: string;
  hiddenAt?: string;
  user?: User;
}

export interface MessageAttachment {
  id: string;
  storageKey: string;
  filename: string;
  mimeType: string;
  size: number; // in bytes
  url: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content?: string | null;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string; // soft deletion
  attachment?: MessageAttachment | null;
  sender?: User;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  avatarUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: ConversationMember[];
  lastMessage?: Message;
  unreadCount: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
