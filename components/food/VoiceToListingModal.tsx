"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  speechRecognitionService,
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
} from "@/lib/voice/speechRecognition";
import { speechSynthManager } from "@/lib/voice/speechSynthesis";
import {
  ConversationStep,
  STEP_METADATA,
  STEP_PROMPTS,
  getNextStep,
} from "@/lib/voice/conversationStateMachine";
import { ParsedFoodListing } from "@/lib/ai/foodParser";

interface VoiceToListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedData: (parsed: ParsedFoodListing) => void;
  defaultLanguage?: SupportedLanguage;
  userType?: "individual" | "restaurant" | string;
}

interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
  step?: ConversationStep;
}

export default function VoiceToListingModal({
  isOpen,
  onClose,
  onApplyParsedData,
  defaultLanguage = "bn-IN",
}: VoiceToListingModalProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [language, setLanguage] = useState<SupportedLanguage>(defaultLanguage);
  const [currentStep, setCurrentStep] = useState<ConversationStep>("DISH_NAME");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const [transcript, setTranscript] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [formData, setFormData] = useState<Partial<ParsedFoodListing>>({
    name: "",
    quantity: undefined,
    quantityUnit: "plates",
    isDonation: undefined,
    price: undefined,
    expiresInHours: undefined,
  });

  const [isComplete, setIsComplete] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const audioListenTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stepMeta = STEP_METADATA[currentStep];
  const stepPrompt = STEP_PROMPTS[language]?.[currentStep] || STEP_PROMPTS["en-IN"][currentStep];

  // Scroll chat to bottom
  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, transcript]);

  // Clean up audio on unmount or close
  useEffect(() => {
    return () => {
      speechSynthManager.stop();
      speechRecognitionService.stopListening();
      if (audioListenTimeoutRef.current) clearTimeout(audioListenTimeoutRef.current);
    };
  }, []);

  /**
   * Speak a text string via SpeechSynthesis, guaranteed echo-safe (mic starts AFTER speech ends)
   */
  const speakAndListen = useCallback(
    async (textToSpeak: string, targetLanguage: SupportedLanguage, shouldListenAfter = true) => {
      // 1. Stop any active speech recognition
      speechRecognitionService.stopListening();
      setIsListening(false);

      if (!voiceEnabled || !speechSynthManager.isSupported()) {
        // If voice is disabled, start listening directly after a small pause
        if (shouldListenAfter) {
          startListeningSafely();
        }
        return;
      }

      setIsAiSpeaking(true);

      await speechSynthManager.speak(textToSpeak, targetLanguage, {
        onStart: () => setIsAiSpeaking(true),
        onEnd: () => {
          setIsAiSpeaking(false);
          // Safety gap (400ms) to ensure speaker output has completely ended
          if (shouldListenAfter) {
            if (audioListenTimeoutRef.current) clearTimeout(audioListenTimeoutRef.current);
            audioListenTimeoutRef.current = setTimeout(() => {
              startListeningSafely();
            }, 400);
          }
        },
        onError: () => {
          setIsAiSpeaking(false);
          if (shouldListenAfter) {
            startListeningSafely();
          }
        },
      });
    },
    [voiceEnabled, language]
  );

  /**
   * Start Speech Recognition safely
   */
  const startListeningSafely = () => {
    if (isAiSpeaking || isProcessing) return;

    speechSynthManager.stop();
    setIsAiSpeaking(false);
    setTranscript("");
    setIsListening(true);

    speechRecognitionService.startListening({
      language,
      onResult: (result) => {
        setTranscript(result.transcript);
        if (result.isFinal && result.transcript.trim().length > 0) {
          handleUserSubmission(result.transcript.trim());
        }
      },
      onError: (err) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });
  };

  /**
   * Stop Speech Recognition
   */
  const stopListening = () => {
    speechRecognitionService.stopListening();
    setIsListening(false);
  };

  /**
   * Initialize assistant when modal opens or language changes
   */
  useEffect(() => {
    if (!isOpen) {
      speechSynthManager.stop();
      speechRecognitionService.stopListening();
      if (audioListenTimeoutRef.current) clearTimeout(audioListenTimeoutRef.current);
      return;
    }

    // Reset state on initial open
    const initialStep: ConversationStep = "DISH_NAME";
    const initialPrompt =
      STEP_PROMPTS[language]?.[initialStep] || STEP_PROMPTS["en-IN"][initialStep];

    setCurrentStep(initialStep);
    setIsComplete(false);
    setTranscript("");
    setManualInput("");
    setFormData({
      name: "",
      quantity: undefined,
      quantityUnit: "plates",
      isDonation: undefined,
      price: undefined,
      expiresInHours: undefined,
    });

    setMessages([
      {
        id: "msg-initial",
        sender: "ai",
        text: initialPrompt.displayTitle,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        step: initialStep,
      },
    ]);

    // Speak initial greeting
    const timer = setTimeout(() => {
      speakAndListen(initialPrompt.spokenText, language, true);
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen, language]);

  /**
   * Handle user submission (from Speech-to-Text, typing, or quick chip)
   */
  const handleUserSubmission = async (textToSubmit: string) => {
    const cleanInput = textToSubmit.trim();
    if (!cleanInput) return;

    stopListening();
    setIsProcessing(true);
    setTranscript("");
    setManualInput("");
    setIsEditingTranscript(false);

    // Append user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: cleanInput,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      step: currentStep,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/ai/voice-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: cleanInput,
          language,
          currentStep,
          currentFormData: formData,
        }),
      });

      const data = await res.json();

      if (data.success && data.extracted) {
        const updated = data.extracted;
        setFormData(updated);

        const next = data.nextStep as ConversationStep;
        setCurrentStep(next);

        if (data.isComplete || next === "COMPLETED") {
          setIsComplete(true);
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            sender: "ai",
            text:
              data.displayTitle ||
              "All details collected! Click the button below to auto-fill the form.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            step: "COMPLETED",
          };
          setMessages((prev) => [...prev, aiMsg]);
          speakAndListen(data.aiResponseText, language, false);
        } else {
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            sender: "ai",
            text: data.displayTitle,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            step: next,
          };
          setMessages((prev) => [...prev, aiMsg]);
          speakAndListen(data.aiResponseText, language, true);
        }
      }
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Reset the voice session
   */
  const handleReset = () => {
    speechSynthManager.stop();
    stopListening();
    setFormData({
      name: "",
      quantity: undefined,
      quantityUnit: "plates",
      isDonation: undefined,
      price: undefined,
      expiresInHours: undefined,
    });
    setCurrentStep("DISH_NAME");
    setIsComplete(false);
    setTranscript("");
    setManualInput("");

    const initialPrompt =
      STEP_PROMPTS[language]?.["DISH_NAME"] || STEP_PROMPTS["en-IN"]["DISH_NAME"];
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: "ai",
        text: initialPrompt.displayTitle,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        step: "DISH_NAME",
      },
    ]);

    speakAndListen(initialPrompt.spokenText, language, true);
  };

  /**
   * Apply extracted data directly to the AddFoodForm
   */
  const handleApply = () => {
    speechSynthManager.stop();
    stopListening();

    const expiresInHours = formData.expiresInHours || 4;
    const expiresAt =
      formData.expiresAt ||
      new Date(Date.now() + expiresInHours * 3_600_000).toISOString();

    const isDonation =
      formData.isDonation !== undefined ? formData.isDonation : true;
    const price = isDonation ? 0 : Number(formData.price) || 0;
    const originalPrice =
      formData.originalPrice || (price > 0 ? Math.round(price * 1.4) : null);

    const finalParsed: ParsedFoodListing = {
      name: formData.name || "Fresh Prepared Food",
      description:
        formData.description ||
        `${formData.name || "Fresh Food"}. Prepared fresh and ready for pickup.`,
      quantity: Math.max(1, Number(formData.quantity) || 1),
      quantityUnit: formData.quantityUnit || "plates",
      isDonation,
      price,
      originalPrice,
      discountPct:
        originalPrice && originalPrice > price
          ? Math.round(((originalPrice - price) / originalPrice) * 100)
          : 0,
      isRaw: Boolean(formData.isRaw),
      isHomeCooked:
        formData.isHomeCooked !== undefined ? formData.isHomeCooked : true,
      cuisineType: formData.cuisineType || null,
      allergens: formData.allergens || [],
      tags: [isDonation ? "donation" : "discounted", "fresh"],
      expiresInHours,
      expiresAt,
      pickupAddressHint: null,
      confidence: {
        overall: 0.98,
        name: 0.98,
        quantity: 0.98,
        price: 0.98,
        expiry: 0.98,
      },
      detectedEntities: {
        dishName: formData.name,
        quantityFound: `${formData.quantity} ${formData.quantityUnit}`,
        pricingFound: isDonation ? "Free Donation" : `₹${price}`,
        expiryFound: `in ${expiresInHours} hours`,
      },
      rawTranscript: messages
        .filter((m) => m.sender === "user")
        .map((m) => m.text)
        .join(" | "),
    };

    onApplyParsedData(finalParsed);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden ${
          isDark
            ? "bg-slate-900/95 border-slate-700/60 text-slate-100 shadow-purple-950/30"
            : "bg-white/95 border-slate-200 text-slate-900 shadow-purple-500/10"
        }`}
      >
        {/* TOP BAR: Header, Language Selector, Voice Toggle & Close */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isDark ? "border-slate-800 bg-slate-950/60" : "border-slate-100 bg-slate-50/80"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20 animate-pulse">
              <span className="text-xl">🎙️</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">AnnoSetu Voice Assistant</h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  Multilingual AI
                </span>
              </div>
              <p className="text-xs text-slate-400">Speak naturally in Bengali, Hindi, or English</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              aria-label="Select Voice Language"
              className={`text-xs sm:text-sm font-medium px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-slate-200 hover:border-purple-500"
                  : "bg-white border-slate-200 text-slate-700 hover:border-purple-500"
              }`}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>

            {/* Voice Audio Toggle */}
            <button
              onClick={() => {
                const next = !voiceEnabled;
                setVoiceEnabled(next);
                if (!next) speechSynthManager.stop();
              }}
              title={voiceEnabled ? "Voice Output Enabled" : "Voice Output Muted"}
              className={`p-2 rounded-xl border text-sm transition-all ${
                voiceEnabled
                  ? isDark
                    ? "bg-purple-950/50 border-purple-800 text-purple-300"
                    : "bg-purple-50 border-purple-200 text-purple-700"
                  : "bg-slate-200/50 border-slate-300 text-slate-400"
              }`}
            >
              {voiceEnabled ? "🔊" : "🔇"}
            </button>

            {/* Close Modal */}
            <button
              onClick={() => {
                speechSynthManager.stop();
                stopListening();
                onClose();
              }}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* STEP PROGRESS BAR */}
        <div
          className={`px-5 py-2.5 border-b flex items-center justify-between gap-2 overflow-x-auto ${
            isDark ? "border-slate-800/80 bg-slate-900/40" : "border-slate-100 bg-slate-50/50"
          }`}
        >
          {(
            ["DISH_NAME", "QUANTITY", "PRICING", "EXPIRY", "COMPLETED"] as ConversationStep[]
          ).map((stepKey, idx) => {
            const meta = STEP_METADATA[stepKey];
            const isCurrent = currentStep === stepKey;
            const isPassed =
              (stepKey === "DISH_NAME" && Boolean(formData.name)) ||
              (stepKey === "QUANTITY" && Boolean(formData.quantity)) ||
              (stepKey === "PRICING" && formData.isDonation !== undefined) ||
              (stepKey === "EXPIRY" && Boolean(formData.expiresInHours)) ||
              (stepKey === "COMPLETED" && isComplete);

            return (
              <div
                key={stepKey}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isCurrent
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-105"
                    : isPassed
                    ? isDark
                      ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : isDark
                    ? "text-slate-500 bg-slate-800/40"
                    : "text-slate-400 bg-slate-100"
                }`}
              >
                <span>{isPassed && !isCurrent ? "✓" : meta.icon}</span>
                <span>{meta.title}</span>
              </div>
            );
          })}
        </div>

        {/* MAIN BODY: 2 Columns */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* LEFT COLUMN: Conversational Agent (7 cols) */}
          <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-700/40 min-h-0">
            {/* Live Visualizer Banner */}
            <div
              className={`p-4 flex items-center justify-between border-b ${
                isDark ? "border-slate-800/60 bg-slate-950/40" : "border-slate-100 bg-slate-50/40"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Glowing Avatar */}
                <div
                  className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-300 ${
                    isAiSpeaking
                      ? "bg-gradient-to-tr from-purple-600 to-pink-500 shadow-lg shadow-purple-500/50 scale-105 animate-pulse text-white"
                      : isListening
                      ? "bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/50 scale-105 animate-bounce text-white"
                      : isProcessing
                      ? "bg-gradient-to-tr from-amber-500 to-orange-400 shadow-lg shadow-amber-500/40 animate-spin text-white"
                      : isDark
                      ? "bg-slate-800 text-slate-300"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {isAiSpeaking ? "🗣️" : isListening ? "🎙️" : isProcessing ? "⏳" : "🤖"}
                  {isListening && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping" />
                  )}
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    {isAiSpeaking
                      ? "AI Speaking..."
                      : isListening
                      ? "Listening to You..."
                      : isProcessing
                      ? "AI Thinking & Parsing..."
                      : "Ready to Listen"}
                  </div>
                  <div className="text-sm font-semibold text-slate-200">
                    {isListening
                      ? "Speak clearly into your microphone"
                      : isAiSpeaking
                      ? "Please listen to the prompt"
                      : "Tap the mic or choose an option below"}
                  </div>
                </div>
              </div>

              {/* Status Audio Waves */}
              <div className="flex items-center gap-1">
                {[40, 70, 100, 60, 90, 50, 80].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      height: isAiSpeaking || isListening ? `${h}%` : "20%",
                      animationDelay: `${i * 0.15}s`,
                    }}
                    className={`w-1 rounded-full transition-all duration-200 ${
                      isAiSpeaking
                        ? "bg-purple-400 animate-pulse"
                        : isListening
                        ? "bg-emerald-400 animate-bounce"
                        : "bg-slate-700"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Conversation Messages Feed */}
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none"
                        : isDark
                        ? "bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-none"
                        : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className="text-[10px] font-bold uppercase opacity-75">
                        {msg.sender === "user" ? "You (Voice/Text)" : "AnnoSetu AI"}
                      </span>
                      <span className="text-[10px] opacity-60">{msg.timestamp}</span>
                    </div>
                    <p className="font-medium text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}

              {/* Real-Time Listening Waveform Preview */}
              {isListening && (
                <div className="flex justify-end animate-in fade-in duration-150">
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm border border-dashed ${
                      isDark
                        ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-300"
                        : "bg-emerald-50 border-emerald-300 text-emerald-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Listening in Real-Time...
                      </span>
                    </div>
                    <p className="font-medium italic">
                      {transcript || "Listening... Speak now (e.g. dish name, portions, free/price)"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Answer Suggestion Chips */}
            <div
              className={`px-4 py-2 border-t flex flex-wrap items-center gap-1.5 ${
                isDark ? "border-slate-800 bg-slate-950/40" : "border-slate-100 bg-slate-50/60"
              }`}
            >
              <span className="text-[11px] font-bold text-slate-400 mr-1">Suggested:</span>
              {stepPrompt.quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleUserSubmission(chip)}
                  disabled={isProcessing}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-purple-900/40 hover:border-purple-600"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-purple-50 hover:border-purple-300"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Bottom Controls: Microphone & Text Input Bar */}
            <div
              className={`p-4 border-t flex items-center gap-2 ${
                isDark ? "border-slate-800 bg-slate-950/80" : "border-slate-200 bg-white"
              }`}
            >
              {/* Big Pulsing Mic Button */}
              <button
                onClick={() => {
                  if (isListening) {
                    stopListening();
                  } else {
                    startListeningSafely();
                  }
                }}
                disabled={isProcessing}
                className={`relative px-4 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-md ${
                  isListening
                    ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/40 animate-pulse"
                    : isAiSpeaking
                    ? "bg-purple-700 text-white opacity-80 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30"
                }`}
              >
                <span className="text-lg">{isListening ? "⏹️" : "🎙️"}</span>
                <span className="text-xs sm:text-sm whitespace-nowrap">
                  {isListening ? "Stop Listening" : "Speak to Answer"}
                </span>
              </button>

              {/* Text Input Fallback Bar */}
              <div className="flex-1 flex items-center gap-1.5">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && manualInput.trim()) {
                      handleUserSubmission(manualInput);
                    }
                  }}
                  placeholder={stepPrompt.placeholder}
                  disabled={isProcessing}
                  className={`w-full text-xs sm:text-sm px-3.5 py-3 rounded-2xl border outline-none transition-all ${
                    isDark
                      ? "bg-slate-900 border-slate-700/80 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      : "bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  }`}
                />

                <button
                  onClick={() => handleUserSubmission(manualInput)}
                  disabled={!manualInput.trim() || isProcessing}
                  className="px-3.5 py-3 rounded-2xl font-semibold bg-slate-800 hover:bg-purple-600 text-white disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors text-xs sm:text-sm"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Real-Time Populated Listing Card Preview (5 cols) */}
          <div
            className={`lg:col-span-5 flex flex-col p-5 overflow-y-auto ${
              isDark ? "bg-slate-950/40" : "bg-slate-50/50"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Live Listing Preview
              </h4>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {formData.name ? "AI Extraction Active" : "Awaiting Input"}
              </span>
            </div>

            {/* Extracted Card Preview Box */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-300 ${
                isDark
                  ? "bg-slate-900/90 border-slate-700/60 shadow-xl"
                  : "bg-white border-slate-200 shadow-md"
              }`}
            >
              {/* Dish Name */}
              <div className="mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Dish Title</span>
                <h3 className="text-lg font-extrabold text-purple-400 flex items-center gap-2">
                  <span>{formData.name || "—"}</span>
                  {formData.name && <span className="text-xs">✓</span>}
                </h3>
              </div>

              {/* 2x2 Grid: Portions, Pricing, Expiry, Type */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Portions */}
                <div
                  className={`p-3 rounded-xl border ${
                    formData.quantity
                      ? isDark
                        ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-300"
                        : "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : isDark
                      ? "bg-slate-800/40 border-slate-800 text-slate-500"
                      : "bg-slate-100 border-slate-200 text-slate-400"
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase">Quantity</div>
                  <div className="text-sm font-bold mt-0.5">
                    {formData.quantity ? `${formData.quantity} ${formData.quantityUnit}` : "—"}
                  </div>
                </div>

                {/* Pricing / Donation */}
                <div
                  className={`p-3 rounded-xl border ${
                    formData.isDonation !== undefined
                      ? isDark
                        ? "bg-purple-950/30 border-purple-800/50 text-purple-300"
                        : "bg-purple-50 border-purple-200 text-purple-800"
                      : isDark
                      ? "bg-slate-800/40 border-slate-800 text-slate-500"
                      : "bg-slate-100 border-slate-200 text-slate-400"
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase">Pricing</div>
                  <div className="text-sm font-bold mt-0.5">
                    {formData.isDonation === true
                      ? "Free Donation 🎁"
                      : formData.price !== undefined
                      ? `₹${formData.price} / portion`
                      : "—"}
                  </div>
                </div>

                {/* Expiry Window */}
                <div
                  className={`p-3 rounded-xl border ${
                    formData.expiresInHours
                      ? isDark
                        ? "bg-amber-950/30 border-amber-800/50 text-amber-300"
                        : "bg-amber-50 border-amber-200 text-amber-800"
                      : isDark
                      ? "bg-slate-800/40 border-slate-800 text-slate-500"
                      : "bg-slate-100 border-slate-200 text-slate-400"
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase">Pickup Window</div>
                  <div className="text-sm font-bold mt-0.5">
                    {formData.expiresInHours ? `Within ${formData.expiresInHours} hrs` : "—"}
                  </div>
                </div>

                {/* Cuisine / Style */}
                <div
                  className={`p-3 rounded-xl border ${
                    formData.cuisineType || formData.isHomeCooked !== undefined
                      ? isDark
                        ? "bg-indigo-950/30 border-indigo-800/50 text-indigo-300"
                        : "bg-indigo-50 border-indigo-200 text-indigo-800"
                      : isDark
                      ? "bg-slate-800/40 border-slate-800 text-slate-500"
                      : "bg-slate-100 border-slate-200 text-slate-400"
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase">Cuisine / Style</div>
                  <div className="text-sm font-bold mt-0.5 capitalize">
                    {formData.cuisineType || (formData.isHomeCooked ? "Home Cooked" : "—")}
                  </div>
                </div>
              </div>

              {/* Status Hint */}
              <div className="text-xs text-slate-400 border-t border-slate-800/60 pt-3">
                {isComplete
                  ? "✅ All 4 fields filled! Ready to populate form."
                  : `Next step: ${stepMeta.description}`}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto pt-4 space-y-2">
              <button
                onClick={handleApply}
                disabled={!formData.name}
                className="w-full py-3.5 px-4 rounded-2xl font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <span>✨</span>
                <span>Apply to Listing Form</span>
              </button>

              <button
                onClick={handleReset}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent hover:border-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>🔄</span>
                <span>Reset & Start Over</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
