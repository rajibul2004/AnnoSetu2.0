"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaSun, FaMoon } from "react-icons/fa";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Before mount: resolvedTheme is undefined — render neutral placeholder
  // This is correct and necessary — not the cause of the network bug
  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 animate-pulse" />
    );
  }

  const isDark = resolvedTheme === "dark";

  function toggle() {
    console.log("current resolvedTheme:", resolvedTheme); // debug
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <motion.button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      transition={{ duration: 0.5 }}
      animate={{
        rotate: isDark ? 360 : 0,
      }}
      className="relative w-10 h-10 cursor-pointer rounded-full flex items-center justify-center overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      style={{
        background: isDark
          ? "linear-gradient(145deg, #fbbf24, #f59e0b)"
          : "linear-gradient(145deg, #1e293b, #0f172a)",
        boxShadow: isDark
          ? "0 4px 15px rgba(245, 158, 11, 0.3), inset 0 2px 5px rgba(255, 255, 255, 0.5)"
          : "0 4px 15px rgba(0, 0, 0, 0.3), inset 0 2px 5px rgba(255, 255, 255, 0.1)",
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: isDark
            ? "radial-gradient(circle at 30% 30%, #fde047, transparent 70%)"
            : "radial-gradient(circle at 30% 30%, #60a5fa, transparent 70%)",
        }}
      />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
        key={isDark ? "sun" : "moon"}
      >
        {isDark ? (
          <FaSun
            className="relative z-10 text-yellow-100 drop-shadow-lg"
            size={18}
          />
        ) : (
          <FaMoon
            className="relative z-10 text-blue-200 drop-shadow-lg"
            size={18}
          />
        )}
      </motion.div>
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: isDark
            ? [
                "0 0 5px #fbbf24, 0 0 10px #fbbf24",
                "0 0 10px #fbbf24, 0 0 20px #fbbf24",
                "0 0 5px #fbbf24, 0 0 10px #fbbf24",
              ]
            : [
                "0 0 5px #60a5fa, 0 0 10px #60a5fa",
                "0 0 10px #60a5fa, 0 0 20px #60a5fa",
                "0 0 5px #60a5fa, 0 0 10px #60a5fa",
              ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.button>
  );
}

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707
           M6.343 17.657l-.707.707m12.728 0l-.707-.707
           M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
      />
    </svg>
  );
}
