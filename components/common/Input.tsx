"use client"

import React, { useState, forwardRef, InputHTMLAttributes, ReactNode } from "react"
import { FaExclamationCircle, FaEye, FaEyeSlash } from "react-icons/fa"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  className?: string
  icon?: ReactNode
  success?: boolean
  required?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      className = "",
      type = "text",
      icon,
      success = false,
      placeholder,
      required = false,
      disabled = false,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)

    const isPassword = type === "password"
    const inputType = isPassword ? (showPassword ? "text" : "password") : type

    const baseBorder = error
      ? "border-red-400 focus-within:border-red-500"
      : success
      ? "border-green-400 focus-within:border-green-500"
      : "border-gray-300 dark:border-gray-600 focus-within:border-green-500"

    const focusShadow = error
      ? "focus-within:shadow-red-100 dark:focus-within:shadow-red-950/30"
      : "focus-within:shadow-green-100 dark:focus-within:shadow-green-950/30"

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label
            htmlFor={label}
            className={`
              block text-sm font-medium transition-colors duration-200
              ${error ? "text-red-500" : "text-gray-700 dark:text-gray-300"}
            `}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div
          className={`
            relative
            flex items-center
            rounded-xl
            border-2
            bg-white dark:bg-gray-800
            transition-all duration-200
            ${baseBorder}
            ${focusShadow}
            focus-within:shadow-sm
            ${disabled ? "opacity-60 cursor-not-allowed" : ""}
          `}
        >
          {icon && (
            <div className="pl-3 text-gray-400 dark:text-gray-500">{icon}</div>
          )}

          <input
            ref={ref}
            id={label}
            type={inputType}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`
              w-full px-4 py-2.5
              bg-transparent
              outline-none
              disabled:cursor-not-allowed
              ${icon ? "pl-3" : "pl-4"}
              ${isPassword ? "pr-12" : "pr-4"}
              ${className}
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              text-gray-900 dark:text-white
            `}
            placeholder={placeholder}
            required={required}
            suppressHydrationWarning
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
            <FaExclamationCircle size={14} />
            {error}
          </p>
        )}

        {!error && helperText && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export default Input