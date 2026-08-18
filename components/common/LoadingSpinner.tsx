"use client"

import React from "react"
import { motion } from "framer-motion"
import { FaLeaf } from "react-icons/fa"

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl"
export type SpinnerVariant = "default" | "pulse" | "dots" | "ring" | "scale" | "bar" | "premium" | "bento"

export interface LoadingSpinnerProps {
  size?: SpinnerSize
  variant?: SpinnerVariant
  text?: string
  fullScreen?: boolean
  overlay?: boolean
  className?: string
  color?: "green" | "blue" | "red" | "purple" | "white"
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  variant = "premium",
  text = "Loading...",
  fullScreen = false,
  overlay = false,
  className = "",
  color = "green",
}) => {
  const sizes: Record<SpinnerSize, string> = {
    xs: "h-4 w-4",
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-20 w-20",
  }

  const borderSizes: Record<SpinnerSize, string> = {
    xs: "border",
    sm: "border-2",
    md: "border-2",
    lg: "border-3",
    xl: "border-4",
  }

  const textSizes: Record<SpinnerSize, string> = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  }

  const colorClasses = {
    green: {
      spinner: "border-emerald-600 dark:border-emerald-400",
      bg: "bg-emerald-600 dark:bg-emerald-400",
      text: "from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300",
      glow: "bg-emerald-500/20",
    },
    blue: {
      spinner: "border-blue-600 dark:border-blue-400",
      bg: "bg-blue-600 dark:bg-blue-400",
      text: "from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300",
      glow: "bg-blue-500/20",
    },
    red: {
      spinner: "border-rose-600 dark:border-rose-400",
      bg: "bg-rose-600 dark:bg-rose-400",
      text: "from-rose-600 to-orange-500 dark:from-rose-400 dark:to-orange-300",
      glow: "bg-rose-500/20",
    },
    purple: {
      spinner: "border-purple-600 dark:border-purple-400",
      bg: "bg-purple-600 dark:bg-purple-400",
      text: "from-purple-600 to-fuchsia-500 dark:from-purple-400 dark:to-fuchsia-300",
      glow: "bg-purple-500/20",
    },
    white: {
      spinner: "border-white",
      bg: "bg-white",
      text: "from-white to-gray-200 dark:from-gray-100 dark:to-gray-300",
      glow: "bg-white/10",
    },
  }

  const spinnerVariants = {
    default: (
      <div className={`relative flex items-center justify-center ${sizes[size]}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className={`absolute inset-0 rounded-full border-t-2 border-r-2 ${colorClasses[color].spinner} opacity-70`}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className={`absolute inset-2 rounded-full border-b-2 border-l-2 ${colorClasses[color].spinner} opacity-50`}
        />
        <motion.div
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className={`absolute w-1/3 h-1/3 rounded-full ${colorClasses[color].bg} blur-[2px]`}
        />
      </div>
    ),
    premium: (
      <div className={`relative flex items-center justify-center ${sizes[size]}`}>
        {/* Outer glowing organic ring 1 */}
        <motion.div
          animate={{ 
            rotate: [0, 360], 
            borderRadius: ["40% 60% 70% 30% / 40% 50% 60% 50%", "60% 40% 30% 70% / 50% 60% 50% 40%", "40% 60% 70% 30% / 40% 50% 60% 50%"] 
          }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className={`absolute inset-0 border-2 ${colorClasses[color].spinner} opacity-40 blur-[0.5px]`}
        />
        {/* Outer glowing organic ring 2 */}
        <motion.div
          animate={{ 
            rotate: [360, 0], 
            borderRadius: ["60% 40% 30% 70% / 50% 60% 50% 40%", "40% 60% 70% 30% / 40% 50% 60% 50%", "60% 40% 30% 70% / 50% 60% 50% 40%"] 
          }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className={`absolute inset-0 border-[2px] ${colorClasses[color].spinner} opacity-60`}
        />
        {/* Inner pulsing leaf */}
        <motion.div
          animate={{ scale: [0.7, 1, 0.7], opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className={`absolute inset-0 flex items-center justify-center text-transparent bg-clip-text bg-gradient-to-r ${colorClasses[color].text}`}
        >
          <FaLeaf className="w-1/2 h-1/2 drop-shadow-md text-emerald-500" />
        </motion.div>
      </div>
    ),
    bento: (
      <div className={`grid grid-cols-2 gap-1 ${sizes[size]}`}>
        <motion.div animate={{ scale: [1, 0.6, 1], borderRadius: ["20%", "50%", "20%"] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className={`w-full h-full bg-gradient-to-br ${colorClasses[color].text} shadow-sm`} />
        <motion.div animate={{ scale: [1, 0.6, 1], borderRadius: ["20%", "50%", "20%"] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }} className={`w-full h-full bg-gradient-to-br ${colorClasses[color].text} shadow-sm`} />
        <motion.div animate={{ scale: [1, 0.6, 1], borderRadius: ["20%", "50%", "20%"] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.9 }} className={`w-full h-full bg-gradient-to-br ${colorClasses[color].text} shadow-sm`} />
        <motion.div animate={{ scale: [1, 0.6, 1], borderRadius: ["20%", "50%", "20%"] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }} className={`w-full h-full bg-gradient-to-br ${colorClasses[color].text} shadow-sm`} />
      </div>
    ),
    pulse: (
      <div className="flex space-x-1">
        <div 
          className={`w-2 h-2 ${colorClasses[color].bg} rounded-full animate-bounce [animation-delay:-0.3s]`} 
        />
        <div 
          className={`w-2 h-2 ${colorClasses[color].bg} rounded-full animate-bounce [animation-delay:-0.15s]`} 
        />
        <div 
          className={`w-2 h-2 ${colorClasses[color].bg} rounded-full animate-bounce`} 
        />
      </div>
    ),
    dots: (
      <div className="flex space-x-1.5">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
          className={`w-2 h-2 ${colorClasses[color].bg} rounded-full`}
        />
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
          className={`w-2 h-2 ${colorClasses[color].bg} rounded-full`}
        />
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
          className={`w-2 h-2 ${colorClasses[color].bg} rounded-full`}
        />
      </div>
    ),
    ring: (
      <div className={`relative flex items-center justify-center ${sizes[size]}`}>
        <motion.div 
          className={`absolute inset-0 ${borderSizes[size]} border-dashed ${colorClasses[color].spinner} rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className={`absolute inset-1 ${borderSizes[size]} border-dotted ${colorClasses[color].spinner} rounded-full opacity-60`}
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
      </div>
    ),
    scale: (
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1 }}
        className={`bg-gradient-to-r from-green-500 to-green-600 rounded-full ${sizes[size]}`}
      />
    ),
    bar: (
      <div className="w-full max-w-xs">
        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${colorClasses[color].bg} rounded-full`}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            style={{ width: "50%" }}
          />
        </div>
      </div>
    ),
  }

  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex flex-col items-center justify-center ${fullScreen || overlay ? "p-8 sm:p-12 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/50 dark:border-white/10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]" : "space-y-4"}`}
    >
      <div className="relative flex items-center justify-center p-2">
        {/* Animated Glow Behind Spinner */}
        <div className={`absolute inset-0 ${colorClasses[color].glow} blur-xl rounded-full animate-pulse [animation-duration:2s]`}></div>
        
        {/* Actual Spinner */}
        <div className="relative z-10">
          {spinnerVariants[variant]}
        </div>
      </div>
      
      {text && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`${textSizes[size]} bg-clip-text text-transparent bg-gradient-to-r ${colorClasses[color].text} font-black tracking-wide animate-pulse [animation-duration:2s] text-center mt-4`}
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-md z-[100]">
        {content}
      </div>
    )
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-950/50 backdrop-blur-md rounded-2xl z-10">
        {content}
      </div>
    )
  }

  return content
}

export default LoadingSpinner