import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FolderPlus, X, Plus, Trash2, Users } from "lucide-react";
import { messengerStore } from "../../../messangerStore/messengerStore";
import { User, Conversation } from "../../../types/types";

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (group: Conversation) => void;
  currentUserId: string;
}

export const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({
  isOpen,
  onClose,
  onGroupCreated,
  currentUserId,
}) => {
  const [groupName, setGroupName] = useState("");
  const [memberUidInput, setMemberUidInput] = useState("");
  const [addedUids, setAddedUids] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  // Add Image for Profile Picture
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddUid = async () => {
    setErrorMsg("");
    const cleanUid = memberUidInput.trim().toUpperCase();
    if (!cleanUid) return;

    console.log("reached here 1");

    const user = await messengerStore.getUserByUid(cleanUid);
    if (!user) {
      setErrorMsg(`No user found with UID "${cleanUid}".`);
      return;
    }

    console.log(user, "from the handledAddedUID function 2");

    if (user.id === currentUserId) {
      setErrorMsg("You are automatically included as group Owner.");
      return;
    }

    console.log(user, "from the handledAddedUID function 3");

    if (addedUids.includes(cleanUid)) {
      setErrorMsg("User UID already added to list.");
      return;
    }

    console.log(user, "from the handledAddedUID function 4");

    setAddedUids([...addedUids, cleanUid]);
    setMemberUidInput("");

    console.log(user, "from the handledAddedUID function 5");
  };

  const handleRemoveUid = (uid: string) => {
    setAddedUids(addedUids.filter((u) => u !== uid));
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
    // setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!groupName.trim()) {
      setErrorMsg("Group name is required.");
      return;
    }

    const formData = new FormData();

    formData.append("userId", currentUserId);
    formData.append("groupName", groupName);

    // Convert array to JSON string
    formData.append("addedUids", JSON.stringify(addedUids));

    if (selectedImage) {
      formData.append("groupImage", selectedImage);
    }
    console.log(currentUserId, "from the create group dialogue component");

    try {
      const newGroup = await messengerStore.createGroupConversation(formData);

      onGroupCreated(newGroup);
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create group.");
    }
  };

  const handleClose = () => {
    setGroupName("");
    setMemberUidInput("");
    setAddedUids([]);
    setErrorMsg("");
    setSelectedImage(null);
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
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <FolderPlus size={18} />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Create Group
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Group Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Developers"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Add Member UIDs */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Add Users by Public UID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={memberUidInput}
                    onChange={(e) =>
                      setMemberUidInput(e.target.value.toUpperCase())
                    }
                    placeholder="e.g. 3M9X7K2P"
                    maxLength={10}
                    className="flex-1 px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono tracking-wider text-white uppercase placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddUid}
                    className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus size={14} /> Add UID
                  </button>
                </div>
              </div>

              {/* Add Profile Picture for Group */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Profile Picture
                </label>

                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                    {selectedImage ? (
                      <img
                        src={URL.createObjectURL(selectedImage)}
                        alt="Group profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-zinc-600 text-xs">No Image</span>
                    )}
                  </div>

                  {/* Upload */}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-zinc-400
                        file:mr-3 file:py-2 file:px-3
                        file:rounded-lg file:border-0
                        file:text-xs file:font-medium
                        file:shadow-lg file:shadow-indigo-600/30
                        file:bg-indigo-600 file:text-white
                        hover:file:bg-indigo-500
                        file:cursor-pointer"
                    />

                    <p className="mt-1.5 text-xs text-zinc-600">
                      PNG, JPG or WEBP. Recommended size: 512×512.
                    </p>
                  </div>
                </div>
              </div>

              {/* Added Members List Chips */}
              {addedUids.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-zinc-400">
                    Selected Members ( {addedUids.length} ) :
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-zinc-950/60 rounded-xl border border-zinc-800">
                    {addedUids.map((uid) => {
                      console.log(uid);
                      const user = messengerStore.getUserByUid(uid);
                      return (
                        <div
                          key={uid}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200"
                        >
                          <span className="font-medium">{uid}</span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            ({uid})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveUid(uid)}
                            className="text-zinc-400 hover:text-rose-400 p-0.5 ml-1"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Users size={14} />
                  Create Group
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
