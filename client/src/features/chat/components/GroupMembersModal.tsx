import React, { useState } from "react";

import { motion, AnimatePresence } from "motion/react";

import { Shield, ShieldAlert, UserMinus, Plus, X } from "lucide-react";

import { Conversation, MemberRole } from "../../../types/types";

import { userApi } from "../../../api/user.api";

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  currentUserId: string;
  onGroupUpdated: () => void;
}

export const GroupMembersModal: React.FC<GroupMembersModalProps> = ({
  isOpen,
  onClose,
  conversation,
  currentUserId,
  onGroupUpdated,
}) => {
  const [newUidInput, setNewUidInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const currentUserMember = conversation.members.find(
    (m) => m.userId === currentUserId,
  );
  const isOwner = currentUserMember?.role === "OWNER";
  const isAdmin = currentUserMember?.role === "ADMIN" || isOwner;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!newUidInput.trim()) return;

    try {
      await userApi.addUserToGroup(
        conversation.id,
        currentUserId,
        newUidInput.trim(),
      );
      setSuccessMsg(`User successfully added to ${conversation.name}!`);
      setNewUidInput("");
      onGroupUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add user to group.");
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await userApi.removeUserFromGroup(
        conversation.id,
        currentUserId,
        targetUserId,
      );
      setSuccessMsg("Member removed from group.");
      onGroupUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to remove member.");
    }
  };

  const handleRoleChange = async (
    targetUserId: string,
    newRole: MemberRole,
  ) => {
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await userApi.updateGroupMemberRole(
        conversation.id,
        currentUserId,
        targetUserId,
        newRole,
      );
      setSuccessMsg(`Role updated to ${newRole}.`);
      onGroupUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update role.");
    }
  };

  const activeMembers = conversation.members.filter((m) => !m.leftAt);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Shield size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {conversation.name} Members
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {activeMembers.length} active participants
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Notifications */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                {successMsg}
              </div>
            )}

            {/* Add Member Bar (Admins / Owner only) */}
            {isAdmin && (
              <form onSubmit={handleAddMember} className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Add member by Public UID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUidInput}
                    onChange={(e) =>
                      setNewUidInput(e.target.value.toUpperCase())
                    }
                    placeholder="Enter UID e.g. 5V8L2N9Q"
                    className="flex-1 px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono uppercase text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </form>
            )}

            {/* Members List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {activeMembers.map((member) => {
                const user = member.user;
                const isSelf = member.userId === currentUserId;

                return (
                  <div
                    key={member.userId}
                    className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={`http://localhost:5000${user?.avatarUrl}`}
                        alt={user?.displayName || "Member"}
                        className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {user?.displayName || "User"}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] text-zinc-500 font-medium">
                              (You)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <span>@{user?.username || "user"}</span>
                          <span className="font-mono text-[10px] text-zinc-500">
                            UID: {user?.uid || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Role Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wide uppercase ${
                          member.role === "OWNER"
                            ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                            : member.role === "ADMIN"
                              ? "bg-purple-500/10 border border-purple-500/20 text-purple-400"
                              : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {member.role === "OWNER"}
                        {member.role === "ADMIN" && <Shield size={12} />}
                        {member.role}
                      </span>

                      {/* Role Actions for Owner */}
                      {isOwner && !isSelf && (
                        <div className="flex items-center gap-1">
                          {member.role === "MEMBER" && (
                            <button
                              onClick={() =>
                                handleRoleChange(member.userId, "ADMIN")
                              }
                              title="Make Admin"
                              className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors cursor-pointer"
                            >
                              <Shield size={14} />
                            </button>
                          )}
                          {member.role === "ADMIN" && (
                            <button
                              onClick={() =>
                                handleRoleChange(member.userId, "MEMBER")
                              }
                              title="Dismiss Admin"
                              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            >
                              <ShieldAlert size={14} />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Remove Member Button for Admin/Owner */}
                      {isAdmin && !isSelf && member.role !== "OWNER" && (
                        <button
                          onClick={() => handleRemoveMember(member.userId)}
                          title="Remove from group"
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                        >
                          <UserMinus size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
