"use client";

import React, { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaUtensils,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaRupeeSign,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaArrowLeft,
  FaQrcode,
  FaCopy,
  FaDownload,
  FaShare,
} from "react-icons/fa";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import toast from "react-hot-toast";
import { QRCodeCanvas } from "qrcode.react";
import {
  useReservationDetails,
  useConfirmReservationRequest,
  useCancelReservation,
} from "@/hooks/useReservationQueries";

export default function ConfirmReservationContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Use shared React Query hooks so cache stays consistent with the rest of
  // the app (e.g. dashboard reservation lists auto-refresh after an action).
  const { reservation, isLoading } = useReservationDetails(id);
  const { confirmReservation, isConfirming } = useConfirmReservationRequest();
  const { cancelReservation, isCancelling } = useCancelReservation();

  const actionLoading = isConfirming || isCancelling;

  // The real pickup code is generated server-side only when the reservation
  // is confirmed. Never generate a fake code on the client — it's misleading
  // and is never persisted anywhere.
  const pickupCode = reservation?.pickupCode ?? null;

  const handleConfirm = async () => {
    if (!reservation) return;
    await confirmReservation(reservation.id).catch(() => {});
  };

  const handleCancel = async () => {
    if (!reservation) return;
    await cancelReservation(reservation.id).catch(() => {});
    router.push("/protected/dashboard/restaurant");
  };

  const handleCopyCode = () => {
    if (!pickupCode) return;
    navigator.clipboard.writeText(pickupCode);
    setCopied(true);
    toast.success("Pickup code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `pickup-${pickupCode}.png`;
      link.href = url;
      link.click();
      toast.success("QR code downloaded!");
    }
  };

  const handleShare = async () => {
    if (!pickupCode) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Pickup Code",
          text: `Pickup code: ${pickupCode}`,
        });
      } else {
        await navigator.clipboard.writeText(`Pickup code: ${pickupCode}`);
        toast.success("Pickup code copied to clipboard!");
      }
    } catch {
      // User cancelled share — no error toast needed
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <LoadingSpinner text="Loading reservation details..." />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Reservation not found
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            It may have been removed, or you don&apos;t have access to it.
          </p>
          <Button onClick={() => router.push("/protected/dashboard/restaurant")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center cursor-pointer text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-300 mb-6 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Back to Previous
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Reservation Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Banner */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-6 ${
                reservation.status === "confirmed"
                  ? "bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-700"
                  : reservation.status === "pending"
                    ? "bg-yellow-50 dark:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-700"
                    : "bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {reservation.status === "confirmed" ? (
                    <FaCheckCircle className="w-8 h-8 text-green-600 dark:text-green-300" />
                  ) : reservation.status === "pending" ? (
                    <FaClock className="w-8 h-8 text-yellow-600 dark:text-yellow-300" />
                  ) : (
                    <FaTimesCircle className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                      {reservation.status === "confirmed"
                        ? "Reservation Confirmed"
                        : reservation.status === "pending"
                          ? "Pending Confirmation"
                          : "Reservation Cancelled"}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {reservation.status === "confirmed"
                        ? "Pickup code generated and ready for the customer"
                        : reservation.status === "pending"
                          ? "Review details and confirm or cancel below"
                          : "This reservation has been cancelled"}
                    </p>
                  </div>
                </div>
                {reservation.status === "pending" && (
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 text-sm font-medium rounded-full animate-pulse">
                    Action Required
                  </span>
                )}
              </div>
            </motion.div>

            {/* Food Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaUtensils className="text-green-600 dark:text-green-300" />
                Food Details
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-100 dark:from-slate-800 to-amber-100 dark:to-gray-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                    {reservation.food?.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={reservation.food.images[0].url}
                        alt={reservation.food.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FaUtensils className="w-8 h-8 text-primary-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {reservation.food?.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {reservation.food?.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Quantity</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {reservation.quantity} {reservation.food?.quantityUnit}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Price</p>
                    <p className="font-semibold text-green-600 dark:text-green-300 flex items-center">
                      <FaRupeeSign className="w-4 h-4" />
                      {reservation.totalPrice}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pickup Time</p>
                    <p className="font-semibold text-gray-900 dark:text-white flex items-center">
                      <FaClock className="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" />
                      {new Date(reservation.pickupTime).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Expires</p>
                    <p className="font-semibold text-orange-600 dark:text-orange-300">
                      {reservation.food?.expiresAt
                        ? new Date(reservation.food.expiresAt).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Customer Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaUser className="text-green-600 dark:text-green-300" />
                Customer Information
              </h3>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 dark:from-blue-800 to-purple-100 dark:to-purple-800 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                      {reservation.reserver?.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {reservation.reserver?.name ?? "Unknown Customer"}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {reservation.totalOrders ?? 0} completed orders
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  {reservation.reserver?.phone && (
                    <div className="flex items-center gap-3">
                      <FaPhone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {reservation.reserver.phone}
                      </span>
                    </div>
                  )}
                  {reservation.reserver?.email && (
                    <div className="flex items-center gap-3">
                      <FaEnvelope className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {reservation.reserver.email}
                      </span>
                    </div>
                  )}
                  {reservation.reserver?.address && (
                    <div className="flex items-center gap-3 md:col-span-2">
                      <FaMapMarkerAlt className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {reservation.reserver.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="card rounded-xl p-4"
            >
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FaCalendarAlt className="text-green-600 dark:text-green-300" />
                Quick Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Reservation ID:</span>
                  <span className="font-mono font-medium">{reservation.id.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Created:</span>
                  <span>{new Date(reservation.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Status:</span>
                  <span
                    className={`font-medium capitalize ${
                      reservation.status === "confirmed"
                        ? "text-green-600 dark:text-green-300"
                        : reservation.status === "pending"
                          ? "text-yellow-600 dark:text-yellow-300"
                          : "text-red-600 dark:text-red-300"
                    }`}
                  >
                    {reservation.status}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column — Actions & Pickup Code */}
          <div className="lg:col-span-1 space-y-6">
            {/* Actions Card — only while pending */}
            {reservation.status === "pending" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card p-6 sticky top-4"
              >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Actions
                </h3>

                <div className="space-y-4">
                  <Button
                    onClick={handleConfirm}
                    loading={actionLoading}
                    disabled={actionLoading}
                    fullWidth
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <FaCheckCircle className="mr-2" />
                    Confirm Reservation
                  </Button>

                  <Button
                    onClick={handleCancel}
                    loading={actionLoading}
                    disabled={actionLoading}
                    variant="outline"
                    fullWidth
                    className="border-red-300 dark:bg-gray-800 bg-white dark:border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40"
                  >
                    <FaTimesCircle className="mr-2" />
                    Cancel Reservation
                  </Button>
                </div>

                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/40 rounded-xl">
                  <p className="text-xs text-yellow-800 dark:text-yellow-100">
                    ⏰ Customer will be notified immediately after confirmation.
                    A unique pickup code will be generated upon confirmation.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Pickup Code Card — shown after confirmation */}
            {reservation.status === "confirmed" && pickupCode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card p-6 sticky top-4"
              >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaQrcode className="text-green-600 dark:text-green-300" />
                  Pickup Code
                </h3>

                {/* QR Code */}
                <div ref={qrRef} className="flex justify-center mb-4">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <QRCodeCanvas
                      value={JSON.stringify({
                        reservationId: reservation.id,
                        pickupCode,
                        foodName: reservation.food?.name,
                      })}
                      size={180}
                      level="H"
                      includeMargin
                    />
                  </div>
                </div>

                {/* Code Display */}
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Pickup Code
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-mono font-bold text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-900/40 px-4 py-2 rounded-lg tracking-widest">
                      {pickupCode}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
                      aria-label="Copy pickup code"
                    >
                      {copied ? (
                        <FaCheckCircle className="w-5 h-5 text-green-600 dark:text-green-300" />
                      ) : (
                        <FaCopy className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>

                {/* QR Actions */}
                <div className="flex justify-center gap-3 mb-4">
                  <button
                    onClick={handleDownloadQR}
                    className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-900 transition-colors"
                  >
                    <FaDownload className="w-4 h-4" />
                    <span className="text-sm">Download QR</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-900 transition-colors"
                  >
                    <FaShare className="w-4 h-4" />
                    <span className="text-sm">Share</span>
                  </button>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Customer has been notified
                  </p>
                  {reservation.food?.expiresAt && (
                    <p className="text-xs text-green-600 dark:text-green-300 text-center mt-2">
                      ✓ Valid until{" "}
                      {new Date(reservation.food.expiresAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Pending pickup code notice */}
            {reservation.status === "pending" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="card p-6 text-center border-dashed border-2 border-gray-200 dark:border-gray-700"
              >
                <FaQrcode className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pickup code not yet generated
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  A unique code will be created once you confirm the reservation
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
