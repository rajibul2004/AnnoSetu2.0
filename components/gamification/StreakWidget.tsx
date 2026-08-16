"use client";

import React from "react";
import { motion } from "framer-motion";
import { FaFire } from "react-icons/fa";
import { getNextBadge } from "@/lib/badges";

interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
}

export default function StreakWidget({ currentStreak, longestStreak }: StreakWidgetProps) {
  const nextBadge = getNextBadge("streak", currentStreak);
  
  const hasStreak = currentStreak > 0;

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/60 dark:border-slate-800/60 rounded-[2rem] p-4 shadow-xs h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <motion.div
            animate={hasStreak ? { scale: [1, 1.15, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`p-3 rounded-2xl ${hasStreak ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-500' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}
          >
            <FaFire className="w-6 h-6" />
          </motion.div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{currentStreak}</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Days</span>
            </div>
            <div className="text-[10px] font-semibold text-gray-400">Best: {longestStreak}</div>
          </div>
        </div>
        
        {hasStreak && nextBadge && (
          <div className="text-right">
            <div className="text-[10px] font-bold text-orange-500 dark:text-orange-400">{nextBadge.threshold - currentStreak} more to go!</div>
            <div className="text-[10px] font-semibold text-gray-500">Next: {nextBadge.title}</div>
          </div>
        )}
      </div>

      {hasStreak ? (
        nextBadge && (
          <div className="mt-auto">
            <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(currentStreak / nextBadge.threshold) * 100}%` }}
                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
              />
            </div>
          </div>
        )
      ) : (
        <div className="mt-auto text-xs font-bold text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-lg text-center border border-orange-100/50 dark:border-orange-900/30">
          Start your streak today!
        </div>
      )}
    </div>
  );
}
