"use client";

import { useState } from "react";
import { FaMicrophone, FaMagic } from "react-icons/fa";
import VoiceToListingModal from "./VoiceToListingModal";
import type { ParsedFoodListing } from "@/lib/ai/foodParser";

interface VoiceListingButtonProps {
  onApplyParsedData: (data: ParsedFoodListing) => void;
  userType?: "individual" | "restaurant";
  variant?: "banner" | "button" | "floating";
  className?: string;
}

export default function VoiceListingButton({
  onApplyParsedData,
  userType = "individual",
  variant = "banner",
  className = "",
}: VoiceListingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isRestaurant = userType === "restaurant";
  const themeGradient = isRestaurant
    ? "from-blue-600 via-indigo-600 to-cyan-500"
    : "from-rose-500 via-pink-600 to-amber-500";

  return (
    <>
      {variant === "banner" && (
        <div
          onClick={() => setIsOpen(true)}
          className={`cursor-pointer group relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-linear-to-r ${themeGradient} text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 ${className}`}
        >
          {/* Ambient light streak */}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                <FaMicrophone className="w-6 h-6 text-white animate-pulse" />
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 ring-2 ring-white animate-ping" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <FaMagic className="w-2.5 h-2.5 text-amber-300" />
                    AI Fast Track
                  </span>
                  <span className="text-[11px] text-white/80 font-medium hidden sm:inline">
                    Multilingual Voice-to-Listing
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-extrabold mt-0.5">
                  Busy kitchen? Speak to create this food listing! 🎙️
                </h4>
                <p className="text-xs text-white/90 mt-0.5 hidden sm:block">
                  Say dish name, quantity, price or donation status — AI fills the form automatically.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-white text-gray-900 font-extrabold text-xs shadow-md group-hover:bg-amber-300 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <FaMicrophone className="text-rose-600" />
              <span>Try Voice Listing ✨</span>
            </button>
          </div>
        </div>
      )}

      {variant === "button" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`px-4 py-2.5 rounded-xl bg-linear-to-r ${themeGradient} text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 ${className}`}
        >
          <FaMicrophone className="w-3.5 h-3.5" />
          <span>Speak to Fill (AI) ✨</span>
        </button>
      )}

      {variant === "floating" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Voice-to-Listing AI Assistant"
          className={`fixed bottom-6 right-6 z-40 p-4 rounded-full bg-linear-to-r ${themeGradient} text-white shadow-2xl hover:scale-110 transition-transform duration-300 ring-4 ring-white/30 flex items-center justify-center ${className}`}
        >
          <FaMicrophone className="w-6 h-6 animate-pulse" />
        </button>
      )}

      <VoiceToListingModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onApplyParsedData={onApplyParsedData}
        userType={userType}
      />
    </>
  );
}
