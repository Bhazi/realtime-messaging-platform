import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { motion } from "motion/react";
import {
  Check,
  CheckCheck,
  Download,
  Eye,
  FileText,
  Play,
  Trash2,
} from "lucide-react";

import { MediaViewerModal } from "./MediaViewerModal";
import { ReceiptHover } from "./ReceiptHover";

import type {
  Message,
  MessageAttachment,
  MessageType,
} from "../../../types/types";

import { socket } from "../../../lib/socket";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onDeleteMessage: (messageId: string) => void;
  canManageMessages: boolean;
  conversationId: string;
  onLoadOlderMessages: () => Promise<void>;
  hasMoreMessages: boolean;
  isLoadingOlderMessages: boolean;
  conversationType: string;
  shouldScrollToBottomRef: RefObject<boolean>;
}

interface ActiveViewer {
  attachment: MessageAttachment;
  type: MessageType;
}

interface MessageStatusProps {
  message: Message;
  currentUserId: string;
}

const API_URL = "http://localhost:5000";

const messageContainerVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.15,
      ease: "easeOut",
    },
  },
};

const messageVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.15,
      ease: "easeOut",
    },
  },
};

function MessageStatus({ message, currentUserId }: MessageStatusProps) {
  if (message.sender!.id !== currentUserId) {
    return null;
  }

  const receipt = (message.receipts ?? []).find(
    (item) => item.userId !== currentUserId,
  );

  if (!receipt) {
    return <Check size={14} strokeWidth={2.5} className="text-zinc-400" />;
  }

  if (receipt.readAt) {
    return <CheckCheck size={16} strokeWidth={2} className="text-sky-500" />;
  }

  if (receipt.deliveredAt) {
    return <CheckCheck size={16} strokeWidth={2.5} className="text-zinc-300" />;
  }

  return <Check size={14} strokeWidth={2.5} className="text-zinc-400" />;
}

function formatMessageDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const MessageList = ({
  messages,
  currentUserId,
  onDeleteMessage,
  canManageMessages,
  conversationId,
  onLoadOlderMessages,
  hasMoreMessages,
  isLoadingOlderMessages,
  conversationType,
  shouldScrollToBottomRef,
}: MessageListProps) => {
  const [activeViewer, setActiveViewer] = useState<ActiveViewer | null>(null);

  const [visibleDate, setVisibleDate] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isInitialLoadRef = useRef(true);
  const previousMessageCountRef = useRef(0);

  const loadingOlderRef = useRef(false);
  const loadingOlderMessagesRef = useRef(false);

  const previousScrollHeightRef = useRef<number | null>(null);
  const previousScrollTopRef = useRef<number | null>(null);

  const readMessageIdsRef = useRef<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  /*
   * =====================================================
   * RESET WHEN CONVERSATION CHANGES
   * =====================================================
   */

  useEffect(() => {
    isInitialLoadRef.current = true;
    previousMessageCountRef.current = 0;

    previousScrollHeightRef.current = null;
    previousScrollTopRef.current = null;

    loadingOlderRef.current = false;
    loadingOlderMessagesRef.current = false;

    readMessageIdsRef.current.clear();

    setVisibleDate(null);
  }, [conversationId]);

  /*
   * =====================================================
   * INITIAL LOAD / NEW MESSAGE SCROLLING
   * =====================================================
   */

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    /*
     * Initial conversation load.
     */
    if (isInitialLoadRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "auto",
          block: "end",
        });
      });

      previousMessageCountRef.current = messages.length;
      isInitialLoadRef.current = false;

      return;
    }

    /*
     * Older messages are being prepended.
     *
     * Scroll restoration is handled by the
     * useLayoutEffect below.
     */
    if (loadingOlderMessagesRef.current) {
      return;
    }

    const hasNewMessages = messages.length > previousMessageCountRef.current;

    if (hasNewMessages && shouldScrollToBottomRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });

      shouldScrollToBottomRef.current = false;
    }

    previousMessageCountRef.current = messages.length;
  }, [messages, shouldScrollToBottomRef]);

  /*
   * =====================================================
   * RESTORE SCROLL AFTER PREPENDING
   * =====================================================
   */

  useLayoutEffect(() => {
    if (!loadingOlderMessagesRef.current) {
      return;
    }

    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    const previousScrollHeight = previousScrollHeightRef.current;
    const previousScrollTop = previousScrollTopRef.current;

    if (previousScrollHeight !== null && previousScrollTop !== null) {
      const heightDifference = container.scrollHeight - previousScrollHeight;

      container.scrollTop = previousScrollTop + heightDifference;
    }

    previousScrollHeightRef.current = null;
    previousScrollTopRef.current = null;

    loadingOlderMessagesRef.current = false;
    loadingOlderRef.current = false;

    previousMessageCountRef.current = messages.length;
  }, [messages]);

  /*
   * =====================================================
   * LOAD OLDER MESSAGES
   * =====================================================
   */

  const handleLoadOlderMessages = async () => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    if (loadingOlderRef.current || isLoadingOlderMessages || !hasMoreMessages) {
      return;
    }

    previousScrollHeightRef.current = container.scrollHeight;
    previousScrollTopRef.current = container.scrollTop;

    loadingOlderRef.current = true;
    loadingOlderMessagesRef.current = true;

    try {
      await onLoadOlderMessages();
    } catch (error) {
      console.error("Failed to load older messages:", error);

      loadingOlderRef.current = false;
      loadingOlderMessagesRef.current = false;

      previousScrollHeightRef.current = null;
      previousScrollTopRef.current = null;
    }
  };

  /*
   * =====================================================
   * INFINITE SCROLL
   * =====================================================
   */

  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    const handleScroll = () => {
      const isNearTop = container.scrollTop <= 50;

      if (
        !isNearTop ||
        !hasMoreMessages ||
        isLoadingOlderMessages ||
        loadingOlderRef.current
      ) {
        return;
      }

      void handleLoadOlderMessages();
    };

    container.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [hasMoreMessages, isLoadingOlderMessages, onLoadOlderMessages]);

  /*
   * =====================================================
   * STICKY MESSAGE DATE
   * =====================================================
   */

  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container || messages.length === 0) {
      return;
    }

    const handleScroll = () => {
      const messageElements = Array.from(
        container.querySelectorAll<HTMLElement>("[data-message-date]"),
      );

      if (messageElements.length === 0) {
        return;
      }

      const containerTop = container.getBoundingClientRect().top;

      let currentDate: string | null = null;

      for (const element of messageElements) {
        const rect = element.getBoundingClientRect();

        if (rect.top <= containerTop + 60) {
          currentDate = element.dataset.messageDate ?? null;
        }
      }

      if (!currentDate) {
        currentDate = messageElements[0].dataset.messageDate ?? null;
      }

      setVisibleDate(currentDate);
    };

    handleScroll();

    container.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [messages]);

  /*
   * =====================================================
   * MESSAGE READ OBSERVER
   * =====================================================
   */

  useEffect(() => {
    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          const element = entry.target as HTMLElement;

          const messageId = element.dataset.messageId;
          const messageSeq = element.dataset.messageSeq;
          const senderId = element.dataset.senderId;

          if (!messageId || !messageSeq) {
            continue;
          }

          /*
           * We don't need to mark our own messages as read.
           */
          if (senderId === currentUserId) {
            observerRef.current?.unobserve(element);
            continue;
          }

          if (readMessageIdsRef.current.has(messageId)) {
            continue;
          }

          readMessageIdsRef.current.add(messageId);

          socket.emit("conversation:read_up_to", {
            conversationId,
            lastReadSeq: messageSeq,
          });

          socket.emit("message:read", {
            messageId,
            conversationId,
          });

          observerRef.current?.unobserve(element);
        }
      },
      {
        threshold: 0.5,
      },
    );

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [conversationId, currentUserId]);

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <motion.div
      ref={scrollContainerRef}
      className="relative min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-0"
      variants={messageContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Sticky date */}
      {messages.length > 0 && (
        <div className="pointer-events-none sticky top-0 z-30 flex h-0 justify-center">
          <div className="relative top-2 flex h-[25px] min-w-[110px] items-center justify-center rounded-full border border-white/30 bg-zinc-800 px-4 shadow-sm">
            <span className="whitespace-nowrap text-xs font-normal text-white">
              {visibleDate}
            </span>
          </div>
        </div>
      )}

      {/* Loading older messages */}
      {isLoadingOlderMessages && messages.length > 0 && (
        <div className="flex justify-center py-2">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" />
            <span>Loading older messages...</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {messages.length === 0 ? (
        <motion.div
          className="flex h-full flex-col items-center justify-center space-y-3 p-8 text-center text-zinc-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.25,
            ease: "easeOut",
          }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-400">
            <FileText size={28} />
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-300">
              No media shared yet
            </p>

            <p className="text-xs text-zinc-500">
              Share photos, videos, or documents using the action bar below.
            </p>
          </div>
        </motion.div>
      ) : (
        /* Messages */
        messages.map((message) => {
          const isSelf = message.senderId === currentUserId;

          const isDeleted = Boolean(message.deletedAt);

          const canDelete = !isDeleted && (isSelf || canManageMessages);

          const messageDate = formatMessageDate(message.createdAt);

          const attachment = message.attachment;

          return (
            <motion.div
              key={message.id}
              data-message-date={messageDate}
              data-message-id={message.id}
              data-message-seq={message.seq}
              data-sender-id={message.senderId}
              variants={messageVariants}
              className={`group mb-2 flex gap-3 px-4 py-2 ${
                isSelf ? "flex-row-reverse" : "flex-row"
              }`}
              ref={(element) => {
                if (element) {
                  observerRef.current?.observe(element);
                }
              }}
            >
              {/* Avatar */}
              <img
                src={`${API_URL}${message.sender?.avatarUrl}`}
                alt={message.sender?.displayName ?? "Sender"}
                className="mt-1 h-9 w-8 flex-shrink-0 rounded-full border border-zinc-700 object-cover"
              />

              <div
                className={`max-w-xs space-y-1 sm:max-w-md lg:max-w-lg ${
                  isSelf ? "items-end" : "items-start"
                }`}
              >
                {/* Message header */}
                <div
                  className={`flex items-center text-[11px] text-zinc-400 ${
                    conversationType === "GROUP" ? "gap-2" : ""
                  } ${isSelf ? "justify-end" : "justify-start"}`}
                >
                  {!isSelf && conversationType === "GROUP" && (
                    <>
                      <span className="font-semibold text-zinc-300">
                        {message.sender?.displayName}
                      </span>

                      <span>•</span>
                    </>
                  )}

                  <span>{formatTime(message.createdAt)}</span>
                </div>

                {/* Deleted message */}
                {isDeleted ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3 text-xs italic text-zinc-500">
                    <Trash2 size={13} />
                    <span>Message deleted</span>
                  </div>
                ) : (
                  <div className="group/card relative">
                    {/* Text */}
                    {message.type === "TEXT" && (
                      <ReceiptHover
                        message={message}
                        currentUserId={currentUserId}
                      >
                        <div
                          className={`max-w-sm break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-md sm:max-w-md ${
                            isSelf
                              ? "rounded-tr-xs bg-indigo-600 text-white"
                              : "rounded-tl-xs border border-zinc-700/60 bg-zinc-800 text-zinc-100"
                          }`}
                        >
                          {message.content}
                        </div>
                      </ReceiptHover>
                    )}

                    {/* Photo */}
                    {message.type === "PHOTO" && attachment && (
                      <ReceiptHover
                        message={message}
                        currentUserId={currentUserId}
                      >
                        <div className="max-w-sm space-y-1.5">
                          {message.content && (
                            <p className="px-1 text-xs font-medium text-zinc-200">
                              {message.content}
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setActiveViewer({
                                attachment,
                                type: "PHOTO",
                              })
                            }
                            className="group/photo relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-left shadow-xl transition-all hover:border-indigo-500/60"
                          >
                            <img
                              src={attachment.url}
                              alt={attachment.filename}
                              className="h-auto max-h-72 w-full object-cover"
                            />

                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 bg-black/40 text-xs font-semibold text-white opacity-0 backdrop-blur-xs transition-opacity group-hover/photo:opacity-100">
                              <Eye size={18} />
                              View Photo
                            </div>

                            <div className="flex items-center justify-between border-t border-zinc-800/60 bg-zinc-950/90 p-2.5">
                              <span className="max-w-[200px] truncate text-xs font-medium text-white">
                                {attachment.filename}
                              </span>

                              <span className="font-mono text-[10px] text-zinc-400">
                                {formatFileSize(attachment.size)}
                              </span>
                            </div>
                          </button>
                        </div>
                      </ReceiptHover>
                    )}

                    {/* Video */}
                    {message.type === "VIDEO" && attachment && (
                      <ReceiptHover
                        message={message}
                        currentUserId={currentUserId}
                      >
                        <div className="max-w-sm space-y-1.5">
                          {message.content && (
                            <p className="px-1 text-xs font-medium text-zinc-200">
                              {message.content}
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setActiveViewer({
                                attachment,
                                type: "VIDEO",
                              })
                            }
                            className="group/video relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-left shadow-xl transition-all hover:border-purple-500/60"
                          >
                            <div className="relative flex h-48 items-center justify-center bg-zinc-900">
                              <video
                                src={attachment.url}
                                className="h-full w-full object-cover opacity-80"
                                muted
                                preload="metadata"
                              />

                              <div className="absolute flex h-12 w-12 items-center justify-center rounded-full bg-purple-600/90 text-white shadow-2xl backdrop-blur-md">
                                <Play size={20} className="ml-0.5" />
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-zinc-800/60 bg-zinc-950/90 p-2.5">
                              <span className="max-w-[200px] truncate text-xs font-medium text-white">
                                {attachment.filename}
                              </span>

                              <span className="font-mono text-[10px] text-zinc-400">
                                {formatFileSize(attachment.size)}
                              </span>
                            </div>
                          </button>
                        </div>
                      </ReceiptHover>
                    )}

                    {/* File */}
                    {message.type === "FILE" && attachment && (
                      <ReceiptHover
                        message={message}
                        currentUserId={currentUserId}
                      >
                        <div className="max-w-sm space-y-1.5">
                          {message.content && (
                            <p className="px-1 text-xs font-medium text-zinc-200">
                              {message.content}
                            </p>
                          )}

                          <div className="flex min-w-[260px] items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5 shadow-xl transition-colors hover:border-zinc-700">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                              <FileText size={20} />
                            </div>

                            <div className="flex-1 truncate">
                              <p className="truncate text-xs font-semibold text-white">
                                {attachment.filename}
                              </p>

                              <p className="mt-0.5 font-mono text-[10px] text-zinc-400">
                                {formatFileSize(attachment.size)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setActiveViewer({
                                  attachment,
                                  type: "FILE",
                                })
                              }
                              className="cursor-pointer rounded-xl bg-zinc-800 p-2 text-zinc-200 transition-colors hover:bg-zinc-700"
                              title="Download file"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </div>
                      </ReceiptHover>
                    )}

                    {/* Message status */}
                    {conversationType === "DIRECT" && isSelf && (
                      <div className="mt-1 flex items-center justify-end gap-1">
                        <MessageStatus
                          message={message}
                          currentUserId={currentUserId}
                        />
                      </div>
                    )}

                    {/* Delete */}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDeleteMessage(message.id)}
                        title="Delete message"
                        className={`absolute top-2 ${
                          isSelf ? "-left-8" : "-right-8"
                        } cursor-pointer rounded-lg bg-rose-500/10 p-1.5 text-rose-400 opacity-0 transition-all hover:bg-rose-500/20 group-hover/card:opacity-100`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })
      )}

      {/* Bottom anchor */}
      <div ref={messagesEndRef} />

      {/* Media viewer */}
      <MediaViewerModal
        isOpen={activeViewer !== null}
        onClose={() => setActiveViewer(null)}
        attachment={activeViewer?.attachment ?? null}
        type={activeViewer?.type ?? null}
      />
    </motion.div>
  );
};
