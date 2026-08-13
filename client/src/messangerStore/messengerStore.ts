import {
  User,
  Conversation,
  Message,
  MemberRole,
  MessageType,
} from "../types/types";

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
  getUsers(): User[] {
    try {
      const data = localStorage.getItem(this.usersKey);
      return data ? JSON.parse(data) : SEED_USERS;
    } catch {
      return SEED_USERS;
    }
  }

  getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  getUserByUid(uid: string): User | undefined {
    const cleanUid = uid.trim().toUpperCase();
    return this.getUsers().find((u) => u.uid.toUpperCase() === cleanUid);
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

  setCurrentUser(user: User): void {
    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
    // also ensure user exists in users table
    const users = this.getUsers();
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

  // Conversations
  getConversations(userId: string): Conversation[] {
    try {
      const data = localStorage.getItem(this.conversationsKey);
      const convs: Conversation[] = data
        ? JSON.parse(data)
        : SEED_CONVERSATIONS;
      const allUsers = this.getUsers();

      // Filter conversations where userId is a member and hasn't left or hidden it
      const userConvs = convs.filter((c) =>
        c.members.some((m) => m.userId === userId && !m.leftAt && !m.hiddenAt),
      );

      // Populate user references & last messages
      const allMessages = this.getMessagesAll();

      return userConvs.map((c) => {
        const enrichedMembers = c.members.map((m) => ({
          ...m,
          user: allUsers.find((u) => u.id === m.userId),
        }));

        const convMessages = allMessages.filter(
          (m) => m.conversationId === c.id,
        );
        const lastMessage = convMessages.length
          ? convMessages[convMessages.length - 1]
          : undefined;

        // For direct chats, name and avatar come from the target user
        let name = c.name;
        let avatarUrl = c.avatarUrl;

        if (c.type === "DIRECT") {
          const otherMember = enrichedMembers.find((m) => m.userId !== userId);
          if (otherMember?.user) {
            name = otherMember.user.displayName;
            avatarUrl = otherMember.user.avatarUrl;
          }
        }

        return {
          ...c,
          name,
          avatarUrl,
          members: enrichedMembers,
          lastMessage,
        };
      });
    } catch {
      return [];
    }
  }

  getConversationById(id: string): Conversation | undefined {
    const current = this.getCurrentUser();
    const convs = this.getConversations(current.id);
    return convs.find((c) => c.id === id);
  }

  createDirectConversation(
    currentUserId: string,
    targetUid: string,
  ): Conversation {
    const targetUser = this.getUserByUid(targetUid);
    if (!targetUser) {
      throw new Error("User not found with provided UID.");
    }
    if (targetUser.id === currentUserId) {
      throw new Error("You cannot start a direct chat with yourself.");
    }

    const allConvs: Conversation[] = JSON.parse(
      localStorage.getItem(this.conversationsKey) || "[]",
    );

    // Check if direct conversation already exists between these 2
    const existing = allConvs.find(
      (c) =>
        c.type === "DIRECT" &&
        c.members.some((m) => m.userId === currentUserId) &&
        c.members.some((m) => m.userId === targetUser.id),
    );

    if (existing) {
      // Unhide if hidden
      existing.members = existing.members.map((m) =>
        m.userId === currentUserId ? { ...m, hiddenAt: undefined } : m,
      );
      localStorage.setItem(this.conversationsKey, JSON.stringify(allConvs));
      return existing;
    }

    const newConv: Conversation = {
      id: `conv_${Date.now()}`,
      type: "DIRECT",
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: [
        {
          conversationId: `conv_${Date.now()}`,
          userId: currentUserId,
          role: "MEMBER",
          joinedAt: new Date().toISOString(),
        },
        {
          conversationId: `conv_${Date.now()}`,
          userId: targetUser.id,
          role: "MEMBER",
          joinedAt: new Date().toISOString(),
        },
      ],
    };

    allConvs.unshift(newConv);
    localStorage.setItem(this.conversationsKey, JSON.stringify(allConvs));
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
