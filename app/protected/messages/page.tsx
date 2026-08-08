"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCommentDots,
  FaSearch,
  FaUtensils,
  FaChevronLeft,
  FaUser,
  FaClock,
  FaCheckDouble,
  FaExclamationCircle,
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { useConversations } from "@/hooks/useMessaging";
import { useAuth } from "@/hooks/useAuth";
import ChatWindow from "@/components/chat/ChatWindow";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import type { ConversationDTO } from "@/types/message";

function MessagesInboxContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get("conversationId");

  const [selectedConvId, setSelectedConvId] = useState<string | null>(initialConvId);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(!!initialConvId);

  const { data: conversations = [], isLoading, typingMap = {} } = useConversations(user?.id);

  useEffect(() => {
    if (initialConvId) {
      setSelectedConvId(initialConvId);
      setIsMobileChatOpen(true);
    } else if (conversations.length > 0 && !selectedConvId) {
      // Default to first conversation on large screens
      if (typeof window !== "undefined" && window.innerWidth >= 768) {
        setSelectedConvId(conversations[0].id);
      }
    }
  }, [initialConvId, conversations, selectedConvId]);

  const filteredConversations = conversations.filter((conv) => {
    const term = searchQuery.toLowerCase();
    const nameMatch = conv.otherParticipant.name.toLowerCase().includes(term);
    const foodMatch = conv.foodInfo?.name.toLowerCase().includes(term);
    const lastMsgMatch = conv.lastMessage?.content.toLowerCase().includes(term);
    return nameMatch || foodMatch || lastMsgMatch;
  });

  const handleSelectConv = (convId: string) => {
    setSelectedConvId(convId);
    setIsMobileChatOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-6 h-[calc(100dvh-7.5rem)] md:h-[calc(100vh-6rem)]">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-2xl overflow-hidden h-full flex flex-col md:flex-row">
        
        {/* ================= LEFT PANE: CONVERSATION LIST ================= */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-gray-200/80 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/40 shrink-0 ${
            isMobileChatOpen ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header & Search */}
          <div className="p-4 border-b border-gray-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">
                  <FaCommentDots />
                </div>
                <h1 className="text-lg font-black text-gray-900 dark:text-white">
                  Messages
                </h1>
              </div>
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded-full">
                {conversations.length} Active
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-xs text-gray-400" />
              <input
                type="text"
                placeholder="Search chats, food, or names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-gray-100 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <LoadingSpinner text="Loading chats..." />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center p-8 text-gray-400 dark:text-gray-500">
                <FaCommentDots className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-500" />
                <p className="text-xs font-semibold">No messages found</p>
                <p className="text-[11px] mt-1 text-gray-400">
                  When you reserve or share food, pickup chat threads will appear here.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConvId === conv.id;
                const hasUnread = conv.unreadCount > 0;

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConv(conv.id)}
                    className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500 text-white shadow-md"
                        : hasUnread
                        ? "bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100/50"
                        : "hover:bg-gray-100/80 dark:hover:bg-slate-800/60 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {/* User Avatar & Online Indicator */}
                    <div className="relative shrink-0 mt-0.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-xs ${
                          isSelected
                            ? "bg-white text-emerald-700"
                            : "bg-gradient-to-tr from-emerald-500 to-teal-600 text-white"
                        }`}
                      >
                        {conv.otherParticipant.name.charAt(0).toUpperCase()}
                      </div>
                      {conv.otherParticipant.isOnline && (
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 ${
                            isSelected ? "border-emerald-600" : "border-white dark:border-slate-900"
                          } bg-emerald-500 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.8)]`}
                          title="Online now"
                        />
                      )}
                      {hasUnread && !isSelected && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full" />
                      )}
                    </div>

                    {/* Content preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4
                          className={`text-xs font-extrabold truncate ${
                            isSelected
                              ? "text-white"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {conv.otherParticipant.name}
                        </h4>
                        <span
                          className={`text-[10px] shrink-0 ${
                            isSelected
                              ? "text-white/80"
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                        >
                          {conv.lastMessageAt
                            ? formatDistanceToNow(new Date(conv.lastMessageAt), {
                                addSuffix: false,
                              })
                            : ""}
                        </span>
                      </div>

                      {/* Food Tag Pill */}
                      {conv.foodInfo && (
                        <div
                          className={`flex items-center gap-1 text-[11px] font-semibold truncate mb-1 ${
                            isSelected
                              ? "text-white/90"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          <FaUtensils className="text-[9px] shrink-0" />
                          <span className="truncate">{conv.foodInfo.name}</span>
                        </div>
                      )}

                      {/* Last Message or Live Typing Preview */}
                      {typingMap[conv.id] ? (
                        <p
                          className={`text-xs font-bold truncate flex items-center gap-1.5 animate-pulse ${
                            isSelected
                              ? "text-emerald-100"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span>typing...</span>
                        </p>
                      ) : (
                        <p
                          className={`text-xs truncate ${
                            isSelected
                              ? "text-white/80"
                              : hasUnread
                              ? "font-bold text-gray-900 dark:text-white"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {conv.lastMessage
                            ? conv.lastMessage.content
                            : "Start the pickup conversation..."}
                        </p>
                      )}
                    </div>

                    {/* Unread Counter Pill */}
                    {hasUnread && !isSelected && (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white shrink-0 mt-1 shadow-xs animate-pulse">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ================= RIGHT PANE: CHAT WINDOW ================= */}
        <div
          className={`flex-1 flex flex-col h-full ${
            !isMobileChatOpen ? "hidden md:flex" : "flex"
          }`}
        >
          {selectedConvId ? (
            <div className="flex-1 flex flex-col h-full relative">
              {/* Mobile Back Button Bar */}
              <div className="md:hidden flex items-center px-4 py-2 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMobileChatOpen(false)}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer"
                >
                  <FaChevronLeft />
                  <span>All Messages</span>
                </button>
              </div>

              <ChatWindow conversationId={selectedConvId} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/40 dark:bg-slate-950/30">
              <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl mb-4 shadow-lg">
                <FaCommentDots />
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                Your Food Pickup Messages
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6 leading-relaxed">
                Coordinate smoothly with food donors, chefs, and reservers. Share arrival ETAs, packaging requests, and pickup updates in real time.
              </p>
              <Link href="/public/food">
                <button className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl text-xs shadow-md transition-all cursor-pointer">
                  Explore Surplus Meals
                </button>
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function MessagesInboxPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner text="Loading messages..." />
        </div>
      }
    >
      <MessagesInboxContent />
    </Suspense>
  );
}
