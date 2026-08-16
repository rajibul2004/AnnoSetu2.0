"use client";

import React from "react";
import { getNextBadge, BadgeCategory } from "@/lib/badges";

interface NextBadgeProgressProps {
  category: BadgeCategory;
  currentValue: number;
  label?: string;
}

export default function NextBadgeProgress({ category, currentValue, label }: NextBadgeProgressProps) {
  const nextBadge = getNextBadge(category, currentValue);

  if (!nextBadge) {
    return (
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-center gap-3 text-emerald-600 dark:text-emerald-400 font-bold">
        <span>✅</span>
        <span>All {category.replace("_", " ")} badges earned!</span>
      </div>
    );
  }

  const progress = Math.min((currentValue / nextBadge.threshold) * 100, 100);
  const remaining = nextBadge.threshold - currentValue;

  const borderColor = nextBadge.rarity === "common" ? "#9CA3AF" : 
                      nextBadge.rarity === "rare" ? "#60A5FA" : 
                      nextBadge.rarity === "epic" ? "#C084FC" : "#FBBF24";

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex items-center gap-4">
      <div className="relative w-[60px] h-[60px] shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
          {/* Background Ring */}
          <path
            className="text-gray-100 dark:text-slate-800"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Progress Ring */}
          <path
            stroke={borderColor}
            strokeWidth="3"
            strokeDasharray={`${progress}, 100`}
            strokeLinecap="round"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <nextBadge.icon className="w-6 h-6 text-gray-700 dark:text-gray-300" style={{ color: borderColor }} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
          {label || `Next ${category.replace("_", " ")} Badge`}
        </div>
        <div className="text-sm font-black text-gray-900 dark:text-white truncate">
          {nextBadge.title}
        </div>
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
          <span className="font-bold" style={{ color: borderColor }}>{remaining}</span> more {nextBadge.thresholdUnit} to unlock!
        </div>
      </div>
    </div>
  );
}
