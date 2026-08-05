"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaEnvelope,
  FaMobileAlt,
  FaShieldAlt,
  FaCheckCircle,
  FaRedo,
} from "react-icons/fa";
import toast from "react-hot-toast";

type UserRole = "individual" | "restaurant" | "ngo";

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  identifier: string; // email or phone
  type: "email" | "phone";
  role?: UserRole;
}

const roleThemeMap = {
  individual: {
    iconBg: "bg-pink-50 dark:bg-pink-950/70 text-pink-600 dark:text-pink-400",
    buttonGradient:
      "from-pink-600 via-pink-500 to-rose-600 hover:from-pink-700 hover:to-rose-700",
    activeDigit:
      "border-pink-500 bg-pink-50/30 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400",
    focusRing: "focus:border-pink-500 focus:ring-pink-500/20",
    linkText: "text-pink-600 dark:text-pink-400",
    roleLabel: "Individual Account",
  },
  restaurant: {
    iconBg: "bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400",
    buttonGradient:
      "from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700",
    activeDigit:
      "border-blue-500 bg-blue-50/30 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
    focusRing: "focus:border-blue-500 focus:ring-blue-500/20",
    linkText: "text-blue-600 dark:text-blue-400",
    roleLabel: "Restaurant Partner",
  },
  ngo: {
    iconBg:
      "bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400",
    buttonGradient:
      "from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-700 hover:to-indigo-700",
    activeDigit:
      "border-purple-500 bg-purple-50/30 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
    focusRing: "focus:border-purple-500 focus:ring-purple-500/20",
    linkText: "text-purple-600 dark:text-purple-400",
    roleLabel: "NGO Partner",
  },
};

export default function OtpVerificationModal({
  isOpen,
  onClose,
  onVerified,
  identifier,
  type,
  role = "individual",
}: OtpVerificationModalProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const currentTheme = roleThemeMap[role] || roleThemeMap.individual;

  // Send OTP when modal opens
  useEffect(() => {
    if (isOpen && identifier) {
      setDigits(["", "", "", "", "", ""]);
      setIsSuccess(false);
      sendOtp();
    }
  }, [isOpen, identifier]);

  // Countdown timer for resend
  useEffect(() => {
    if (!isOpen) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown, isOpen]);

  const sendOtp = async () => {
    setIsSending(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, type }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send OTP");
        return;
      }
      toast.success(`Verification code sent to your ${type}!`);
      setCountdown(60);
      setCanResend(false);
    } catch {
      toast.error("Network error while sending OTP");
    } finally {
      setIsSending(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      if (pasted.length > 0) {
        const newDigits = [...digits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = pasted[i] || "";
        }
        setDigits(newDigits);
        const nextFocus = Math.min(pasted.length, 5);
        inputRefs.current[nextFocus]?.focus();
      }
      return;
    }

    const singleDigit = value.replace(/\D/g, "");
    const newDigits = [...digits];
    newDigits[index] = singleDigit;
    setDigits(newDigits);

    // Auto-focus next input
    if (singleDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = digits.join("");
    if (otp.length < 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp, type }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Invalid or expired code");
        return;
      }

      setIsSuccess(true);
      toast.success(
        `${type === "email" ? "Email" : "Phone"} verified successfully!`,
      );
      setTimeout(() => {
        onVerified();
        onClose();
      }, 1000);
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl z-10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <FaTimes className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div
              className={`w-16 h-16 ${currentTheme.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner transition-colors`}
            >
              {type === "email" ? <FaEnvelope /> : <FaMobileAlt />}
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
              <FaShieldAlt className="text-emerald-500" />
              <span>{currentTheme.roleLabel}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Verify Your {type === "email" ? "Email Address" : "Phone Number"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Enter the 6-digit verification code sent to{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-200">
                {identifier}
              </span>
            </p>
          </div>

          {/* 6 Digit Inputs */}
          <div className="flex justify-center gap-2.5 sm:gap-3 mb-6">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={isVerifying || isSuccess}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-extrabold rounded-2xl border transition-all focus:outline-hidden ${
                  digit
                    ? currentTheme.activeDigit
                    : `border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-gray-900 dark:text-white focus:ring-2 ${currentTheme.focusRing}`
                }`}
              />
            ))}
          </div>

          {/* Verify / Resend Actions */}
          <div className="space-y-3">
            <button
              onClick={handleVerify}
              disabled={isVerifying || digits.join("").length < 6 || isSuccess}
              className={`w-full py-3.5 px-4 bg-gradient-to-r ${currentTheme.buttonGradient} disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer`}
            >
              {isSuccess ? (
                <>
                  <FaCheckCircle className="text-emerald-300" />
                  <span>Verified!</span>
                </>
              ) : isVerifying ? (
                <span>Checking code...</span>
              ) : (
                <>
                  <FaShieldAlt />
                  <span>Confirm &amp; Proceed</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1 pt-1">
              <span>Didn&apos;t receive code?</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={isSending}
                  className={`${currentTheme.linkText} hover:underline font-bold flex items-center gap-1 cursor-pointer`}
                >
                  <FaRedo className={isSending ? "animate-spin" : ""} />
                  <span>Resend Code</span>
                </button>
              ) : (
                <span>Resend in {countdown}s</span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
