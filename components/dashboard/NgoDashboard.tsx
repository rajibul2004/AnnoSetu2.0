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
  FaExchangeAlt,
  FaHeart,
  FaHandHoldingMedical,
} from "react-icons/fa";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { formatDate, formatPrice } from "@/lib/formatters";
import { useAuth } from "@/hooks/useAuth";
import { useMyReservations, useCancelReservation } from "@/hooks/useReservationQueries";
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
    // Fix: Money saved is the difference between original price and what was paid.
    // If original price is not set, they didn't 'save' a trackable amount, they just spent money.
    if (r.food?.originalPrice) {
      return sum + Math.max(0, (r.food.originalPrice * r.quantity) - (r.totalPrice || 0));
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
// Status badge
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, string> = {
  picked_up:
    "bg-green-100 dark:bg-green-800/60 text-green-800 dark:text-green-100",
  confirmed:
    "bg-blue-100 dark:bg-blue-800/60 text-blue-800 dark:text-blue-100",
  pending:
    "bg-yellow-100 dark:bg-yellow-800/60 text-yellow-800 dark:text-yellow-100",
  cancelled: "bg-red-100 dark:bg-red-800/60 text-red-800 dark:text-red-100",
  expired: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100",
};

// ---------------------------------------------------------------------------
// Page
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
    welcomeTimerRef.current = setTimeout(() => setShowWelcome(false), 4000);
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
    toast.success("Report generation started. You will receive it via email.");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <LoadingSpinner text="Loading NGO dashboard..." />
      </div>
    );
  }

  const displayName =
    user?.name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Toast */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-20 right-4 z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4 border-l-4 border-pink-500 max-w-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-linear-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                  <FaHeart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    Welcome back, {displayName}! 🎉
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    You have {upcomingPickups} upcoming pickup
                    {upcomingPickups !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-r from-pink-600 via-purple-600 to-blue-600 rounded-3xl shadow-2xl p-8 mb-8 mt-20 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white rounded-full" />
          </div>

          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <FaHandHoldingMedical className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Hey {displayName}! 👋
                </h1>
                <p className="text-white/90 flex items-center gap-2">
                  <FaExchangeAlt className="w-4 h-4" />
                  You&apos;re making a difference as both a saver &amp; sharer
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row w-full md:w-fit gap-3">
              <button
                onClick={() => router.push("/protected/food")}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-purple-700 font-semibold rounded-xl hover:bg-white/90 transition-colors shadow"
              >
                <FaBoxOpen className="w-4 h-4" />
                Bulk Reservation
              </button>
              <button
                onClick={generateReport}
                className="flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-white/60 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
              >
                <FaDownload className="w-4 h-4" />
                Generate Report
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: "Total Meals",
              value: stats.totalMeals,
              sub: `${stats.thisWeekCount} this week`,
              icon: FaHandsHelping,
              colors: "from-green-50 dark:from-green-950 to-green-100 dark:to-green-900 border-green-200 dark:border-green-700",
              iconBg: "bg-green-500 dark:bg-green-400",
              textColors: "text-green-800 dark:text-green-100",
              valueColors: "text-green-900 dark:text-green-50",
              subColors: "text-green-700 dark:text-green-200",
            },
            {
              label: "People Served",
              value: stats.peopleServed,
              sub: "Estimated individuals",
              icon: FaUsers,
              colors: "from-blue-50 dark:from-blue-950 to-blue-100 dark:to-blue-900 border-blue-200 dark:border-blue-700",
              iconBg: "bg-blue-500 dark:bg-blue-400",
              textColors: "text-blue-800 dark:text-blue-100",
              valueColors: "text-blue-900 dark:text-blue-50",
              subColors: "text-blue-700 dark:text-blue-200",
            },
            {
              label: "CO₂ Reduced",
              value: `${stats.co2Reduced}kg`,
              sub: "Eco-friendly impact",
              icon: FaChartPie,
              colors: "from-purple-50 dark:from-purple-950 to-purple-100 dark:to-purple-900 border-purple-200 dark:border-purple-700",
              iconBg: "bg-purple-500 dark:bg-purple-400",
              textColors: "text-purple-800 dark:text-purple-100",
              valueColors: "text-purple-900 dark:text-purple-50",
              subColors: "text-purple-700 dark:text-purple-200",
            },
            {
              label: "This Week",
              value: stats.thisWeekCount,
              sub: "Meals distributed",
              icon: FaCalendar,
              colors: "from-orange-50 dark:from-orange-950 to-orange-100 dark:to-orange-900 border-orange-200 dark:border-orange-700",
              iconBg: "bg-orange-500 dark:bg-orange-400",
              textColors: "text-orange-800 dark:text-orange-100",
              valueColors: "text-orange-900 dark:text-orange-50",
              subColors: "text-orange-700 dark:text-orange-200",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`bg-linear-to-br ${card.colors} border rounded-xl p-6`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${card.textColors}`}>
                    {card.label}
                  </p>
                  <p className={`text-3xl font-bold mt-2 ${card.valueColors}`}>
                    {card.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}
                >
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className={`text-sm mt-4 ${card.subColors}`}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Recent Distributions */}
        <div className="card p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Recent Distributions
            </h2>
            <button
              onClick={() => router.push("/protected/dashboard/ngo")}
              className="text-green-600 dark:text-green-300 hover:text-green-700 dark:hover:text-green-200 font-medium text-sm"
            >
              View All
            </button>
          </div>

          {reservations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <FaHandsHelping className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No distributions yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Start by making your first bulk reservation.
              </p>
              <button
                onClick={() => router.push("/protected/food")}
                className="px-5 py-2 rounded-xl border-2 border-green-600 text-green-600 dark:text-green-300 dark:border-green-300 font-semibold hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
              >
                Browse Food
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    {[
                      "Food Item",
                      "Supplier",
                      "Quantity",
                      "Pickup Date",
                      "Status",
                      "Action",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {reservations.slice(0, 8).map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                      onClick={() =>
                        router.push(`/protected/reservation/${r.id}`)
                      }
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white text-sm">
                        {r.food.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                        {r.food.supplierName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                        {r.quantity} {r.food.quantityUnit}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                        {formatDate(r.pickupTime, "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            STATUS_STYLES[r.status] ?? STATUS_STYLES.expired
                          }`}
                        >
                          {r.status.replace("_", " ")}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(r.status === "pending" ||
                          r.status === "confirmed") && (
                          <button
                            disabled={isCancelling}
                            onClick={() => cancelReservation({ id: r.id })}
                            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 font-medium"
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

        {/* Impact Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Environmental Impact */}
          <div className="bg-linear-to-br from-green-400 dark:from-green-900/60 to-green-300 dark:to-green-800/60 rounded-xl shadow-lg p-8 text-gray-900 dark:text-white">
            <h3 className="text-xl font-bold mb-6">Environmental Impact</h3>
            <div className="space-y-4">
              {[
                {
                  label: "CO₂ Emissions Reduced",
                  value: `${stats.co2Reduced} kg`,
                },
                {
                  label: "Water Saved",
                  value: `${(stats.totalMeals * 1000).toLocaleString()} L`,
                },
                {
                  label: "Landfill Waste Reduced",
                  value: `${(stats.totalMeals * 0.5).toFixed(1)} kg`,
                },
                {
                  label: "Money Saved",
                  value: formatPrice(stats.moneySaved),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm">{item.label}</span>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Quick Actions
            </h3>
            <div className="space-y-3">
              {[
                {
                  icon: FaBoxOpen,
                  label: "Browse Available Food",
                  color: "green",
                  href: "/protected/food",
                },
                {
                  icon: FaDownload,
                  label: "Download Monthly Report",
                  color: "blue",
                  onClick: generateReport,
                },
                {
                  icon: FaUsers,
                  label: "View All Reservations",
                  color: "purple",
                  href: "/protected/dashboard/ngo",
                },
              ].map((action) => (
                <button
                  key={action.label}
                  className={`w-full flex items-center justify-between p-4 bg-${action.color}-50 dark:bg-${action.color}-900/40 hover:bg-${action.color}-100 dark:hover:bg-${action.color}-900/60 rounded-xl transition-colors cursor-pointer`}
                  onClick={() =>
                    action.href
                      ? router.push(action.href)
                      : action.onClick?.()
                  }
                >
                  <div className="flex items-center gap-3">
                    <action.icon
                      className={`w-5 h-5 text-${action.color}-600 dark:text-${action.color}-300`}
                    />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {action.label}
                    </span>
                  </div>
                  <span
                    className={`text-${action.color}-600 dark:text-${action.color}-300 text-lg`}
                  >
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
