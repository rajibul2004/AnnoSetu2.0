"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  FaInbox,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaArrowRight,
  FaArrowLeft,
  FaUtensils,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaHourglassHalf,
  FaCheck,
  FaShieldAlt,
  FaExclamationTriangle,
  FaQrcode,
} from "react-icons/fa";
import { useIncomingRequests, useConfirmReservationRequest } from "@/hooks/useReservationQueries";
import { useFoodDetails } from "@/hooks/useFoodQueries";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { formatDate, formatPrice } from "@/lib/formatters";
import Button from "@/components/common/Button";

export default function RequestsContent() {
  const params = useParams();
  const foodId = params?.id as string;
  const router = useRouter();

  const { requests, isLoading: requestsLoading } = useIncomingRequests(foodId);
  const { food, isLoading: foodLoading } = useFoodDetails(foodId);
  const { confirmReservation, isConfirming } = useConfirmReservationRequest();

  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const initialFilter = searchParams?.get("filter") || "all";
  const [filter, setFilter] = useState(initialFilter);

  const isLoading = requestsLoading || foodLoading;

  const handleQuickConfirm = async (reservationId: string) => {
    try {
      setConfirmingId(reservationId);
      await confirmReservation(reservationId);
    } catch {
      // Toast handled by mutation hook
    } finally {
      setConfirmingId(null);
    }
  };

  // Counts by status
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const confirmedCount = requests.filter((r) => r.status === "confirmed").length;
  const pickedUpCount = requests.filter((r) => r.status === "picked_up").length;
  const cancelledCount = requests.filter(
    (r) => r.status === "cancelled" || r.status === "expired"
  ).length;

  const totalReservedQty = requests
    .filter((r) => r.status === "confirmed" || r.status === "picked_up")
    .reduce((sum, r) => sum + r.quantity, 0);

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    if (filter === "all") return true;
    if (filter === "cancelled") return req.status === "cancelled" || req.status === "expired";
    return req.status === filter;
  });

  // Sort: pending first, then newest
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <LoadingSpinner text="Loading reservation requests..." />
      </div>
    );
  }

  const primaryImage =
    food?.images && food.images.length > 0
      ? (food.images.find((img) => img.isPrimary) ?? food.images[0]).url
      : null;

  return (
    <div className="min-h-screen bg-transparent py-6 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation & Breadcrumbs */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <nav className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 truncate">
            <button
              onClick={() => router.push("/protected/dashboard")}
              className="hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
            >
              Dashboard
            </button>
            <span>/</span>
            {food && (
              <>
                <Link
                  href={`/protected/food/${food.id}`}
                  className="hover:text-emerald-600 transition-colors cursor-pointer truncate max-w-[140px] sm:max-w-xs"
                >
                  {food.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
              Incoming Requests
            </span>
          </nav>

          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-emerald-600 transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <FaArrowLeft className="w-3 h-3" />
            <span>Back</span>
          </button>
        </div>

        {/* Hero Food Listing Banner */}
        {food && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-7 mb-8 border border-gray-200/80 dark:border-slate-800 shadow-xl"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-5 min-w-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-linear-to-br from-emerald-100 to-teal-50 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl overflow-hidden shrink-0 border border-gray-200/80 dark:border-slate-700 shadow-inner flex items-center justify-center">
                  {primaryImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={primaryImage} alt={food.name} className="w-full h-full object-cover" />
                  ) : (
                    <FaUtensils className="w-8 h-8 text-emerald-500/50" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        new Date(food.expiresAt).getTime() <= Date.now()
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300"
                          : food.availableQty === 0
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                      }`}
                    >
                      {new Date(food.expiresAt).getTime() <= Date.now()
                        ? "Expired"
                        : food.availableQty === 0
                          ? "Fully Reserved"
                          : "Active Listing"}
                    </span>
                    <span className="text-xs font-bold text-gray-400">
                      {food.supplierName}
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white truncate mt-1">
                    {food.name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400 font-semibold">
                    <span>
                      Total Quantity: <b className="text-gray-900 dark:text-white">{food.quantity} {food.quantityUnit}</b>
                    </span>
                    <span>•</span>
                    <span>
                      Available: <b className="text-emerald-600 dark:text-emerald-400">{food.availableQty} {food.quantityUnit}</b>
                    </span>
                    <span>•</span>
                    <span>
                      Expires: <b className="text-amber-600 dark:text-amber-400">{new Date(food.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</b>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
                <Link
                  href={`/protected/food/${food.id}`}
                  className="flex-1 md:flex-initial text-center px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 transition-colors shadow-xs"
                >
                  View Food Listing
                </Link>
                <Link
                  href="/protected/reservation/pickup"
                  className="flex-1 md:flex-initial text-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-colors shadow-md flex items-center justify-center gap-1.5"
                >
                  <FaQrcode />
                  <span>Verify Pickup</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-gray-200/70 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Total Requests
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              {requests.length}
            </div>
          </div>

          <div className="bg-amber-50/70 dark:bg-amber-950/30 backdrop-blur-md rounded-2xl p-4 border border-amber-200/70 dark:border-amber-900/50 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center justify-between">
              <span>Pending Action</span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {pendingCount}
            </div>
          </div>

          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 backdrop-blur-md rounded-2xl p-4 border border-emerald-200/70 dark:border-emerald-900/50 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Confirmed Rescues
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {confirmedCount + pickedUpCount}
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-gray-200/70 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Portions Reserved
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              {totalReservedQty} <span className="text-xs font-normal text-gray-500">{food?.quantityUnit || "units"}</span>
            </div>
          </div>
        </div>

        {/* Filter Pills Header */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {[
            { id: "all", label: "All Requests", count: requests.length },
            { id: "pending", label: "Pending Review", count: pendingCount, highlight: true },
            { id: "confirmed", label: "Confirmed", count: confirmedCount },
            { id: "picked_up", label: "Picked Up", count: pickedUpCount },
            { id: "cancelled", label: "Cancelled", count: cancelledCount },
          ].map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md scale-102"
                    : "bg-white/80 dark:bg-slate-900/80 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200/70 dark:border-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive
                      ? "bg-white/20 text-white"
                      : tab.highlight && tab.count > 0
                        ? "bg-amber-500 text-white"
                        : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Requests List */}
        {sortedRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-12 text-center border border-gray-200/80 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center"
          >
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-2xl text-gray-400 mb-4">
              <FaInbox />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">
              No requests in this view
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
              {filter === "all"
                ? "When customers or NGOs reserve portions from this listing, they will appear here."
                : `There are currently no requests with "${filter}" status.`}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {sortedRequests.map((request, index) => {
                const isPending = request.status === "pending";
                const isConfirmed = request.status === "confirmed";
                const isPickedUp = request.status === "picked_up";
                const isCancelled =
                  request.status === "cancelled" || request.status === "expired";

                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.04 }}
                    className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden border flex flex-col justify-between ${
                      isPending
                        ? "border-amber-300 dark:border-amber-800/80 shadow-amber-500/5"
                        : isConfirmed
                          ? "border-emerald-300 dark:border-emerald-800/80"
                          : "border-gray-200/80 dark:border-slate-800"
                    }`}
                  >
                    <div className="p-5 sm:p-6 space-y-4">
                      {/* Card Header: Status & Timestamp */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                            isConfirmed
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                              : isPending
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 animate-pulse"
                                : isPickedUp
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300"
                                  : "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-400"
                          }`}
                        >
                          {isConfirmed && <FaCheckCircle className="w-3 h-3 text-emerald-600" />}
                          {isPending && <FaHourglassHalf className="w-3 h-3 text-amber-600" />}
                          {isPickedUp && <FaCheck className="w-3 h-3 text-blue-600" />}
                          {isCancelled && <FaTimesCircle className="w-3 h-3 text-rose-500" />}
                          <span>{request.status}</span>
                        </span>

                        <span className="text-[11px] font-semibold text-gray-400">
                          {formatDate(request.createdAt, "MMM d, h:mm a")}
                        </span>
                      </div>

                      {/* Customer Profile Box */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-100 dark:border-slate-800">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                          {(request.reserverName || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-black text-gray-900 dark:text-white truncate">
                            {request.reserverName || "Customer User"}
                          </div>
                          {request.reserverPhone ? (
                            <a
                              href={`tel:${request.reserverPhone}`}
                              className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <FaPhone className="w-2.5 h-2.5" />
                              <span>{request.reserverPhone}</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-gray-400">Phone not provided</span>
                          )}
                        </div>
                      </div>

                      {/* Request Details Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50/80 dark:bg-slate-800/40 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">
                            Requested
                          </span>
                          <span className="font-black text-gray-900 dark:text-white">
                            {request.quantity} {request.food.quantityUnit}
                          </span>
                        </div>

                        <div className="bg-gray-50/80 dark:bg-slate-800/40 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">
                            Amount
                          </span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">
                            {request.totalPrice === 0 ? "FREE" : formatPrice(request.totalPrice)}
                          </span>
                        </div>

                        <div className="bg-gray-50/80 dark:bg-slate-800/40 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 col-span-2">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">
                            Pickup Slot
                          </span>
                          <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 mt-0.5">
                            <FaClock className="w-3 h-3 text-blue-500" />
                            {new Date(request.pickupTime).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Pickup Code Display (if confirmed) */}
                      {isConfirmed && request.pickupCode && (
                        <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                            Pickup Code
                          </span>
                          <span className="font-mono font-black text-sm tracking-widest text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            {request.pickupCode}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-4 bg-gray-50/80 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2">
                      {isPending ? (
                        <>
                          <Button
                            onClick={() => handleQuickConfirm(request.id)}
                            loading={confirmingId === request.id}
                            disabled={Boolean(confirmingId) || isConfirming}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <FaCheckCircle className="w-3 h-3" />
                            <span>Quick Confirm</span>
                          </Button>

                          <Link
                            href={`/protected/reservation/${request.id}/confirm`}
                            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1 transition-colors"
                          >
                            <span>Review</span>
                            <FaArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        </>
                      ) : (
                        <Link
                          href={`/protected/reservation/${request.id}/confirm`}
                          className="w-full text-center py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <span>Manage Request Details</span>
                          <FaArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
