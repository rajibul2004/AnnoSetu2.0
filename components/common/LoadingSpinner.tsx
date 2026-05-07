"use client"

import React from "react"
import { motion } from "framer-motion"

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl"
export type SpinnerVariant = "default" | "pulse" | "dots" | "ring" | "scale" | "bar"

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
  variant = "default",
  text = "Loading...",
  fullScreen = false,
  overlay = false,
  className = "",
  color = "green",
}) => {
  const sizes: Record<SpinnerSize, string> = {
    xs: "h-3 w-3 border",
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
    xl: "h-16 w-16 border-4",
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
      spinner: "border-green-600 dark:border-green-400",
      bg: "bg-green-600 dark:bg-green-400",
      text: "text-green-600 dark:text-green-400",
    },
    blue: {
      spinner: "border-blue-600 dark:border-blue-400",
      bg: "bg-blue-600 dark:bg-blue-400",
      text: "text-blue-600 dark:text-blue-400",
    },
    red: {
      spinner: "border-red-600 dark:border-red-400",
      bg: "bg-red-600 dark:bg-red-400",
      text: "text-red-600 dark:text-red-400",
    },
    purple: {
      spinner: "border-purple-600 dark:border-purple-400",
      bg: "bg-purple-600 dark:bg-purple-400",
      text: "text-purple-600 dark:text-purple-400",
    },
    white: {
      spinner: "border-white",
      bg: "bg-white",
      text: "text-white",
    },
  }

  const spinnerVariants = {
    default: (
      <div
        className={`
          animate-spin 
          rounded-full 
          border-t-transparent
          ${colorClasses[color].spinner}
          ${sizes[size]}
          ${className}
        `}
      />
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
      <div className="relative">
        <div className={`animate-spin rounded-full border-2 border-gray-200 dark:border-gray-700 ${sizes[size]}`} />
        <div 
          className={`absolute inset-0 animate-spin rounded-full border-t-2 ${colorClasses[color].spinner} ${sizes[size]}`} 
          style={{ animationDirection: "reverse", animationDuration: "0.8s" }}
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center space-y-3"
    >
      {spinnerVariants[variant]}
      {text && (
        <p className={`${textSizes[size]} ${colorClasses[color].text} animate-pulse font-medium`}>
          {text}
        </p>
      )}
    </motion.div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
        {content}
      </div>
    )
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg z-10">
        {content}
      </div>
    )
  }

  return content
}

export default LoadingSpinner