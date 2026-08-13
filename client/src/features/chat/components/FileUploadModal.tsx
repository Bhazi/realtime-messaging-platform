import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Paperclip,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  X,
  Upload,
  Check,
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

const PRESET_FILES = {
  PHOTO: [
    {
      filename: "app_ui_mockup.png",
      mimeType: "image/png",
      size: 2450000,
      url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80",
    },
    {
      filename: "architecture_diagram.jpg",
      mimeType: "image/jpeg",
      size: 1850000,
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80",
    },
    {
      filename: "design_brand_kit.png",
      mimeType: "image/png",
      size: 3100000,
      url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80",
    },
  ],
  VIDEO: [
    {
      filename: "feature_preview_demo.mp4",
      mimeType: "video/mp4",
      size: 12400000,
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    },
    {
      filename: "luma_intro_clip.mp4",
      mimeType: "video/mp4",
      size: 8500000,
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    },
  ],
  FILE: [
    {
      filename: "luma_project_spec.pdf",
      mimeType: "application/pdf",
      size: 4200000,
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    },
    {
      filename: "database_schema.sql",
      mimeType: "text/x-sql",
      size: 185000,
      url: "https://raw.githubusercontent.com/prisma/prisma/main/README.md",
    },
    {
      filename: "luma_app_v1.0.zip",
      mimeType: "application/zip",
      size: 18400000,
      url: "#",
    },
  ],
};

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  defaultType,
  onSendFile,
}) => {
  const [selectedType, setSelectedType] = useState<MessageType>(defaultType);
  const [customFile, setCustomFile] = useState<{
    filename: string;
    mimeType: string;
    size: number;
    url: string;
  } | null>(null);
  const [caption, setCaption] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      let type: MessageType = "FILE";
      if (file.type.startsWith("image/")) type = "PHOTO";
      else if (file.type.startsWith("video/")) type = "VIDEO";

      setSelectedType(type);
      setCustomFile({
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        url,
      });
    }
  };

  const handleSelectPreset = (preset: {
    filename: string;
    mimeType: string;
    size: number;
    url: string;
  }) => {
    setCustomFile(preset);
  };

  const handleConfirmSend = () => {
    const file =
      customFile ||
      PRESET_FILES[selectedType as "PHOTO" | "VIDEO" | "FILE"]?.[0] ||
      PRESET_FILES.FILE[0];
    onSendFile(selectedType, file, caption.trim() || undefined);
    setCustomFile(null);
    setCaption("");
    onClose();
  };

  const activePresets = PRESET_FILES[selectedType] || PRESET_FILES.FILE;

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

            {/* Preset Files list */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-zinc-400">
                Or pick sample file:
              </span>
              <div className="space-y-1.5">
                {activePresets.map((file) => {
                  const isSelected = customFile?.url === file.url;
                  return (
                    <div
                      key={file.filename}
                      onClick={() => handleSelectPreset(file)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? "bg-indigo-600/10 border-indigo-500 text-white"
                          : "bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {selectedType === "PHOTO" && (
                          <ImageIcon size={16} className="text-indigo-400" />
                        )}
                        {selectedType === "VIDEO" && (
                          <VideoIcon size={16} className="text-purple-400" />
                        )}
                        {selectedType === "FILE" && (
                          <FileText size={16} className="text-cyan-400" />
                        )}
                        <div className="truncate">
                          <p className="text-xs font-medium truncate">
                            {file.filename}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono">
                            {(file.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <Check size={16} className="text-indigo-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

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
