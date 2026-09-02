import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface RemoveChatModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RemoveChatModal: React.FC<RemoveChatModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6"
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
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Remove Chat
                </h2>

                <p className="text-sm text-zinc-400 mt-1">
                  This action will remove the chat from your account.
                </p>
              </div>

              <motion.button
                type="button"
                onClick={onCancel}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Message */}
            <div className="mt-6 rounded-xl bg-zinc-950 border border-zinc-800 p-4">
              <p className="text-sm  font-semibold text-zinc-300 leading-relaxed">
                Are you sure you want to remove this chat from your account?
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6">
              <motion.button
                type="button"
                onClick={onCancel}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Cancel
              </motion.button>

              <motion.button
                type="button"
                onClick={onConfirm}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-md shadow-rose-600/30 cursor-pointer"
              >
                OK
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
