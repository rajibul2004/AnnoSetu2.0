"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaQrcode,
  FaCheckCircle,
  FaSearch,
  FaCamera,
  FaSyncAlt,
  FaTimes,
  FaUtensils,
  FaShieldAlt,
  FaPaste,
  FaCheck,
  FaInfoCircle,
  FaClock,
  FaStar,
} from "react-icons/fa";
import Webcam from "react-webcam";
import jsQR from "jsqr";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import toast from "react-hot-toast";
import { useVerifyPickup, useRecentPickups } from "@/hooks/useReservationQueries";
import { useGamification } from "@/context/GamificationContext";
import { formatDate } from "@/lib/formatters";
import type { PickupVerificationResult } from "@/types/reservation";

type VerificationMethod = "code" | "qr";

interface QrPayload {
  reservationId?: string;
  pickupCode?: string;
  code?: string;
  id?: string;
  foodName?: string;
  food?: string;
}

export default function PickupManager() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code");

  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>("code");
  const [pickupCode, setPickupCode] = useState(initialCode || "");
  const [scanning, setScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [lastVerified, setLastVerified] = useState<PickupVerificationResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { showXP, showBadgeUnlock } = useGamification();

  const { verifyPickup, isVerifying, reset } = useVerifyPickup((data) => {
    // Show XP popup (suppliers get points too! we can show a general message here)
    if (data.pointsEarned) {
      showXP(data.pointsEarned, "Pickup Confirmed");
    }
    
    // Show badge celebrations if any new badges were unlocked
    if (data.newBadges && data.newBadges.length > 0) {
      // If multiple badges unlock at once, they'll queue up in the context
      // but for simplicity we'll just show the first one or we can let context handle it
      data.newBadges.forEach((badgeId, index) => {
        setTimeout(() => showBadgeUnlock(badgeId), index * 6000); // staggering if multiple
      });
    }
  });

  const { recentPickups, isLoading: pickupsLoading, refetch: refetchRecent } = useRecentPickups();

  const handleVerifyCode = async (codeToVerify: string) => {
    let cleanCode = codeToVerify.trim();
    
    // Check if the user pasted the raw JSON payload from the QR code
    try {
      const parsed: QrPayload = JSON.parse(cleanCode);
      if (parsed.pickupCode || parsed.code) {
        cleanCode = (parsed.pickupCode || parsed.code) as string;
      }
    } catch {
      // Not a JSON payload, proceed with raw string
    }
    
    cleanCode = cleanCode.toUpperCase();

    if (!cleanCode) {
      toast.error("Please enter a valid pickup code");
      return;
    }

    try {
      const result = await verifyPickup(cleanCode);
      if (result) {
        setLastVerified(result);
        setPickupCode("");
      }
    } catch {
      // Handled by mutation hook toast
    }
  };

  // Auto-verify if code is present in URL
  const hasAutoVerified = useRef(false);
  useEffect(() => {
    if (initialCode && !hasAutoVerified.current) {
      hasAutoVerified.current = true;
      handleVerifyCode(initialCode);
    }
  }, [initialCode]);

  const decodeFrame = useCallback((): string | null => {
    const video = webcamRef.current?.video;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (!decoded || !decoded.data) return null;

    const rawData = decoded.data.trim();

    // 1. Check if JSON payload
    try {
      const parsed: QrPayload = JSON.parse(rawData);
      const code = parsed.pickupCode || parsed.code;
      if (code) return code.trim().toUpperCase();
    } catch {
      // Not JSON, check if raw string code
    }

    // 2. Direct string code
    if (rawData.length >= 4 && rawData.length <= 30) {
      return rawData.toUpperCase();
    }

    return null;
  }, []);

  // Continuous frame scanner loop while camera is active
  useEffect(() => {
    if (!scanning || isVerifying) {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      return;
    }

    scanIntervalRef.current = setInterval(() => {
      const code = decodeFrame();
      if (code) {
        setScanning(false);
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
        }
        toast.success(`QR detected: ${code}`);
        handleVerifyCode(code);
      }
    }, 400);

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [scanning, isVerifying, decodeFrame]);

  // Manual one-click capture fallback
  const handleManualCapture = () => {
    const code = decodeFrame();
    if (!code) {
      toast.error("No QR code detected. Center the QR code in the frame and try again.");
      return;
    }
    setScanning(false);
    toast.success(`QR detected: ${code}`);
    handleVerifyCode(code);
  };

  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setPickupCode(text.trim().toUpperCase());
        toast.success("Pasted from clipboard");
      }
    } catch {
      toast.error("Clipboard access denied or empty");
    }
  };

  const handleResetVerification = () => {
    setLastVerified(null);
    setPickupCode("");
    reset();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Verification Card */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/80 dark:border-slate-800 overflow-hidden">
        {/* Card Header */}
        <div className="bg-linear-to-r from-emerald-600 to-teal-700 dark:from-emerald-900 dark:to-teal-950 p-5 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                <FaShieldAlt className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                  Pickup Verification
                </h2>
                <p className="text-emerald-100 text-xs sm:text-sm font-medium mt-0.5">
                  Confirm and handover reserved meals in real-time
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/20">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                Live Verification
              </span>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-8">
          {/* Method Switcher Tabs */}
          <div className="flex bg-gray-100/90 dark:bg-slate-800/80 p-1.5 rounded-2xl mb-6 sm:mb-8 border border-gray-200/50 dark:border-slate-700/50">
            {[
              { id: "code", label: "Code Entry", fullLabel: "Manual Code Entry", icon: FaSearch },
              { id: "qr", label: "Camera QR", fullLabel: "Camera QR Scanner", icon: FaQrcode },
            ].map((method) => {
              const isActive = verificationMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => {
                    setVerificationMethod(method.id as VerificationMethod);
                    if (method.id === "qr") {
                      setScanning(true);
                      setCameraError(null);
                    } else {
                      setScanning(false);
                    }
                  }}
                  className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                    isActive
                      ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md scale-101"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <method.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="sm:hidden">{method.label}</span>
                  <span className="hidden sm:inline">{method.fullLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Success Result Modal / Banner */}
          <AnimatePresence>
            {lastVerified && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-8 p-6 bg-emerald-50 dark:bg-emerald-950/40 rounded-3xl border border-emerald-300 dark:border-emerald-800 text-center relative overflow-hidden shadow-xl shadow-emerald-500/5"
              >
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                  <FaCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-emerald-900 dark:text-emerald-200">
                  Pickup Successfully Verified!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  The reservation status has been marked as <b>Picked Up</b>. You can now safely hand over the food.
                </p>

                <div className="mt-4 p-4 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 inline-flex flex-col sm:flex-row items-center gap-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <FaUtensils className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase">Item Rescued</div>
                      <div className="text-sm font-black text-gray-900 dark:text-white">
                        {lastVerified.foodName}
                      </div>
                    </div>
                  </div>

                  <div className="h-6 w-px bg-gray-200 dark:bg-slate-800 hidden sm:block" />

                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase">Portions</div>
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {lastVerified.quantity} portions
                    </div>
                  </div>
                </div>

                {/* Gamification Celebration */}
                {lastVerified.pointsEarned && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                    className="mt-6 mx-auto flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl shadow-xl shadow-amber-500/30 text-white max-w-fit"
                  >
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                      <FaStar className="w-5 h-5 text-amber-100" />
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] font-black uppercase tracking-widest text-amber-100">
                        Impact Points Earned
                      </div>
                      <div className="text-xl font-black">
                        +{lastVerified.pointsEarned} XP
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={handleResetVerification}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    Verify Another Order
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verification Mode 1: Manual Code */}
          {verificationMethod === "code" && !lastVerified && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-xl mx-auto"
            >
              <div className="text-center space-y-1">
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  Enter 8-Character Secret Code
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ask the customer for the pickup code displayed on their confirmed digital ticket.
                </p>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. ANO-8F3B9A"
                  value={pickupCode}
                  onChange={(e) => setPickupCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleVerifyCode(pickupCode);
                  }}
                  className="w-full text-center tracking-widest font-mono text-xl sm:text-2xl font-black py-4 px-12 rounded-2xl bg-gray-50 dark:bg-slate-800/80 border-2 border-gray-200 dark:border-slate-700 focus:border-emerald-500 focus:outline-hidden text-gray-900 dark:text-white shadow-inner uppercase"
                />

                <button
                  type="button"
                  onClick={handlePasteCode}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2.5 text-xs text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
                  title="Paste from clipboard"
                >
                  <FaPaste className="w-4 h-4" />
                </button>
              </div>

              <Button
                onClick={() => handleVerifyCode(pickupCode)}
                loading={isVerifying}
                disabled={!pickupCode.trim() || isVerifying}
                className="w-full py-4 text-sm font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
              >
                <FaCheckCircle className="w-4 h-4" />
                <span>Verify Pickup Code</span>
              </Button>
            </motion.div>
          )}

          {/* Verification Mode 2: Camera QR Scanner */}
          {verificationMethod === "qr" && !lastVerified && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-xl mx-auto text-center"
            >
              {cameraError ? (
                <div className="p-8 bg-rose-50 dark:bg-rose-950/30 rounded-3xl border border-rose-200 dark:border-rose-900/50 text-center space-y-4">
                  <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
                    <FaTimes className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-black text-rose-900 dark:text-rose-200">
                    Camera Access Required
                  </h4>
                  <p className="text-xs text-rose-700 dark:text-rose-400 max-w-sm mx-auto">
                    {cameraError}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCameraError(null);
                      setScanning(true);
                    }}
                    className="text-xs font-bold"
                  >
                    Try Again
                  </Button>
                </div>
              ) : scanning ? (
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-500/30 bg-black aspect-square max-w-md mx-auto">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode }}
                    onUserMediaError={(err) => {
                      setCameraError(
                        typeof err === "string"
                          ? err
                          : "Please grant camera permissions to scan QR codes."
                      );
                      setScanning(false);
                    }}
                    className="w-full h-full object-cover"
                  />

                  {/* Viewfinder Overlay with Reticle & Animated Laser */}
                  <div className="absolute inset-0 border-[48px] sm:border-[64px] border-black/60 pointer-events-none flex items-center justify-center">
                    <div className="relative w-full h-full border-2 border-dashed border-emerald-400/80 rounded-2xl">
                      {/* Reticle corner accents */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                      {/* Laser scanning bar */}
                      <motion.div
                        animate={{ y: ["0%", "100%", "0%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        className="w-full h-0.5 bg-linear-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399]"
                      />
                    </div>
                  </div>

                  {/* Controls bar */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      onClick={toggleFacingMode}
                      className="p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-colors text-xs font-bold cursor-pointer"
                      title="Switch Camera"
                    >
                      <FaSyncAlt className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setScanning(false)}
                      className="p-2.5 rounded-full bg-rose-600/90 text-white hover:bg-rose-700 backdrop-blur-md transition-colors text-xs cursor-pointer"
                      title="Stop Scanner"
                    >
                      <FaTimes className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Bottom Scan CTA */}
                  <div className="absolute bottom-4 inset-x-4">
                    <Button
                      onClick={handleManualCapture}
                      loading={isVerifying}
                      className="w-full bg-white/95 text-emerald-800 hover:bg-white backdrop-blur-md py-3 text-xs font-black rounded-xl shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FaCamera className="w-3.5 h-3.5" />
                      <span>Capture & Decode Frame</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-10 border-2 border-dashed border-emerald-200 dark:border-emerald-900/50 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-3xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                    <FaQrcode className="w-10 h-10" />
                  </div>
                  <h4 className="text-base font-black text-gray-900 dark:text-white">
                    Camera Scanner Ready
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Point your camera at the customer&apos;s digital boarding pass QR code for automatic verification.
                  </p>
                  <Button
                    onClick={() => {
                      setScanning(true);
                      setCameraError(null);
                    }}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer inline-flex items-center gap-2"
                  >
                    <FaCamera className="w-3.5 h-3.5" />
                    <span>Open Camera Scanner</span>
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Recent Pickups Section */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              Recently Verified Pickups
            </h3>
            <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs rounded-full font-black">
              {recentPickups?.length || 0}
            </span>
          </div>

          <button
            onClick={() => refetchRecent()}
            className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1 font-bold"
            title="Refresh list"
          >
            <FaSyncAlt className={`w-3 h-3 ${pickupsLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pickupsLoading ? (
            <div className="col-span-2 py-8 text-center text-xs text-gray-400">
              Loading recent pickups...
            </div>
          ) : recentPickups.length === 0 ? (
            <div className="col-span-2 py-10 text-center bg-gray-50/80 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800">
              <FaClock className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                No recent pickups recorded today.
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Verified pickup orders will appear here automatically.
              </p>
            </div>
          ) : (
            recentPickups.map((pickup, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                key={pickup.id}
                className="p-4 bg-gray-50/80 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700/80 rounded-2xl flex items-center gap-4 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all shadow-xs"
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/80 rounded-xl flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
                  <FaCheckCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                    {pickup.foodName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {pickup.pickupCode && (
                      <span className="font-mono text-[10px] font-black px-2 py-0.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-emerald-600 dark:text-emerald-400">
                        {pickup.pickupCode}
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-gray-400">
                      {formatDate(pickup.pickedUpAt, "p")}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Supplier Quick Guide */}
      <div className="p-6 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-3xl border border-emerald-200/70 dark:border-emerald-900/40">
        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-2 mb-3">
          <FaInfoCircle className="w-4 h-4 text-emerald-600" />
          <span>How Verification Works</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-emerald-900 dark:text-emerald-200">
          <div className="bg-white/80 dark:bg-slate-900/60 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
            <b className="text-emerald-600 block mb-1">1. Customer Arrives</b>
            Customer presents their Digital Pass or 8-digit pickup code upon arrival.
          </div>
          <div className="bg-white/80 dark:bg-slate-900/60 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
            <b className="text-emerald-600 block mb-1">2. Scan or Enter Code</b>
            Scan the QR with your camera or type the code in the box above.
          </div>
          <div className="bg-white/80 dark:bg-slate-900/60 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
            <b className="text-emerald-600 block mb-1">3. Hand Over Food</b>
            Once verified, hand over the packaged rescue food with confidence.
          </div>
        </div>
      </div>
    </div>
  );
}