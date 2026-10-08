import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Image as ImageIcon,
  Paperclip,
  Plus,
  Send,
  Trash2,
  Users,
  Video as VideoIcon,
} from "lucide-react";
import { motion } from "motion/react";

import type {
  Conversation,
  Message,
  MessageReceipt,
  MessageType,
  User,
} from "../../../types/types";

import { chatApi } from "../../../api/chat.api";
import { presenceApi } from "../../../api/presence.api";
import { userApi } from "../../../api/user.api";
import { socket } from "../../../lib/socket";

import { FileUploadModal } from "./FileUploadModal";
import { GroupMembersModal } from "./GroupMembersModal";
import { MessageList } from "./MessageList";
import { RemoveChatModal } from "./RemoveChat";

interface ChatAreaProps {
  conversation: Conversation;
  currentUser: User;
  onRefresh: () => void;
}

interface Presence {
  userId: string;
  online: boolean;
  lastSeenAt: string | null;
}

const API_URL = "http://localhost:5000";

export const ChatArea = ({
  conversation,
  currentUser,
  onRefresh,
}: ChatAreaProps) => {
  const [textMessage, setTextMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [participantPresence, setParticipantPresence] = useState<
    Presence | undefined
  >();

  const [onlineParticipantIds, setOnlineParticipantIds] = useState<Set<string>>(
    new Set(),
  );

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const [uploadModalType, setUploadModalType] = useState<MessageType | null>(
    null,
  );

  const messageInputRef = useRef<HTMLInputElement>(null);
  const shouldScrollToBottomRef = useRef(false);

  /*
   * =====================================================
   * DERIVED VALUES
   * =====================================================
   */

  const currentMember = conversation.members.find(
    (member) => member.userId === currentUser.id,
  );

  const canManageGroup =
    conversation.type === "GROUP" &&
    (currentMember?.role === "OWNER" || currentMember?.role === "ADMIN");

  const isGroup = conversation.type === "GROUP";
  const isDirect = conversation.type === "DIRECT";

  /*
   * =====================================================
   * PRESENCE
   * =====================================================
   */

  useEffect(() => {
    let cancelled = false;

    const fetchPresence = async () => {
      const participantIds = conversation.members
        .filter((member) => member.userId !== currentUser.id)
        .map((member) => member.userId);

      try {
        if (isDirect) {
          const participantId = participantIds[0];

          if (!participantId) {
            setParticipantPresence(undefined);
            return;
          }

          const presence = await presenceApi.isParticipantOnline(participantId);

          if (!cancelled) {
            setParticipantPresence(presence);
          }

          return;
        }

        if (participantIds.length === 0) {
          setOnlineParticipantIds(new Set());
          return;
        }

        const onlineIds =
          await presenceApi.onlineParticipantsIds(participantIds);

        if (!cancelled) {
          setOnlineParticipantIds(new Set(onlineIds));
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch participant presence:", error);
        }
      }
    };

    fetchPresence();

    return () => {
      cancelled = true;
    };
  }, [conversation.members, currentUser.id, isDirect]);

  useEffect(() => {
    const handlePresenceUpdate = (presence: Presence) => {
      const isMember = conversation.members.some(
        (member) => member.userId === presence.userId,
      );

      if (!isMember || presence.userId === currentUser.id) {
        return;
      }

      if (isDirect) {
        setParticipantPresence(presence);
        return;
      }

      setOnlineParticipantIds((previous) => {
        const next = new Set(previous);

        if (presence.online) {
          next.add(presence.userId);
        } else {
          next.delete(presence.userId);
        }

        return next;
      });
    };

    socket.on("presence:update", handlePresenceUpdate);

    return () => {
      socket.off("presence:update", handlePresenceUpdate);
    };
  }, [conversation.members, currentUser.id, isDirect]);

  /*
   * =====================================================
   * HELPERS
   * =====================================================
   */

  const formatLastSeen = (date: string): string => {
    const lastSeenDate = new Date(date);
    const now = new Date();

    const time = lastSeenDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const isSameDay = (first: Date, second: Date) =>
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate();

    if (isSameDay(lastSeenDate, now)) {
      return `Today ${time}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(lastSeenDate, yesterday)) {
      return `Yesterday ${time}`;
    }

    const differenceInMs = now.getTime() - lastSeenDate.getTime();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    if (differenceInMs >= 0 && differenceInMs < sevenDaysInMs) {
      return `${lastSeenDate.toLocaleDateString("en-US", {
        weekday: "short",
      })} ${time}`;
    }

    return lastSeenDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const updateMessageReceipt = (messageId: string, receipt: MessageReceipt) => {
    setMessages((previous) =>
      previous.map((message) => {
        if (message.id !== messageId) {
          return message;
        }

        const receipts = (message.receipts ?? []).filter(
          (existingReceipt) => existingReceipt.userId !== receipt.userId,
        );

        return {
          ...message,
          receipts: [...receipts, receipt],
        };
      }),
    );
  };

  /*
   * =====================================================
   * LOAD MESSAGES
   * =====================================================
   */

  useEffect(() => {
    let cancelled = false;

    const fetchMessages = async () => {
      setMessages([]);
      setNextCursor(null);
      setHasMoreMessages(true);
      setIsLoadingMessages(true);

      try {
        const result = await chatApi.getMessages(conversation.id, {
          limit: 20,
        });

        if (cancelled) {
          return;
        }

        setMessages(result.messages);
        setNextCursor(result.nextCursor);
        setHasMoreMessages(result.hasMore);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Failed to load messages:", error);

        setMessages([]);
        setNextCursor(null);
        setHasMoreMessages(false);
      } finally {
        if (!cancelled) {
          setIsLoadingMessages(false);
        }
      }
    };

    fetchMessages();
    messageInputRef.current?.focus();

    return () => {
      cancelled = true;
    };
  }, [conversation.id]);

  /*
   * =====================================================
   * SOCKET.IO — JOIN / LEAVE CONVERSATION
   * =====================================================
   */

  useEffect(() => {
    const conversationId = conversation.id;

    socket.emit("join_conversation", conversationId);

    return () => {
      socket.emit("leave_conversation", conversationId);
    };
  }, [conversation.id]);

  /*
   * =====================================================
   * SOCKET.IO — MESSAGE RECEIPTS
   * =====================================================
   */

  useEffect(() => {
    const handleMessageDelivered = ({
      messageId,
      conversationId,
      receipt,
    }: {
      messageId: string;
      conversationId: string;
      receipt: MessageReceipt;
    }) => {
      if (conversationId !== conversation.id) {
        return;
      }

      updateMessageReceipt(messageId, receipt);
    };

    socket.on("message:delivered", handleMessageDelivered);

    return () => {
      socket.off("message:delivered", handleMessageDelivered);
    };
  }, [conversation.id]);

  useEffect(() => {
    const handleMessageRead = ({
      messageId,
      conversationId,
      receipt,
    }: {
      messageId: string;
      conversationId: string;
      receipt: MessageReceipt;
    }) => {
      if (conversationId !== conversation.id) {
        return;
      }

      updateMessageReceipt(messageId, receipt);
    };

    socket.on("message:read", handleMessageRead);

    return () => {
      socket.off("message:read", handleMessageRead);
    };
  }, [conversation.id]);

  /*
   * =====================================================
   * SOCKET.IO — NEW MESSAGE
   * =====================================================
   */

  useEffect(() => {
    const handleNewMessage = ({
      conversationId,
      message,
      senderId,
    }: {
      conversationId: string;
      message: Message;
      senderId: string;
    }) => {
      if (conversationId !== conversation.id) {
        return;
      }

      setMessages((previous) => {
        const alreadyExists = previous.some(
          (existingMessage) => existingMessage.id === message.id,
        );

        if (alreadyExists) {
          return previous;
        }

        shouldScrollToBottomRef.current = senderId === currentUser.id;

        return [...previous, message];
      });
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [conversation.id, currentUser.id]);

  /*
   * =====================================================
   * LOAD OLDER MESSAGES
   * =====================================================
   */

  const loadOlderMessages = async (): Promise<void> => {
    if (isLoadingMessages || !hasMoreMessages || !nextCursor) {
      return;
    }

    setIsLoadingMessages(true);

    try {
      const result = await chatApi.getMessages(conversation.id, {
        limit: 20,
        cursor: nextCursor,
      });

      setMessages((previous) => {
        const existingIds = new Set(previous.map((message) => message.id));

        const olderMessages = result.messages.filter(
          (message: Message) => !existingIds.has(message.id),
        );

        return [...olderMessages, ...previous];
      });

      setNextCursor(result.nextCursor);
      setHasMoreMessages(result.hasMore);
    } catch (error) {
      console.error("Failed to load older messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  /*
   * =====================================================
   * SEND MESSAGE
   * =====================================================
   */

  const handleSendText = async (event?: FormEvent) => {
    event?.preventDefault();

    const content = textMessage.trim();

    if (!content) {
      return;
    }

    try {
      await chatApi.sendMessage(conversation.id, currentUser.id, "TEXT", {
        content,
      });

      setTextMessage("");
      messageInputRef.current?.focus();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  /*
   * =====================================================
   * SEND FILE
   * =====================================================
   */

  const handleSendFile = async (
    type: MessageType,
    file: File,
    caption?: string,
  ) => {
    try {
      await chatApi.sendMessage(conversation.id, currentUser.id, type, {
        content: caption,
        file,
      });

      messageInputRef.current?.focus();
    } catch (error) {
      console.error("Failed to send file:", error);
    }
  };

  /*
   * =====================================================
   * DELETE MESSAGE
   * =====================================================
   */

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await chatApi.deleteMessage(messageId, currentUser.id);

      onRefresh();

      messageInputRef.current?.focus();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Cannot delete message.";

      alert(message);
    }
  };

  /*
   * =====================================================
   * DELETE CONVERSATION
   * =====================================================
   */

  const handleDeleteConversation = () => {
    setIsRemoveModalOpen(true);
  };

  const handleRemoveChat = async () => {
    try {
      if (isGroup) {
        await userApi.deleteGroupConversation(conversation.id, currentUser.id);
      } else {
        await userApi.deleteDirectConversation(conversation.id, currentUser.id);
      }

      onRefresh();
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    } finally {
      setIsRemoveModalOpen(false);
    }
  };

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  const displayName =
    conversation.name!.charAt(0).toUpperCase() +
    conversation.name!.slice(1).toLowerCase();

  return (
    <motion.div
      className="relative flex h-full flex-1 flex-col bg-black text-zinc-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
      }}
    >
      {/* Header */}
      <motion.header
        className="z-10 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/90 px-6 py-4 backdrop-blur-md"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
      >
        <div className="flex items-center gap-3">
          <img
            src={`${API_URL}${conversation.avatarUrl}`}
            alt={conversation.name ?? "Conversation"}
            className="h-10 w-10 rounded-full border border-zinc-700 object-cover"
          />

          <div>
            <h2 className="text-sm font-bold text-white sm:text-base">
              {displayName}
            </h2>

            {isDirect ? (
              <p className="text-xs text-zinc-400">
                {participantPresence?.online
                  ? "Online"
                  : participantPresence?.lastSeenAt
                    ? `Last seen ${formatLastSeen(
                        participantPresence.lastSeenAt,
                      )}`
                    : "Offline"}
              </p>
            ) : (
              <p className="text-xs text-zinc-400">
                {onlineParticipantIds.size} online
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isGroup && (
            <button
              type="button"
              onClick={() => setIsMembersModalOpen(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <Users size={14} />
              <span>Members ({conversation.members.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDeleteConversation}
            title="Remove chat from account"
            className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </motion.header>

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={currentUser.id}
        onDeleteMessage={handleDeleteMessage}
        canManageMessages={canManageGroup}
        conversationId={conversation.id}
        onLoadOlderMessages={loadOlderMessages}
        hasMoreMessages={hasMoreMessages}
        isLoadingOlderMessages={isLoadingMessages}
        conversationType={conversation.type}
        shouldScrollToBottomRef={shouldScrollToBottomRef}
      />

      {/* Message input */}
      <motion.div
        className="z-10 border-t border-zinc-800/80 bg-zinc-950/90 p-3 backdrop-blur-md sm:p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0,
          ease: "easeOut",
        }}
      >
        <form
          onSubmit={handleSendText}
          className="relative mx-auto flex w-full max-w-4xl items-center gap-6"
        >
          {/* Attachment menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAttachmentMenu((previous) => !previous)}
              className={`flex cursor-pointer items-center justify-center rounded-xl border p-2.5 transition-colors ${
                showAttachmentMenu
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
              title="Attach media or files"
            >
              <Plus
                size={18}
                className={`transition-transform ${
                  showAttachmentMenu ? "rotate-45" : ""
                }`}
              />
            </button>

            {showAttachmentMenu && (
              <motion.div
                className="absolute bottom-12 left-0 z-50 flex w-44 flex-col gap-1 rounded-2xl border border-zinc-800 bg-zinc-900 p-2 shadow-2xl"
                initial={{
                  opacity: 0,
                  y: 8,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                transition={{
                  duration: 0.15,
                  ease: "easeOut",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setUploadModalType("PHOTO");
                    setShowAttachmentMenu(false);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
                >
                  <ImageIcon size={15} className="text-indigo-400" />
                  <span>Send Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUploadModalType("VIDEO");
                    setShowAttachmentMenu(false);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
                >
                  <VideoIcon size={15} className="text-purple-400" />
                  <span>Send Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUploadModalType("FILE");
                    setShowAttachmentMenu(false);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
                >
                  <Paperclip size={15} className="text-cyan-400" />
                  <span>Attach File</span>
                </button>
              </motion.div>
            )}
          </div>

          {/* Input */}
          <input
            ref={messageInputRef}
            type="text"
            value={textMessage}
            onChange={(event) => setTextMessage(event.target.value)}
            placeholder="Type a message or attach media..."
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 transition-colors focus:border-indigo-500 focus:outline-none sm:text-sm"
          />

          {/* Send */}
          <motion.button
            type="submit"
            disabled={!textMessage.trim()}
            whileHover={textMessage.trim() ? { scale: 1.05 } : undefined}
            whileTap={textMessage.trim() ? { scale: 0.95 } : undefined}
            className="flex cursor-pointer items-center justify-center rounded-xl bg-indigo-600 p-2.5 text-white shadow-md transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"
          >
            <Send size={16} />
          </motion.button>
        </form>
      </motion.div>

      {/* File upload */}
      <FileUploadModal
        isOpen={uploadModalType !== null}
        onClose={() => setUploadModalType(null)}
        defaultType={uploadModalType ?? "FILE"}
        onSendFile={handleSendFile}
      />

      {/* Group members */}
      {isGroup && (
        <GroupMembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          conversation={conversation}
          currentUserId={currentUser.id}
          onGroupUpdated={onRefresh}
        />
      )}

      {/* Remove conversation */}
      <RemoveChatModal
        isOpen={isRemoveModalOpen}
        onConfirm={handleRemoveChat}
        onCancel={() => setIsRemoveModalOpen(false)}
      />
    </motion.div>
  );
};
