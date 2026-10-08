import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Paperclip,
  Image as ImageIcon,
  Video as VideoIcon,
  X,
  Upload,
} from "lucide-react";

import { MessageType } from "../../../types/types";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType: MessageType;
  onSendFile: (
    type: MessageType,
    fileData: { filename: string; mimeType: string; size: number; url: string },
    caption?: string,
  ) => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onSendFile,
}) => {
  const [selectedType, setSelectedType] = useState<MessageType>("PHOTO");

  const [customFile, setCustomFile] = useState<File | null>(null);

  const [caption, setCaption] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      let type: MessageType = "FILE";

      if (file.type.startsWith("image/")) type = "PHOTO";
      else if (file.type.startsWith("video/")) type = "VIDEO";

      setSelectedType(type);
      setCustomFile(file); // Save raw File directly
    }
  };

  const handleConfirmSend = () => {
    if (!customFile) return;

    onSendFile(selectedType, customFile, caption.trim() || undefined);
    setCustomFile(null);
    setCaption("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative space-y-5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">Send File</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-xl text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Category tabs */}
            <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedType("PHOTO");
                  setCustomFile(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedType === "PHOTO"
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <ImageIcon size={14} /> Photo
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedType("VIDEO");
                  setCustomFile(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedType === "VIDEO"
                    ? "bg-purple-600 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <VideoIcon size={14} /> Video
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedType("FILE");
                  setCustomFile(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedType === "FILE"
                    ? "bg-cyan-600 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Paperclip size={14} /> File
              </button>
            </div>

            {/* Custom file upload dropzone */}
            <label className="border-2 border-dashed border-zinc-800 hover:border-indigo-500/60 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-zinc-950/50">
              <Upload size={24} className="text-indigo-400" />
              <span className="text-xs font-medium text-zinc-300">
                Choose file from device
              </span>
              <span className="text-[10px] text-zinc-500">
                Supports photos, videos, and documents
              </span>
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Optional Caption Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-400">
                Caption (optional):
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a message with this file..."
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Action button */}
            <button
              onClick={handleConfirmSend}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Send {selectedType}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
