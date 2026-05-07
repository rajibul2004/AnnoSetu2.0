"use client";

import React, { useState, SelectHTMLAttributes, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaChevronDown,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

export interface SelectOption {
  value: string | number | boolean;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "value" | "onChange"
> {
  label?: string;
  options: SelectOption[];
  value?: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
  placeholder?: string;
  error?: string;
  success?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
}

const Select = ({
  label,
  options = [],
  error,
  placeholder = "Select an option",
  helperText,
  className = "",
  value,
  onChange,
  icon,
  success,
  required,
  disabled,
  ...props
}: SelectProps) => {
  const [touched, setTouched] = useState(false);

  const baseBorder = error
    ? "border-red-400"
    : success
      ? "border-green-400"
      : "border-gray-500 dark:border-gray-400";

  const focusBorder = error
    ? "focus-within:border-red-500"
    : "focus-within:border-green-500";

  const focusShadow = error
    ? "focus-within:shadow-red-500"
    : "focus-within:shadow-green-200 dark:focus-within:shadow-green-900/40";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-1.5"
    >
      {/* Label */}
      {label && (
        <label
          className={`block text-sm font-medium ${
            error ? "text-red-500" : "text-gray-700 dark:text-gray-200"
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select Wrapper */}
      <div
        className={`relative rounded-xl flex items-center border-2 bg-gray-200 dark:bg-gray-700 transition-all duration-200
        ${disabled ? "opacity-60 cursor-not-allowed" : ""}
        ${className}
        ${baseBorder}
        ${focusBorder}
        ${focusShadow}
        focus-within:shadow-sm`}
      >
        <select
          value={value?.toString() ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val);
            setTouched(true);
          }}
          disabled={disabled}
          className={`w-full appearance-none bg-transparent rounded-xl px-4 py-2.5 text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer ${
            icon ? "pl-10 pr-8" : ""
          }`}
          {...props}
        >
          {placeholder && (
            <option
              value=""
              disabled
              className="text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-800"
            >
              {placeholder}
            </option>
          )}

          {options.map((option) => (
            <option
              key={option.value.toString()}
              value={option.value.toString()}
              disabled={option.disabled}
              className="text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 text-sm"
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Left Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        {/* Right Icons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="text-red-500"
              >
                <FaExclamationCircle size={16} />
              </motion.div>
            )}

            {success && touched && !error && (
              <motion.div
                key="success"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="text-green-500"
              >
                <FaCheckCircle size={16} />
              </motion.div>
            )}
          </AnimatePresence>

          <FaChevronDown size={16} className="text-gray-400" />
        </div>
      </div>

      {/* Helper / Error Text */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key="error-text"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-sm text-red-600 flex items-center gap-1"
          >
            <FaExclamationCircle size={14} />
            {error}
          </motion.p>
        )}

        {helperText && !error && (
          <motion.p
            key="helper-text"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Select;
