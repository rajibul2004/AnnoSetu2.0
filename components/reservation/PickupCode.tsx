"use client";
 
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaQrcode,
  FaCopy,
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaShare,
  FaDownload,
  FaPrint,
} from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import toast from "react-hot-toast";
import type { ReservationDetailDTO } from "@/types/reservation";
 
interface PickupCodeProps {
  reservation: ReservationDetailDTO;
}
 
function computeTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}
 
export default function PickupCode({ reservation }: PickupCodeProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  // Computed immediately on mount below, instead of the original's
  // useState('') that stayed blank for up to a full minute until the
  // first 60-second interval tick fired.
  const [timeRemaining, setTimeRemaining] = useState(() => computeTimeRemaining(reservation.food.expiresAt));
  const qrWrapperRef = useRef<HTMLDivElement>(null);
 
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(computeTimeRemaining(reservation.food.expiresAt));
    }, 60000);
    return () => clearInterval(timer);
  }, [reservation.food.expiresAt]);
 
  const handleCopyCode = () => {
    if (!reservation.pickupCode) return;
    navigator.clipboard.writeText(reservation.pickupCode);
    setCopied(true);
    toast.success("Pickup code copied!");
    setTimeout(() => setCopied(false), 2000);
  };
 
  const getCanvasDataUrl = (): string | null => {
    const canvas = qrWrapperRef.current?.querySelector("canvas");
    return canvas ? canvas.toDataURL("image/png") : null;
  };
 
  const handleDownloadQR = () => {
    const url = getCanvasDataUrl();
    if (!url) return;
    const link = document.createElement("a");
    link.download = `pickup-${reservation.pickupCode}.png`;
    link.href = url;
    link.click();
    toast.success("QR code downloaded!");
  };
 
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Food Pickup Code",
          text: `Your pickup code: ${reservation.pickupCode}`,
          url: window.location.href,
        });
      } catch {
        // share sheet dismissed — nothing to do
      }
    } else {
      handleCopyCode();
    }
  };
 
  const handlePrint = () => {
    const qrDataUrl = getCanvasDataUrl();
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Pickup Code - Annosetu</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 40px; }
            .code { font-size: 32px; letter-spacing: 5px; margin: 20px; }
            .qr { margin: 20px; }
            .qr img { width: 200px; height: 200px; }
          </style>
        </head>
        <body>
          <h2>Annosetu Pickup Code</h2>
          <div class="code">${reservation.pickupCode}</div>
          ${qrDataUrl ? `<div class="qr"><img src="${qrDataUrl}" alt="QR code" /></div>` : ""}
          <p>Food: ${reservation.food.name}</p>
          <p>Quantity: ${reservation.quantity}</p>
          <p>Pickup by: ${new Date(reservation.food.expiresAt).toLocaleString()}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };
 
  const statusLabel =
    reservation.status === "picked_up"
      ? "✓ Picked Up"
      : reservation.status === "confirmed"
        ? "🕒 Ready for Pickup"
        : "⏳ Awaiting Confirmation";
  const statusClass =
    reservation.status === "picked_up"
      ? "bg-green-100 text-green-800"
      : reservation.status === "confirmed"
        ? "bg-yellow-100 text-yellow-800"
        : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100";
 
  return (
    <div className="bg-transparent overflow-hidden">
      <div className="bg-linear-to-b to-lime-200 dark:to-slate-800 p-6 text-gray-900 dark:text-white">
        <h3 className="text-xl font-bold mb-2">Pickup Details</h3>
        <p className="opacity-90">Show this code at the pickup location</p>
      </div>
 
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Pickup Code</div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-mono font-bold text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-900 px-6 py-3 rounded-xl border-2 border-green-200 dark:border-green-700">
              {reservation.pickupCode ?? "Not yet generated"}
            </span>
            {reservation.pickupCode && (
              <button
                onClick={handleCopyCode}
                className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                {copied ? (
                  <FaCheckCircle className="w-5 h-5 text-green-600 dark:text-green-300" />
                ) : (
                  <FaCopy className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>
            )}
          </div>
        </div>
 
        <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/40 rounded-xl">
          <FaClock
            className={`w-4 h-4 ${timeRemaining === "Expired" ? "text-red-600 dark:text-red-300" : "text-yellow-600 dark:text-yellow-300"}`}
          />
          <span className={timeRemaining === "Expired" ? "text-red-600 dark:text-red-300" : "text-yellow-700 dark:text-yellow-200"}>
            {timeRemaining === "Expired" ? "Pickup window expired" : `Pickup by: ${timeRemaining}`}
          </span>
        </div>
 
        {reservation.pickupCode && (
          <div className="mb-6">
            <button
              onClick={() => setShowQR((v) => !v)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FaQrcode className="w-5 h-5 text-green-600 dark:text-green-300" />
                <span className="font-medium">Show QR Code</span>
              </div>
              <span className="text-green-600 dark:text-green-300">{showQR ? "−" : "+"}</span>
            </button>
 
            <AnimatePresence>
              {showQR && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 p-6 bg-linear-to-br from-gray-50 dark:from-slate-900 to-gray-100 dark:to-slate-800 rounded-xl text-center">
                    <div ref={qrWrapperRef} className="inline-block p-4 card">
                      <QRCodeCanvas
                        value={JSON.stringify({
                          reservationId: reservation.id,
                          pickupCode: reservation.pickupCode,
                          foodName: reservation.food.name,
                        })}
                        size={200}
                        level="H"
                        includeMargin
                      />
                    </div>
 
                    <div className="flex justify-center gap-3 mt-4">
                      <button onClick={handleDownloadQR} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Download QR">
                        <FaDownload className="w-4 h-4 text-gray-600" />
                      </button>
                      <button onClick={handlePrint} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Print">
                        <FaPrint className="w-4 h-4 text-gray-600" />
                      </button>
                      <button onClick={handleShare} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Share">
                        <FaShare className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
 
        {/*
          The original's OTP verification block here was gated behind a
          commented-out `{reservation.otp && (...)}` check (so it always
          rendered regardless), had no real submit target with schema
          support, and duplicated the pickup-code concept this schema
          already has. Dropped rather than wired to nothing — the
          Reservation model has no `otp` field at all.
        */}
 
        <div className="border-t border-gray-200 dark:border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Pickup Instructions</h4>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <p className="flex items-start gap-2">
              <span className="w-5 h-5 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-xs text-green-600 dark:text-green-300 mt-0.5">
                1
              </span>
              Show this code or QR at the pickup location
            </p>
            <p className="flex items-start gap-2">
              <span className="w-5 h-5 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-xs text-green-600 dark:text-green-300 mt-0.5">
                2
              </span>
              Bring your ID for verification
            </p>
            <p className="flex items-start gap-2">
              <span className="w-5 h-5 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-xs text-green-600 dark:text-green-300 mt-0.5">
                3
              </span>
              Pickup within the specified time window
            </p>
          </div>
        </div>
 
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/40 rounded-xl">
          <div className="flex items-start gap-3">
            <FaMapMarkerAlt className="w-5 h-5 text-blue-600 dark:text-blue-300 mt-0.5" />
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-1">Pickup Location</h5>
              <p className="text-sm text-gray-700 dark:text-gray-200">{reservation.pickupAddress}</p>
            </div>
          </div>
        </div>
 
        {/*
          Real supplier contact instead of the original's hardcoded
          phone/email (which looked like a real developer's actual
          personal contact info left in as test data).
        */}
        <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FaPhone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-sm">{reservation.supplierPhone || "Not provided"}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaEnvelope className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-sm">{reservation.supplierEmail}</span>
          </div>
        </div>
 
        <div className="mt-4 flex justify-center">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusClass}`}>{statusLabel}</span>
        </div>
      </div>
    </div>
  );
}
 