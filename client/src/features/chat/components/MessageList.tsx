import React, { useState, useRef, useEffect, useLayoutEffect } from "react";

import { motion } from "motion/react";

import { FileText, Download, Trash2, Eye, Play } from "lucide-react";

import { Message, MessageAttachment, MessageType } from "../../../types/types";

import { MediaViewerModal } from "./MediaViewerModal";

interface MessageListProps {
  messages: Message[];

  currentUserId: string;

  onDeleteMessage: (messageId: string) => void;

  canManageMessages: boolean;

  conversationId: string;

  /*
   * Parent owns pagination.
   */
  onLoadOlderMessages: () => Promise<void>;

  hasMoreMessages: boolean;

  isLoadingOlderMessages: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  onDeleteMessage,
  canManageMessages,
  conversationId,

  /*
   * IMPORTANT:
   *
   * Your previous code was missing these three
   * values in the destructuring.
   */
  onLoadOlderMessages,
  hasMoreMessages,
  isLoadingOlderMessages,
}) => {
  const [activeViewer, setActiveViewer] = useState<{
    attachment: MessageAttachment;
    type: MessageType;
  } | null>(null);

  const [visibleDate, setVisibleDate] = useState<string | null>(null);

  /*
   * Main scroll container.
   */
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  /*
   * Bottom anchor.
   */
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  /*
   * Detect first render / conversation switch.
   */
  const isInitialLoad = useRef(true);

  /*
   * Used for detecting newly appended messages.
   */
  const previousMessageCount = useRef(0);

  /*
   * Prevent multiple top-scroll requests.
   */
  const loadingOlderRef = useRef(false);

  /*
   * Stores scroll position before older messages
   * are inserted.
   *
   * Example:
   *
   * previousScrollHeight = 1200
   * previousScrollTop    = 100
   *
   * After adding old messages:
   *
   * newScrollHeight = 1800
   *
   * We set:
   *
   * scrollTop = 100 + (1800 - 1200)
   *           = 700
   */
  const previousScrollHeight = useRef<number | null>(null);

  const previousScrollTop = useRef<number | null>(null);

  /*
   * Tells us that the next messages update is
   * specifically caused by loading older messages.
   */
  const loadingOlderMessagesRef = useRef(false);

  /*
   * Reset state when conversation changes.
   */
  useEffect(() => {
    isInitialLoad.current = true;

    previousMessageCount.current = 0;

    previousScrollHeight.current = null;

    previousScrollTop.current = null;

    loadingOlderMessagesRef.current = false;

    loadingOlderRef.current = false;
  }, [conversationId]);

  /*
   * ============================================================
   * INITIAL LOAD / NEW MESSAGE SCROLLING
   * ============================================================
   *
   * DO NOT automatically scroll to bottom whenever messages
   * increase.
   *
   * That would break pagination.
   */
  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    /*
     * First page loaded.
     *
     * Start the chat at the bottom.
     */
    if (isInitialLoad.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "auto",
          block: "end",
        });
      });

      previousMessageCount.current = messages.length;

      isInitialLoad.current = false;

      return;
    }

    /*
     * If we are loading older messages, DON'T
     * scroll to bottom.
     *
     * The useLayoutEffect below will restore the
     * previous viewport.
     */
    if (loadingOlderMessagesRef.current) {
      return;
    }

    /*
     * A new message was appended.
     *
     * Scroll to bottom.
     */
    if (messages.length > previousMessageCount.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });
    }

    previousMessageCount.current = messages.length;
  }, [messages]);

  /*
   * ============================================================
   * RESTORE SCROLL POSITION AFTER PREPENDING OLD MESSAGES
   * ============================================================
   *
   * useLayoutEffect is important here because it runs after
   * React has updated the DOM but before the browser paints.
   */
  useLayoutEffect(() => {
    if (!loadingOlderMessagesRef.current) {
      return;
    }

    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    const oldScrollHeight = previousScrollHeight.current;

    const oldScrollTop = previousScrollTop.current;

    if (oldScrollHeight !== null && oldScrollTop !== null) {
      const newScrollHeight = container.scrollHeight;

      const heightDifference = newScrollHeight - oldScrollHeight;

      container.scrollTop = oldScrollTop + heightDifference;
    }

    /*
     * Reset.
     */
    previousScrollHeight.current = null;

    previousScrollTop.current = null;

    loadingOlderMessagesRef.current = false;

    loadingOlderRef.current = false;

    /*
     * Update count after old messages were added.
     */
    previousMessageCount.current = messages.length;
  }, [messages]);

  /*
   * ============================================================
   * LOAD OLDER MESSAGES
   * ============================================================
   */
  const handleLoadOlderMessages = async () => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    /*
     * Don't make duplicate requests.
     */
    if (loadingOlderRef.current || isLoadingOlderMessages || !hasMoreMessages) {
      return;
    }

    /*
     * Save the exact scroll position BEFORE
     * loading older messages.
     */
    previousScrollHeight.current = container.scrollHeight;

    previousScrollTop.current = container.scrollTop;

    /*
     * Tell the effects that this update is
     * pagination, not a new message.
     */
    loadingOlderMessagesRef.current = true;

    loadingOlderRef.current = true;

    try {
      await onLoadOlderMessages();
    } catch (error) {
      console.error("Failed to load older messages:", error);

      /*
       * Reset if the request failed.
       */
      loadingOlderMessagesRef.current = false;

      loadingOlderRef.current = false;

      previousScrollHeight.current = null;

      previousScrollTop.current = null;
    }
  };

  /*
   * ============================================================
   * SCROLL HANDLER
   * ============================================================
   */
  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    const handleScroll = () => {
      /*
       * User reached near the top.
       *
       * 50px gives us a small threshold so the request
       * starts slightly before the absolute top.
       */
      const isNearTop = container.scrollTop <= 50;

      if (
        isNearTop &&
        hasMoreMessages &&
        !isLoadingOlderMessages &&
        !loadingOlderRef.current
      ) {
        handleLoadOlderMessages();
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [hasMoreMessages, isLoadingOlderMessages, onLoadOlderMessages]);

  /*
   * ============================================================
   * HELPERS
   * ============================================================
   */

  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container || messages.length === 0) {
      return;
    }

    const messageElements = Array.from(
      container.querySelectorAll("[data-message-date]"),
    );

    if (messageElements.length === 0) {
      return;
    }

    const handleScroll = () => {
      const containerTop = container.getBoundingClientRect().top;

      let currentDate: string | null = null;

      for (const element of messageElements) {
        const rect = element.getBoundingClientRect();

        /*
         * Find the last message that has passed
         * the top of the scroll container.
         */
        if (rect.top <= containerTop + 60) {
          currentDate = element.getAttribute("data-message-date");
        }
      }

      /*
       * If we haven't passed any message yet,
       * use the first message's date.
       */
      if (!currentDate) {
        currentDate = messageElements[0].getAttribute("data-message-date");
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

  const formatMessageDate = (isoString: string) => {
    const date = new Date(isoString);

    console.log(date.toLocaleDateString("en-UK"));

    return date.toLocaleDateString("en-UK");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);

    // setDate(d.toLocaleDateString());

    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  return (
    <motion.div
      ref={scrollContainerRef}
      className="relative min-h-0 flex-1 overflow-y-auto p-4 sm:p-0 space-y-4"
      variants={messageContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ===================================================== */}
      {/* STICKY DATE */}
      {/* ===================================================== */}
      {messages.length > 0 && (
        <div className="sticky top-0 z-30 flex h-0 justify-center pointer-events-none">
          <div className="relative top-2 flex h-[25px] min-w-[110px] items-center justify-center rounded-full border border-white/30 bg-zinc-800 px-4 shadow-sm">
            <span className="text-xs font-normal whitespace-nowrap text-white">
              {visibleDate}
            </span>
          </div>
        </div>
      )}
      {/* ===================================================== */}
      {/* LOADING OLDER MESSAGES */}
      {/* ===================================================== */}

      {isLoadingOlderMessages && messages.length > 0 && (
        <div className="flex justify-center py-2">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <div className="w-3.5 h-3.5 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin" />

            <span>Loading older messages...</span>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* NO MESSAGES */}
      {/* ===================================================== */}

      {messages.length === 0 ? (
        <motion.div
          className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500 space-y-3"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            duration: 0.25,
            ease: "easeOut",
          }}
        >
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
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
        /* =================================================== */
        /* MESSAGES */
        /* =================================================== */

        messages.map((msg) => {
          const isSelf = msg.senderId === currentUserId;

          const isDeleted = !!msg.deletedAt;

          const canDelete = !isDeleted && (isSelf || canManageMessages);

          const messageDate = formatMessageDate(msg.createdAt);

          return (
            <motion.div
              key={msg.id}
              data-message-date={messageDate}
              data-message-id={msg.id}
              variants={messageVariants}
              className={`flex gap-3 px-4 py-2 mb-2 group ${
                isSelf ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <img
                src={`http://localhost:5000${msg.sender?.avatarUrl}`}
                alt={msg.sender?.displayName || "Sender"}
                className="w-8 h-9 rounded-full object-cover border border-zinc-700 flex-shrink-0 mt-1"
              />

              <div
                className={`max-w-xs sm:max-w-md lg:max-w-lg space-y-1 ${
                  isSelf ? "items-end" : "items-start"
                }`}
              >
                {/* Message header */}
                <div
                  className={`flex items-center gap-2 text-[11px] text-zinc-400 ${
                    isSelf ? "justify-end" : "justify-start"
                  }`}
                >
                  <span className="font-semibold text-zinc-300">
                    {isSelf ? "" : msg.sender?.displayName || "User"}
                  </span>

                  <span>{isSelf ? "" : "•"}</span>

                  <span>{formatTime(msg.createdAt)}</span>
                </div>

                {/* Deleted message */}
                {isDeleted ? (
                  <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl italic text-xs text-zinc-500 flex items-center gap-2">
                    <Trash2 size={13} />
                    Message deleted
                  </div>
                ) : (
                  <div className="relative group/card">
                    {/* ================================================= */}
                    {/* TEXT */}
                    {/* ================================================= */}

                    {msg.type === "TEXT" && (
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed max-w-sm sm:max-w-md break-words shadow-md ${
                          isSelf
                            ? "bg-indigo-600 text-white rounded-tr-xs"
                            : "bg-zinc-800 text-zinc-100 border border-zinc-700/60 rounded-tl-xs"
                        }`}
                      >
                        {msg.content}
                      </div>
                    )}

                    {/* ================================================= */}
                    {/* PHOTO */}
                    {/* ================================================= */}

                    {msg.type === "PHOTO" && msg.attachment && (
                      <div className="space-y-1.5 max-w-sm">
                        {msg.content && (
                          <p className="text-xs font-medium text-zinc-200 px-1">
                            {msg.content}
                          </p>
                        )}

                        <div
                          onClick={() =>
                            setActiveViewer({
                              attachment: msg.attachment!,
                              type: "PHOTO",
                            })
                          }
                          className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-xl cursor-pointer hover:border-indigo-500/60 transition-all"
                        >
                          <img
                            src={msg.attachment.url}
                            alt={msg.attachment.filename}
                            className="w-full h-auto max-h-72 object-cover"
                          />

                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-xs">
                            <Eye size={18} />
                            View Photo
                          </div>

                          <div className="p-2.5 bg-zinc-950/90 flex items-center justify-between border-t border-zinc-800/60">
                            <span className="text-xs font-medium text-white truncate max-w-[200px]">
                              {msg.attachment.filename}
                            </span>

                            <span className="text-[10px] text-zinc-400 font-mono">
                              {formatFileSize(msg.attachment.size)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ================================================= */}
                    {/* VIDEO */}
                    {/* ================================================= */}

                    {msg.type === "VIDEO" && msg.attachment && (
                      <div className="space-y-1.5 max-w-sm">
                        {msg.content && (
                          <p className="text-xs font-medium text-zinc-200 px-1">
                            {msg.content}
                          </p>
                        )}

                        <div
                          onClick={() =>
                            setActiveViewer({
                              attachment: msg.attachment!,
                              type: "VIDEO",
                            })
                          }
                          className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-xl cursor-pointer hover:border-purple-500/60 transition-all"
                        >
                          <div className="relative bg-zinc-900 h-48 flex items-center justify-center">
                            <video
                              src={msg.attachment.url}
                              className="w-full h-full object-cover opacity-80"
                            />

                            <div className="absolute w-12 h-12 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-md">
                              <Play size={20} className="ml-0.5" />
                            </div>
                          </div>

                          <div className="p-2.5 bg-zinc-950/90 flex items-center justify-between border-t border-zinc-800/60">
                            <span className="text-xs font-medium text-white truncate max-w-[200px]">
                              {msg.attachment.filename}
                            </span>

                            <span className="text-[10px] text-zinc-400 font-mono">
                              {formatFileSize(msg.attachment.size)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {msg.type === "FILE" && msg.attachment && (
                      <div className="space-y-1.5 max-w-sm">
                        {msg.content && (
                          <p className="text-xs font-medium text-zinc-200 px-1">
                            {msg.content}
                          </p>
                        )}

                        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl flex items-center gap-3 hover:border-zinc-700 transition-colors min-w-[260px]">
                          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                            <FileText size={20} />
                          </div>

                          <div className="flex-1 truncate">
                            <p className="text-xs font-semibold text-white truncate">
                              {msg.attachment.filename}
                            </p>

                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                              {formatFileSize(msg.attachment.size)}
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              setActiveViewer({
                                attachment: msg.attachment!,
                                type: "FILE",
                              })
                            }
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ================================================= */}
                    {/* DELETE */}
                    {/* ================================================= */}

                    {canDelete && (
                      <button
                        onClick={() => onDeleteMessage(msg.id)}
                        title="Delete message"
                        className={`absolute top-2 ${
                          isSelf ? "-left-8" : "-right-8"
                        } opacity-0 group-hover/card:opacity-100 p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer`}
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

      {/* ===================================================== */}
      {/* BOTTOM ANCHOR */}
      {/* ===================================================== */}

      <div ref={messagesEndRef} />

      {/* ===================================================== */}
      {/* MEDIA VIEWER */}
      {/* ===================================================== */}

      <MediaViewerModal
        isOpen={!!activeViewer}
        onClose={() => setActiveViewer(null)}
        attachment={activeViewer?.attachment || null}
        type={activeViewer?.type || null}
      />
    </motion.div>
  );
};
