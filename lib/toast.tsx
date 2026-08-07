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

interface MessageToastOptions {
  senderName: string;
  senderRole?: string;
  message: string;
  conversationId: string;
  avatarUrl?: string;
  onOpen?: () => void;
  duration?: number;
}

/**
 * Modern interactive chat toast popup for incoming real-time messages
 */
export function showMessageToast(options: MessageToastOptions) {
  const initial = options.senderName ? options.senderName.charAt(0).toUpperCase() : "U";

  return toast.custom(
    (t) => (
      <div
        className={`relative flex items-start gap-3.5 p-4 rounded-2xl bg-white/95 dark:bg-[#0c182d]/95 backdrop-blur-2xl border border-emerald-500/40 dark:border-emerald-500/30 shadow-2xl shadow-emerald-500/15 max-w-sm sm:max-w-md w-full transition-all duration-300 pointer-events-auto cursor-pointer hover:border-emerald-500 ${
          t.visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2"
        }`}
        onClick={() => {
          if (options.onOpen) {
            options.onOpen();
          } else if (typeof window !== "undefined") {
            window.location.href = `/protected/messages?conversationId=${options.conversationId}`;
          }
          toast.dismiss(t.id);
        }}
      >
        {/* Left emerald glowing bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-400 to-teal-600 rounded-l-2xl" />

        {/* Sender Avatar or Initial */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md border-2 border-white dark:border-slate-800">
          {initial}
        </div>

        {/* Text Body */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {options.senderName}
            </h4>
            {options.senderRole && (
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {options.senderRole}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 leading-relaxed">
            {options.message}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-sm transition-transform active:scale-95">
              💬 Reply
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              Click to open chat
            </span>
          </div>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss(t.id);
          }}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 transition-colors shrink-0"
          aria-label="Close notification"
        >
          <FaTimes className="w-3.5 h-3.5" />
        </button>
      </div>
    ),
    { duration: options.duration || 5000 }
  );
}

export default toast;
