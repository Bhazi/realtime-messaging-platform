import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings, UserPlus, FolderPlus, LogOut } from "lucide-react";
import { Conversation, User } from "../../../types/types";
import { LumaLogo } from "../../../components/LumaLogo";

import { motion } from "framer-motion";

interface SidebarProps {
  currentUser: User;
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onOpenAddUser: () => void;
  onOpenCreateGroup: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  conversations,
  activeConversationId,
  onSelectConversation,
  onOpenAddUser,
  onOpenCreateGroup,
  onLogout,
}) => {
  const navigate = useNavigate();

  const renderLastMessageSnippet = (msg?: Conversation["lastMessage"]) => {
    if (!msg) return undefined;
    if (msg.type === "TEXT") return msg.content || "Text message";
    if (msg.type === "PHOTO")
      return msg.content ? `📷 ${msg.content}` : "📷 Photo";
    if (msg.type === "VIDEO")
      return msg.content ? `📹 ${msg.content}` : "📹 Video";
    if (msg.type === "FILE")
      return msg.content
        ? `📄 ${msg.content}`
        : `📄 ${msg.attachment?.filename || "File"}`;
    return "Message";
  };

  const personalChats = conversations.filter((c) => c.type === "DIRECT");
  const groupChats = conversations.filter((c) => c.type === "GROUP");

  return (
    <div className="w-full lg:w-80 h-full bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Header & Settings Button */}
      <div className="p-4 space-y-4 border-b border-zinc-800/80">
        <div className="flex items-center justify-between">
          <LumaLogo size="sm" />
          <Link
            to="/app/settings"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
          >
            <Settings size={14} />
            <span>Settings</span>
          </Link>
        </div>

        {/* User Card info */}
        <div className="p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-2.5">
          <img
            src={`http://localhost:5000${currentUser.avatarUrl}`}
            alt="Avatar"
            className="w-9 h-9 rounded-full object-cover border border-zinc-700"
          />
          <div className="flex-1 truncate">
            <h4 className="text-s font-semibold text-white truncate">
              {currentUser.displayName.charAt(0).toUpperCase() +
                currentUser.displayName.slice(1).toLowerCase()}
            </h4>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-zinc-400 font-mono">
                UID: {currentUser.uid}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Lists Section */}

      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {/* PERSONAL CHATS SECTION */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Personal
              </span>
              <button
                onClick={onOpenAddUser}
                title="Add user by UID"
                className="p-1 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer"
              >
                <UserPlus size={13} />
                <span>Add</span>
              </button>
            </div>

            <div className="space-y-1">
              {personalChats.length === 0 ? (
                <p className="px-2 py-2 text-xs text-zinc-600 italic">
                  No personal chats. Click + Add to connect.
                </p>
              ) : (
                personalChats.map((chat, index) => {
                  const isActive = chat.id === activeConversationId;

                  return (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.2,
                        ease: "easeOut",
                        delay: index * 0.05,
                      }}
                    >
                      <button
                        onClick={() => onSelectConversation(chat.id)}
                        // onClick={() => handleSelectConversation(chat)}
                        className={`
                          relative w-full
                          flex items-center gap-3
                          px-3 py-2.5
                          rounded-xl
                          cursor-pointer
                          text-left
                          transition-colors duration-200
                          ${
                            isActive
                              ? "bg-zinc-800/80 text-white"
                              : "text-zinc-300 hover:bg-zinc-800/50"
                          }
                        `}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <span
                            className="
                              absolute left-0 top-1/2
                              -translate-y-1/2
                              w-[3px] h-7
                              rounded-r-full
                              bg-indigo-500
                            "
                          />
                        )}

                        {/* Avatar */}
                        <div
                          className="
                            w-10 h-10
                            rounded-full
                            flex items-center justify-center
                            flex-shrink-0
                            overflow-hidden
                            bg-zinc-800
                            border border-zinc-700
                          "
                        >
                          {chat.avatarUrl ? (
                            <img
                              src={`http://localhost:5000${chat.avatarUrl}`}
                              alt={chat.name || "User"}
                              className="
                                w-full h-full
                                object-cover
                                block
                              "
                              onError={(e) => {
                                e.currentTarget.style.display = "none";

                                const fallback =
                                  e.currentTarget.nextElementSibling;

                                if (fallback) {
                                  fallback.style.display = "flex";
                                }
                              }}
                            />
                          ) : null}

                          {/* Avatar fallback */}
                          <div
                            className={`
                              ${chat.avatarUrl ? "hidden" : "flex"}
                              w-full h-full
                              items-center justify-center
                              rounded-full
                              font-semibold
                              text-sm
                              uppercase
                              ${
                                isActive
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-zinc-800 text-zinc-400"
                              }
                            `}
                          >
                            {chat.name?.trim()?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                        </div>

                        {/* Name + Last Message */}
                        <div className="flex-1 min-w-0">
                          <div
                            className={`
                              text-[13px]
                              font-medium
                              truncate
                              ${isActive ? "text-white" : "text-zinc-200"}
                            `}
                          >
                            {chat.name
                              ? chat.name.charAt(0).toUpperCase() +
                                chat.name.slice(1).toLowerCase()
                              : "Unknown"}
                          </div>

                          <p
                            className={`
                              mt-0.5
                              text-[11px]
                              truncate
                              ${chat.unreadCount > 0 ? "text-zinc-300" : "text-zinc-500"}
                            `}
                          >
                            {renderLastMessageSnippet(chat.lastMessage) ||
                              "Direct chat"}
                          </p>
                        </div>

                        {/* Unread Count */}
                        {chat.unreadCount > 0 && (
                          <span
                            className="
                              flex-shrink-0
                              min-w-[20px]
                              h-5
                              px-1.5
                              rounded-full
                              bg-emerald-500
                              text-white
                              text-[10px]
                              font-semibold
                              leading-none
                              flex items-center justify-center
                            "
                          >
                            {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                          </span>
                        )}
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>

        {/* GROUPS CHATS SECTION */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            ease: "easeOut",
            delay: 0.7,
          }}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Groups
              </span>
              <button
                onClick={onOpenCreateGroup}
                title="Create new group"
                className="p-1 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer"
              >
                <FolderPlus size={13} />
                <span>New</span>
              </button>
            </div>

            <div className="space-y-1">
              {groupChats.length === 0 ? (
                <p className="px-2 py-2 text-xs text-zinc-600 italic">
                  No groups. Click + New to create one.
                </p>
              ) : (
                groupChats.map((chat, index) => {
                  const isActive = chat.id === activeConversationId;
                  return (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.2,
                        ease: "easeOut",
                        delay: index * 0.05,
                      }}
                    >
                      <button
                        onClick={() => onSelectConversation(chat.id)}
                        className={`
                          relative w-full
                          px-3 py-2.5
                          rounded-xl
                          flex items-center gap-3
                          cursor-pointer
                          transition-all duration-200
                          border
                          ${
                            isActive
                              ? "bg-purple-500/[0.08] border-purple-500/20 text-white"
                              : "bg-transparent border-transparent text-zinc-300 hover:bg-zinc-800/60"
                          }
                        `}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <span
                            className="
                            absolute left-0
                            top-1/2 -translate-y-1/2
                            w-[3px] h-6
                            rounded-r-full
                            bg-purple-500
                          "
                          />
                        )}

                        {/* Avatar */}
                        <div
                          className={`
                              w-10 h-10
                              rounded-full
                              flex items-center justify-center
                              flex-shrink-0
                              overflow-hidden
                              border
                              transition-colors duration-200
                              ${
                                isActive
                                  ? "bg-purple-500/15 border-purple-500/25"
                                  : "bg-zinc-800 border-zinc-700"
                              }
                            `}
                        >
                          {chat.avatarUrl ? (
                            <img
                              src={`http://localhost:5000${chat.avatarUrl}`}
                              alt={chat.name || "Group"}
                              className="
                                w-full h-full
                                object-cover
                                block
                              "
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.nextElementSibling.style.display =
                                  "flex";
                              }}
                            />
                          ) : null}

                          {/* Fallback avatar */}
                          <div
                            className={`
                              ${chat.avatarUrl ? "hidden" : "flex"}
                              w-full h-full
                              items-center justify-center
                              font-semibold
                              text-sm
                              uppercase
                              ${
                                isActive
                                  ? "bg-purple-500/15 text-purple-400"
                                  : "bg-zinc-800 text-zinc-400"
                              }
                            `}
                          >
                            {chat.name?.trim()?.charAt(0)?.toUpperCase() || "G"}
                          </div>
                        </div>

                        {/* Name + Last Message */}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`
                                  text-[12px]
                                  font-semibold
                                  truncate
                                  ${isActive ? "text-white" : "text-zinc-200"}
                                `}
                            >
                              {chat.name
                                ? chat.name.charAt(0).toUpperCase() +
                                  chat.name.slice(1).toLowerCase()
                                : "Unnamed Group"}
                            </span>
                          </div>

                          <p
                            className={`
                                mt-0.5
                                text-[11px]
                                truncate
                                ${chat.unreadCount > 0 ? "text-zinc-300" : "text-zinc-500"}
                              `}
                          >
                            {renderLastMessageSnippet(chat.lastMessage) ||
                              "Group workspace"}
                          </p>
                        </div>

                        {/* Unread Count */}
                        {chat.unreadCount > 0 && (
                          <span
                            className="
                              flex-shrink-0
                              min-w-[20px]
                              h-5
                              px-1.5
                              rounded-full
                              bg-indigo-500
                              text-white
                              text-[10px]
                              font-semibold
                              leading-none
                              flex items-center justify-center
                            "
                          >
                            {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                          </span>
                        )}
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Logout Footer */}
      <div className="p-3 border-t border-zinc-900">
        <button
          onClick={onLogout}
          className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-rose-500/10 hover:text-rose-400 text-zinc-400 text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  );
};
