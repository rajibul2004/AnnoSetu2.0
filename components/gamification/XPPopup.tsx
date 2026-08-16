"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGamification } from "@/context/GamificationContext";

export default function XPPopup() {
  const { xpEvents } = useGamification();

  return (
    <div className="fixed top-24 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {xpEvents.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 50, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl p-3 sm:p-4 min-w-[120px] text-center"
          >
            <div className="text-emerald-500 font-black text-xl sm:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400">
              +{event.amount} XP
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">
              {event.label}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
