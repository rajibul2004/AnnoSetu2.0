"use client";

import React from "react";
import { Toaster, ToastBar, toast } from "react-hot-toast";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";

export default function ModernToaster() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={12}
      containerClassName="!top-20 !right-4 sm:!right-6 !z-[9999]"
      toastOptions={{
        duration: 4500,
      }}
    >
      {(t) => {
        // If it's a custom toast with its own container (like showModernToast or showMessageToast)
        if (t.type === "custom") {
          return (
            <div key={t.id} className="contents">
              {typeof t.message === "function" ? t.message(t) : t.message}
            </div>
          );
        }

        // Standard toast types (success, error, loading, blank)
        const isSuccess = t.type === "success";
        const isError = t.type === "error";
        const isLoading = t.type === "loading";

        let borderColor = "border-indigo-500/30 dark:border-indigo-500/20";
        let shadowColor = "shadow-indigo-500/10";
        let leftBarGradient = "from-indigo-500 to-violet-600";
        let defaultIcon = <FaInfoCircle className="w-5 h-5 text-indigo-500 shrink-0" />;

        if (isSuccess) {
          borderColor = "border-emerald-500/30 dark:border-emerald-500/20";
          shadowColor = "shadow-emerald-500/15";
          leftBarGradient = "from-emerald-400 to-teal-600";
          defaultIcon = <FaCheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />;
        } else if (isError) {
          borderColor = "border-rose-500/30 dark:border-rose-500/20";
          shadowColor = "shadow-rose-500/15";
          leftBarGradient = "from-rose-500 to-red-600";
          defaultIcon = <FaTimesCircle className="w-5 h-5 text-rose-500 shrink-0" />;
        } else if (isLoading) {
          borderColor = "border-cyan-500/30 dark:border-cyan-500/20";
          shadowColor = "shadow-cyan-500/15";
          leftBarGradient = "from-cyan-400 to-blue-600";
          defaultIcon = (
            <FaSpinner className="w-5 h-5 text-cyan-500 animate-spin shrink-0" />
          );
        }

        return (
          <div
            className={`group relative flex items-center gap-3.5 pl-4 pr-3 py-3 rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border ${borderColor} shadow-2xl ${shadowColor} max-w-sm sm:max-w-md w-full overflow-hidden transition-all duration-300 pointer-events-auto select-none`}
            style={{
              opacity: t.visible ? 1 : 0,
              transform: t.visible
                ? "translateY(0) scale(1)"
                : "translateY(-12px) scale(0.96)",
            }}
          >
            {/* Left glowing accent strip */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${leftBarGradient}`}
            />

            {/* Custom or Default Icon */}
            <div className="flex items-center justify-center shrink-0">
              {t.icon ? (
                typeof t.icon === "string" ? (
                  <span className="text-xl shrink-0 leading-none">{t.icon}</span>
                ) : (
                  t.icon
                )
              ) : (
                defaultIcon
              )}
            </div>

            {/* Message Body */}
            <div className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug tracking-tight">
              {typeof t.message === "function" ? t.message(t) : t.message}
            </div>

            {/* Dismiss Close Button */}
            {t.type !== "loading" && (
              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0 cursor-pointer"
                aria-label="Dismiss toast"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      }}
    </Toaster>
  );
}
