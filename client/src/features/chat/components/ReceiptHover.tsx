import { useEffect, useRef, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck } from "lucide-react";

import { Message, MessageReceipt } from "../../../types/types";

interface ReceiptSectionProps {
  title: string;
  icon: React.ReactNode;
  iconClass: string;
  receipts: MessageReceipt[];
  timeKey: keyof MessageReceipt;
  formatTime: (time: string | null) => string;
  hasBorder?: boolean;
  currentUserId: string;
}

const ReceiptSection: React.FC<ReceiptSectionProps> = ({
  title,
  icon,
  iconClass,
  receipts,
  timeKey,
  formatTime,
  hasBorder = false,
  currentUserId,
}) => {
  return (
    <div
      className={`
        ${hasBorder ? "mt-3 border-t border-zinc-800 pt-3" : ""}
      `}
    >
      {/* Section Header */}
      <div className="mb-2 flex items-center gap-1.5">
        <span className={iconClass}>{icon}</span>

        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          {title}
        </span>

        <span className="ml-auto rounded-md bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-500">
          {receipts.length}
        </span>
      </div>

      {/* Users */}
      <div className="space-y-1">
        {receipts.map((receipt) => {
          if (receipt.userId === currentUserId) return null;

          return (
            <div
              key={`${title}-${receipt.userId}`}
              className="
              flex
              items-center
              gap-2.5
              rounded-xl
              px-2
              py-1.5
              transition-colors
              hover:bg-zinc-800/60
            "
            >
              {/* Avatar */}
              <img
                src={
                  receipt.avatarUrl?.startsWith("http")
                    ? receipt.avatarUrl
                    : `http://localhost:5000${receipt.avatarUrl || ""}`
                }
                alt={receipt.displayName || "User"}
                className="
                h-8
                w-8
                shrink-0
                rounded-full
                border
                border-zinc-700
                object-cover
              "
              />

              {/* Name */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-zinc-200">
                  {receipt.displayName || receipt.username || "User"}
                </p>

                <p className="text-[10px] text-zinc-500">
                  @{receipt.username || "user"}
                </p>
              </div>

              {/* Time */}
              <span className="shrink-0 text-[10px] text-zinc-500">
                {formatTime(receipt[timeKey])}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface ReceiptHoverProps {
  message: Message;
  currentUserId: string;
  children: ReactNode;
}

export const ReceiptHover = ({
  message,
  currentUserId,
  children,
}: ReceiptHoverProps) => {
  const [showPopup, setShowPopup] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSelf = message.senderId === currentUserId;

  const receipts = message.receipts || [];

  const readReceipts = receipts.filter(
    (receipt) => receipt.userId !== currentUserId && receipt.readAt,
  );

  const deliveredReceipts = receipts.filter(
    (receipt) =>
      receipt.deliveredAt &&
      receipt.userId !== currentUserId &&
      !receipt.readAt,
  );

  const handleMouseEnter = () => {
    if (!isSelf) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setShowPopup(true);
    }, 1000);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setShowPopup(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const formatTime = (date: string | null) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Don't add hover behavior to messages that aren't yours
  if (!isSelf) {
    return children;
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.94,
              y: 8,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: 5,
            }}
            transition={{
              duration: 0.18,
              ease: "easeOut",
            }}
            className="
              absolute
              bottom-[calc(100%+10px)]
              right-0
              z-50
              w-64
              overflow-hidden
              rounded-2xl
              border
              border-zinc-700/70
              bg-zinc-950/90
              p-3
              shadow-2xl
              backdrop-blur-xl
            "
          >
            {/* READ */}
            {readReceipts.length > 0 && (
              <ReceiptSection
                title="Read"
                icon={<CheckCheck size={13} />}
                iconClass="text-emerald-400"
                receipts={readReceipts}
                timeKey="readAt"
                formatTime={formatTime}
                currentUserId={currentUserId}
              />
            )}

            {/* DELIVERED */}
            {deliveredReceipts.length > 0 && (
              <ReceiptSection
                title="Delivered"
                icon={<CheckCheck size={13} />}
                iconClass="text-zinc-400"
                receipts={deliveredReceipts}
                timeKey="deliveredAt"
                formatTime={formatTime}
                hasBorder={readReceipts.length > 0}
                currentUserId={currentUserId}
              />
            )}

            {/* Nothing */}
            {readReceipts.length === 0 && deliveredReceipts.length === 0 && (
              <div className="py-3 text-center">
                <p className="text-xs text-zinc-500">No delivery information</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
