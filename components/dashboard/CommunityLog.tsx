"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { FaUtensils, FaHandsHelping, FaGlobe, FaMedal } from "react-icons/fa";
import Link from "next/link";
import { useCommunityLog } from "@/hooks/useCommunityLog";

export default function CommunityLog() {
  const { data: logs, isLoading } = useCommunityLog();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!logs || logs.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % logs.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [logs]);

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-gray-200/80 dark:border-slate-800/80 rounded-[2rem] p-6 sm:p-8 shadow-xl mt-8 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 dark:bg-slate-700 rounded-full mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return null;
  }

  const log = logs[currentIndex];
  if (!log) return null;

  const isShared = log.type === "food_shared";
  const isBadge = log.type === "badge_unlocked";
  const isFollow = log.type === "social_follow";
  
  let Icon = FaHandsHelping;
  let iconBgClass = "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400";
  
  if (isShared) {
    Icon = FaUtensils;
    iconBgClass = "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400";
  } else if (isBadge) {
    Icon = FaMedal;
    iconBgClass = "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400";
  } else if (isFollow) {
    Icon = FaGlobe;
    iconBgClass = "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-indigo-100 dark:border-indigo-900/30 rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-indigo-500/5 mt-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
          <div className="p-2.5 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/40 dark:to-blue-900/40 rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-400/20 animate-ping rounded-xl"></div>
            <FaGlobe className="text-indigo-600 dark:text-indigo-400 w-5 h-5 relative z-10" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-400">
            Live Community Activity
          </span>
        </h3>
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
      </div>

      <div className="overflow-hidden relative h-12 flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="flex items-center gap-2 py-2 absolute w-full"
          >
            <div className={`p-1.5 rounded-full ${iconBgClass} shrink-0`}>
              <Icon className="w-3 h-3" />
            </div>
            
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between min-w-0 gap-1 sm:gap-4">
              <p className="text-sm truncate">
                <Link href={`/protected/profile/${log.userId}`} className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                  {log.userName}
                </Link>
                <span className="text-gray-500 dark:text-gray-400 mx-1">{log.action}</span>
                {!isBadge && !isFollow && (
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{log.quantity}x</span>
                )}
                <span className={`font-bold ml-1 ${isBadge ? 'text-amber-500 capitalize' : isFollow ? 'text-blue-500' : 'text-orange-500'}`}>
                  {log.foodName}
                </span>
              </p>
              <div className="flex items-center gap-2 shrink-0">
                {!isBadge && !isFollow && log.points > 0 && (
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    +{log.points} pts
                  </span>
                )}
                <span className="text-[10px] sm:text-xs font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
