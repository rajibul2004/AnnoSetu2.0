"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FaBell,
  FaCheck,
  FaCheckDouble,
  FaTrash,
  FaFilter,
  FaChevronRight,
  FaBoxOpen,
  FaArrowLeft,
  FaSyncAlt,
  FaCompass,
  FaUtensils,
  FaVolumeUp,
} from "react-icons/fa";
import { formatDistanceToNow, format } from "date-fns";
import { playNotificationSound } from "@/lib/notificationAudio";
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
// Constants & Color Schemes
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
  reservation_request: "Reservation Request",
  reservation_confirmed: "Reservation Confirmed",
  pickup_code_generated: "Pickup Code Ready",
  pickup_reminder: "Pickup Reminder",
  food_expiring: "Food Expiring Soon",
  payment_success: "Payment Received",
  payment_failed: "Payment Failed",
  review_received: "Review Received",
  report_received: "Community Report",
  system_alert: "System Notification",
};

const PRIORITY_STYLES: Record<
  string,
  { border: string; bg: string; badge: string; dot: string }
> = {
  urgent: {
    border: "border-l-rose-500",
    bg: "bg-rose-500/5 dark:bg-rose-950/20",
    badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    dot: "bg-rose-500 shadow-rose-500/50",
  },
  high: {
    border: "border-l-amber-500",
    bg: "bg-amber-500/5 dark:bg-amber-950/20",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    dot: "bg-amber-500 shadow-amber-500/50",
  },
  medium: {
    border: "border-l-blue-500",
    bg: "bg-blue-500/5 dark:bg-blue-950/20",
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    dot: "bg-blue-500 shadow-blue-500/50",
  },
  low: {
    border: "border-l-gray-400 dark:border-l-gray-600",
    bg: "bg-gray-500/5 dark:bg-gray-900/20",
    badge: "bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30",
    dot: "bg-gray-400 shadow-gray-400/50",
  },
};

type FilterTab = "all" | "unread" | "priority" | NotificationType;

