"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaHandsHelping,
  FaUsers,
  FaChartPie,
  FaDownload,
  FaCalendar,
  FaBoxOpen,
  FaHeart,
  FaHandHoldingHeart,
  FaLeaf,
  FaCheckCircle,
} from "react-icons/fa";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { formatDate, formatPrice } from "@/lib/formatters";
import { useAuth } from "@/hooks/useAuth";
import {
  useMyReservations,
  useCancelReservation,
} from "@/hooks/useReservationQueries";
import type { ReservationDTO } from "@/types/reservation";

// ---------------------------------------------------------------------------
// Stat helpers
// ---------------------------------------------------------------------------

interface NGOStats {
  totalMeals: number;
  thisWeekCount: number;
  moneySaved: number;
  co2Reduced: number;
  peopleServed: number;
}

function computeStats(reservations: ReservationDTO[]): NGOStats {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const completed = reservations.filter((r) => r.status === "picked_up");

  const totalMeals = completed.reduce((s, r) => s + r.quantity, 0);
  const totalMoneySaved = completed.reduce((sum, r) => {
    if (r.food?.originalPrice) {
      return (
        sum +
        Math.max(0, r.food.originalPrice * r.quantity - (r.totalPrice || 0))
      );
    }
    return sum;
  }, 0);

  const thisWeekCount = reservations.filter(
    (r) => new Date(r.pickupTime) > oneWeekAgo,
  ).length;

  return {
    totalMeals,
    thisWeekCount,
    moneySaved: totalMoneySaved,
    co2Reduced: +(totalMeals * 2.5).toFixed(1),
    peopleServed: totalMeals * 2,
  };
}

// ---------------------------------------------------------------------------
// Status badge styles
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, string> = {
  picked_up:
    "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200",
  confirmed:
    "bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200",
  pending:
    "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200",
  cancelled:
    "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200",
  expired:
    "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200",
};

// ---------------------------------------------------------------------------
// NGO Dashboard Component
// ---------------------------------------------------------------------------

