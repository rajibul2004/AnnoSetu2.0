"use client";

import React, { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  FaExclamationTriangle,
  FaArrowLeft,
  FaQrcode,
  FaCopy,
  FaDownload,
  FaShare,
  FaDirections,
  FaStore,
  FaShieldAlt,
  FaHourglassHalf,
  FaCheck,
  FaHandsHelping,
  FaArrowRight,
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
import { formatPrice } from "@/lib/formatters";

export default function ConfirmReservationContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [copied, setCopied] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Cancel note & modal prompt
  const [cancelNote, setCancelNote] = useState("");
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  const { reservation, isLoading } = useReservationDetails(id);
  const { confirmReservation, isConfirming } = useConfirmReservationRequest();
  const { cancelReservation, isCancelling } = useCancelReservation();

  const actionLoading = isConfirming || isCancelling;

  const pickupCode = reservation?.pickupCode ?? null;

  const handleConfirm = async () => {
    if (!reservation) return;
    try {
      await confirmReservation(reservation.id);
    } catch (err: any) {
      // Toast handled by mutation hook
    }
  };

  const handleCancel = async () => {
    if (!reservation) return;
    try {
      await cancelReservation({ id: reservation.id, note: cancelNote });
      setShowCancelPrompt(false);
      router.push("/protected/dashboard");
    } catch (err: any) {
      // Toast handled by mutation hook
    }
  };

  const handleCopyCode = () => {
    if (!pickupCode) return;
    navigator.clipboard.writeText(pickupCode);
    setCopied(true);
    toast.success("Pickup code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAddress = () => {
    if (!reservation?.pickupAddress) return;
    navigator.clipboard.writeText(reservation.pickupAddress);
    setAddressCopied(true);
    toast.success("Pickup address copied!");
    setTimeout(() => setAddressCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `annosetu-pass-${pickupCode || id.slice(-6)}.png`;
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
          title: `AnnoSetu Pickup Pass: ${reservation?.food?.name}`,
          text: `Reservation for ${reservation?.food?.name}. Pickup Code: ${pickupCode}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(
          `Pickup code for ${reservation?.food?.name}: ${pickupCode}`
        );
        toast.success("Pickup code copied to clipboard!");
      }
    } catch {
      // User cancelled share
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <LoadingSpinner text="Loading reservation review..." />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-gray-200/80 dark:border-slate-800"
        >
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/60 rounded-3xl flex items-center justify-center mx-auto mb-5 text-rose-500 text-3xl">
            <FaExclamationTriangle />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
            Reservation Not Found
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            This reservation may have been removed or you do not have permission to view it.
          </p>
          <Button
            onClick={() => router.push("/protected/dashboard")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg cursor-pointer"
          >
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  const isConfirmed = reservation.status === "confirmed";
  const isPending = reservation.status === "pending";
  const isPickedUp = reservation.status === "picked_up";
  const isCancelled = reservation.status === "cancelled" || reservation.status === "expired";

  const mapsUrl = reservation.pickupAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(reservation.pickupAddress)}`
    : null;

  const primaryImage =
    reservation.food?.images && reservation.food.images.length > 0
      ? (reservation.food.images.find((img) => img.isPrimary) ?? reservation.food.images[0]).url
      : null;

  return (
    <div className="min-h-screen bg-transparent py-6 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header & Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <nav className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
            <button
              onClick={() => router.push("/protected/dashboard")}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              Dashboard
            </button>
            <span>/</span>
            <Link
              href={`/protected/food/${reservation.food?.id}/requests`}
              className="hover:text-emerald-600 transition-colors cursor-pointer truncate max-w-[120px] sm:max-w-none"
            >
              Requests
            </Link>
            <span>/</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate">
              Review #{reservation.id.slice(-6).toUpperCase()}
            </span>
          </nav>

          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-emerald-600 transition-colors shadow-xs cursor-pointer"
          >
            <FaArrowLeft className="w-3 h-3" />
            <span>Back</span>
          </button>
        </div>

        {/* Status Alert Banner */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 border backdrop-blur-xl shadow-lg relative overflow-hidden ${
            isConfirmed
              ? "bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : isPending
                ? "bg-amber-500/10 dark:bg-amber-950/40 border-amber-500/30 text-amber-700 dark:text-amber-300"
                : isPickedUp
                  ? "bg-blue-500/10 dark:bg-blue-950/40 border-blue-500/30 text-blue-700 dark:text-blue-300"
                  : "bg-rose-500/10 dark:bg-rose-950/40 border-rose-500/30 text-rose-700 dark:text-rose-300"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-lg sm:text-xl shrink-0 shadow-md ${
                  isConfirmed
                    ? "bg-emerald-500 text-white"
                    : isPending
                      ? "bg-amber-500 text-white"
                      : isPickedUp
                        ? "bg-blue-500 text-white"
                        : "bg-rose-500 text-white"
                }`}
              >
                {isConfirmed && <FaCheckCircle />}
                {isPending && <FaHourglassHalf />}
                {isPickedUp && <FaHandsHelping />}
                {isCancelled && <FaTimesCircle />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base sm:text-xl font-black tracking-tight">
                    {isConfirmed && "Reservation Confirmed"}
                    {isPending && "Pending Confirmation"}
                    {isPickedUp && "Order Collected & Completed"}
                    {isCancelled && "Reservation Cancelled"}
                  </h1>
                  {isPending && reservation.isSupplierView && (
                    <span className="px-2.5 py-0.5 bg-amber-500 text-white text-[10px] font-black uppercase rounded-full animate-pulse shadow-xs">
                      Action Required
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm mt-0.5 opacity-90 leading-relaxed max-w-2xl">
                  {isConfirmed && "Pickup code generated. The customer can present this code or QR pass at pickup."}
                  {isPending &&
                    (reservation.isSupplierView
                      ? "Review the request details below and click confirm to approve this pickup."
                      : "Awaiting approval from the food provider.")}
                  {isPickedUp && "This reservation was verified and picked up successfully."}
                  {isCancelled && "This reservation has been cancelled and is no longer valid."}
                </p>
              </div>
            </div>

            {isConfirmed && reservation.isSupplierView && (
              <Button
                onClick={() => router.push("/protected/reservation/pickup")}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0"
              >
                <FaQrcode />
                <span>Verify Pickup QR</span>
              </Button>
            )}
          </div>
        </motion.div>

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          {/* Main Details (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Food Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl p-5 sm:p-7 border border-gray-200/80 dark:border-slate-800"
            >
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100 dark:border-slate-800">
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <FaUtensils className="text-emerald-500" />
                  Food Information
                </h3>
                <Link
                  href={`/protected/food/${reservation.food?.id}`}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  View Food Details →
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-linear-to-br from-emerald-100 to-teal-50 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl overflow-hidden shrink-0 border border-gray-200/80 dark:border-slate-700 shadow-inner flex items-center justify-center">
                  {primaryImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={primaryImage}
                      alt={reservation.food?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FaUtensils className="w-8 h-8 text-emerald-500/50" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-xl font-black text-gray-900 dark:text-white truncate">
                    {reservation.food?.name}
                  </h4>
                  {reservation.food?.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {reservation.food.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <FaStore className="w-3 h-3" />
                      <span>{reservation.supplierName}</span>
                    </span>

                    {reservation.totalPrice === 0 ? (
                      <span className="px-3 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-black border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                        <FaShieldAlt className="w-3 h-3" />
                        <span>FREE RESCUE</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold">
                        {formatPrice(reservation.totalPrice)} Total
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-gray-100 dark:border-slate-800">
                <div className="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Portions
                  </div>
                  <div className="text-sm font-black text-gray-900 dark:text-white mt-0.5">
                    {reservation.quantity} {reservation.food?.quantityUnit}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Total Amount
                  </div>
                  <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {reservation.totalPrice === 0 ? "FREE" : formatPrice(reservation.totalPrice)}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Pickup Time
                  </div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white mt-0.5 truncate">
                    {new Date(reservation.pickupTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Expiry Deadline
                  </div>
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5 truncate">
                    {new Date(reservation.food?.expiresAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Customer Information (When viewed by Supplier) OR Supplier Info */}
            {reservation.isSupplierView ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-7 border border-gray-200/80 dark:border-slate-800"
              >
                <h3 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaUser className="text-blue-500" />
                  Customer Information
                </h3>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                    {reservation.reserver?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white">
                      {reservation.reserver?.name ?? "Customer"}
                    </h4>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      {reservation.totalOrders ?? 0} completed rescues on AnnoSetu
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-slate-800 text-xs">
                  {reservation.reserver?.phone && (
                    <a
                      href={`tel:${reservation.reserver.phone}`}
                      className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-emerald-600"
                    >
                      <FaPhone className="text-blue-500" />
                      <span>{reservation.reserver.phone}</span>
                    </a>
                  )}

                  {reservation.reserver?.email && (
                    <a
                      href={`mailto:${reservation.reserver.email}`}
                      className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-emerald-600"
                    >
                      <FaEnvelope className="text-blue-500" />
                      <span className="truncate">{reservation.reserver.email}</span>
                    </a>
                  )}

                  {reservation.reserver?.address && (
                    <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl flex items-center gap-2 text-gray-700 dark:text-gray-300 sm:col-span-2">
                      <FaMapMarkerAlt className="text-rose-500 shrink-0" />
                      <span className="truncate">{reservation.reserver.address}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-7 border border-gray-200/80 dark:border-slate-800"
              >
                <h3 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaStore className="text-emerald-500" />
                  Supplier Contact
                </h3>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                    {reservation.supplierName?.charAt(0)?.toUpperCase() ?? "S"}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white">
                      {reservation.supplierName}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Verified AnnoSetu Partner
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-slate-800 text-xs">
                  {reservation.supplierPhone && (
                    <a
                      href={`tel:${reservation.supplierPhone}`}
                      className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-emerald-600 font-semibold"
                    >
                      <FaPhone className="text-emerald-500" />
                      <span>{reservation.supplierPhone}</span>
                    </a>
                  )}

                  {reservation.supplierEmail && (
                    <a
                      href={`mailto:${reservation.supplierEmail}`}
                      className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-emerald-600 font-semibold"
                    >
                      <FaEnvelope className="text-blue-500" />
                      <span className="truncate">{reservation.supplierEmail}</span>
                    </a>
                  )}
                </div>
              </motion.div>
            )}

            {/* Pickup Location Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-7 border border-gray-200/80 dark:border-slate-800"
            >
              <h3 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaMapMarkerAlt className="text-rose-500" />
                Pickup Location & Address
              </h3>

              <div className="p-4 bg-linear-to-br from-gray-50 to-blue-50/30 dark:from-slate-800/60 dark:to-slate-800/30 rounded-2xl border border-gray-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-white leading-relaxed">
                    {reservation.pickupAddress || "Address provided by supplier"}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Present the secret pickup code upon handover.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {addressCopied ? <FaCheck className="text-emerald-500" /> : <FaCopy />}
                    <span>{addressCopied ? "Copied" : "Copy"}</span>
                  </button>

                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <FaDirections />
                      <span>Directions</span>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Actions & Ticket Status */}
          <div className="lg:col-span-1 space-y-6">
            {/* SUPPLIER ACTIONS CARD (WHEN PENDING) */}
            {isPending && reservation.isSupplierView && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-7 border border-amber-200 dark:border-amber-900/60 sticky top-24 space-y-4"
              >
                <div className="text-center pb-2">
                  <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/60 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl">
                    <FaHourglassHalf className="animate-spin" />
                  </div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">
                    Supplier Confirmation
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Accept this order to generate the customer&apos;s secret pickup pass.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    onClick={handleConfirm}
                    loading={actionLoading}
                    disabled={actionLoading}
                    fullWidth
                    variant="secondary"
                    className="bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black py-3 rounded-2xl shadow-lg shadow-emerald-600/20 text-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FaCheckCircle />
                    <span>Confirm & Accept Order</span>
                  </Button>

                  {!showCancelPrompt ? (
                    <Button
                      onClick={() => setShowCancelPrompt(true)}
                      disabled={actionLoading}
                      variant="outline"
                      fullWidth
                      className="border-rose-300 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold py-2.5 rounded-2xl text-xs cursor-pointer flex items-center justify-center gap-2"
                    >
                      <FaTimesCircle />
                      <span>Decline Request</span>
                    </Button>
                  ) : (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 bg-rose-50 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-200 dark:border-rose-800"
                      >
                        <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                          Provide reason for cancellation:
                        </p>
                        <textarea
                          value={cancelNote}
                          onChange={(e) => setCancelNote(e.target.value)}
                          placeholder="e.g. Out of stock, kitchen closed..."
                          className="w-full text-xs p-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white resize-none"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowCancelPrompt(false)}
                            className="flex-1 py-2 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 cursor-pointer"
                          >
                            Keep
                          </button>
                          <button
                            type="button"
                            onClick={handleCancel}
                            disabled={actionLoading}
                            className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-xs cursor-pointer"
                          >
                            {isCancelling ? "Cancelling..." : "Confirm Decline"}
                          </button>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>

                <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/40 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <FaClock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>The customer will receive immediate push notifications with the pickup code.</span>
                </div>
              </motion.div>
            )}

            {/* CONSUMER WAITING NOTICE (WHEN PENDING) */}
            {isPending && !reservation.isSupplierView && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-7 border border-amber-200 dark:border-amber-900/60 sticky top-24 text-center space-y-4"
              >
                <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/60 text-amber-500 rounded-2xl flex items-center justify-center mx-auto text-xl">
                  <FaHourglassHalf className="animate-spin" />
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  Awaiting Confirmation
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Your reservation request is being reviewed by <b>{reservation.supplierName}</b>. Once approved, your QR pass will appear here.
                </p>

                <div className="pt-2">
                  <Button
                    onClick={handleCancel}
                    loading={actionLoading}
                    variant="outline"
                    fullWidth
                    className="border-rose-300 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold py-2.5 rounded-2xl text-xs cursor-pointer"
                  >
                    Cancel Request
                  </Button>
                </div>
              </motion.div>
            )}

            {/* DIGITAL PASS TICKET (WHEN CONFIRMED) */}
            {isConfirmed && pickupCode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-emerald-300 dark:border-emerald-800/80 sticky top-24"
              >
                <div className="h-2.5 w-full bg-linear-to-r from-emerald-500 via-teal-500 to-green-500" />

                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <FaQrcode />
                      <span>Pickup Pass</span>
                    </h3>
                    <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase rounded-full">
                      Ready For Pickup
                    </span>
                  </div>

                  {/* QR Code Container */}
                  <div ref={qrRef} className="flex justify-center mb-5">
                    <div className="p-3 bg-white rounded-2xl shadow-md border border-gray-100">
                      <QRCodeCanvas
                        value={JSON.stringify({
                          id: reservation.id,
                          code: pickupCode,
                          food: reservation.food?.name,
                        })}
                        size={170}
                        level="H"
                        includeMargin
                      />
                    </div>
                  </div>

                  {/* Perforated Divider */}
                  <div className="relative py-4 border-y border-dashed border-gray-200 dark:border-slate-800 text-center">
                    <div className="absolute -left-9 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-50 dark:bg-slate-950 border-r border-gray-200 dark:border-slate-800" />
                    <div className="absolute -right-9 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-50 dark:bg-slate-950 border-l border-gray-200 dark:border-slate-800" />

                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                      Secret Pickup Code
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl sm:text-3xl font-mono font-black tracking-[0.2em] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-1.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-inner">
                        {pickupCode}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="p-3 rounded-2xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition-colors shadow-xs cursor-pointer"
                        aria-label="Copy pickup code"
                      >
                        {copied ? <FaCheck className="text-emerald-500" /> : <FaCopy />}
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2.5 mt-5">
                    <button
                      type="button"
                      onClick={handleDownloadQR}
                      className="flex-1 py-2.5 px-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FaDownload className="text-emerald-500" />
                      <span>Save QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="flex-1 py-2.5 px-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FaShare className="text-teal-500" />
                      <span>Share Pass</span>
                    </button>
                  </div>

                  {reservation.isSupplierView && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                      <Button
                        onClick={() => router.push("/protected/reservation/pickup")}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        <FaQrcode />
                        <span>Verify Pickup at Handover</span>
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Quick Summary Card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-gray-200/60 dark:border-slate-800 text-xs space-y-2 text-gray-600 dark:text-gray-300"
            >
              <div className="flex justify-between">
                <span>Reservation Ref:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">
                  #{reservation.id.slice(-8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Created Date:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {new Date(reservation.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-black capitalize text-emerald-600 dark:text-emerald-400">
                  {reservation.status}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
