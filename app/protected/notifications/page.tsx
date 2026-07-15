"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBell,
  FaCheck,
  FaCheckDouble,
  FaTrash,
  FaFilter,
  FaChevronRight,
  FaBoxOpen,
} from "react-icons/fa";
import { formatDistanceToNow, format } from "date-fns";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAsClicked,
  useMarkAllAsRead,
  useDeleteNotification,
  useNotificationStream,
} from "@/hooks/useNotifications";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import type { NotificationDTO, NotificationType } from "@/types/notification";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_ICONS: Record<NotificationType, string> = {
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
};

const TYPE_LABELS: Record<NotificationType, string> = {
  reservation_request: "Reservation",
  reservation_confirmed: "Confirmed",
  pickup_code_generated: "Pickup",
  pickup_reminder: "Reminder",
  food_expiring: "Expiry",
  payment_success: "Payment",
  payment_failed: "Payment",
  review_received: "Review",
  report_received: "Report",
  system_alert: "System",
};

const PRIORITY_STYLES: Record<string, { bar: string; badge: string }> = {
  urgent: { bar: "border-l-red-500", badge: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" },
  high: { bar: "border-l-orange-500", badge: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300" },
  medium: { bar: "border-l-blue-400", badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
  low: { bar: "border-l-gray-300 dark:border-l-gray-600", badge: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300" },
};

type FilterTab = "all" | "unread" | NotificationType;

// ---------------------------------------------------------------------------
// NotificationCard
// ---------------------------------------------------------------------------

function NotificationCard({ notification }: { notification: NotificationDTO }) {
  const router = useRouter();
  const { mutate: markRead } = useMarkAsRead();
  const { mutate: markClicked } = useMarkAsClicked();
  const { mutate: remove, isPending: isRemoving } = useDeleteNotification();

  const styles = PRIORITY_STYLES[notification.priority] ?? PRIORITY_STYLES.medium;

  const handleCardClick = () => {
    if (!notification.isRead) markRead(notification.id);
    if (notification.actionUrl) {
      markClicked(notification.id);
      router.push(notification.actionUrl);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative flex gap-4 p-4 rounded-2xl border-l-4 ${styles.bar} ${
        notification.isRead
          ? "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
          : "bg-blue-50/60 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 shadow-sm"
      } cursor-pointer hover:shadow-md transition-all duration-200`}
      onClick={handleCardClick}
    >
      {/* Unread dot */}
      {!notification.isRead && (
        <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400" />
      )}

      {/* Icon */}
      <div className="shrink-0 w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 shadow flex items-center justify-center text-2xl border border-gray-100 dark:border-gray-700">
        {TYPE_ICONS[notification.type] ?? "🔔"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className={`font-semibold text-sm leading-tight ${notification.isRead ? "text-gray-700 dark:text-gray-200" : "text-gray-900 dark:text-white"}`}>
            {notification.title}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${styles.badge}`}>
              {notification.priority}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {notification.message}
        </p>

        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {format(new Date(notification.createdAt), "MMM d, h:mm a")}
            </span>
          </div>
          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
            {TYPE_LABELS[notification.type] ?? "Alert"}
          </span>
        </div>

        {notification.actionUrl && (
          <div className="flex items-center gap-1 mt-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
            View details <FaChevronRight className="w-2.5 h-2.5" />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div
        className="absolute bottom-3 right-3 flex gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {!notification.isRead && (
          <button
            onClick={() => markRead(notification.id)}
            title="Mark as read"
            className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
          >
            <FaCheck className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={() => remove(notification.id)}
          disabled={isRemoving}
          title="Delete"
          className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-40"
        >
          <FaTrash className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NotificationsPage() {
  const [filter, setFilter] = useState<FilterTab>("all");

  // Real-time stream for this page too
  useNotificationStream(true);

  const { notifications, unreadCount, isLoading } = useNotifications(50, 0);
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllAsRead();

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    return n.type === filter;
  });

  const filterTabs: { id: FilterTab; label: string; emoji: string }[] = [
    { id: "all", label: "All", emoji: "🔔" },
    { id: "unread", label: "Unread", emoji: "🔵" },
    { id: "reservation_request", label: "Reservations", emoji: "🍽️" },
    { id: "reservation_confirmed", label: "Confirmed", emoji: "✅" },
    { id: "payment_success", label: "Payments", emoji: "💰" },
    { id: "system_alert", label: "System", emoji: "📢" },
  ];

  return (
    <div className="min-h-screen bg-transparent pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-linear-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FaBell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                    : "You're all caught up!"}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                disabled={isMarkingAll}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                <FaCheckDouble className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                <span className="text-gray-700 dark:text-gray-200">Mark all read</span>
              </button>
            )}
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 mt-4">
            <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live updates active
            </span>
          </div>
        </motion.div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {filterTabs.map((tab) => {
            const count =
              tab.id === "all"
                ? notifications.length
                : tab.id === "unread"
                  ? unreadCount
                  : notifications.filter((n) => n.type === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  filter === tab.id
                    ? "bg-violet-600 border-violet-600 text-white shadow-md"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-400"
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold ${
                      filter === tab.id ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner text="Loading notifications..." />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <FaBoxOpen className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
              {filter === "unread" ? "No unread notifications" : "No notifications"}
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {filter === "all"
                ? "You'll see notifications about reservations, confirmations, and more here."
                : `No ${filter.replace("_", " ")} notifications yet.`}
            </p>
            {filter !== "all" && (
              <button
                onClick={() => setFilter("all")}
                className="mt-4 flex items-center gap-1 mx-auto text-sm text-violet-600 dark:text-violet-400 hover:underline"
              >
                <FaFilter className="w-3 h-3" />
                Show all notifications
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {filtered.map((n) => (
                <NotificationCard key={n.id} notification={n} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
