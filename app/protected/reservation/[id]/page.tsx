"use client";
 
import { useRef, useState } from "react";
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
  FaExclamationTriangle,
  FaArrowLeft,
  FaQrcode,
  FaCopy,
  FaDownload,
  FaShare,
} from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import toast from "react-hot-toast";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  useReservationDetails,
  useConfirmReservationRequest,
  useCancelReservation,
} from "@/hooks/useReservationQueries";
 
export default function ReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
 
  const [copied, setCopied] = useState(false);
  const qrWrapperRef = useRef<HTMLDivElement>(null);
 
  const { reservation, isLoading } = useReservationDetails(params.id);
  const { confirmReservation, isConfirming } = useConfirmReservationRequest();
  const { cancelReservation, isCancelling } = useCancelReservation();
 
  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <LoadingSpinner text="Loading reservation details..." />
      </div>
    );
  }
 
  // The original had this guard entirely commented out, so a missing or
  // inaccessible reservation would crash on `reservation.status` etc.
  if (!reservation) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <div className="text-center">
          <FaExclamationTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Reservation not found
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            It may have been removed, or you don&apos;t have access to it.
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }
 
  const handleConfirm = async () => {
    await confirmReservation(reservation.id).catch(() => {});
  };
 
  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    await cancelReservation({ id: reservation.id }).catch(() => {});
    router.back();
  };
 
  const handleCopyCode = () => {
    if (!reservation.pickupCode) return;
    navigator.clipboard.writeText(reservation.pickupCode);
    setCopied(true);
    toast.success("Pickup code copied!");
    setTimeout(() => setCopied(false), 2000);
  };
 
  const handleDownloadQR = () => {
    const canvas = qrWrapperRef.current?.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `pickup-${reservation.pickupCode}.png`;
      link.href = url;
      link.click();
      toast.success("QR code downloaded!");
    }
  };
 
  return (
    <div className="min-h-screen bg-transparent py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="flex items-center cursor-pointer text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-300 mb-6 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Back to Previous
        </button>
 
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-6 shadow-sm relative overflow-hidden ${
                reservation.status === "confirmed"
                  ? "bg-linear-to-r from-green-50 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/20 border border-green-200 dark:border-green-700/50"
                  : reservation.status === "pending"
                    ? "bg-linear-to-r from-yellow-50 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-700/50"
                    : "bg-linear-to-r from-gray-50 to-slate-100 dark:from-gray-900/40 dark:to-slate-900/20 border border-gray-200 dark:border-gray-700/50"
              }`}
            >
              {/* Decorative background element */}
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-5 bg-black dark:bg-white pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-start sm:items-center gap-4">
                  <div className={`p-3 rounded-full shadow-sm ${
                    reservation.status === "confirmed" ? "bg-white dark:bg-green-800/80" : 
                    reservation.status === "pending" ? "bg-white dark:bg-yellow-800/80" : 
                    "bg-white dark:bg-gray-800/80"
                  }`}>
                    {reservation.status === "confirmed" ? (
                      <FaCheckCircle className="w-6 h-6 text-green-600 dark:text-green-300" />
                    ) : reservation.status === "pending" ? (
                      <FaClock className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
                    ) : (
                      <FaTimesCircle className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize tracking-tight">
                      {reservation.status === "confirmed"
                        ? "Reservation Confirmed"
                        : reservation.status === "pending"
                          ? "Pending Confirmation"
                          : reservation.status}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                      {reservation.status === "confirmed"
                        ? "Your pickup code is ready. Please present it to the supplier."
                        : reservation.status === "pending"
                          ? reservation.isSupplierView
                            ? "Review details and confirm or decline"
                            : "Waiting for the supplier to confirm"
                          : "This reservation is no longer active"}
                    </p>
                  </div>
                </div>
                {reservation.status === "pending" && reservation.isSupplierView && (
                  <span className="px-4 py-1.5 bg-white dark:bg-yellow-800 text-yellow-700 dark:text-yellow-100 text-sm font-bold rounded-full animate-pulse shadow-sm border border-yellow-200 dark:border-yellow-600">
                    Action Required
                  </span>
                )}
              </div>
            </motion.div>
 
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
                  <div className="w-20 h-20 bg-linear-to-br from-green-100 dark:from-slate-800 to-amber-100 dark:to-gray-800 rounded-xl flex items-center justify-center overflow-hidden">
                    {reservation.food.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={reservation.food.images[0].url}
                        alt={reservation.food.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FaUtensils className="w-8 h-8 text-green-600 dark:text-green-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {reservation.food.name}
                    </h4>
                    {reservation.food.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {reservation.food.description}
                      </p>
                    )}
                  </div>
                </div>
 
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100 dark:border-gray-800/60">
                  <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium uppercase tracking-wider">Quantity</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">
                      {reservation.quantity} <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">{reservation.food.quantityUnit}</span>
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium uppercase tracking-wider">Total Price</p>
                    <p className="font-semibold text-green-600 dark:text-green-400 text-lg flex items-center">
                      <FaRupeeSign className="w-4 h-4 mr-0.5 opacity-80" />
                      {reservation.totalPrice}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium uppercase tracking-wider">Pickup Time</p>
                    <p className="font-medium text-gray-900 dark:text-white text-sm flex items-start gap-1.5 mt-0.5">
                      <FaClock className="w-3.5 h-3.5 mt-0.5 text-blue-500 dark:text-blue-400 shrink-0" />
                      {new Date(reservation.pickupTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium uppercase tracking-wider">Food Expires</p>
                    <p className="font-medium text-orange-600 dark:text-orange-400 text-sm flex items-start gap-1.5 mt-0.5">
                      <FaExclamationTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {new Date(reservation.food.expiresAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
 
            {/* Reserver Information — only shown to the supplier managing
                this request; a reserver viewing their own reservation
                doesn't need their own contact details echoed back. */}
            {reservation.isSupplierView && (
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
                    <div className="w-16 h-16 bg-linear-to-br from-blue-100 dark:from-blue-800 to-purple-100 dark:to-purple-800 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                        {reservation.reserver.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {reservation.reserver.name}
                      </h4>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {reservation.totalOrders} completed{" "}
                        {reservation.totalOrders === 1 ? "order" : "orders"} on Annosetu
                      </span>
                    </div>
                  </div>
 
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <FaPhone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {reservation.reserver.phone || "Not provided"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaEnvelope className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {reservation.reserver.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 md:col-span-2">
                      <FaMapMarkerAlt className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {reservation.reserver.address || "Not provided"}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
 
          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6">
            {reservation.status === "pending" && reservation.isSupplierView && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card p-6 sticky top-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Actions</h3>
 
                <div className="space-y-4">
                  <Button onClick={handleConfirm} loading={isConfirming} disabled={isConfirming || isCancelling} fullWidth className="bg-green-600 hover:bg-green-700">
                    <FaCheckCircle className="mr-2" />
                    Confirm Reservation
                  </Button>
 
                  <Button
                    onClick={handleCancel}
                    loading={isCancelling}
                    disabled={isConfirming || isCancelling}
                    variant="outline"
                    fullWidth
                    className="border-red-300 dark:bg-gray-800 bg-white dark:border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40"
                  >
                    <FaTimesCircle className="mr-2" />
                    Decline Reservation
                  </Button>
                </div>
 
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/40 rounded-xl">
                  <p className="text-xs text-yellow-800 dark:text-yellow-100">
                    ⏰ A pickup code is generated automatically once you confirm.
                  </p>
                </div>
              </motion.div>
            )}
 
            {reservation.status === "pending" && !reservation.isSupplierView && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card p-6 sticky top-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Waiting for confirmation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  You&apos;ll get your pickup code as soon as the supplier confirms this reservation.
                </p>
                <Button
                  onClick={handleCancel}
                  loading={isCancelling}
                  variant="outline"
                  fullWidth
                  className="border-red-300 dark:bg-gray-800 bg-white dark:border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40"
                >
                  <FaTimesCircle className="mr-2" />
                  Cancel Reservation
                </Button>
              </motion.div>
            )}

            {reservation.status === "confirmed" && reservation.pickupCode && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card sticky top-4 overflow-hidden border-0 shadow-xl dark:bg-gray-800/90 backdrop-blur-xl">
                {/* Top colored accent line */}
                <div className="h-2 w-full bg-linear-to-r from-green-400 via-emerald-500 to-teal-500" />
                
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center justify-center gap-2">
                    <FaQrcode className="text-green-500 dark:text-green-400" />
                    Pickup Ticket
                  </h3>
  
                  <div ref={qrWrapperRef} className="flex justify-center mb-6">
                    <div className="p-4 bg-white rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.05)] border border-gray-100">
                      <QRCodeCanvas
                        value={JSON.stringify({
                          reservationId: reservation.id,
                          pickupCode: reservation.pickupCode,
                          foodName: reservation.food.name,
                        })}
                        size={180}
                        level="H"
                        includeMargin
                      />
                    </div>
                  </div>
  
                  <div className="text-center mb-6 border-y border-dashed border-gray-200 dark:border-gray-700 py-6 relative">
                    {/* Ticket notches */}
                    <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700" />
                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700" />
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest font-medium">Secret Code</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-3xl font-mono font-bold tracking-[0.2em] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-6 py-2.5 rounded-xl border border-green-100 dark:border-green-800/50 shadow-inner">
                        {reservation.pickupCode}
                      </span>
                      <button onClick={handleCopyCode} className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all hover:scale-105 active:scale-95 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 shadow-sm">
                        {copied ? (
                          <FaCheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <FaCopy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
  
                  <div className="flex justify-center gap-3 mb-5">
                    <button
                      onClick={handleDownloadQR}
                      className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                      <FaDownload className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Save QR</span>
                    </button>
                    <button
                      onClick={() => {
                        navigator.share?.({
                          title: "Pickup Code",
                          text: `Pickup code: ${reservation.pickupCode}`,
                        });
                      }}
                      className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                      <FaShare className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Share</span>
                    </button>
                  </div>
  
                  <div className="pt-2 text-center">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 py-2 rounded-lg inline-flex items-center gap-1.5 px-4">
                      <FaCheckCircle className="w-3.5 h-3.5" />
                      Valid until {new Date(reservation.food.expiresAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
 
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="card rounded-xl p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Quick Summary</h4>
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
        </div>
      </div>
    </div>
  );
}