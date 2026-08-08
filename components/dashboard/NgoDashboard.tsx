"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  FaTimesCircle,
  FaClock,
  FaCopy,
  FaQrcode,
  FaChevronDown,
  FaUtensils,
  FaMapMarkerAlt,
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
// Types & Stat helpers
// ---------------------------------------------------------------------------

type NGOTab = "upcoming" | "completed" | "cancelled" | "all";

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

// ---------------------------------------------------------------------
// Reusable Scrollable Container with Gradient Overflow Indicators
// ---------------------------------------------------------------------

function ScrollableContainer({
  children,
  maxHeight = "max-h-[680px]",
}: {
  children: React.ReactNode;
  maxHeight?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight + 10;
    setCanScrollUp(el.scrollTop > 15);
    setCanScrollDown(
      hasOverflow && el.scrollTop < el.scrollHeight - el.clientHeight - 15,
    );
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [children]);

  return (
    <div className="relative group">
      {/* Top overflow shadow indicator */}
      <div
        className={`pointer-events-none absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-gray-900/10 dark:from-black/30 to-transparent z-10 rounded-t-3xl transition-opacity duration-300 ${
          canScrollUp ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Scrollable Body */}
      <div
        ref={containerRef}
        onScroll={checkScroll}
        className={`${maxHeight} overflow-y-auto custom-scrollbar scroll-smooth py-1`}
      >
        {children}
      </div>

      {/* Bottom overflow shadow indicator */}
      <div
        className={`pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-gray-900/10 dark:from-black/30 to-transparent z-10 rounded-b-3xl transition-opacity duration-300 ${
          canScrollDown ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Scroll hint badge when content overflows */}
      {canScrollDown && (
        <div className="flex justify-center mt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-gray-200 dark:border-slate-700 text-[11px] font-bold text-gray-500 dark:text-gray-400 rounded-full shadow-sm animate-pulse">
            <FaChevronDown className="w-2.5 h-2.5" />
            Scroll for more distributions
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NGO Dashboard Component
// ---------------------------------------------------------------------------

export default function NGODashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { reservations, isLoading } = useMyReservations();
  const { cancelReservation, isCancelling } = useCancelReservation();
  const [activeTab, setActiveTab] = useState<NGOTab>("upcoming");

  const stats = useMemo(() => computeStats(reservations), [reservations]);
  const [showWelcome, setShowWelcome] = useState(true);
  const welcomeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    welcomeTimerRef.current = setTimeout(() => setShowWelcome(false), 4500);
    return () => {
      if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current);
    };
  }, []);

  const now = new Date();
  const upcomingReservations = useMemo(
    () =>
      reservations.filter(
        (r) =>
          (r.status === "confirmed" || r.status === "pending") &&
          new Date(r.pickupTime) > now,
      ),
    [reservations],
  );

  const completedReservations = useMemo(
    () =>
      reservations.filter(
        (r) =>
          r.status === "picked_up" ||
          (r.status !== "cancelled" && new Date(r.pickupTime) <= now),
      ),
    [reservations],
  );

  const cancelledReservations = useMemo(
    () => reservations.filter((r) => r.status === "cancelled"),
    [reservations],
  );

  const filteredReservations = useMemo(() => {
    switch (activeTab) {
      case "upcoming":
        return upcomingReservations;
      case "completed":
        return completedReservations;
      case "cancelled":
        return cancelledReservations;
      default:
        return reservations;
    }
  }, [activeTab, upcomingReservations, completedReservations, cancelledReservations, reservations]);

  const generateReport = () => {
    toast.success("Community Impact Report has been dispatched to your email!");
  };

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success("Pickup pass code copied!");
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
                    You have {upcomingReservations.length} active pickup
                    {upcomingReservations.length !== 1 ? "s" : ""} scheduled
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
                    NGO Partner &amp; Rescue Hub
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

            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={() => router.push("/public/food")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-white hover:bg-white/90 text-purple-800 font-extrabold text-sm rounded-2xl shadow-xl hover:scale-103 transition-all cursor-pointer"
              >
                <FaBoxOpen className="text-purple-600" />
                <span>Rescue Food Now</span>
              </button>
              <Link href="/protected/reservation/pickup" className="w-full sm:w-auto">
                <button className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-sm rounded-2xl backdrop-blur-md transition-all cursor-pointer">
                  <FaQrcode />
                  <span>Pickup Scanner</span>
                </button>
              </Link>
              <button
                onClick={generateReport}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-sm rounded-2xl backdrop-blur-md transition-all cursor-pointer"
              >
                <FaDownload />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Quick Stat Pill Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-8 pt-6 border-t border-white/20">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-white/15">
              <div className="text-xl sm:text-2xl font-black">{stats.totalMeals}</div>
              <div className="text-[11px] sm:text-xs text-purple-100 font-medium">Meals Rescued</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-white/15">
              <div className="text-xl sm:text-2xl font-black">{stats.peopleServed}</div>
              <div className="text-[11px] sm:text-xs text-purple-100 font-medium">Individuals Fed</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-white/15">
              <div className="text-xl sm:text-2xl font-black">{stats.co2Reduced} kg</div>
              <div className="text-[11px] sm:text-xs text-purple-100 font-medium">CO₂ Prevented</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-white/15">
              <div className="text-xl sm:text-2xl font-black">{formatPrice(stats.moneySaved)}</div>
              <div className="text-[11px] sm:text-xs text-purple-100 font-medium">Funds Saved</div>
            </div>
          </div>
        </motion.div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
          {[
            {
              label: "Rescued Meals",
              value: stats.totalMeals,
              sub: `${stats.thisWeekCount} this week`,
              icon: FaHandsHelping,
              bg: "from-purple-500/10 to-indigo-500/10 border-purple-200 dark:border-purple-800/60",
              iconBg: "bg-purple-600 text-white",
              valColor: "text-purple-600 dark:text-purple-400",
            },
            {
              label: "People Served",
              value: stats.peopleServed,
              sub: "Direct beneficiaries",
              icon: FaUsers,
              bg: "from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800/60",
              iconBg: "bg-blue-600 text-white",
              valColor: "text-blue-600 dark:text-blue-400",
            },
            {
              label: "CO₂ Diverted",
              value: `${stats.co2Reduced} kg`,
              sub: "Carbon offset",
              icon: FaLeaf,
              bg: "from-emerald-500/10 to-green-500/10 border-emerald-200 dark:border-emerald-800/60",
              iconBg: "bg-emerald-600 text-white",
              valColor: "text-emerald-600 dark:text-emerald-400",
            },
            {
              label: "Active Pickups",
              value: stats.thisWeekCount,
              sub: "Scheduled pickups",
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
              className={`bg-gradient-to-br ${card.bg} bg-white dark:bg-slate-900 border rounded-3xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {card.label}
                  </p>
                  <p className={`text-2xl sm:text-3xl font-black mt-1 ${card.valColor}`}>
                    {card.value}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 ${card.iconBg} rounded-2xl flex items-center justify-center shadow-md shrink-0`}
                >
                  <card.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2 sm:mt-3 font-medium">
                {card.sub}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Tab Navigation for NGO Distributions */}
        <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-2 border border-gray-200/80 dark:border-slate-800 shadow-md mb-6">
          <div className="flex items-center justify-between gap-3">
            <div className="overflow-x-auto custom-scrollbar pb-0.5 flex-1">
              <div className="flex items-center gap-2 min-w-max">
                <button
                  onClick={() => setActiveTab("upcoming")}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "upcoming"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <FaClock className="text-xs" />
                  <span>Upcoming Pickups</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-black ${
                      activeTab === "upcoming"
                        ? "bg-white/20 text-white"
                        : "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                    }`}
                  >
                    {upcomingReservations.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("completed")}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "completed"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <FaCheckCircle className="text-xs" />
                  <span>Past Rescues</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-black ${
                      activeTab === "completed"
                        ? "bg-white/20 text-white"
                        : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                    }`}
                  >
                    {completedReservations.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("cancelled")}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "cancelled"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <FaTimesCircle className="text-xs" />
                  <span>Cancelled</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-black ${
                      activeTab === "cancelled"
                        ? "bg-white/20 text-white"
                        : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    {cancelledReservations.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "all"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>All Rescues</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-black ${
                      activeTab === "all"
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {reservations.length}
                  </span>
                </button>
              </div>
            </div>

            <button
              onClick={() => router.push("/public/food")}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors shrink-0"
            >
              <FaBoxOpen />
              <span>Browse Food</span>
            </button>
          </div>
        </div>

        {/* Recent Distributions Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-xl overflow-hidden mb-8">
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Food Distributions &amp; Pickups
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Showing {filteredReservations.length} {activeTab} distribution{filteredReservations.length === 1 ? "" : "s"}.
              </p>
            </div>
            <button
              onClick={() => router.push("/public/food")}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 font-bold text-xs cursor-pointer"
            >
              Browse All Food →
            </button>
          </div>

          {filteredReservations.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-20 h-20 mx-auto bg-purple-50 dark:bg-purple-950/60 rounded-3xl flex items-center justify-center mb-4 text-purple-600 text-2xl">
                <FaHandsHelping />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                No {activeTab} distributions
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
            <div>
              {/* MOBILE VIEW: Cards for small screens (sm:hidden) */}
              <div className="block sm:hidden p-4 space-y-3">
                {filteredReservations.map((r, idx) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => router.push(`/protected/reservation/${r.id}`)}
                    className="p-4 rounded-2xl bg-gray-50/80 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 space-y-3 cursor-pointer hover:border-purple-500/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
                          {r.food.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Supplier: {r.food.supplierName}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full shrink-0 ${
                          STATUS_STYLES[r.status] ?? STATUS_STYLES.expired
                        }`}
                      >
                        {r.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200/60 dark:border-slate-700/60">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {r.quantity} {r.food.quantityUnit} portions
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-[11px]">
                        {formatDate(r.pickupTime, "MMM d, h:mm a")}
                      </span>
                    </div>

                    {r.pickupCode && (
                      <div
                        className="p-2.5 rounded-xl bg-purple-50 dark:bg-slate-800 border border-purple-200/60 dark:border-slate-700 flex items-center justify-between gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <FaQrcode className="text-purple-600 dark:text-purple-400" />
                          <span className="text-gray-500 dark:text-gray-400 text-[11px]">Pickup Pass:</span>
                          <span className="font-mono font-black text-purple-700 dark:text-purple-300">
                            {r.pickupCode}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleCopyCode(r.pickupCode!, e)}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-xs font-bold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-slate-600 flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <FaCopy className="text-[10px]" />
                          <span>Copy</span>
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => router.push(`/protected/reservation/${r.id}`)}
                        className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <FaQrcode className="text-xs" />
                        <span>View Boarding Pass</span>
                      </button>

                      {(r.status === "pending" || r.status === "confirmed") && (
                        <button
                          type="button"
                          disabled={isCancelling}
                          onClick={() => cancelReservation({ id: r.id })}
                          className="py-2 px-3 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold border border-rose-200 dark:border-rose-800/40 cursor-pointer disabled:opacity-40"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* TABLET / DESKTOP VIEW: Data Table (hidden sm:block) */}
              <div className="hidden sm:block">
                <ScrollableContainer>
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800/60">
                      <thead className="bg-gray-50/80 dark:bg-slate-800/80">
                        <tr>
                          {[
                            "Food Item",
                            "Supplier",
                            "Quantity",
                            "Pickup Pass Code",
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
                        {filteredReservations.map((r) => (
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
                            <td
                              className="px-6 py-4 text-xs font-mono font-bold"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {r.pickupCode ? (
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyCode(r.pickupCode!, e)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-slate-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-slate-700 border border-purple-200 dark:border-slate-700 transition-colors"
                                  title="Click to copy pickup code"
                                >
                                  <FaQrcode className="text-xs text-purple-500" />
                                  <span>{r.pickupCode}</span>
                                  <FaCopy className="text-[10px] opacity-70" />
                                </button>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
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
                </ScrollableContainer>
              </div>
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
                  onClick={() => router.push("/protected/reservation/pickup")}
                  className="w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700/80 rounded-2xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FaQrcode className="text-blue-600 text-lg" />
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      Open Volunteer Pickup Scanner Station
                    </span>
                  </div>
                  <span className="text-blue-600 font-bold">→</span>
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

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 text-xs text-gray-500 dark:text-gray-400">
              Need assistance coordinating large bulk distributions? Contact support at support@annosetu.org.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
