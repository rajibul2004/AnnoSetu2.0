"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPaperPlane,
  FaUtensils,
  FaMapMarkerAlt,
  FaClock,
  FaCheck,
  FaCheckDouble,
  FaCar,
  FaSmile,
  FaTimes,
  FaChevronDown,
  FaExclamationCircle,
  FaVolumeUp,
  FaVolumeMute,
  FaSearch,
  FaCopy,
  FaSpinner,
} from "react-icons/fa";
import { format, isToday, isYesterday } from "date-fns";
import {
  useConversation,
  useSendMessage,
  useMarkConversationAsRead,
  useTypingIndicator,
  useChatSoundSetting,
} from "@/hooks/useMessaging";
import { useAuth } from "@/hooks/useAuth";
import { RESIDUAL_QUICK_CHIPS, QuickChip, MessageDTO } from "@/types/message";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { setActiveConversationId } from "@/lib/activeChatTracker";
import toast from "react-hot-toast";

interface ChatWindowProps {
  conversationId: string;
  onClose?: () => void;
  isModal?: boolean;
}

const QUICK_EMOJIS = ["👋", "👍", "❤️", "🍛", "🚗", "⏱️", "🙏", "✅"];

function formatMessageDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Recent";
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMMM d, yyyy");
}

export default function ChatWindow({
  conversationId,
  onClose,
  isModal = false,
}: ChatWindowProps) {
  const { user } = useAuth();
  const [inputMessage, setInputMessage] = useState("");
  const [showEtaModal, setShowEtaModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Register active conversation ID to suppress redundant popup toasts & double sounds
  useEffect(() => {
    setActiveConversationId(conversationId);
    return () => {
      setActiveConversationId(null);
    };
  }, [conversationId]);

  const { soundOn, toggleSound } = useChatSoundSetting();
  const { data: conversation, isLoading, isError, connectionStatus } = useConversation(
    conversationId,
    user?.id
  );
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(
    conversationId,
    user?.id
  );
  const { mutate: markAsRead } = useMarkConversationAsRead();
  const {
    isOtherTyping,
    typingText,
    handleUserTyping,
    handleUserStopTyping,
  } = useTypingIndicator(conversationId, user?.id);

  const prevMessagesCountRef = useRef(0);

  // Smooth scroll ONLY inside the message container, never touching window/page scroll
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (!messagesContainerRef.current) return;
    const container = messagesContainerRef.current;
    if (behavior === "smooth") {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  // Detect scroll position to show/hide "Scroll to bottom" button
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 150);
  };

  // Scroll only chat window on initial message load or new message arrivals
  useEffect(() => {
    const currentCount = conversation?.messages?.length || 0;
    if (currentCount > 0) {
      if (prevMessagesCountRef.current === 0) {
        // Initial load: instant jump inside the chat container
        scrollToBottom("auto");
      } else if (currentCount > prevMessagesCountRef.current) {
        // New message: smooth scroll inside the chat container
        scrollToBottom("smooth");
      }
      prevMessagesCountRef.current = currentCount;
    }
  }, [conversation?.messages?.length, scrollToBottom]);

  // Mark as read when conversation is opened, new messages arrive, or window gains focus
  useEffect(() => {
    if (!conversationId) return;

    markAsRead(conversationId);

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        markAsRead(conversationId);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [conversationId, conversation?.messages?.length, markAsRead]);

  // Handle message sending
  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanContent = inputMessage.trim();
    if (!cleanContent || isSending) return;

    handleUserStopTyping();
    sendMessage({
      content: cleanContent,
      messageType: "text",
    });
    setInputMessage("");
    setShowEmojiPicker(false);
    setTimeout(() => {
      scrollToBottom("smooth");
      inputRef.current?.focus({ preventScroll: true });
    }, 50);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    if (e.target.value.trim().length > 0) {
      handleUserTyping();
    } else {
      handleUserStopTyping();
    }
  };

  const handleSendQuickChip = (chip: QuickChip) => {
    handleUserStopTyping();
    sendMessage({
      content: chip.message,
      messageType: "quick_chip",
      metadata: { chipId: chip.id, icon: chip.icon, label: chip.label },
    });
    setTimeout(() => scrollToBottom("smooth"), 50);
  };

  const handleSendEta = (minutes: number) => {
    handleUserStopTyping();
    sendMessage({
      content: `🚗 I am on my way! Estimated arrival in ${minutes} minutes.`,
      messageType: "eta_share",
      metadata: { etaMinutes: minutes },
    });
    setShowEtaModal(false);
    setTimeout(() => scrollToBottom("smooth"), 50);
  };

  const handleInsertEmoji = (emoji: string) => {
    setInputMessage((prev) => prev + emoji);
    handleUserTyping();
    inputRef.current?.focus({ preventScroll: true });
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard", { duration: 1200 });
  };

  // Group messages by day
  const groupedMessages = useMemo(() => {
    if (!conversation?.messages) return [];

    let list = conversation.messages;
    if (filterSearch.trim()) {
      const term = filterSearch.toLowerCase();
      list = list.filter((m) => m.content.toLowerCase().includes(term));
    }

    const groups: { dateKey: string; messages: MessageDTO[] }[] = [];
    let currentGroup: { dateKey: string; messages: MessageDTO[] } | null = null;

    list.forEach((msg) => {
      const dateKey = formatMessageDateSeparator(msg.createdAt);
      if (!currentGroup || currentGroup.dateKey !== dateKey) {
        currentGroup = { dateKey, messages: [msg] };
        groups.push(currentGroup);
      } else {
        currentGroup.messages.push(msg);
      }
    });

    return groups;
  }, [conversation?.messages, filterSearch]);

  // Accurately determine if the current user is the Food Supplier or the Customer/Reserver
  const isUserSupplier = useMemo(() => {
    if (!conversation) return false;
    // 1. Direct check against reservation IDs
    if (conversation.foodInfo?.supplierId) {
      return conversation.foodInfo.supplierId === user?.id;
    }
    if (conversation.foodInfo?.reserverId) {
      return conversation.foodInfo.reserverId !== user?.id;
    }
    // 2. Role-based check
    if (
      conversation.otherParticipant?.role === "restaurant" ||
      conversation.otherParticipant?.role === "ngo"
    ) {
      return false; // Customer / Reserver
    }
    if (user?.role === "restaurant" || user?.role === "ngo") {
      return true; // Supplier
    }
    // Default fallback for individual consumers
    return false;
  }, [conversation, user?.id, user?.role]);

  const userRoleType = isUserSupplier ? "supplier" : "reserver";

  const relevantQuickChips = useMemo(() => {
    return RESIDUAL_QUICK_CHIPS.filter(
      (c) => c.type === "both" || c.type === userRoleType
    );
  }, [userRoleType]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-950/50">
        <LoadingSpinner text="Loading conversation..." />
      </div>
    );
  }

  if (isError || !conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white/50 dark:bg-slate-900/50">
        <FaExclamationCircle className="text-4xl text-rose-500 mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Conversation Unavailable
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
          This conversation could not be loaded or you do not have permission to view it.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-2xl overflow-hidden relative select-text">
      {/* 1. Context Header */}
      <div className="p-3.5 sm:px-6 bg-white/95 dark:bg-slate-900/95 border-b border-gray-200/80 dark:border-slate-800 backdrop-blur-md z-10 shrink-0 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          {/* Other Participant Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                {conversation.otherParticipant.name.charAt(0).toUpperCase()}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white dark:border-slate-900 rounded-full transition-all duration-300 ${
                  isOtherTyping
                    ? "bg-emerald-400 animate-ping"
                    : conversation.otherParticipant.isOnline
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]"
                    : "bg-gray-300 dark:bg-slate-600"
                }`}
                title={
                  conversation.otherParticipant.isOnline
                    ? "Online now"
                    : conversation.otherParticipant.lastSeen
                    ? `Last active ${format(new Date(conversation.otherParticipant.lastSeen), "h:mm a")}`
                    : "Offline"
                }
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-gray-900 dark:text-white text-sm sm:text-base leading-tight truncate">
                  {conversation.otherParticipant.name}
                </h3>
                {/* Real-Time Stream Status Badge */}
                {connectionStatus === "connected" ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                ) : connectionStatus === "reconnecting" || connectionStatus === "connecting" ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/60">
                    <FaSpinner className="animate-spin text-[8px]" />
                    Connecting
                  </span>
                ) : null}
              </div>

              {/* Status / Typing Indicator Text */}
              {isOtherTyping ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold animate-pulse mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                  <span>{typingText}</span>
                </div>
              ) : conversation.otherParticipant.isOnline ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Online</span>
                  {conversation.foodInfo && (
                    <span className="text-gray-400 dark:text-gray-500 truncate ml-1">
                      • {conversation.foodInfo.name}
                    </span>
                  )}
                </p>
              ) : conversation.foodInfo ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
                  <FaUtensils className="text-[10px] text-emerald-500 shrink-0" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {conversation.foodInfo.name}
                  </span>
                  <span>•</span>
                  <span>
                    {conversation.foodInfo.quantity} {conversation.foodInfo.quantityUnit}
                  </span>
                </p>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                  {conversation.otherParticipant.lastSeen
                    ? `Active ${format(new Date(conversation.otherParticipant.lastSeen), "h:mm a")}`
                    : "Direct Chat"}
                </p>
              )}
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search in chat toggle */}
            <button
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) setFilterSearch("");
              }}
              className={`p-2 rounded-xl transition-colors cursor-pointer text-xs ${
                showSearch
                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800"
              }`}
              title="Search messages"
            >
              <FaSearch />
            </button>

            {/* Sound Mute Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs"
              title={soundOn ? "Mute chat sounds" : "Enable chat sounds"}
            >
              {soundOn ? (
                <FaVolumeUp className="text-emerald-600 dark:text-emerald-400" />
              ) : (
                <FaVolumeMute className="text-gray-400" />
              )}
            </button>

            {conversation.reservationId && (
              <Link
                href={`/protected/reservation/${conversation.reservationId}`}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors"
              >
                <span>Ticket #</span>
                <span>{conversation.reservationId.slice(-6).toUpperCase()}</span>
              </Link>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close chat"
              >
                <FaTimes size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Message Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-2 pt-2 border-t border-gray-100 dark:border-slate-800"
            >
              <div className="relative">
                <FaSearch className="absolute left-3 top-2.5 text-xs text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter messages in this chat..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  autoFocus
                />
                {filterSearch && (
                  <button
                    onClick={() => setFilterSearch("")}
                    className="absolute right-2.5 top-2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Food & Pickup Context Strip */}
        {conversation.foodInfo && (
          <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2 truncate">
              <FaMapMarkerAlt className="text-emerald-500 shrink-0" />
              <span className="truncate">
                {conversation.foodInfo.pickupAddress || "Pickup location in reservation ticket"}
              </span>
            </div>
            {conversation.foodInfo.pickupTime && (
              <div className="flex items-center gap-1 font-bold text-gray-700 dark:text-gray-300 shrink-0 ml-2">
                <FaClock className="text-amber-500" />
                <span>
                  {format(new Date(conversation.foodInfo.pickupTime), "h:mm a")}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Message History Thread */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 custom-scrollbar relative overscroll-contain"
      >
        {groupedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400 dark:text-gray-500">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl mb-3">
              <FaPaperPlane />
            </div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {filterSearch ? "No matching messages found" : "Start the conversation"}
            </p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              {filterSearch
                ? "Try searching for a different keyword."
                : "Coordinate food pickup time, parking instructions, or express gratitude."}
            </p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.dateKey} className="space-y-3">
              {/* Date Header Pill */}
              <div className="flex justify-center my-3 sticky top-1 z-5">
                <span className="px-3 py-1 text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-white/90 dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 rounded-full shadow-2xs backdrop-blur-md">
                  {group.dateKey}
                </span>
              </div>

              {/* Messages within this date */}
              {group.messages.map((msg, index) => {
                if (msg.messageType === "system") {
                  return (
                    <div key={msg.id || index} className="flex justify-center my-2">
                      <span className="px-3.5 py-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-400 bg-gray-100/90 dark:bg-slate-800/90 border border-gray-200/60 dark:border-slate-700/60 rounded-xl shadow-2xs text-center max-w-md">
                        {msg.content}
                      </span>
                    </div>
                  );
                }

                const isSelf = Boolean(
                  msg.isSelf ||
                  (user?.id && msg.senderId === user.id) ||
                  msg.id.startsWith("temp-")
                );
                const isTemp = msg.id.startsWith("temp-");

                return (
                  <motion.div
                    key={msg.id || index}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`group flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[88%] sm:max-w-[72%] rounded-2xl p-3.5 shadow-xs relative transition-all ${
                        isSelf
                          ? "bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-tr-xs"
                          : msg.messageType === "eta_share"
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-tl-xs shadow-md"
                          : msg.messageType === "quick_chip"
                          ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 text-emerald-950 dark:text-emerald-100 rounded-tl-xs"
                          : "bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-tl-xs"
                      }`}
                    >
                      {/* ETA Header Badge */}
                      {msg.messageType === "eta_share" && (
                        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider mb-1.5 opacity-90">
                          <FaCar className="text-sm" />
                          <span>Live ETA Arrival</span>
                        </div>
                      )}

                      {/* Content */}
                      <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap break-words select-text">
                        {msg.content}
                      </p>

                      {/* Footer: Timestamp & Delivery Status & Quick Copy */}
                      <div
                        className={`flex items-center justify-end gap-1.5 text-[10px] mt-1.5 select-none ${
                          isSelf || msg.messageType === "eta_share"
                            ? "text-white/80"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        <button
                          onClick={() => handleCopyText(msg.content)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-white dark:hover:text-white cursor-pointer mr-1"
                          title="Copy message"
                        >
                          <FaCopy size={9} />
                        </button>

                        <span>
                          {format(new Date(msg.createdAt), "h:mm a")}
                        </span>

                        {isSelf && (
                          <span className="flex items-center ml-0.5">
                            {isTemp ? (
                              <FaSpinner className="animate-spin text-white/70" title="Sending..." />
                            ) : msg.isRead ? (
                              <FaCheckDouble className="text-cyan-200" title="Read" />
                            ) : (
                              <FaCheck className="text-white/70" title="Delivered" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))
        )}

        {/* Real-time Typing Bubble on Receiver End */}
        <AnimatePresence>
          {isOtherTyping && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              className="flex items-center gap-2 items-start"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                {conversation.otherParticipant.name.charAt(0).toUpperCase()}
              </div>
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-28 right-6 z-20 w-9 h-9 rounded-full bg-emerald-600 text-white shadow-lg flex items-center justify-center hover:bg-emerald-500 transition-all cursor-pointer"
            title="Scroll to latest message"
          >
            <FaChevronDown size={14} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 3. Quick Action Chips Bar */}
      <div className="px-3.5 py-2 bg-white/80 dark:bg-slate-900/80 border-t border-gray-200/60 dark:border-slate-800/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
          {/* Share ETA Button - only relevant for Reserver/Customer picking up the food */}
          {!isUserSupplier && (
            <button
              type="button"
              onClick={() => setShowEtaModal(true)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <FaCar className="text-xs" />
              <span>Share ETA 🚗</span>
            </button>
          )}

          {/* Canned Quick Chips */}
          {relevantQuickChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleSendQuickChip(chip)}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-gray-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold text-xs transition-all shadow-2xs cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Emoji Quick Tray */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto custom-scrollbar"
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleInsertEmoji(emoji)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center text-lg transition-transform active:scale-125 cursor-pointer shrink-0"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Text Input & Fast Send Form */}
      <div className="p-2.5 sm:p-3.5 bg-white dark:bg-slate-900 border-t border-gray-200/80 dark:border-slate-800 shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2.5 rounded-2xl transition-colors cursor-pointer text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 ${
              showEmojiPicker ? "text-emerald-600 dark:text-emerald-400" : ""
            }`}
            title="Add emoji"
          >
            <FaSmile size={18} />
          </button>

          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={handleInputChange}
            onBlur={handleUserStopTyping}
            className="flex-1 px-4 py-3 bg-gray-100/90 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="px-4.5 sm:px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-emerald-500/20 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            <FaPaperPlane className="text-xs" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>

      {/* 6. Live ETA Modal */}
      <AnimatePresence>
        {showEtaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-200 dark:border-slate-800 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 text-xl">
                <FaCar />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">
                Share Arrival ETA
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                Notify the cook when you will arrive so they can keep food packed and ready.
              </p>

              <div className="grid grid-cols-4 gap-2 mb-6">
                {[5, 10, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleSendEta(mins)}
                    className="py-3 px-2 rounded-2xl font-black text-sm bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-500 hover:text-white text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-all cursor-pointer active:scale-95"
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowEtaModal(false)}
                className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
