"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaMicrophone,
  FaStop,
  FaMagic,
  FaTimes,
  FaCheck,
  FaUtensils,
  FaClock,
  FaTag,
  FaHandHoldingHeart,
  FaExclamationTriangle,
  FaVolumeUp,
  FaShieldAlt,
} from "react-icons/fa";
import {
  VoiceRecognitionManager,
  isSpeechRecognitionSupported,
  SUPPORTED_VOICE_LANGUAGES,
} from "@/lib/voice/speechRecognition";
import type { ParsedFoodListing } from "@/lib/ai/foodParser";
import toast from "react-hot-toast";

interface VoiceToListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedData: (data: ParsedFoodListing) => void;
  userType?: "individual" | "restaurant";
}

const SAMPLE_PROMPTS = [
  "Amar kache 10 plate biriyani ache jeta ami donation hisabe dite chai",
  "5 plates of homemade paneer butter masala combo with 10 rotis, free donation, pickup in 3 hours",
  "Mere paas 15 plate veg pulao aur paneer hai jo main daan me dena chahta hu",
  "10 boxes fresh vegetable biryani surplus at 80 rupees each, pick up tonight before 10 PM",
  "Amader kache 20 packet fried rice ache 50 taka kore nite paren",
  "3 kg fresh bakery bread and muffins, 100% vegetarian, free donation, pick up within 4 hours",
];

