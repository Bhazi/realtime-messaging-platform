import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, FileText } from "lucide-react";
import { MessageAttachment, MessageType } from "../../../types/types";

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: MessageAttachment | null;
  type: MessageType | null;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  isOpen,
  onClose,
  attachment,
  type,
}) => {
  if (!attachment || !type) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]"
          >
            {/* Top Bar */}
            <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between z-10">
              <div className="truncate pr-4">
                <h4 className="text-sm font-semibold text-white truncate">
                  {attachment.filename}
                </h4>
                <p className="text-xs text-zinc-400 font-mono">
                  {(attachment.size / 1024 / 1024).toFixed(2)} MB •{" "}
                  {attachment.mimeType}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={attachment.url}
                  download={attachment.filename}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download size={14} /> Download
                </a>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Media Content Area */}
            <div className="p-6 flex items-center justify-center overflow-auto max-h-[70vh] bg-black/60">
              {type === "PHOTO" && (
                <img
                  src={attachment.url}
                  alt={attachment.filename}
                  className="max-h-[60vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
                />
              )}

              {type === "VIDEO" && (
                <video
                  src={attachment.url}
                  controls
                  autoPlay
                  className="max-h-[60vh] w-full max-w-2xl rounded-2xl shadow-2xl"
                />
              )}

              {type === "FILE" && (
                <div className="p-12 text-center space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto shadow-xl">
                    <FileText size={40} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-white">
                      {attachment.filename}
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono">
                      {(attachment.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <Download size={16} /> Download Document
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
