import React from "react";
import toast from "react-hot-toast";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaHeart,
  FaUtensils,
  FaLeaf,
  FaTimes,
} from "react-icons/fa";

interface CustomToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Modern custom interactive popup toast
 */
export function showModernToast(options: CustomToastOptions) {
  return toast.custom(
    (t) => (
      <div
        className={`relative flex items-start gap-3.5 p-4 rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-indigo-500/30 dark:border-indigo-500/20 shadow-2xl shadow-indigo-500/15 max-w-sm sm:max-w-md w-full transition-all duration-300 pointer-events-auto ${
          t.visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-l-2xl" />

        <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
          <FaLeaf className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0 pr-2">
          {options.title && (
            <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              {options.title}
            </h4>
          )}
          {options.description && (
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
              {options.description}
            </p>
          )}
          {options.action && (
            <button
              type="button"
              onClick={() => {
                options.action?.onClick();
                toast.dismiss(t.id);
              }}
              className="mt-2.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              {options.action.label}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 transition-colors shrink-0 cursor-pointer"
        >
          <FaTimes className="w-3 h-3" />
        </button>
      </div>
    ),
    { duration: options.duration || 4500 }
  );
}

export default toast;
