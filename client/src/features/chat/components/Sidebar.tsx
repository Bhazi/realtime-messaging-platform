import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings, Users, UserPlus, FolderPlus, LogOut } from "lucide-react";
import { Conversation, User } from "../../../types/types";
import { LumaLogo } from "../../../components/LumaLogo";

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
              personalChats.map((chat) => {
                const isActive = chat.id === activeConversationId;
                return (
                  <button
                    key={chat.id}
                    onClick={() => onSelectConversation(chat.id)}
                    className={`w-full p-2.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer ${
                      isActive
                        ? "bg-indigo-600/20 border border-indigo-500/50 text-white shadow-lg shadow-indigo-600/10"
                        : "text-zinc-300 hover:bg-zinc-900 border border-transparent"
                    }`}
                  >
                    <img
                      src={`http://localhost:5000${chat.avatarUrl}`}
                      alt={chat.name}
                      className="w-9 h-9 rounded-full object-cover border border-zinc-700 flex-shrink-0"
                    />
                    <div className="flex-1 text-left truncate">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold truncate text-white">
                          {chat.name
                            ? chat.name.charAt(0).toUpperCase() +
                              chat.name.slice(1).toLowerCase()
                            : null}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {renderLastMessageSnippet(chat.lastMessage) ||
                          "Direct chat"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* GROUPS CHATS SECTION */}
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
              groupChats.map((chat) => {
                const isActive = chat.id === activeConversationId;
                return (
                  <button
                    key={chat.id}
                    onClick={() => onSelectConversation(chat.id)}
                    className={`w-full p-2.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer ${
                      isActive
                        ? "bg-purple-600/20 border border-purple-500/50 text-white shadow-lg shadow-purple-600/10"
                        : "text-zinc-300 hover:bg-zinc-900 border border-transparent"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      <Users size={16} />
                    </div>
                    <div className="flex-1 text-left truncate">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold truncate text-white">
                          {chat.name}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {chat.members.length}m
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {renderLastMessageSnippet(chat.lastMessage) ||
                          "Group workspace"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
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
