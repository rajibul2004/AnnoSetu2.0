"use client";

import React from "react";
import { motion } from "framer-motion";
import { getLevel } from "@/lib/levels";

interface LevelProgressBarProps {
  points: number;
}

export default function LevelProgressBar({ points }: LevelProgressBarProps) {
  const levelInfo = getLevel(points);

  return (
    <div className="w-full">
      <div className="flex items-end justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{levelInfo.icon}</span>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Level {levelInfo.level}
            </span>
            <span className="text-sm font-black text-gray-900 dark:text-white">
              {levelInfo.title}
            </span>
          </div>
        </div>
        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
          {levelInfo.isMaxLevel ? (
            "MAX LEVEL"
          ) : (
            `${levelInfo.xpInLevel} / ${levelInfo.xpForNextLevel} XP`
          )}
        </div>
      </div>

      <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${levelInfo.progress * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)] rounded-full"
        />
      </div>
    </div>
  );
}
