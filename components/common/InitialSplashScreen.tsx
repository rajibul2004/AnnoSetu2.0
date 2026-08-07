"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaLeaf, FaUtensils, FaHeart } from "react-icons/fa";

const LOADING_STEPS = [
  "Connecting to AnnaSetu Network...",
  "Loading Local Community Hubs...",
  "Discovering Fresh Surplus Food...",
  "Almost Ready...",
];

export default function InitialSplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [progress, setProgress] = useState(15);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Check if splash was already shown in this tab session
    const hasSeenSplash = sessionStorage.getItem("annosetu_splash_seen");
    if (hasSeenSplash) {
      setShowSplash(false);
      return;
    }

    // Step progression timer
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 280);

    // Progress percentage animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        const jump = Math.floor(Math.random() * 25) + 15;
        return Math.min(prev + jump, 100);
      });
    }, 180);

    // Complete loading and fade out smoothly
    const finishTimeout = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem("annosetu_splash_seen", "true");
      }, 350);
    }, 950);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      clearTimeout(finishTimeout);
    };
  }, []);

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          key="initial-splash-screen"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.04,
            filter: "blur(8px)",
            transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
          }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950 text-white select-none overflow-hidden"
        >
          {/* Ambient Glow Orbs */}
          <div className="absolute w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-tr from-emerald-600/30 via-teal-500/20 to-cyan-500/10 blur-[100px] animate-pulse pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-emerald-700/20 blur-[90px] pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-teal-700/20 blur-[90px] pointer-events-none" />

          {/* Center Brand Identity */}
          <div className="relative z-10 flex flex-col items-center max-w-sm mx-auto px-6 text-center">
            {/* Animated Logo Container */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative mb-6"
            >
              {/* Outer Pulsing Rings */}
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 blur-md opacity-40"
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 opacity-75 blur-xs"
              />

              {/* Logo Box */}
              <div className="relative w-20 h-20 rounded-2xl bg-slate-900 border border-emerald-500/40 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <div className="relative flex items-center justify-center">
                  <FaUtensils className="text-emerald-400 text-2xl -mr-1" />
                  <FaLeaf className="text-emerald-300 text-3xl animate-bounce" />
                </div>
              </div>
            </motion.div>

            {/* Brand Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent drop-shadow-sm">
                AnnaSetu
              </h1>
              <p className="text-xs sm:text-sm text-emerald-400/90 font-medium tracking-wide mt-1.5 flex items-center justify-center gap-1.5">
                <span>Bridging Surplus to Smiles</span>
                <FaHeart className="text-rose-500 text-[10px] animate-pulse" />
              </p>
            </motion.div>

            {/* Progress Bar Container */}
            <div className="w-full max-w-[220px] mt-8">
              <div className="h-1.5 w-full bg-slate-800/90 rounded-full overflow-hidden border border-slate-700/50 p-0.5">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                  initial={{ width: "10%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.2 }}
                />
              </div>

              {/* Dynamic Status Text */}
              <div className="mt-3.5 h-4 flex items-center justify-center">
                <motion.span
                  key={stepIndex}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  className="text-[11px] font-semibold text-slate-400 tracking-wider"
                >
                  {LOADING_STEPS[stepIndex]}
                </motion.span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
