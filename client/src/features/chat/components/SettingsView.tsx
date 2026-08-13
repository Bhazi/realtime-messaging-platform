import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Copy,
  Check,
  LogOut,
  Trash2,
  ArrowLeft,
  Shield,
  User as UserIcon,
  Lock,
  Key,
} from "lucide-react";
import { User } from "../../../types/types";
import { messengerStore } from "../../../messangerStore/messengerStore";

interface SettingsViewProps {
  currentUser: User;
  onLogout: () => void;
  onProfileUpdated: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onLogout,
  onProfileUpdated,
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [username, setUsername] = useState(currentUser.username);
  const [isSaved, setIsSaved] = useState(false);

  // Change Password State
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [passSaved, setPassSaved] = useState(false);

  const handleCopyUid = () => {
    navigator.clipboard.writeText(currentUser.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    messengerStore.updateUserProfile(currentUser.id, {
      displayName: displayName.trim(),
      username: username.trim(),
    });
    setIsSaved(true);
    onProfileUpdated();
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassSaved(true);
    setOldPass("");
    setNewPass("");
    setTimeout(() => setPassSaved(false), 2000);
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to permanently delete your account?")) {
      onLogout();
      navigate("/login");
    }
  };

  return (
    <div className="flex-1 h-full bg-black text-zinc-100 p-6 sm:p-10 overflow-y-auto selection:bg-indigo-500 selection:text-white">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Back Button & Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/app")}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Settings
            </h1>
            <p className="text-xs text-zinc-400">
              Manage your profile, public UID, account credentials, and security
              settings.
            </p>
          </div>
        </div>

        {/* PROFILE SECTION */}
        <section className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
            <UserIcon size={18} className="text-indigo-400" />
            <h3 className="text-base font-semibold text-white">Profile</h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/40"
              />
              <div>
                <span className="text-xs font-semibold text-white block">
                  {currentUser.displayName}
                </span>
                <span className="text-xs text-zinc-400">
                  @{currentUser.username}
                </span>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* PUBLIC UID DISPLAY WITH COPY BUTTON */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-medium text-zinc-300">
                Your Public UID (Share this with friends to connect)
              </label>
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-500 block">
                    PUBLIC UID
                  </span>
                  <span className="font-mono text-base font-bold text-indigo-400 tracking-widest">
                    {currentUser.uid}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check size={14} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy UID
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {isSaved && (
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                  <Check size={14} /> Profile updated successfully!
                </span>
              )}
              <button
                type="submit"
                className="ml-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/30"
              >
                Save Profile
              </button>
            </div>
          </form>
        </section>

        {/* ACCOUNT SECTION */}
        <section className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
            <Lock size={18} className="text-purple-400" />
            <h3 className="text-base font-semibold text-white">
              Account & Password
            </h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {passSaved && (
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                  <Check size={14} /> Password changed successfully!
                </span>
              )}
              <button
                type="submit"
                className="ml-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                Change Password
              </button>
            </div>
          </form>

          <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
            <span className="text-xs text-zinc-400">
              Sign out of your active session
            </span>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-zinc-800 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </section>

        {/* DANGER ZONE */}
        <section className="bg-rose-950/20 border border-rose-900/40 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-rose-900/40 text-rose-400">
            <Trash2 size={18} />
            <h3 className="text-base font-semibold">Danger Zone</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-white">
                Delete Account
              </h4>
              <p className="text-[11px] text-zinc-400">
                Permanently delete your profile, conversations, and account
                details.
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
            >
              Delete Account
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
