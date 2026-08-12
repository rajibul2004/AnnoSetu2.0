"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaBell, FaCheck, FaTrash, FaChevronRight } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAsClicked,
  useMarkAllAsRead,
  useDeleteNotification,
  useNotificationStream,
} from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import type { NotificationDTO } from "@/types/notification";

const TYPE_ICONS: Record<string, string> = {
  reservation_request: "🍽️",
  reservation_confirmed: "✅",
  pickup_code_generated: "🔑",
  pickup_reminder: "⏰",
  food_expiring: "⚠️",
  payment_success: "💰",
  payment_failed: "❌",
  review_received: "⭐",
  report_received: "🚩",
  system_alert: "📢",
  new_message: "💬",
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-blue-400",
  low: "bg-gray-400",
};

function NotificationItem({
  notification,
  onClose,
}: {
  notification: NotificationDTO;
  onClose: () => void;
}) {
  const router = useRouter();
  const { mutate: markRead } = useMarkAsRead();
  const { mutate: markClicked } = useMarkAsClicked();
  const { mutate: remove } = useDeleteNotification();

  const handleClick = () => {
    markClicked(notification.id);
    onClose();
    if (notification.actionUrl) router.push(notification.actionUrl);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`group relative flex gap-3 p-3 rounded-xl transition-colors cursor-pointer ${
        notification.isRead
          ? "hover:bg-gray-50 dark:hover:bg-gray-800"
          : "bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30"
      }`}
      onClick={handleClick}
    >
      {/* Priority dot */}
      {!notification.isRead && (
        <span
          className={`absolute top-3 right-3 w-2 h-2 rounded-full ${PRIORITY_DOT[notification.priority] ?? "bg-blue-400"}`}
        />
      )}

      {/* Icon */}
      <div className="shrink-0 w-9 h-9 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-lg">
        {TYPE_ICONS[notification.type] ?? "🔔"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${notification.isRead ? "text-gray-600 dark:text-gray-300" : "text-gray-900 dark:text-white"}`}>
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Action buttons - visible on hover */}
      <div
        className="absolute right-3 bottom-2 hidden group-hover:flex gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {!notification.isRead && (
          <button
            onClick={() => markRead(notification.id)}
            className="p-1 rounded-md hover:bg-green-100 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400"
            title="Mark as read"
          >
            <FaCheck className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={() => remove(notification.id)}
          className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500"
          title="Delete"
        >
          <FaTrash className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Real-time SSE stream
  useNotificationStream(isAuthenticated);

  const unreadCount = useUnreadCount();
  const { notifications, isLoading, refetch } = useNotifications(10, 0);
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllAsRead();

  // Close on outside click and refetch on open
  useEffect(() => {
    if (!open) return;
    
    // Force a fresh fetch when the dropdown is opened
    refetch();

    const handle = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, refetch]);

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <FaBell className={`w-5 h-5 ${unreadCount > 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[19px] h-[19px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center leading-none shadow-md shadow-rose-500/30"
          >
            <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-60 pointer-events-none" />
            <span className="relative z-10">{unreadCount > 99 ? "99+" : unreadCount}</span>
          </motion.span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <FaBell className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  disabled={isMarkingAll}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {isLoading ? (
                <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <FaBell className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">You&apos;re all caught up!</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((n) => (
                    <NotificationItem key={n.id} notification={n} onClose={() => setOpen(false)} />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            <Link
              href="/protected/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-t border-gray-100 dark:border-gray-800 transition-colors font-medium"
            >
              View all notifications
              <FaChevronRight className="w-3 h-3" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
