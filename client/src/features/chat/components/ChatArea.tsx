import React, { useState, useEffect, useRef } from "react";

import {
  Paperclip,
  Image as ImageIcon,
  Video as VideoIcon,
  Users,
  Trash2,
  Send,
  Plus,
} from "lucide-react";

import { Conversation, MessageType, Message, User } from "../../../types/types";

import { MessageList } from "./MessageList";

import { FileUploadModal } from "./FileUploadModal";
import { GroupMembersModal } from "./GroupMembersModal";

import { motion } from "motion/react";

import { socket } from "../../../lib/socket";

import { userApi } from "../../../api/user.api";
import { chatApi } from "../../../api/chat.api";

import { RemoveChatModal } from "./RemoveChat";

import { presenceApi } from "../../../api/presence.api";

interface ChatAreaProps {
  conversation: Conversation;
  currentUser: User;
  onRefresh: () => void;
}

type Presence = {
  userId: string;
  online: boolean;
  lastSeenAt: string | null;
};

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  currentUser,
  onRefresh,
}) => {
  const [textMessage, setTextMessage] = useState("");

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  const [uploadModalType, setUploadModalType] = useState<MessageType | null>(
    null,
  );

  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);

  const messageInputRef = useRef<HTMLInputElement | null>(null);

  /*
   * Cursor used to fetch older messages.
   */
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  /*
   * Whether older messages exist.
   */
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  /*
   * Loading state.
   */
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [participantPresence, setParticipantPresence] = useState<Presence>();
  const [onlineParticipantIds, setOnlineParticipantIds] = useState<Set<string>>(
    new Set(),
  );

  /*
   * =====================================================
   * ISONLINE
   * =====================================================
   */

  useEffect(() => {
    const fetchParticipantPresence = async () => {
      try {
        const participantIds = conversation.members
          .filter(({ userId }) => userId !== currentUser.id)
          .map(({ userId }) => userId);

        // Direct conversation: check the other participant's presence
        if (conversation.type === "DIRECT") {
          const participantId = participantIds[0];

          if (!participantId) {
            setParticipantPresence(undefined);
            return;
          }

          const presence = await presenceApi.isParticipantOnline(participantId);

          setParticipantPresence(presence);
          return;
        }

        // Group conversation: count online participants
        if (participantIds.length === 0) {
          setOnlineParticipantIds(new Set());
          return;
        }

        const onlineIds =
          await presenceApi.onlineParticipantsIds(participantIds);

        setOnlineParticipantIds(new Set(onlineIds));
      } catch (error) {
        console.error("Failed to fetch participant presence:", error);
      }
    };

    fetchParticipantPresence();
  }, [conversation.members, conversation.type]);

  {
    /* TESTING -------------------------------------------------------------------------------*/
  }
  function formatLastSeen(date: string): string {
    const lastSeenDate = new Date(date);
    const now = new Date();

    const time = lastSeenDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Check if the date is today
    const isToday =
      lastSeenDate.getFullYear() === now.getFullYear() &&
      lastSeenDate.getMonth() === now.getMonth() &&
      lastSeenDate.getDate() === now.getDate();

    if (isToday) {
      return `Today ${time}`;
    }

    // Check if the date is yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
      lastSeenDate.getFullYear() === yesterday.getFullYear() &&
      lastSeenDate.getMonth() === yesterday.getMonth() &&
      lastSeenDate.getDate() === yesterday.getDate();

    if (isYesterday) {
      return `Yesterday ${time}`;
    }

    // Within the last 7 days
    const differenceInMs = now.getTime() - lastSeenDate.getTime();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    if (differenceInMs >= 0 && differenceInMs < sevenDaysInMs) {
      return (
        lastSeenDate.toLocaleDateString("en-US", {
          weekday: "short",
        }) +
        " " +
        time
      );
    }

    // Older than 7 days
    return lastSeenDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  useEffect(() => {
    const handlePresenceUpdate = (data: {
      userId: string;
      online: boolean;
      lastSeenAt: string | null;
    }) => {
      // Is this user a member of the current conversation?
      const isMember = conversation.members.some(
        ({ userId }) => userId === data.userId,
      );

      if (!isMember) {
        return;
      }

      // Only relevant for group conversations
      if (conversation.type !== "GROUP") {
        setParticipantPresence(data);
      }

      setOnlineParticipantIds((previous) => {
        const next = new Set(previous);

        if (data.online) {
          next.add(data.userId);
        } else {
          next.delete(data.userId);
        }

        return next;
      });
    };

    socket.on("presence:update", handlePresenceUpdate);

    return () => {
      socket.off("presence:update", handlePresenceUpdate);
    };
  }, [conversation.type, conversation.members]);

  /*
   * =====================================================
   * LOAD MESSAGES
   * =====================================================
   */

  useEffect(() => {
    let cancelled = false;

    const fetchMessages = async () => {
      try {
        setMessages([]);

        setNextCursor(null);

        setHasMoreMessages(true);

        setIsLoadingMessages(true);

        /*
         * Load existing messages.
         */
        const result = await chatApi.getMessages(conversation.id, {
          limit: 20,
        });

        if (cancelled) {
          return;
        }

        setMessages(result.messages);

        const lastMessage = result.messages[result.messages.length - 1];

        if (lastMessage) {
          console.log("called the conversation");

          socket.emit("conversation:read", {
            conversationId: conversation.id,
            lastReadSeq: lastMessage.seq,
            currentUser,
          });
        }

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

    /*
     * Focus input.
     */
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
    if (!conversation?.id) {
      return;
    }

    socket.emit("join_conversation", conversation.id);

    console.log("Joined conversation:", conversation.id);
    /*
     * Leave when conversation changes
     * or component unmounts.
     */
    return () => {
      socket.emit("leave_conversation", conversation.id);

      console.log("Left conversation:", conversation.id);
    };
  }, [conversation.id]);

  /*
   * =====================================================
   * SOCKET.IO — RECEIVE NEW MESSAGE
   * =====================================================
   */

  const shouldScrollToBottomRef = useRef(false);

  useEffect(() => {
    /*
     * Handle message received from backend.
     */
    const handleNewMessage = ({ message, senderId }) => {
      console.log("New message received:", message);

      /*
       * Make sure this message belongs
       * to the currently open conversation.
       */
      if (message.conversationId !== conversation.id) {
        return;
      }

      /*
       * Add message to UI.
       */
      setMessages((prev) => {
        //Prevent duplicates.
        const alreadyExists = prev.some(
          (existing) => existing.id === message.id,
        );

        if (alreadyExists) {
          return prev;
        }

        // Only auto-scroll when I sent the message.
        shouldScrollToBottomRef.current = senderId === currentUser.id;

        // New messages go at the end.
        return [...prev, message];
      });
    };

    /*
     * Start listening.
     */
    socket.on("new_message", handleNewMessage);

    /*
     * Cleanup listener.
     */
    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [conversation.id]);
  // please check the above the depended conversation id

  /*
   * =====================================================
   * LOAD OLDER MESSAGES
   * =====================================================
   */

  const loadOlderMessages = async (): Promise<void> => {
    /*
     * Prevent duplicate requests.
     */
    if (isLoadingMessages || !hasMoreMessages || !nextCursor) {
      return;
    }

    try {
      setIsLoadingMessages(true);

      const result = await chatApi.getMessages(conversation.id, {
        limit: 20,
        cursor: nextCursor,
      });

      /*
       * Older messages go BEFORE
       * existing messages.
       */
      setMessages((prev) => {
        const existingIds = new Set(prev.map((message) => message.id));

        const newMessages = result.messages.filter(
          (message: Message) => !existingIds.has(message.id),
        );

        return [...newMessages, ...prev];
      });

      /*
       * Update cursor.
       */
      setNextCursor(result.nextCursor);

      /*
       * Update hasMore.
       */
      setHasMoreMessages(result.hasMore);
    } catch (error) {
      console.error("Failed to load older messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  /*
   * =====================================================
   * GROUP PERMISSIONS
   * =====================================================
   */

  const currentMember = conversation.members.find(
    (m) => m.userId === currentUser.id,
  );

  const canManageGroup =
    conversation.type === "GROUP" &&
    (currentMember?.role === "OWNER" || currentMember?.role === "ADMIN");

  /*
   * =====================================================
   * SEND TEXT
   * =====================================================
   */

  const handleSendText = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const messageContent = textMessage.trim();

    /*
     * Don't send empty message.
     */
    if (!messageContent) {
      return;
    }

    try {
      /*
       * HTTP request.
       *
       * Backend saves message and
       * then broadcasts through Socket.IO.
       */
      await chatApi.sendMessage(conversation.id, currentUser.id, "TEXT", {
        content: messageContent,
      });

      /*
       * Clear input.
       */
      setTextMessage("");

      /*
       * DO NOT call onRefresh().
       *
       * Socket.IO will update messages.
       */
      messageInputRef.current?.focus();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  /*
   * =====================================================
   * SEND FILE / PHOTO / VIDEO
   * =====================================================
   */

  const handleSendFile = async (
    type: MessageType,
    file: File,
    caption?: string,
  ) => {
    try {
      /*
       * Still use HTTP/FormData for
       * the actual file upload.
       */
      await chatApi.sendMessage(conversation.id, currentUser.id, type, {
        content: caption,
        file,
      });

      /*
       * Socket.IO will broadcast
       * the resulting DB message.
       */
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

      /*
       * Keep your current refresh
       * until we implement message_deleted
       * Socket.IO events.
       */
      onRefresh();

      messageInputRef.current?.focus();
    } catch (err: any) {
      alert(err.message || "Cannot delete message.");
    }
  };

  /*
   * =====================================================
   * DELETE CONVERSATION
   * =====================================================
   */

  const handleDeleteConversation = async () => {
    setIsRemoveModalOpen(true);
  };

  const handleRemoveChat = async () => {
    try {
      if (conversation.type === "GROUP") {
        await userApi.deleteGroupConversation(conversation.id, currentUser.id);
      } else {
        await userApi.deleteDirectConversation(conversation.id, currentUser.id);
      }

      onRefresh();
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
    // Remove chat logic here
    setIsRemoveModalOpen(false);
  };

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <motion.div
      className="flex-1 h-full flex flex-col bg-black text-zinc-100 relative"
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
      }}
    >
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}
      <motion.div
        className="px-6 py-4 bg-zinc-950/90 border-b border-zinc-800/80 flex items-center justify-between z-10 backdrop-blur-md"
        initial={{
          opacity: 0,
          y: -10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
      >
        <div className="flex items-center gap-3">
          <img
            src={`http://localhost:5000${conversation.avatarUrl}`}
            alt={conversation.name}
            className="w-10 h-10 rounded-full object-cover border border-zinc-700"
          />

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white">
                {conversation.name!.charAt(0).toUpperCase() +
                  conversation.name!.slice(1).toLowerCase()}
              </h2>
            </div>

            {/*Online presence section*/}
            {conversation.type == "DIRECT" ? (
              <p className="text-xs text-zinc-400">
                {participantPresence?.online
                  ? "online"
                  : `Last seen ${formatLastSeen(participantPresence?.lastSeenAt!)}`}
              </p>
            ) : (
              <p className="text-xs text-zinc-400">{`${onlineParticipantIds.size} online`}</p>
            )}
          </div>
        </div>

        {/* Header buttons */}

        <div className="flex items-center gap-2">
          {conversation.type === "GROUP" && (
            <button
              onClick={() => setIsMembersModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Users size={14} />

              <span>Members ({conversation.members.length})</span>
            </button>
          )}

          <button
            onClick={handleDeleteConversation}
            title="Remove chat from account"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition-colors cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </motion.div>
      {/* ================================================= */}
      {/* MESSAGE LIST */}
      {/* ================================================= */}
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
      {/* ================================================= */}
      {/* MESSAGE INPUT */}
      {/* ================================================= */}
      <motion.div
        className="p-3 sm:p-4 bg-zinc-950/90 border-t border-zinc-800/80 z-10 backdrop-blur-md"
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0,
          ease: "easeOut",
        }}
      >
        <form
          onSubmit={handleSendText}
          className="w-full max-w-4xl mx-auto flex items-center gap-6 relative"
        >
          {/* Attachment button */}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-center ${
                showAttachmentMenu
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-800"
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
                className="absolute bottom-12 left-0 z-50 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 w-44"
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
                {/* PHOTO */}

                <button
                  type="button"
                  onClick={() => {
                    setUploadModalType("PHOTO");

                    setShowAttachmentMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-zinc-200 hover:bg-zinc-800 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <ImageIcon size={15} className="text-indigo-400" />

                  <span>Send Photo</span>
                </button>

                {/* VIDEO */}

                <button
                  type="button"
                  onClick={() => {
                    setUploadModalType("VIDEO");

                    setShowAttachmentMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-zinc-200 hover:bg-zinc-800 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <VideoIcon size={15} className="text-purple-400" />

                  <span>Send Video</span>
                </button>

                {/* FILE */}

                <button
                  type="button"
                  onClick={() => {
                    setUploadModalType("FILE");

                    setShowAttachmentMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-zinc-200 hover:bg-zinc-800 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
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
            onChange={(e) => setTextMessage(e.target.value)}
            placeholder="Type a message or attach media..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />

          {/* Send */}

          <motion.button
            type="submit"
            disabled={!textMessage.trim()}
            whileHover={
              textMessage.trim()
                ? {
                    scale: 1.05,
                  }
                : undefined
            }
            whileTap={
              textMessage.trim()
                ? {
                    scale: 0.95,
                  }
                : undefined
            }
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </motion.button>
        </form>
      </motion.div>
      {/* ================================================= */}
      {/* FILE UPLOAD MODAL */}
      {/* ================================================= */}
      <FileUploadModal
        isOpen={!!uploadModalType}
        onClose={() => setUploadModalType(null)}
        defaultType={uploadModalType || "FILE"}
        onSendFile={handleSendFile}
      />
      {/* ================================================= */}
      {/* GROUP MEMBERS */}
      {/* ================================================= */}
      {conversation.type === "GROUP" && (
        <GroupMembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          conversation={conversation}
          currentUserId={currentUser.id}
          onGroupUpdated={onRefresh}
        />
      )}
      {/* ================================================= */}
      {/* Remove chat Model */}
      {/* ================================================= */}
      {
        <RemoveChatModal
          isOpen={isRemoveModalOpen}
          onConfirm={handleRemoveChat}
          onCancel={() => setIsRemoveModalOpen(false)}
        />
      }
    </motion.div>
  );
};
