"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FaCommentDots } from "react-icons/fa";
import { useUnreadMessageCount } from "@/hooks/useMessaging";

export default function NavbarMessagesButton() {
  const { data } = useUnreadMessageCount();
  const count = data?.unreadCount || 0;

  return (
    <Link
      href="/protected/messages"
      className="relative p-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-white/10 transition-all duration-200 flex items-center justify-center"
      title="Messages"
    >
      <FaCommentDots className="text-lg text-emerald-600 dark:text-emerald-400" />

      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-[10px] rounded-full flex items-center justify-center px-1 shadow-md border-2 border-white dark:border-slate-900 animate-pulse"
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      )}
    </Link>
  );
}
