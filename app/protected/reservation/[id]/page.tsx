"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  FaExclamationTriangle,
  FaArrowLeft,
  FaQrcode,
  FaCopy,
  FaDownload,
  FaShare,
  FaDirections,
  FaStore,
  FaBuilding,
  FaHandHoldingHeart,
  FaShieldAlt,
  FaHourglassHalf,
  FaCheck,
  FaCommentDots,
} from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import toast from "react-hot-toast";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ReservationChatModal from "@/components/chat/ReservationChatModal";
import {
  useReservationDetails,
  useConfirmReservationRequest,
  useCancelReservation,
} from "@/hooks/useReservationQueries";
import { formatPrice } from "@/lib/formatters";

export default function ReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const qrWrapperRef = useRef<HTMLDivElement>(null);

  const { reservation, isLoading } = useReservationDetails(params.id);
  const { confirmReservation, isConfirming } = useConfirmReservationRequest();
  const { cancelReservation, isCancelling } = useCancelReservation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <LoadingSpinner text="Loading reservation ticket..." />
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
            This reservation may have been deleted, or you do not have permission to view it.
          </p>
          <Button
            onClick={() => router.push("/protected/dashboard")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg cursor-pointer"
          >
            Go to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  const handleConfirm = async () => {
    try {
      await confirmReservation(reservation.id);
      toast.success("Reservation confirmed successfully! Pickup code generated.");
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm reservation");
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel / decline this reservation?")) return;
    try {
      await cancelReservation({ id: reservation.id });
      toast.success("Reservation cancelled.");
      router.push("/protected/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel reservation");
    }
  };

  const handleCopyCode = () => {
    if (!reservation.pickupCode) return;
    navigator.clipboard.writeText(reservation.pickupCode);
    setCopied(true);
    toast.success("Pickup code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAddress = () => {
    if (!reservation.pickupAddress) return;
    navigator.clipboard.writeText(reservation.pickupAddress);
    setAddressCopied(true);
    toast.success("Pickup address copied!");
    setTimeout(() => setAddressCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const canvas = qrWrapperRef.current?.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `annosetu-pickup-${reservation.pickupCode || reservation.id.slice(-6)}.png`;
      link.href = url;
      link.click();
      toast.success("QR code downloaded!");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `AnnoSetu Pickup Pass: ${reservation.food.name}`,
        text: `AnnoSetu Food Reservation for ${reservation.food.name}. Pickup Code: ${reservation.pickupCode || "Pending"}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Reservation link copied to clipboard!");
    }
  };

  const mapsUrl = reservation.pickupAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(reservation.pickupAddress)}`
    : null;

  const isConfirmed = reservation.status === "confirmed";
  const isPending = reservation.status === "pending";
  const isPickedUp = reservation.status === "picked_up";
  const isCancelled = reservation.status === "cancelled" || reservation.status === "expired";

  const statusMeta = (() => {
    switch (reservation.status) {
      case "confirmed":
        return {
          title: "Reservation Confirmed",
          subtitle: "Your pickup ticket and secret code are ready. Present this upon collection.",
          bg: "bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
          badgeBg: "bg-emerald-500 text-white",
          icon: FaCheckCircle,
        };
      case "pending":
        return {
          title: "Pending Supplier Confirmation",
          subtitle: reservation.isSupplierView
            ? "Review the request below and click confirm to generate a pickup code."
            : "Waiting for the supplier to accept your request. We'll generate your pickup code once approved.",
          bg: "bg-amber-500/10 dark:bg-amber-950/40 border-amber-500/30 text-amber-700 dark:text-amber-300",
          badgeBg: "bg-amber-500 text-white",
          icon: FaHourglassHalf,
        };
      case "picked_up":
        return {
          title: "Food Collected Successfully",
          subtitle: "This food has been collected and verified. Thank you for rescuing surplus food!",
          bg: "bg-blue-500/10 dark:bg-blue-950/40 border-blue-500/30 text-blue-700 dark:text-blue-300",
          badgeBg: "bg-blue-500 text-white",
          icon: FaCheckCircle,
        };
      default:
        return {
          title: "Reservation Cancelled",
          subtitle: "This reservation is no longer active.",
          bg: "bg-rose-500/10 dark:bg-rose-950/40 border-rose-500/30 text-rose-700 dark:text-rose-300",
          badgeBg: "bg-rose-500 text-white",
          icon: FaTimesCircle,
        };
    }
  })();

  const primaryImage =
    reservation.food.images && reservation.food.images.length > 0
      ? (reservation.food.images.find((img) => img.isPrimary) ?? reservation.food.images[0]).url
      : null;

  return (
    <div className="min-h-screen bg-transparent py-6 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <nav className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
            <button
              onClick={() => router.push("/protected/dashboard")}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              Dashboard
            </button>
            <span>/</span>
            <span className="text-gray-400 dark:text-gray-500">Reservations</span>
            <span>/</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[120px] sm:max-w-xs">
              Ticket #{reservation.id.slice(-6).toUpperCase()}
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
          className={`rounded-3xl p-5 sm:p-6 mb-8 border backdrop-blur-xl shadow-lg relative overflow-hidden ${statusMeta.bg}`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start sm:items-center gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-md ${statusMeta.badgeBg}`}
              >
                <statusMeta.icon />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight">
                    {statusMeta.title}
                  </h1>
                  {isPending && reservation.isSupplierView && (
                    <span className="px-2.5 py-0.5 bg-amber-500 text-white text-[10px] font-black uppercase rounded-full animate-pulse shadow-xs">
                      Action Required
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm mt-0.5 opacity-90 leading-relaxed max-w-2xl">
                  {statusMeta.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleShare}
                className="px-3.5 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <FaShare className="w-3 h-3" />
                <span>Share Ticket</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Columns: Food Details, Pickup Address, Supplier/Customer Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Food Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-7 border border-gray-200/80 dark:border-slate-800"
            >
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100 dark:border-slate-800">
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <FaUtensils className="text-emerald-500" />
                  Reserved Food Details
                </h3>

                <Link
                  href={`/protected/food/${reservation.food.id}`}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  View Food Listing →
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-linear-to-br from-emerald-100 to-teal-50 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl overflow-hidden shrink-0 border border-gray-200/80 dark:border-slate-700 shadow-inner flex items-center justify-center">
                  {primaryImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={primaryImage}
                      alt={reservation.food.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FaUtensils className="w-8 h-8 text-emerald-500/50" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-xl font-black text-gray-900 dark:text-white truncate">
                    {reservation.food.name}
                  </h4>
                  {reservation.food.description && (
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
                        <FaHandHoldingHeart className="w-3 h-3" />
                        <span>FREE DONATION</span>
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
                    {reservation.quantity} {reservation.food.quantityUnit}
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
                    {new Date(reservation.food.expiresAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Pickup Location Details */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-7 border border-gray-200/80 dark:border-slate-800"
            >
              <h3 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaMapMarkerAlt className="text-rose-500" />
                Pickup Location & Address
              </h3>

              <div className="p-4 bg-linear-to-br from-gray-50 to-blue-50/30 dark:from-slate-800/60 dark:to-slate-800/30 rounded-2xl border border-gray-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-white leading-relaxed">
                    {reservation.pickupAddress || "Pickup address provided by supplier"}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Please arrive during the designated pickup window with your pickup code.
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

            {/* Reserver Info (Shown to Supplier) OR Supplier Info (Shown to Reserver) */}
            {reservation.isSupplierView ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-7 border border-gray-200/80 dark:border-slate-800"
              >
                <h3 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaUser className="text-emerald-500" />
                  Customer Information
                </h3>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                    {reservation.reserver.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white">
                      {reservation.reserver.name}
                    </h4>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      {reservation.totalOrders} completed rescues on AnnoSetu
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsChatOpen(true)}
                    className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl flex items-center justify-center gap-2 font-bold cursor-pointer transition-colors border border-emerald-200 dark:border-emerald-800/80"
                  >
                    <FaCommentDots className="text-emerald-600 dark:text-emerald-400" />
                    <span>Chat with Customer</span>
                  </button>

                  {reservation.reserver.phone && (
                    <a
                      href={`tel:${reservation.reserver.phone}`}
                      className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 hover:text-emerald-600"
                    >
                      <FaPhone className="text-emerald-500" />
                      <span>{reservation.reserver.phone}</span>
                    </a>
                  )}

                  <a
                    href={`mailto:${reservation.reserver.email}`}
                    className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 hover:text-emerald-600 truncate"
                  >
                    <FaEnvelope className="text-blue-500" />
                    <span className="truncate">{reservation.reserver.email}</span>
                  </a>
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
                  Supplier Contact & Support
                </h3>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                    {reservation.supplierName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white">
                      {reservation.supplierName}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Verified AnnoSetu Food Partner
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsChatOpen(true)}
                    className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl flex items-center justify-center gap-2 font-bold cursor-pointer transition-colors border border-emerald-200 dark:border-emerald-800/80"
                  >
                    <FaCommentDots className="text-emerald-600 dark:text-emerald-400" />
                    <span>Chat with Supplier</span>
                  </button>

                  {reservation.supplierPhone && (
                    <a
                      href={`tel:${reservation.supplierPhone}`}
                      className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 hover:text-emerald-600 font-semibold"
                    >
                      <FaPhone className="text-emerald-500" />
                      <span>Call Supplier</span>
                    </a>
                  )}

                  {reservation.supplierEmail && (
                    <a
                      href={`mailto:${reservation.supplierEmail}`}
                      className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 hover:text-emerald-600 font-semibold"
                    >
                      <FaEnvelope className="text-blue-500" />
                      <span>Email Supplier</span>
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column: Digital Boarding Pass Ticket / Supplier Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* SUPPLIER ACTION CARD (WHEN PENDING) */}
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
                    Pending Confirmation
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Accept this request to confirm portions and generate the customer&apos;s pickup pass.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <Button
                    onClick={handleConfirm}
                    loading={isConfirming}
                    disabled={isConfirming || isCancelling}
                    fullWidth
                    className="bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black py-3 rounded-2xl shadow-lg shadow-emerald-600/20 text-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FaCheckCircle />
                    <span>Confirm Reservation</span>
                  </Button>

                  <Button
                    onClick={handleCancel}
                    loading={isCancelling}
                    disabled={isConfirming || isCancelling}
                    variant="outline"
                    fullWidth
                    className="border-rose-300 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold py-2.5 rounded-2xl text-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FaTimesCircle />
                    <span>Decline Request</span>
                  </Button>
                </div>
              </motion.div>
            )}

            {/* CONSUMER WAITING CARD (WHEN PENDING) */}
            {isPending && !reservation.isSupplierView && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-7 border border-amber-200 dark:border-amber-900/60 sticky top-24 text-center space-y-4"
              >
                <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/60 text-amber-500 rounded-2xl flex items-center justify-center mx-auto text-xl">
                  <FaHourglassHalf />
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  Request Sent to Supplier
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Your reservation request has been received by <b>{reservation.supplierName}</b>. Once confirmed, your unique QR pickup ticket will be unlocked here.
                </p>

                <div className="pt-2">
                  <Button
                    onClick={handleCancel}
                    loading={isCancelling}
                    variant="outline"
                    fullWidth
                    className="border-rose-300 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold py-2.5 rounded-2xl text-xs cursor-pointer"
                  >
                    Cancel Reservation
                  </Button>
                </div>
              </motion.div>
            )}

            {/* DIGITAL PICKUP PASS TICKET (WHEN CONFIRMED OR PICKED UP) */}
            {(isConfirmed || isPickedUp) && reservation.pickupCode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-emerald-300 dark:border-emerald-800/80 sticky top-24"
              >
                {/* Ticket Top Gradient Line */}
                <div className="h-2.5 w-full bg-linear-to-r from-emerald-500 via-teal-500 to-green-500" />

                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <FaQrcode />
                      <span>AnnoSetu Pickup Pass</span>
                    </h3>
                    <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase rounded-full">
                      {isPickedUp ? "Collected" : "Active"}
                    </span>
                  </div>

                  {/* QR Code Container */}
                  <div ref={qrWrapperRef} className="flex justify-center mb-5">
                    <div className="p-3 bg-white rounded-2xl shadow-md border border-gray-100">
                      <QRCodeCanvas
                        value={JSON.stringify({
                          id: reservation.id,
                          code: reservation.pickupCode,
                          food: reservation.food.name,
                        })}
                        size={170}
                        level="H"
                        includeMargin
                      />
                    </div>
                  </div>

                  {/* Perforated Divider */}
                  <div className="relative py-4 border-y border-dashed border-gray-200 dark:border-slate-800 text-center">
                    {/* Left Notch */}
                    <div className="absolute -left-9 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-50 dark:bg-slate-950 border-r border-gray-200 dark:border-slate-800" />
                    {/* Right Notch */}
                    <div className="absolute -right-9 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-50 dark:bg-slate-950 border-l border-gray-200 dark:border-slate-800" />

                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                      Secret Pickup Code
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl sm:text-3xl font-mono font-black tracking-[0.2em] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-1.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-inner">
                        {reservation.pickupCode}
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

                  {/* Download & Share Actions */}
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

                  <div className="mt-4 text-center">
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
                      <FaShieldAlt className="text-emerald-500" />
                      Present this pass to the supplier at pickup
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Summary Card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
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

      {/* Slide-over In-Context Pickup Chat Modal */}
      <ReservationChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        reservationId={reservation.id}
      />
    </div>
  );
}