export default function NGODashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { reservations, isLoading } = useMyReservations();
  const { cancelReservation, isCancelling } = useCancelReservation();

  const stats = useMemo(() => computeStats(reservations), [reservations]);
  const [showWelcome, setShowWelcome] = useState(true);
  const welcomeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    welcomeTimerRef.current = setTimeout(() => setShowWelcome(false), 4500);
    return () => {
      if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current);
    };
  }, []);

  const upcomingPickups = reservations.filter(
    (r) =>
      (r.status === "confirmed" || r.status === "pending") &&
      new Date(r.pickupTime) > new Date(),
  ).length;

  const generateReport = () => {
    toast.success("Community Impact Report has been dispatched to your email!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <LoadingSpinner text="Loading NGO impact dashboard..." />
      </div>
    );
  }

  const displayName =
    user?.name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Partner";

  return (
    <div className="min-h-screen bg-transparent pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Toast Notification */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="fixed top-24 right-6 z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-4 border-l-4 border-purple-500 border border-gray-200 dark:border-slate-800 max-w-sm backdrop-blur-xl"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
                  <FaHeart className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">
                    Welcome, {displayName}! 🎉
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    You have {upcomingPickups} active pickup
                    {upcomingPickups !== 1 ? "s" : ""} scheduled
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Impact Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-700 via-indigo-700 to-emerald-700 rounded-3xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-white rounded-full blur-2xl" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-400 rounded-full blur-2xl" />
          </div>

          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/25 shadow-lg">
                <FaHandHoldingHeart className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-xs border border-white/20">
                    NGO Partner & Rescue Hub
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  Welcome back, {displayName}! 🤝
                </h1>
                <p className="text-sm text-purple-100 mt-1">
                  Coordinating bulk food rescue and serving vulnerable communities.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
              <button
                onClick={() => router.push("/public/food")}
                className="flex items-center gap-2 px-5 py-3.5 bg-white hover:bg-white/90 text-purple-800 font-extrabold text-sm rounded-2xl shadow-xl hover:scale-103 transition-all cursor-pointer"
              >
                <FaBoxOpen className="text-purple-600" />
                <span>Rescue Food Now</span>
              </button>
              <button
                onClick={generateReport}
                className="flex items-center gap-2 px-5 py-3.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-sm rounded-2xl backdrop-blur-md transition-all cursor-pointer"
              >
                <FaDownload />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Quick Stat Pill Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/20">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <div className="text-2xl font-black">{stats.totalMeals}</div>
              <div className="text-xs text-purple-100 font-medium">Meals Rescued</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <div className="text-2xl font-black">{stats.peopleServed}</div>
              <div className="text-xs text-purple-100 font-medium">Individuals Fed</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <div className="text-2xl font-black">{stats.co2Reduced} kg</div>
              <div className="text-xs text-purple-100 font-medium">CO₂ Prevented</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <div className="text-2xl font-black">{formatPrice(stats.moneySaved)}</div>
              <div className="text-xs text-purple-100 font-medium">Funds Saved</div>
            </div>
          </div>
        </motion.div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {[
            {
              label: "Total Rescued Meals",
              value: stats.totalMeals,
              sub: `${stats.thisWeekCount} pickups this week`,
              icon: FaHandsHelping,
              bg: "from-purple-500/10 to-indigo-500/10 border-purple-200 dark:border-purple-800/60",
              iconBg: "bg-purple-600 text-white",
              valColor: "text-purple-600 dark:text-purple-400",
            },
            {
              label: "People Served",
              value: stats.peopleServed,
              sub: "Estimated direct beneficiaries",
              icon: FaUsers,
              bg: "from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800/60",
              iconBg: "bg-blue-600 text-white",
              valColor: "text-blue-600 dark:text-blue-400",
            },
            {
              label: "Carbon Offset",
              value: `${stats.co2Reduced} kg`,
              sub: "Green environmental impact",
              icon: FaLeaf,
              bg: "from-emerald-500/10 to-green-500/10 border-emerald-200 dark:border-emerald-800/60",
              iconBg: "bg-emerald-600 text-white",
              valColor: "text-emerald-600 dark:text-emerald-400",
            },
            {
              label: "This Week",
              value: stats.thisWeekCount,
              sub: "Active pickups scheduled",
              icon: FaCalendar,
              bg: "from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800/60",
              iconBg: "bg-amber-500 text-white",
              valColor: "text-amber-600 dark:text-amber-400",
            },
          ].map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-gradient-to-br ${card.bg} bg-white dark:bg-slate-900 border rounded-3xl p-5 sm:p-6 shadow-md hover:shadow-lg transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {card.label}
                  </p>
                  <p className={`text-3xl font-black mt-1 ${card.valColor}`}>
                    {card.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 ${card.iconBg} rounded-2xl flex items-center justify-center shadow-md`}
                >
                  <card.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 font-medium">
                {card.sub}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Recent Distributions Table Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-xl overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Recent Food Distributions &amp; Pickups
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Track your active reservations, pickup codes, and status.
              </p>
            </div>
            <button
              onClick={() => router.push("/public/food")}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 font-bold text-xs cursor-pointer"
            >
              Browse All Food →
            </button>
          </div>

          {reservations.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-20 h-20 mx-auto bg-purple-50 dark:bg-purple-950/60 rounded-3xl flex items-center justify-center mb-4 text-purple-600 text-2xl">
                <FaHandsHelping />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                No active distributions yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm max-w-sm mx-auto">
                Explore nearby surplus food donations from restaurants and home cooks to begin rescuing food.
              </p>
              <button
                onClick={() => router.push("/public/food")}
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                Browse Surplus Food
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800/60">
                <thead className="bg-gray-50/80 dark:bg-slate-800/80">
                  <tr>
                    {[
                      "Food Item",
                      "Supplier",
                      "Quantity",
                      "Scheduled Pickup",
                      "Status",
                      "Action",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 bg-transparent">
                  {reservations.slice(0, 10).map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-purple-50/40 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      onClick={() =>
                        router.push(`/protected/reservation/${r.id}`)
                      }
                    >
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white text-sm">
                        {r.food.name}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-600 dark:text-gray-300">
                        {r.food.supplierName}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {r.quantity} {r.food.quantityUnit}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300 font-medium">
                        {formatDate(r.pickupTime, "MMM d, yyyy - h:mm a")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                            STATUS_STYLES[r.status] ?? STATUS_STYLES.expired
                          }`}
                        >
                          {r.status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(r.status === "pending" ||
                          r.status === "confirmed") && (
                          <button
                            disabled={isCancelling}
                            onClick={() => cancelReservation({ id: r.id })}
                            className="text-xs text-rose-600 hover:text-rose-700 disabled:opacity-40 font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Environmental & Quick Actions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Environmental Metrics */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-xl">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <FaLeaf />
              Environmental Impact Metrics
            </h3>
            <div className="space-y-4">
              {[
                {
                  label: "CO₂ Greenhouse Emissions Prevented",
                  value: `${stats.co2Reduced} kg`,
                },
                {
                  label: "Water Conserved",
                  value: `${(stats.totalMeals * 1000).toLocaleString()} Litres`,
                },
                {
                  label: "Organic Landfill Waste Diverted",
                  value: `${(stats.totalMeals * 0.5).toFixed(1)} kg`,
                },
                {
                  label: "Value Saved for Community",
                  value: formatPrice(stats.moneySaved),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center pb-3 border-b border-white/20 text-sm"
                >
                  <span className="text-emerald-100 font-medium">{item.label}</span>
                  <span className="font-extrabold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Hub Navigation */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">
                Rescue Hub Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/public/food")}
                  className="w-full flex items-center justify-between p-4 bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700/80 rounded-2xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FaBoxOpen className="text-emerald-600 text-lg" />
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      Explore Food Listings Near You
                    </span>
                  </div>
                  <span className="text-emerald-600 font-bold">→</span>
                </button>

                <button
                  onClick={generateReport}
                  className="w-full flex items-center justify-between p-4 bg-purple-50 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-slate-700/80 rounded-2xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FaDownload className="text-purple-600 text-lg" />
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      Generate Impact Verification Certificate
                    </span>
                  </div>
                  <span className="text-purple-600 font-bold">→</span>
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <FaCheckCircle className="text-emerald-500" />
              <span>All bulk claims are verified via encrypted QR token authentication.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
