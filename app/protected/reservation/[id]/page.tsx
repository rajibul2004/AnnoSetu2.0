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
    await cancelReservation(reservation.id).catch(() => {});
    if (reservation.isSupplierView) router.push("/restaurant/dashboard");
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
                          : reservation.status}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {reservation.status === "confirmed"
                        ? "Pickup code generated"
                        : reservation.status === "pending"
                          ? reservation.isSupplierView
                            ? "Review details and confirm or decline"
                            : "Waiting for the supplier to confirm"
                          : "This reservation is no longer active"}
                    </p>
                  </div>
                </div>
                {reservation.status === "pending" && reservation.isSupplierView && (
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 text-sm font-medium rounded-full animate-pulse">
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
 
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Quantity</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {reservation.quantity} {reservation.food.quantityUnit}
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Food Expires</p>
                    <p className="font-semibold text-orange-600 dark:text-orange-300">
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
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card p-6 sticky top-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaQrcode className="text-green-600 dark:text-green-300" />
                  Pickup Code
                </h3>
 
                <div ref={qrWrapperRef} className="flex justify-center mb-4">
                  <div className="p-4 card">
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
 
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Pickup Code</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-mono font-bold text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-900/40 px-4 py-2 rounded-lg">
                      {reservation.pickupCode}
                    </span>
                    <button onClick={handleCopyCode} className="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors">
                      {copied ? (
                        <FaCheckCircle className="w-5 h-5 text-green-600 dark:text-green-300" />
                      ) : (
                        <FaCopy className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>
 
                <div className="flex justify-center gap-3 mb-4">
                  <button
                    onClick={handleDownloadQR}
                    className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-900 transition-colors"
                  >
                    <FaDownload className="w-4 h-4" />
                    <span className="text-sm">Download QR</span>
                  </button>
                  <button
                    onClick={() => {
                      navigator.share?.({
                        title: "Pickup Code",
                        text: `Pickup code: ${reservation.pickupCode}`,
                      });
                    }}
                    className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-900 transition-colors"
                  >
                    <FaShare className="w-4 h-4" />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
 
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                  <p className="text-xs text-green-600 dark:text-green-300 text-center">
                    ✓ Valid until {new Date(reservation.food.expiresAt).toLocaleString()}
                  </p>
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