import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
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
  Camera,
  X,
} from "lucide-react";
import { User } from "../../../types/types";
import { messengerStore } from "../../../messangerStore/messengerStore";

import { userApi } from "../../../api/user.api";

interface SettingsViewProps {
  currentUser: User;
  onLogout: () => void;
  onProfileUpdated: () => void;
  onCurrentUserChange: (user: User) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onLogout,
  onProfileUpdated,
  onCurrentUserChange,
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

  // Change Profile Picture
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Open file picker
  const handleCameraClick = () => {
    setIsModalOpen(true);
  };

  // Select image
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // Optional: only allow images
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Cancel
  const handleCancel = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setIsModalOpen(false);

    // Reset input so the same image can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit
  const handleSubmit = async () => {
    if (!selectedImage) return;

    const formData = new FormData();

    formData.append("userId", currentUser.id);
    formData.append("avatar", selectedImage);

    try {
      const user: User = await userApi.updateAvatar(formData);

      // Close modal after successful upload
      setIsModalOpen(false);
      setSelectedImage(null);
      setPreviewUrl(null);

      onCurrentUserChange(user);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
    }
  };

  const handleCopyUid = () => {
    navigator.clipboard.writeText(currentUser.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedUser: User = await userApi.updateUserProfile(currentUser.id, {
      displayName: displayName.trim(),
      username: username.trim(),
    });

    setIsSaved(true);
    onCurrentUserChange(updatedUser);

    // onProfileUpdated();

    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // API calling for changing the password
    await userApi.changePassword(currentUser.id, oldPass, newPass);

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
    <motion.div
      className="flex-1 h-full bg-black text-zinc-100 p-6 sm:p-10 overflow-y-auto selection:bg-indigo-500 selection:text-white"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
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
              <div className="relative">
                <img
                  src={`http://localhost:5000${currentUser.avatarUrl}`}
                  alt="Avatar"
                  // src={previewUrl || currentUser.avatarUrl}
                  // alt={currentUser.displayName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/40"
                />

                <button
                  type="button"
                  onClick={handleCameraClick}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-indigo-600 border-2 border-zinc-900 flex items-center justify-center text-white hover:bg-indigo-500 transition-colors shadow-md"
                  aria-label="Change profile picture"
                >
                  <Camera size={14} strokeWidth={2.5} />
                </button>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              <div>
                <span className="text-xs font-semibold text-white block">
                  {currentUser.displayName.charAt(0).toUpperCase() +
                    currentUser.displayName.slice(1).toLowerCase()}
                </span>

                <span className="text-xs text-zinc-400">
                  @{currentUser.username}
                </span>
              </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
              {isModalOpen && (
                <motion.div
                  className="
              fixed inset-0 z-50
              flex items-center justify-center
              bg-black/60 backdrop-blur-sm
              p-4
            "
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleCancel}
                >
                  {/* Modal content */}
                  <motion.div
                    className="
                w-full max-w-md
                rounded-2xl
                bg-zinc-900
                border border-zinc-800
                shadow-2xl
                p-6
              "
                    initial={{
                      opacity: 0,
                      scale: 0.9,
                      y: 20,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                      y: 20,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                    }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-lg font-semibold text-white">
                          Change Profile Picture
                        </h2>

                        <p className="text-sm text-zinc-400 mt-1">
                          Choose a new profile picture.
                        </p>
                      </div>

                      <motion.button
                        type="button"
                        onClick={handleCancel}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="
                    w-8 h-8
                    rounded-full
                    flex items-center justify-center
                    text-zinc-400
                    hover:text-white
                    hover:bg-zinc-800
                    transition-colors
                  "
                        aria-label="Close"
                      >
                        <X size={18} />
                      </motion.button>
                    </div>

                    {/* Preview */}
                    <div className="flex flex-col items-center">
                      <AnimatePresence mode="wait">
                        {previewUrl ? (
                          <motion.img
                            key="preview"
                            src={previewUrl}
                            alt="Selected profile"
                            className="
                        w-32 h-32
                        rounded-full
                        object-cover
                        border-4
                        border-indigo-500/30
                        shadow-xl
                        mb-5
                      "
                            initial={{
                              opacity: 0,
                              scale: 0.7,
                            }}
                            animate={{
                              opacity: 1,
                              scale: 1,
                            }}
                            exit={{
                              opacity: 0,
                              scale: 0.7,
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            }}
                          />
                        ) : (
                          <motion.div
                            key="empty"
                            className="
                        w-32 h-32
                        rounded-full
                        bg-zinc-800
                        border-2
                        border-dashed
                        border-zinc-700
                        flex flex-col
                        items-center justify-center
                        text-zinc-500
                        mb-5
                      "
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                          >
                            <Camera size={30} />

                            <span className="text-xs mt-2">No image</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Choose image */}
                      <motion.button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="
                    px-4 py-2
                    rounded-lg
                    bg-zinc-800
                    text-sm
                    font-medium
                    text-white
                    hover:bg-zinc-700
                    transition-colors
                  "
                      >
                        Choose Image
                      </motion.button>

                      <p className="text-xs text-zinc-500 mt-3">
                        JPG, PNG or GIF
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 mt-8">
                      <motion.button
                        type="button"
                        onClick={handleCancel}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="
                    px-4 py-2
                    rounded-lg
                    text-sm
                    font-medium
                    text-zinc-300
                    bg-zinc-800
                    hover:bg-zinc-700
                    transition-colors
                  "
                      >
                        Cancel
                      </motion.button>

                      <motion.button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!selectedImage}
                        whileHover={selectedImage ? { scale: 1.02 } : undefined}
                        whileTap={selectedImage ? { scale: 0.97 } : undefined}
                        className="
                    px-5 py-2
                    rounded-lg
                    text-sm
                    font-semibold
                    text-white
                    bg-indigo-600
                    hover:bg-indigo-500
                    disabled:opacity-40
                    disabled:cursor-not-allowed
                    transition-colors
                  "
                      >
                        Submit
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

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
    </motion.div>
  );
};
