"use client"

import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from "react"
import { motion } from "framer-motion"
import { HTMLMotionProps } from "framer-motion";

export type ButtonVariant = 
  | "primary" 
  | "secondary" 
  | "outline" 
  | "danger" 
  | "success" 
  | "ghost" 
  | "link"

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl"

export interface ButtonProps extends HTMLMotionProps<"button">{
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  className?: string
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      className = "",
      onClick,
      type = "button",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group cursor-pointer"

    const variants: Record<ButtonVariant, string> = {
      primary:
        "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 dark:text-white text-black shadow-lg hover:shadow-xl hover:scale-102 focus:ring-amber-500",
      secondary: "dark:text-white hover:scale-102",
      outline:
        "border-2 border-gray-300 bg-white/50 dark:bg-white/20 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:border-green-500 hover:text-green-700 dark:hover:text-green-300 hover:scale-102 focus:ring-primary-500 shadow-sm hover:shadow-lg",
      danger:
        "bg-gradient-to-r from-red-400 via-red-500 to-red-600 dark:text-white text-black shadow-lg hover:shadow-xl hover:scale-102 focus:ring-red-500",
      success:
        "bg-gradient-to-r from-green-500 via-green-600 to-emerald-500 dark:text-white text-black shadow-lg hover:shadow-xl hover:scale-102 focus:ring-green-500",
      ghost:
        "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:scale-102 focus:ring-gray-500",
      link: "bg-transparent text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 underline-offset-4 hover:underline focus:ring-0",
    }

    const sizes: Record<ButtonSize, string> = {
      xs: "px-3 py-1.5 text-xs gap-1.5",
      sm: "px-4 py-2 text-sm gap-2",
      md: "px-6 py-2.5 text-base gap-2.5",
      lg: "px-8 py-3.5 text-lg gap-3",
      xl: "px-10 py-4 text-xl gap-3",
    }

    const widthClass = fullWidth ? "w-full" : ""

    const ShineEffect = () => (
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
    )

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = e.currentTarget
      const ripple = document.createElement("span")
      const rect = button.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2

      ripple.style.width = ripple.style.height = `${size}px`
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`
      ripple.className =
        "absolute bg-white/30 dark:bg-white/0 rounded-full pointer-events-none animate-ripple"

      button.appendChild(ripple)

      setTimeout(() => {
        ripple.remove()
      }, 600)

      onClick?.(e)
    }

    const shouldShowShine = variant !== "outline" && variant !== "ghost" && variant !== "link"

    const MotionButton = motion.button;

    return (
      <motion.button
        ref={ref}
        type={type}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        disabled={loading || disabled}
        onClick={handleClick}
        {...props}
      >
        {/* Shine effect for gradient buttons */}
        {shouldShowShine && <ShineEffect />}

        {/* Loading Spinner */}
        {loading && (
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        <span className="flex items-center justify-center gap-2">
          {children}
        </span>

        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
      </motion.button>
    )
  }
)

Button.displayName = "Button"

export default Button