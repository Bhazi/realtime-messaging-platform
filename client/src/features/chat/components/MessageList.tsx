import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Download,
  Trash2,
  Eye,
  Play,
} from "lucide-react";
import {
  Message,
  MessageAttachment,
  MessageType,
  User,
} from "../../../types/types";
import { MediaViewerModal } from "./MediaViewerModal";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onDeleteMessage: (messageId: string) => void;
  canManageMessages: boolean; // True for group Admin/Owner
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  onDeleteMessage,
  canManageMessages,
}) => {
  const [activeViewer, setActiveViewer] = useState<{
    attachment: MessageAttachment;
    type: MessageType;
  } | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <FileText size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-300">
              No media shared yet
            </p>
            <p className="text-xs text-zinc-500">
              Share photos, videos, or documents using the action bar below.
            </p>
          </div>
        </div>
      ) : (
        messages.map((msg) => {
          const isSelf = msg.senderId === currentUserId;
          const isDeleted = !!msg.deletedAt;
          const canDelete = !isDeleted && (isSelf || canManageMessages);

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 group ${isSelf ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Sender Avatar */}
              <img
                src={`http://localhost:5000${msg.sender?.avatarUrl}`}
                alt={msg.sender?.displayName || "Sender"}
                className="w-8 h-8 rounded-full object-cover border border-zinc-700 flex-shrink-0 mt-1"
              />

              {/* Message Bubble Container */}
              <div
                className={`max-w-xs sm:max-w-md lg:max-w-lg space-y-1 ${isSelf ? "items-end" : "items-start"}`}
              >
                {/* Sender Name & Timestamp */}
                <div
                  className={`flex items-center gap-2 text-[11px] text-zinc-400 ${isSelf ? "justify-end" : "justify-start"}`}
                >
                  <span className="font-semibold text-zinc-300">
                    {isSelf ? "You" : msg.sender?.displayName || "User"}
                  </span>
                  <span>•</span>
                  <span>{formatTime(msg.createdAt)}</span>
                </div>

                {/* Main Content Box */}
                {isDeleted ? (
                  <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl italic text-xs text-zinc-500 flex items-center gap-2">
                    <Trash2 size={13} /> Message deleted
                  </div>
                ) : (
                  <div className="relative group/card">
                    {/* TEXT MESSAGE */}
                    {msg.type === "TEXT" && (
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed max-w-sm sm:max-w-md break-words shadow-md ${
                          isSelf
                            ? "bg-indigo-600 text-white rounded-tr-xs"
                            : "bg-zinc-800 text-zinc-100 border border-zinc-700/60 rounded-tl-xs"
                        }`}
                      >
                        {msg.content}
                      </div>
                    )}

                    {/* PHOTO MESSAGE */}
                    {msg.type === "PHOTO" && msg.attachment && (
                      <div className="space-y-1.5 max-w-sm">
                        {msg.content && (
                          <p className="text-xs font-medium text-zinc-200 px-1">
                            {msg.content}
                          </p>
                        )}
                        <div
                          onClick={() =>
                            setActiveViewer({
                              attachment: msg.attachment!,
                              type: "PHOTO",
                            })
                          }
                          className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-xl cursor-pointer hover:border-indigo-500/60 transition-all"
                        >
                          <img
                            src={msg.attachment.url}
                            alt={msg.attachment.filename}
                            className="w-full h-auto max-h-72 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-xs">
                            <Eye size={18} /> View Photo
                          </div>
                          <div className="p-2.5 bg-zinc-950/90 flex items-center justify-between border-t border-zinc-800/60">
                            <span className="text-xs font-medium text-white truncate max-w-[200px]">
                              {msg.attachment.filename}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {formatFileSize(msg.attachment.size)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VIDEO MESSAGE */}
                    {msg.type === "VIDEO" && msg.attachment && (
                      <div className="space-y-1.5 max-w-sm">
                        {msg.content && (
                          <p className="text-xs font-medium text-zinc-200 px-1">
                            {msg.content}
                          </p>
                        )}
                        <div
                          onClick={() =>
                            setActiveViewer({
                              attachment: msg.attachment!,
                              type: "VIDEO",
                            })
                          }
                          className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-xl cursor-pointer hover:border-purple-500/60 transition-all"
                        >
                          <div className="relative bg-zinc-900 h-48 flex items-center justify-center">
                            <video
                              src={msg.attachment.url}
                              className="w-full h-full object-cover opacity-80"
                            />
                            <div className="absolute w-12 h-12 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-md">
                              <Play size={20} className="ml-0.5" />
                            </div>
                          </div>
                          <div className="p-2.5 bg-zinc-950/90 flex items-center justify-between border-t border-zinc-800/60">
                            <span className="text-xs font-medium text-white truncate max-w-[200px]">
                              {msg.attachment.filename}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {formatFileSize(msg.attachment.size)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* FILE MESSAGE */}
                    {msg.type === "FILE" && msg.attachment && (
                      <div className="space-y-1.5 max-w-sm">
                        {msg.content && (
                          <p className="text-xs font-medium text-zinc-200 px-1">
                            {msg.content}
                          </p>
                        )}
                        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl flex items-center gap-3 hover:border-zinc-700 transition-colors min-w-[260px]">
                          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                            <FileText size={20} />
                          </div>
                          <div className="flex-1 truncate">
                            <p className="text-xs font-semibold text-white truncate">
                              {msg.attachment.filename}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                              {formatFileSize(msg.attachment.size)}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setActiveViewer({
                                attachment: msg.attachment!,
                                type: "FILE",
                              })
                            }
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Delete Action Trigger */}
                    {canDelete && (
                      <button
                        onClick={() => onDeleteMessage(msg.id)}
                        title="Delete message"
                        className={`absolute top-2 ${
                          isSelf ? "-left-8" : "-right-8"
                        } opacity-0 group-hover/card:opacity-100 p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })
      )}

      <MediaViewerModal
        isOpen={!!activeViewer}
        onClose={() => setActiveViewer(null)}
        attachment={activeViewer?.attachment || null}
        type={activeViewer?.type || null}
      />
    </div>
  );
};
