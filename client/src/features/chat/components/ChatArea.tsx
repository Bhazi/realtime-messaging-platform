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

import { messengerStore } from "../../../messangerStore/messengerStore";

interface ChatAreaProps {
  conversation: Conversation;
  currentUser: User;
  onRefresh: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  currentUser,
  onRefresh,
}) => {
  const [textMessage, setTextMessage] = useState("");

  const [uploadModalType, setUploadModalType] = useState<MessageType | null>(
    null,
  );

  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const messageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setMessages([]);

        const result = await messengerStore.getMessages(conversation.id);

        setMessages(result);
      } catch (error) {
        console.error("Failed to load messages:", error);

        setMessages([]);
      }
    };

    fetchMessages();

    messageInputRef.current?.focus();
  }, [conversation.id]);

  const currentMember = conversation.members.find(
    (m) => m.userId === currentUser.id,
  );

  const canManageGroup =
    conversation.type === "GROUP" &&
    (currentMember?.role === "OWNER" || currentMember?.role === "ADMIN");

  const handleSendText = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const messageContent = textMessage.trim();

    try {
      await messengerStore.sendMessage(
        conversation.id,
        currentUser.id,
        "TEXT",
        {
          content: messageContent,
        },
      );

      setTextMessage("");

      onRefresh();

      messageInputRef.current?.focus();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleSendFile = async (
    type: MessageType,
    file: File,
    caption?: string,
  ) => {
    try {
      await messengerStore.sendMessage(conversation.id, currentUser.id, type, {
        content: caption,
        file: file,
      });

      onRefresh();

      messageInputRef.current?.focus();
    } catch (error) {
      console.error("Failed to send file:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await messengerStore.deleteMessage(messageId, currentUser.id);

      onRefresh();

      messageInputRef.current?.focus();
    } catch (err: any) {
      alert(err.message || "Cannot delete message.");
    }
  };

  const handleDeleteConversation = async () => {
    if (
      confirm("Are you sure you want to remove this chat from your account?")
    ) {
      try {
        await messengerStore.deleteGroupConversation(
          conversation.id,
          currentUser.id,
        );

        onRefresh();
      } catch (error) {
        console.error("Failed to delete conversation:", error);
      }
    }
  };

  return (
    <motion.div
      className="flex-1 h-full flex flex-col bg-black text-zinc-100 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.25,
        ease: "easeOut",
      }}
    >
      <motion.div
        className="px-6 py-4 bg-zinc-950/90 border-b border-zinc-800/80 flex items-center justify-between z-10 backdrop-blur-md"
        initial={{
          opacity: 0,
          y: -15,
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
                {conversation.name}
              </h2>

              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                {conversation.type}
              </span>
            </div>

            <p className="text-xs text-zinc-400">
              {conversation.type === "GROUP"
                ? `${conversation.members.length} members`
                : "Direct Chat & File Sharing"}
            </p>
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

      <MessageList
        messages={messages}
        currentUserId={currentUser.id}
        onDeleteMessage={handleDeleteMessage}
        canManageMessages={canManageGroup}
      />

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
          duration: 0.3,
          ease: "easeOut",
        }}
      >
        <form
          onSubmit={handleSendText}
          className="w-full max-w-4xl mx-auto flex items-center gap-6 relative"
        >
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

          <input
            ref={messageInputRef}
            type="text"
            value={textMessage}
            onChange={(e) => setTextMessage(e.target.value)}
            placeholder="Type a message or attach media..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />

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

      <FileUploadModal
        isOpen={!!uploadModalType}
        onClose={() => setUploadModalType(null)}
        defaultType={uploadModalType || "FILE"}
        onSendFile={handleSendFile}
      />

      {conversation.type === "GROUP" && (
        <GroupMembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          conversation={conversation}
          currentUserId={currentUser.id}
          onGroupUpdated={onRefresh}
        />
      )}
    </motion.div>
  );
};
