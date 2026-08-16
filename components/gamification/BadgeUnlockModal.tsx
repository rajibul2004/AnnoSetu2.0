"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGamification } from "@/context/GamificationContext";
import { getBadge, RARITY_STYLES } from "@/lib/badges";

export default function BadgeUnlockModal() {
  const { badgeUnlock, dismissBadgeUnlock } = useGamification();

  const badge = badgeUnlock ? getBadge(badgeUnlock) : null;

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={dismissBadgeUnlock}
        >
          {/* Confetti container */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-sm opacity-80"
                style={{
                  top: "50%",
                  left: "50%",
                  backgroundColor: ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444"][Math.floor(Math.random() * 5)],
                  borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                  animation: `confettiBurst 2s ease-out forwards`,
                  animationDelay: `${Math.random() * 0.2}s`,
                  transform: `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`,
                  "--tx": `${(Math.random() - 0.5) * 400}px`,
                  "--ty": `${(Math.random() - 0.5) * 400 - 100}px`,
                } as any}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            transition={{ type: "spring", bounce: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] p-8 sm:p-10 max-w-sm w-full text-center shadow-2xl border-2 ${RARITY_STYLES[badge.rarity].border} ${RARITY_STYLES[badge.rarity].glow}`}
          >
            <div className="mb-2 inline-block">
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${RARITY_STYLES[badge.rarity].bg} ${RARITY_STYLES[badge.rarity].border} border`}>
                {RARITY_STYLES[badge.rarity].label}
              </span>
            </div>
            
            <div className={`mx-auto w-32 h-32 my-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 shadow-inner`}>
              <badge.icon className={`w-16 h-16 text-${badge.color}-500 dark:text-${badge.color}-400`} />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
              {badge.title}
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8 font-medium">
              {badge.description}
            </p>

            <button
              onClick={dismissBadgeUnlock}
              className="w-full py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-500/30"
            >
              Awesome!
            </button>
          </motion.div>

          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes confettiBurst {
              0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
              50% { opacity: 1; }
              100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) rotate(720deg) scale(1.5); opacity: 0; }
            }
          `}} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
