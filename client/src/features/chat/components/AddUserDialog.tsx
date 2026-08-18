import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, UserPlus, X, Check, Shield } from "lucide-react";
import { messengerStore } from "../../../messangerStore/messengerStore";
import { User } from "../../../types/types";

interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: (user: User) => void;
  currentUserId: string;
}

export const AddUserDialog: React.FC<AddUserDialogProps> = ({
  isOpen,
  onClose,
  onUserAdded,
  currentUserId,
}) => {
  const [uidInput, setUidInput] = useState("");
  const [searchedUser, setSearchedUser] = useState<User | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSearchedUser(null);
    setIsSuccess(false);

    if (!uidInput.trim()) {
      setErrorMsg("Please enter a Public UID (e.g. 3M9X7K2P).");
      return;
    }

    const found = await messengerStore.getUserByUid(uidInput.trim());
    if (!found) {
      setErrorMsg(`No user found with UID "${uidInput.trim().toUpperCase()}".`);
      return;
    }

    if (found.id === currentUserId) {
      setErrorMsg("You cannot add your own UID.");
      return;
    }

    setSearchedUser(found);
  };

  const handleAddUser = async () => {
    if (!searchedUser) return;
    try {
      await messengerStore.createDirectConversation(
        currentUserId,
        searchedUser.uid,
      );
      setIsSuccess(true);
      setTimeout(() => {
        onUserAdded(searchedUser);
        handleClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add user.");
    }
  };

  const handleClose = () => {
    setUidInput("");
    setSearchedUser(null);
    setErrorMsg("");
    setIsSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative space-y-5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Add Personal User
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSearch} className="space-y-3">
              <label className="text-xs font-medium text-zinc-300">
                Enter User Public UID
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={uidInput}
                    onChange={(e) => setUidInput(e.target.value.toUpperCase())}
                    placeholder="e.g. 3M9X7K2P"
                    maxLength={10}
                    className="w-full pl-3.5 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white font-mono tracking-wider uppercase placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Search size={16} />
                  Search
                </button>
              </div>

              {/* Quick hints for searching */}
              <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                <span>Try sample UIDs:</span>
                <button
                  type="button"
                  onClick={() => setUidInput("3M9X7K2P")}
                  className="text-indigo-400 hover:underline font-mono"
                >
                  3M9X7K2P
                </button>
                <span>(Sarah) or</span>
                <button
                  type="button"
                  onClick={() => setUidInput("7P2W9X4K")}
                  className="text-indigo-400 hover:underline font-mono"
                >
                  7P2W9X4K
                </button>
                <span>(Michael)</span>
              </div>
            </form>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {searchedUser && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={`http://localhost:5000${searchedUser.avatarUrl}`}
                    alt={searchedUser.displayName}
                    className="w-11 h-11 rounded-full object-cover border border-zinc-700"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {searchedUser.displayName}
                    </h4>
                    <p className="text-xs text-zinc-400">
                      @{searchedUser.username}
                    </p>
                    <span className="inline-block px-2 py-0.5 mt-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-[10px] rounded-md">
                      UID: {searchedUser.uid}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleAddUser}
                  disabled={isSuccess}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:bg-emerald-600"
                >
                  {isSuccess ? (
                    <>
                      <Check size={14} /> Added
                    </>
                  ) : (
                    "Add Chat"
                  )}
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