// ---------------------------------------------------------------------------
// NotificationCard Component
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
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
      className={`group relative p-5 rounded-3xl border-l-4 ${styles.border} transition-all duration-200 cursor-pointer ${
        notification.isRead
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 hover:bg-white dark:hover:bg-gray-800/90 shadow-sm hover:shadow-md"
          : `${styles.bg} backdrop-blur-xl border border-blue-500/30 dark:border-blue-500/20 shadow-md hover:shadow-lg`
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Type Emoji Icon */}
        <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/90 dark:bg-gray-800/90 shadow-sm border border-gray-200/80 dark:border-gray-700/80 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
          {TYPE_ICONS[notification.type] ?? "🔔"}
        </div>

        {/* Text and Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <h3
                className={`font-black text-sm md:text-base leading-snug tracking-tight ${
                  notification.isRead
                    ? "text-gray-800 dark:text-gray-200"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {notification.title}
              </h3>
              {!notification.isRead && (
                <span
                  className={`w-2.5 h-2.5 rounded-full ${styles.dot} animate-pulse shrink-0`}
                  title="Unread notification"
                />
              )}
            </div>

            <span
              className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border ${styles.badge}`}
            >
              {notification.priority}
            </span>
          </div>

          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {notification.message}
          </p>

          {/* Bottom Metas & Actions */}
          <div className="flex flex-wrap items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/80 gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </span>
              <span>•</span>
              <span>{format(new Date(notification.createdAt), "MMM d, h:mm a")}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline font-semibold text-emerald-600 dark:text-emerald-400">
                {TYPE_LABELS[notification.type] ?? "Alert"}
              </span>
            </div>

            {/* Action Buttons */}
            <div
              className="flex items-center gap-2 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {notification.actionUrl && (
                <button
                  type="button"
                  onClick={handleCardClick}
                  className="px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Details</span>
                  <FaChevronRight className="w-2.5 h-2.5" />
                </button>
              )}

              {!notification.isRead && (
                <button
                  type="button"
                  onClick={() => markRead(notification.id)}
                  title="Mark as read"
                  className="w-8 h-8 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <FaCheck className="w-3 h-3" />
                </button>
              )}

              <button
                type="button"
                onClick={() => remove(notification.id)}
                disabled={isRemoving}
                title="Delete notification"
                className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
              >
                <FaTrash className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>("all");

  // Real-time SSE stream listener
  useNotificationStream(true);

  const { notifications, unreadCount, isLoading, refetch } = useNotifications(50, 0);
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllAsRead();

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    if (filter === "priority") return n.priority === "urgent" || n.priority === "high";
    return n.type === filter;
  });

  const filterTabs: { id: FilterTab; label: string; emoji: string }[] = [
    { id: "all", label: "All", emoji: "🔔" },
    { id: "unread", label: "Unread", emoji: "🔵" },
    { id: "priority", label: "Urgent & High", emoji: "🚨" },
    { id: "reservation_request", label: "Reservations", emoji: "🍽️" },
    { id: "reservation_confirmed", label: "Confirmed", emoji: "✅" },
    { id: "payment_success", label: "Payments", emoji: "💰" },
    { id: "system_alert", label: "System", emoji: "📢" },
  ];

  return (
    <div className="min-h-screen bg-transparent pt-24 pb-20 sm:pt-28 md:pb-28 relative z-10">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-24 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-15 dark:opacity-20 bg-linear-to-tr from-violet-600 via-indigo-600 to-emerald-500" />
        <div className="absolute bottom-24 right-1/3 w-96 h-96 rounded-full blur-3xl opacity-15 dark:opacity-20 bg-linear-to-bl from-emerald-600 via-teal-600 to-blue-500" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl flex items-center justify-center border border-gray-200/80 dark:border-gray-700/80 hover:bg-white dark:hover:bg-gray-700 shadow-sm transition-all cursor-pointer"
              >
                <FaArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-200" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-linear-to-tr from-violet-600 via-indigo-600 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg text-white">
                  <FaBell className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    Notifications
                  </h1>
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {unreadCount > 0
                      ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"} waiting for your review`
                      : "You're all caught up with your meals and requests"}
                  </p>
                </div>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playNotificationSound();
                  toast.success("Playing notification chime!");
                }}
                title="Test notification sound"
                className="w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl flex items-center justify-center border border-gray-200/80 dark:border-gray-700/80 hover:bg-emerald-50 dark:hover:bg-gray-700 shadow-sm transition-all text-emerald-600 dark:text-emerald-400 cursor-pointer"
              >
                <FaVolumeUp className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => refetch()}
                title="Refresh notifications"
                className="w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl flex items-center justify-center border border-gray-200/80 dark:border-gray-700/80 hover:bg-white dark:hover:bg-gray-700 shadow-sm transition-all text-gray-600 dark:text-gray-300 cursor-pointer"
              >
                <FaSyncAlt className="w-3.5 h-3.5" />
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead()}
                  disabled={isMarkingAll}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  <FaCheckDouble className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Live stream badge */}
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span>Real-time SSE Stream &amp; Audio Active</span>
            </span>
          </div>
        </motion.div>

        {/* Filter Pills Bar */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-3 mb-6">
          {filterTabs.map((tab) => {
            const count =
              tab.id === "all"
                ? notifications.length
                : tab.id === "unread"
                ? unreadCount
                : tab.id === "priority"
                ? notifications.filter((n) => n.priority === "urgent" || n.priority === "high")
                    .length
                : notifications.filter((n) => n.type === tab.id).length;

            const isActive = filter === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                  isActive
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-white/80 dark:bg-gray-900/80 border-gray-200/80 dark:border-gray-800/80 text-gray-600 dark:text-gray-300 hover:border-emerald-500/50"
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] rounded-full px-2 py-0.5 font-black ${
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content List */}
        {isLoading ? (
          <div className="flex justify-center py-24">
            <LoadingSpinner text="Loading your notifications..." />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 p-8 rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-gray-200/80 dark:border-gray-800/80 shadow-xl"
          >
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-4xl mb-4">
              {filter === "unread" ? "🎉" : "📭"}
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
              {filter === "unread"
                ? "All caught up!"
                : filter === "priority"
                ? "No high priority alerts"
                : "No notifications found"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              {filter === "all"
                ? "You'll see real-time updates when someone reserves your food, sends confirmation, or makes a pickup."
                : `No notifications match the "${filter.replace("_", " ")}" filter.`}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {filter !== "all" && (
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="px-4 py-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FaFilter className="w-3 h-3" />
                  <span>Show All Notifications</span>
                </button>
              )}
              <Link
                href="/public/food"
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <FaUtensils className="w-3 h-3" />
                <span>Explore Available Food</span>
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
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