export default function VoiceToListingModal({
  isOpen,
  onClose,
  onApplyParsedData,
  userType = "individual",
}: VoiceToListingModalProps) {
  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedFoodListing | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const voiceManagerRef = useRef<VoiceRecognitionManager | null>(null);

  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  useEffect(() => {
    if (!isOpen) {
      if (voiceManagerRef.current) {
        voiceManagerRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const manager = new VoiceRecognitionManager(selectedLanguage);
    voiceManagerRef.current = manager;

    manager.onTranscript((text) => {
      setTranscript(text);
      setErrorMessage(null);
    });

    manager.onStateChange((listening) => {
      setIsListening(listening);
    });

    manager.onError((err) => {
      setErrorMessage(err);
      setIsListening(false);
      toast.error(err);
    });

    return () => {
      manager.stop();
    };
  }, [isOpen, selectedLanguage]);

  const toggleListening = () => {
    if (!voiceManagerRef.current) return;

    if (isListening) {
      voiceManagerRef.current.stop();
      if (transcript.trim()) {
        handleAnalyze(transcript);
      }
    } else {
      setErrorMessage(null);
      setParsedData(null);
      const started = voiceManagerRef.current.start();
      if (started) {
        toast("Listening... Speak your meal details now!", { icon: "🎙️" });
      }
    }
  };

  const handleAnalyze = async (textToParse: string) => {
    const text = textToParse.trim();
    if (!text || text.length < 3) {
      toast.error("Please speak or type food listing details first");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/ai/voice-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: text,
          language: selectedLanguage,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to analyze voice listing");
      }

      setParsedData(json.data);
      toast.success("AI extracted listing details! Review below ✨");
    } catch (err: any) {
      setErrorMessage(err.message || "Could not parse voice details");
      toast.error(err.message || "Could not parse voice details");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!parsedData) return;
    onApplyParsedData(parsedData);
    toast.success("Details applied to food form! ✨");
    onClose();
  };

  const isRestaurant = userType === "restaurant";
  const themeGradient = isRestaurant
    ? "from-blue-600 via-indigo-600 to-cyan-500"
    : "from-rose-500 via-pink-600 to-amber-500";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden z-10 my-8"
      >
        {/* Glow ambient background */}
        <div
          className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 bg-linear-to-br ${themeGradient} pointer-events-none`}
        />
        <div
          className={`absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20 bg-linear-to-tr ${themeGradient} pointer-events-none`}
        />

        {/* Modal Header */}
        <div className={`p-6 bg-linear-to-r ${themeGradient} text-white relative`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <FaMagic className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold tracking-wide uppercase">
                  ✨ AI Multilingual Assistant
                </div>
                <h3 className="text-xl sm:text-2xl font-black">
                  Voice-to-Listing
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          <p className="text-white/85 text-xs sm:text-sm mt-2">
            Just speak naturally. AI extracts food name, quantity, price or donation status, allergens, and expiry window instantly!
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Controls Bar: Language + Speech Support */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200/80 dark:border-gray-700/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
              <FaVolumeUp className="text-indigo-500" />
              <span>Input Language:</span>
            </div>

            <select
              value={selectedLanguage}
              onChange={(e) => {
                const code = e.target.value;
                setSelectedLanguage(code);
                if (voiceManagerRef.current) {
                  voiceManagerRef.current.setLanguage(code);
                }
              }}
              disabled={isListening}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {SUPPORTED_VOICE_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>

          {/* Voice Microphone Center Stage */}
          <div className="flex flex-col items-center justify-center py-4 text-center">
            {/* Animated Mic Button */}
            <div className="relative flex items-center justify-center">
              {isListening && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className={`absolute w-32 h-32 rounded-full bg-linear-to-r ${themeGradient} blur-md`}
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.2, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className={`absolute w-28 h-28 rounded-full bg-linear-to-r ${themeGradient}`}
                  />
                </>
              )}

              <button
                type="button"
                onClick={toggleListening}
                className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-all duration-300 transform active:scale-95 ${
                  isListening
                    ? "bg-red-600 ring-8 ring-red-500/30 scale-105"
                    : `bg-linear-to-r ${themeGradient} hover:scale-105 ring-4 ring-indigo-500/20`
                }`}
              >
                {isListening ? (
                  <>
                    <FaStop className="w-8 h-8 mb-1 animate-pulse" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">
                      Stop & Parse
                    </span>
                  </>
                ) : (
                  <>
                    <FaMicrophone className="w-8 h-8 mb-1" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">
                      Tap to Speak
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Sound Wave Bars when Listening */}
            {isListening && (
              <div className="flex items-center justify-center gap-1.5 mt-5">
                {[40, 75, 100, 60, 90, 45, 80, 50, 95, 65, 85].map((height, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: [`${height * 0.3}%`, `${height}%`, `${height * 0.4}%`],
                    }}
                    transition={{
                      duration: 0.6 + (i % 3) * 0.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-1 bg-linear-to-t from-rose-500 to-indigo-500 rounded-full h-8"
                  />
                ))}
              </div>
            )}

            <div className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400">
              {isListening
                ? "🎙️ Listening... Speak clearly (e.g., '10 plates veg pulao for free donation')"
                : isAnalyzing
                ? "⚡ AI analyzing your speech..."
                : "Press the microphone and speak your food surplus details"}
            </div>
          </div>

          {/* Transcript Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <span>Spoken Transcript / Prompt:</span>
                {transcript && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    (Ready to Parse)
                  </span>
                )}
              </label>
              {transcript && (
                <button
                  type="button"
                  onClick={() => setTranscript("")}
                  className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="relative">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Speak using the microphone above, or type details here (e.g., '5 plates hot rajma chawal donation, ready for pickup in 3 hours')..."
                rows={3}
                className="w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-xs"
              />

              {!isListening && transcript.trim().length > 3 && (
                <button
                  type="button"
                  onClick={() => handleAnalyze(transcript)}
                  disabled={isAnalyzing}
                  className="absolute right-3 bottom-3 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
                >
                  <FaMagic className="w-3 h-3 text-amber-300" />
                  {isAnalyzing ? "Analyzing..." : "Re-Analyze with AI"}
                </button>
              )}
            </div>
          </div>

          {/* Sample Prompts Inspiration */}
          <div>
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
              💡 Quick Sample Inspiration (Click to Test):
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTranscript(prompt);
                    handleAnalyze(prompt);
                  }}
                  className="text-xs text-left px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700/80 transition-all cursor-pointer"
                >
                  &ldquo;{prompt.slice(0, 45)}...&rdquo;
                </button>
              ))}
            </div>
          </div>

          {/* Parsed Output Card Preview */}
          <AnimatePresence>
            {parsedData && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                      <FaCheck className="w-3.5 h-3.5" />
                    </span>
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      Extracted Food Listing Fields
                    </h4>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                    AI Confidence: {Math.round(parsedData.confidence.overall * 100)}%
                  </span>
                </div>

                {/* Grid of Extracted Attributes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-gray-900/80 border border-emerald-100 dark:border-emerald-900">
                    <span className="text-gray-400 font-medium block text-[10px] uppercase">
                      Dish Name
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                      {parsedData.name}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-gray-900/80 border border-emerald-100 dark:border-emerald-900">
                    <span className="text-gray-400 font-medium block text-[10px] uppercase">
                      Quantity
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                      {parsedData.quantity} {parsedData.quantityUnit}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-gray-900/80 border border-emerald-100 dark:border-emerald-900">
                    <span className="text-gray-400 font-medium block text-[10px] uppercase">
                      Listing Type & Price
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1">
                      {parsedData.isDonation ? (
                        <>
                          <FaHandHoldingHeart className="text-purple-500" />
                          <span>100% Free Donation</span>
                        </>
                      ) : (
                        <>
                          <FaTag className="text-blue-500" />
                          <span>₹{parsedData.price} (Surplus Deal)</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-gray-900/80 border border-emerald-100 dark:border-emerald-900">
                    <span className="text-gray-400 font-medium block text-[10px] uppercase">
                      Expiry Window
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1">
                      <FaClock className="text-amber-500" />
                      <span>{parsedData.expiresInHours} hours from now</span>
                    </span>
                  </div>
                </div>

                {/* Allergens & Dietary */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-gray-500 font-medium mr-1">
                    Tags:
                  </span>
                  {parsedData.cuisineType && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[11px] font-semibold capitalize">
                      🍲 {parsedData.cuisineType.replace("_", " ")}
                    </span>
                  )}
                  {parsedData.allergens.length > 0 ? (
                    parsedData.allergens.map((a) => (
                      <span
                        key={a}
                        className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[11px] font-semibold capitalize"
                      >
                        ⚠️ {a}
                      </span>
                    ))
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-[11px] font-semibold">
                      🌱 No Common Allergens
                    </span>
                  )}
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={handleApply}
                  className={`w-full py-3 rounded-2xl bg-linear-to-r ${themeGradient} text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-98`}
                >
                  <FaMagic className="w-4 h-4 text-amber-300" />
                  Apply & Populate Food Form ✨
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-200/80 dark:border-gray-700/80 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <FaShieldAlt className="text-emerald-500" />
            <span>Encrypted & Private Audio Processing</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-semibold text-gray-700 dark:text-gray-300 hover:underline"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
