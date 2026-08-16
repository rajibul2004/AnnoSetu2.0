"use client";

import { useState, useMemo, useRef, useEffect, UIEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaShoppingBag,
  FaUtensils,
  FaClock,
  FaTimesCircle,
  FaMapMarkerAlt,
  FaPlus,
  FaStar,
  FaHeart,
  FaChartLine,
  FaHome,
  FaExchangeAlt,
  FaGift,
  FaLeaf,
  FaAward,
  FaFire,
  FaMedal,
  FaTrophy,
  FaStore,
  FaRupeeSign,
  FaArrowRight,
  FaShieldAlt,
  FaCheckCircle,
  FaQrcode,
  FaCopy,
  FaExternalLinkAlt,
  FaExclamationCircle,
  FaInfoCircle,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import CommunityLog from "./CommunityLog";
import { useImpact } from "@/hooks/useImpact";
import Button from "@/components/common/Button";
import ReviewModal from "@/components/reviews/ReviewModal";
import { formatDate, formatTimeRemaining, formatPrice } from "@/lib/formatters";
import { useAuth } from "@/hooks/useAuth";
import {
  useMyReservations,
  useCancelReservation,
} from "@/hooks/useReservationQueries";
import { useMySharedFood, useDeleteFood } from "@/hooks/useFoodQueries";
import LevelProgressBar from "@/components/gamification/LevelProgressBar";
import StreakWidget from "@/components/gamification/StreakWidget";
import NextBadgeProgress from "@/components/gamification/NextBadgeProgress";
import { getBadge, RARITY_STYLES } from "@/lib/badges";
import type { ReservationDTO } from "@/types/reservation";
import { isFoodExpired, type SharedFoodDTO } from "@/types/food";

type ConsumerTab = "upcoming" | "past" | "cancelled";
type SupplierTab = "active" | "reserved" | "expired";

interface DashboardStats {
  mealsConsumed: number;
  moneySaved: number;
  co2Reduced: number;
  favoriteRestaurants: number;
  mealsShared: number;
  peopleFed: number;
  earnings: number;
  avgRating: number;
  totalImpact: number;
  impactBadges: string[];
}

function calculateStats(
  reservedFoods: ReservationDTO[],
  sharedFoods: SharedFoodDTO[],
): DashboardStats {
  const completedReservations = reservedFoods.filter(
    (r) => r.status === "picked_up",
  );
  const totalMealsConsumed = completedReservations.reduce(
    (sum, r) => sum + r.quantity,
    0,
  );

  const totalMoneySaved = completedReservations.reduce((sum, r) => {
    if (r.food?.originalPrice) {
      return (
        sum +
        Math.max(0, r.food.originalPrice * r.quantity - (r.totalPrice || 0))
      );
    }
    return sum;
  }, 0);

  const totalMealsShared = sharedFoods.reduce(
    (sum, l) => sum + (l.quantity - l.availableQty),
    0,
  );

  const totalEarnings = sharedFoods.reduce((sum, l) => {
    if (l.isDonation || !l.price) return sum;
    return sum + (l.quantity - l.availableQty) * l.price;
  }, 0);

  const ratedListings = sharedFoods.filter((l) => l.reviewCount > 0);
  const avgRating =
    ratedListings.length > 0
      ? ratedListings.reduce((sum, l) => sum + (l.averageRating || 0), 0) /
        ratedListings.length
      : 0;

  return {
    mealsConsumed: totalMealsConsumed,
    moneySaved: totalMoneySaved,
    co2Reduced: +(totalMealsConsumed * 2.5).toFixed(1),
    favoriteRestaurants: new Set(
      completedReservations.map((r) => r.food?.supplierId),
    ).size,
    mealsShared: totalMealsShared,
    peopleFed: totalMealsShared * 2,
    earnings: totalEarnings,
    avgRating,
    totalImpact: totalMealsConsumed + totalMealsShared,
    impactBadges: [
      totalMealsConsumed > 0 && "food-saver",
      totalMealsShared > 0 && "food-sharer",
      totalMealsConsumed > 10 && "eco-warrior",
      avgRating > 4.5 && "top-rated",
    ].filter((v): v is string => Boolean(v)),
  };
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"consumer" | "supplier">("consumer");
  const [consumerTab, setConsumerTab] = useState<ConsumerTab>("upcoming");
  const [supplierTab, setSupplierTab] = useState<SupplierTab>("active");

  const { reservations: userReservations, isLoading: isReservationsLoading } =
    useMyReservations();
  const { mySharedFood: userSharedFood, isLoading: isMySharedLoading } =
    useMySharedFood();
  const { data: impactData, isLoading: isImpactLoading } = useImpact();

  const isLoading = isReservationsLoading || isMySharedLoading;

  const stats = useMemo(
    () => calculateStats(userReservations, userSharedFood),
    [userReservations, userSharedFood],
  );

  // Consumer tab reservation counts
  const now = new Date();
  const upcomingReservations = useMemo(
    () =>
      userReservations.filter(
        (res) =>
          (res.status === "confirmed" || res.status === "pending") &&
          new Date(res.pickupTime) > now,
      ),
    [userReservations],
  );

  const pastReservations = useMemo(
    () =>
      userReservations.filter(
        (res) =>
          res.status === "picked_up" ||
          (res.status !== "cancelled" && new Date(res.pickupTime) <= now),
      ),
    [userReservations],
  );

  const cancelledReservations = useMemo(
    () => userReservations.filter((res) => res.status === "cancelled"),
    [userReservations],
  );

  const filteredReservations = useMemo(() => {
    switch (consumerTab) {
      case "upcoming":
        return upcomingReservations;
      case "past":
        return pastReservations;
      case "cancelled":
        return cancelledReservations;
      default:
        return userReservations;
    }
  }, [consumerTab, upcomingReservations, pastReservations, cancelledReservations, userReservations]);

  // Supplier tab food counts
  const activeSupplierListings = useMemo(
    () =>
      userSharedFood.filter(
        (f) => (!isFoodExpired(f) && f.isActive && f.availableQty > 0) || (f.pendingCount ?? 0) > 0,
      ),
    [userSharedFood],
  );

  const reservedSupplierListings = useMemo(
    () =>
      userSharedFood.filter((food) => {
        const isExpired = isFoodExpired(food) || !food.isActive;
        const reservedQty =
          food.confirmedQty !== undefined
            ? food.confirmedQty
            : Math.max(0, food.quantity - food.availableQty);
        const hasReservations = reservedQty > 0 || food.quantity > food.availableQty;
        return !isExpired && hasReservations;
      }),
    [userSharedFood],
  );

  const expiredSupplierListings = useMemo(
    () => userSharedFood.filter((f) => isFoodExpired(f) || !f.isActive),
    [userSharedFood],
  );

  const filteredSupplierListings = useMemo(() => {
    switch (supplierTab) {
      case "active":
        return activeSupplierListings;
      case "reserved":
        return reservedSupplierListings;
      case "expired":
        return expiredSupplierListings;
      default:
        return userSharedFood;
    }
  }, [supplierTab, activeSupplierListings, reservedSupplierListings, expiredSupplierListings, userSharedFood]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <LoadingSpinner text="Loading your dashboard..." />
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] ?? "Friend";

  return (
    <div className="min-h-screen bg-transparent pb-20 pt-20 sm:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl p-5 sm:p-6 mb-6 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-700 dark:from-pink-600/50 dark:via-purple-600/50 dark:to-indigo-700/50 backdrop-blur-3xl text-white shadow-2xl overflow-hidden border border-white/15 dark:border-white/5"
        >
          {/* Subtle Ambient Light Gradients */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-pink-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/15 backdrop-blur-md rounded-2xl p-1 border border-white/20 flex items-center justify-center text-xl shadow-inner shrink-0">
                {stats.avgRating >= 4.5 ? (
                  <FaTrophy className="text-yellow-300 w-6 h-6 sm:w-7 sm:h-7 drop-shadow-md" />
                ) : (
                  <FaHeart className="text-pink-200 w-6 h-6 sm:w-7 sm:h-7 drop-shadow-md" />
                )}
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 bg-white/15 backdrop-blur-md rounded-full text-[10px] font-semibold uppercase tracking-wider mb-1 border border-white/20">
                  <FaShieldAlt className="text-emerald-300 w-3 h-3" />
                  <span>Individual Partner</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Welcome back, {firstName}! ✨
                </h1>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row w-full lg:w-auto items-stretch sm:items-center gap-2">
              <Link href="/public/food" className="w-full sm:w-auto">
                <Button className="w-full bg-white text-gray-900 hover:bg-gray-50 font-black shadow-lg text-xs rounded-xl py-2 px-4 hover:scale-[1.03] hover:-translate-y-0.5 transition-all duration-300">
                  <FaShoppingBag className="mr-2 text-emerald-500 w-3.5 h-3.5" />
                  Save
                </Button>
              </Link>
              <Link href="/protected/add-food?role=individual" className="w-full sm:w-auto">
                <Button className="w-full bg-white/15 hover:bg-white/25 text-white font-black backdrop-blur-md border border-white/30 shadow-lg text-xs rounded-xl py-2 px-4 hover:scale-[1.03] hover:-translate-y-0.5 transition-all duration-300">
                  <FaPlus className="mr-2 text-yellow-300 w-3.5 h-3.5" />
                  Share
                </Button>
              </Link>
              <Link href="/protected/reservation/pickup" className="w-full sm:w-auto">
                <Button className="w-full bg-emerald-500/90 hover:bg-emerald-400 text-white font-black backdrop-blur-md border border-emerald-400/50 shadow-lg text-xs rounded-xl py-2 px-4 hover:scale-[1.03] hover:-translate-y-0.5 transition-all duration-300">
                  <FaQrcode className="mr-2 w-3.5 h-3.5" />
                  Scan
                </Button>
              </Link>
            </div>
          </div>

          {/* Unified Compact Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/15 relative z-10">
            {/* Metric 1 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] sm:text-xs text-emerald-100/80 font-bold uppercase tracking-wider flex justify-between items-center">
                Total Impact <FaLeaf className="text-emerald-300 w-3 h-3" />
              </span>
              <div className="text-2xl font-black mt-2 text-white drop-shadow-sm truncate">
                {stats.totalImpact} <span className="text-xs font-semibold text-emerald-200">Meals</span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] sm:text-xs text-emerald-100/80 font-bold uppercase tracking-wider flex justify-between items-center">
                CO₂ Saved <FaShieldAlt className="text-emerald-300 w-3 h-3" />
              </span>
              <div className="text-2xl font-black mt-2 text-white drop-shadow-sm truncate">
                {!isImpactLoading && impactData ? impactData.impact.carbonSavedKg.toFixed(1) : stats.co2Reduced.toFixed(1)} <span className="text-xs font-semibold text-emerald-200">kg</span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] sm:text-xs text-amber-100/80 font-bold uppercase tracking-wider flex justify-between items-center">
                Impact Points <FaStar className="text-amber-300 w-3 h-3" />
              </span>
              <div className="text-2xl font-black mt-2 text-white drop-shadow-sm truncate">
                {!isImpactLoading && impactData ? impactData.impact.points : 0}
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] sm:text-xs text-purple-100/80 font-bold uppercase tracking-wider flex justify-between items-center">
                Badges <FaMedal className="text-purple-300 w-3 h-3" />
              </span>
              <div className="text-2xl font-black mt-2 text-white drop-shadow-sm truncate">
                {!isImpactLoading && impactData ? impactData.achievements.length : 0}
              </div>
            </div>

            {/* Metric 5 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] sm:text-xs text-yellow-100/80 font-bold uppercase tracking-wider flex justify-between items-center">
                Rank <FaTrophy className="text-yellow-300 w-3 h-3" />
              </span>
              <div className="text-2xl font-black mt-2 text-white drop-shadow-sm truncate flex items-center gap-1">
                #{impactData?.communityRank || "New"}
              </div>
            </div>

            {/* Metric 6 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] sm:text-xs text-pink-100/80 font-bold uppercase tracking-wider flex justify-between items-center">
                Cook Rating <FaHeart className="text-pink-300 w-3 h-3" />
              </span>
              <div className="text-2xl font-black mt-2 text-white drop-shadow-sm truncate">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A"}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Level Progress Bar & Streak Grid */}
        {!isImpactLoading && impactData && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <LevelProgressBar points={impactData.impact.points} />
            </div>
            <div className="lg:col-span-1">
              <StreakWidget 
                currentStreak={impactData.streak?.currentStreak || 0} 
                longestStreak={impactData.streak?.longestStreak || 0} 
              />
            </div>
          </div>
        )}

        {/* Dedicated Badges Section */}
        {!isImpactLoading && impactData?.achievements && impactData.achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-amber-200/40 dark:border-amber-900/20 rounded-[1.5rem] p-4 sm:p-5 shadow-sm"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <FaMedal className="text-amber-500 w-4 h-4" />
                Achievements & Badges
              </h3>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                {impactData.achievements.length} Earned
              </span>
            </div>
            
            <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar">
              {impactData.achievements.map((ach) => {
                const badge = getBadge(ach.badgeId);
                const rarity = badge ? RARITY_STYLES[badge.rarity] : RARITY_STYLES.common;
                const BadgeIcon = badge?.icon || FaMedal;
                return (
                  <div 
                    key={ach.id} 
                    className={`flex-shrink-0 flex items-center gap-2.5 px-3 py-2 bg-white dark:bg-slate-800 border ${rarity.border} rounded-xl shadow-xs hover:-translate-y-0.5 transition-all cursor-default`}
                  >
                    <div className={`p-1.5 rounded-lg ${badge?.imageUrl ? "" : rarity.bg}`}>
                      {badge?.imageUrl ? (
                        <img src={badge.imageUrl} alt={badge.title} className="w-5 h-5 object-contain" />
                      ) : (
                        <BadgeIcon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-gray-800 dark:text-gray-100 leading-tight">
                        {badge?.title || ach.badgeId.replace(/_/g, " ")}
                      </span>
                      {badge && (
                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-70" style={{ color: rarity.border.includes('amber') ? '#d97706' : rarity.border.includes('purple') ? '#a855f7' : rarity.border.includes('blue') ? '#3b82f6' : '#6b7280' }}>
                          {rarity.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="flex flex-col space-y-6">
        
        {/* Interactive Mode Switcher with Horizontal Scroll container for mobile */}
        <div className="relative">
          <div className="overflow-x-auto custom-scrollbar pb-1">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800/80 rounded-2xl p-1.5 flex min-w-[440px] sm:min-w-0 shadow-sm">
              <button
                onClick={() => setActiveTab("consumer")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTab === "consumer"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <FaShoppingBag className={activeTab === "consumer" ? "text-white" : "text-blue-500"} />
                <span>Saver Mode (Reservations)</span>
                {userReservations.length > 0 && (
                  <span
                    className={`ml-1 px-2 py-0.5 text-[11px] sm:text-xs font-black rounded-full ${
                      activeTab === "consumer"
                        ? "bg-white/20 text-white"
                        : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                    }`}
                  >
                    {userReservations.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("supplier")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTab === "supplier"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <FaUtensils className={activeTab === "supplier" ? "text-white" : "text-purple-500"} />
                <span>Sharer Mode (Shared Food)</span>
                {userSharedFood.length > 0 && (
                  <span
                    className={`ml-1 px-2 py-0.5 text-[11px] sm:text-xs font-black rounded-full ${
                      activeTab === "supplier"
                        ? "bg-white/20 text-white"
                        : "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                    }`}
                  >
                    {userSharedFood.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content Section */}
        <AnimatePresence mode="wait">
          {activeTab === "consumer" && (
            <motion.div
              key="consumer-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Subtabs for Consumer with Scrollbar & Overflow Support */}
              <div className="flex items-center justify-between gap-4">
                <div className="overflow-x-auto custom-scrollbar pb-1 max-w-full">
                  <div className="flex items-center gap-2 bg-gray-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl w-max border border-gray-200/60 dark:border-slate-700/60">
                    <button
                      onClick={() => setConsumerTab("upcoming")}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        consumerTab === "upcoming"
                          ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      <FaClock className="text-xs" />
                      <span>Upcoming</span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black">
                        {upcomingReservations.length}
                      </span>
                    </button>

                    <button
                      onClick={() => setConsumerTab("past")}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        consumerTab === "past"
                          ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      <FaCheckCircle className="text-xs" />
                      <span>Past Pickups</span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black">
                        {pastReservations.length}
                      </span>
                    </button>

                    <button
                      onClick={() => setConsumerTab("cancelled")}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        consumerTab === "cancelled"
                          ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      <FaTimesCircle className="text-xs" />
                      <span>Cancelled</span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-black">
                        {cancelledReservations.length}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  <span>Showing {filteredReservations.length} reservation{filteredReservations.length === 1 ? "" : "s"}</span>
                </div>
              </div>

              {/* Reservations List with Scroll Container Effect if Overflow Occurs */}
              {filteredReservations.length === 0 ? (
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800/80 rounded-3xl p-12 text-center shadow-sm">
                  <div className="w-20 h-20 mx-auto bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mb-4 text-3xl shadow-inner">
                    <FaShoppingBag />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    No {consumerTab} reservations
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm mb-6">
                    {consumerTab === "upcoming"
                      ? "Ready to save delicious food near you and reduce food waste? Browse available meals in your area."
                      : consumerTab === "past"
                        ? "Your completed pickups and order history will appear right here."
                        : "You do not have any cancelled reservations."}
                  </p>
                  {consumerTab === "upcoming" && (
                    <Link href="/public/food">
                      <Button
                        variant="secondary"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg px-6 py-3"
                      >
                        <FaShoppingBag className="mr-2" /> Browse Food Marketplace
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <ScrollableContainer maxItemsThreshold={4}>
                  <div className="space-y-4 pr-1">
                    {filteredReservations.map((reservation, index) => (
                      <ConsumerReservationCard
                        key={reservation.id}
                        reservation={reservation}
                        index={index}
                      />
                    ))}
                  </div>
                </ScrollableContainer>
              )}

              {/* Insights Panel */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-gray-200/80 dark:border-slate-800/80 rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-blue-500/5">
                <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3 tracking-tight">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                    <FaChartLine className="text-blue-600 dark:text-blue-400 w-5 h-5" />
                  </div>
                  <span>Your Food Saver Insights</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="p-5 bg-white dark:bg-slate-800/90 rounded-3xl border border-gray-100 dark:border-slate-700/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-indigo-600 group-hover:scale-105 transition-transform origin-left">
                      {stats.favoriteRestaurants}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-wider">
                      Suppliers Visited
                    </div>
                  </div>
                  <div className="p-5 bg-white dark:bg-slate-800/90 rounded-3xl border border-gray-100 dark:border-slate-700/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-500 to-pink-600 group-hover:scale-105 transition-transform origin-left">
                      {userReservations.length}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-wider">
                      Total Reservations
                    </div>
                  </div>
                  <div className="p-5 bg-white dark:bg-slate-800/90 rounded-3xl border border-gray-100 dark:border-slate-700/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-teal-600 group-hover:scale-105 transition-transform origin-left flex items-center">
                      <FaRupeeSign className="text-xl sm:text-2xl" />
                      {(stats.moneySaved / (stats.mealsConsumed || 1)).toFixed(0)}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-wider">
                      Avg Savings per Meal
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "supplier" && (
            <motion.div
              key="supplier-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Sharer Header CTA */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-600/50 dark:to-pink-600/50 backdrop-blur-3xl rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 dark:border dark:border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl shrink-0">
                    <FaGift />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Share Your Home Cooking! 🍳</h3>
                    <p className="text-pink-100 text-sm mt-0.5">
                      Got extra wholesome food? Turn it into smiles for your neighbors.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/protected/reservation/pickup">
                    <Button className="bg-white/20 hover:bg-white/30 text-white font-bold backdrop-blur-md border border-white/30 shadow-md rounded-xl text-sm py-2.5">
                      <FaQrcode className="mr-2" /> Scanner Station
                    </Button>
                  </Link>
                  <Link href="/protected/add-food?role=individual">
                    <Button className="bg-white text-purple-700 hover:bg-white/90 font-bold shadow-md rounded-xl text-sm py-2.5">
                      <FaPlus className="mr-2" /> List New Meal
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Workflow Notice Box explaining partial reservation logic */}
              <div className="p-4 rounded-2xl bg-purple-50/80 dark:bg-slate-900/90 border border-purple-200/80 dark:border-purple-900/40 flex items-start gap-3 text-xs text-gray-600 dark:text-gray-300">
                <FaInfoCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-gray-900 dark:text-white">
                    How Surplus & Reservation Portions Work:
                  </span>{" "}
                  When you list food (e.g. 10 portions), it shows in <strong>Active Listings</strong>. If 5 portions are reserved, it remains in <strong>Active Listings</strong> (5 available) and appears in <strong>Reserved Orders</strong> (5 reserved). Incoming reservation requests become officially reserved once you confirm them.
                </div>
              </div>

              {/* Subtabs for Supplier with Scrollbar & Overflow Support */}
              <div className="flex items-center justify-between gap-4">
                <div className="overflow-x-auto custom-scrollbar pb-1 max-w-full">
                  <div className="flex items-center gap-2 bg-gray-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl w-max border border-gray-200/60 dark:border-slate-700/60">
                    <button
                      onClick={() => setSupplierTab("active")}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        supplierTab === "active"
                          ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      <FaFire className="text-xs" />
                      <span>Active Listings</span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black">
                        {activeSupplierListings.length}
                      </span>
                    </button>

                    <button
                      onClick={() => setSupplierTab("reserved")}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        supplierTab === "reserved"
                          ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      <FaClock className="text-xs" />
                      <span>Reserved Orders</span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-black">
                        {reservedSupplierListings.length}
                      </span>
                    </button>

                    <button
                      onClick={() => setSupplierTab("expired")}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        supplierTab === "expired"
                          ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      <FaTimesCircle className="text-xs" />
                      <span>Expired / Inactive</span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-black">
                        {expiredSupplierListings.length}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  <span>Showing {filteredSupplierListings.length} listing{filteredSupplierListings.length === 1 ? "" : "s"}</span>
                </div>
              </div>

              {/* Supplier Listings Grid with Scroll Container Effect if Overflow Occurs */}
              {filteredSupplierListings.length === 0 ? (
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800/80 rounded-3xl p-12 text-center shadow-sm">
                  <div className="w-20 h-20 mx-auto bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-3xl flex items-center justify-center mb-4 text-3xl shadow-inner">
                    <FaUtensils />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    No {supplierTab} food listings
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm mb-6">
                    {supplierTab === "active"
                      ? "Ready to share your cooking? List your first home-cooked meal with just a few clicks!"
                      : supplierTab === "reserved"
                        ? "No active reservations on your listings. When neighbors request portions, they will appear here."
                        : "You do not have any expired or inactive listings right now."}
                  </p>
                  {supplierTab === "active" && (
                    <Link href="/protected/add-food?role=individual">
                      <Button
                        variant="secondary"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg px-6 py-3"
                      >
                        <FaPlus className="mr-2" /> Share Your First Meal
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <ScrollableContainer maxItemsThreshold={6}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-1">
                    {filteredSupplierListings.map((food, index) => (
                      <SupplierFoodCard
                        key={food.id}
                        food={food}
                        index={index}
                        tab={supplierTab}
                      />
                    ))}
                  </div>
                </ScrollableContainer>
              )}

              {/* Performance Section */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-gray-200/80 dark:border-slate-800/80 rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-purple-500/5">
                <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3 tracking-tight">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
                    <FaChartLine className="text-purple-600 dark:text-purple-400 w-5 h-5" />
                  </div>
                  <span>Home Cook Reputation &amp; Badges</span>
                </h3>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="px-5 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2.5 border border-purple-100 dark:border-purple-800/30 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-default">
                    <FaMedal className="text-purple-600 dark:text-purple-400 w-4 h-4" />
                    <span className="tracking-wide uppercase">Verified Home Cook</span>
                  </div>
                  {stats.mealsShared > 5 && (
                    <div className="px-5 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2.5 border border-blue-100 dark:border-blue-800/30 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-default">
                      <FaAward className="text-blue-600 dark:text-blue-400 w-4 h-4" />
                      <span className="tracking-wide uppercase">Pro Sharer</span>
                    </div>
                  )}
                  {stats.avgRating > 4.5 && (
                    <div className="px-5 py-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2.5 border border-yellow-100 dark:border-yellow-800/30 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-default">
                      <FaStar className="text-yellow-500 w-4 h-4" />
                      <span className="tracking-wide uppercase">Top Rated (4.5+ ★)</span>
                    </div>
                  )}
                  <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2.5 border border-emerald-100 dark:border-emerald-800/30 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-default">
                    <FaLeaf className="text-emerald-600 dark:text-emerald-400 w-4 h-4" />
                    <span className="tracking-wide uppercase">{stats.peopleFed} Neighbors Fed</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* Bottom Section: Community Log */}
        <div className="mt-8">
          <CommunityLog />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Reusable Scrollable Container with Top/Bottom Gradient Overflow Indicators
// ---------------------------------------------------------------------

function ScrollableContainer({
  children,
  maxItemsThreshold = 4,
}: {
  children: React.ReactNode;
  maxItemsThreshold?: number;
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
        className="max-h-[750px] sm:max-h-[820px] overflow-y-auto custom-scrollbar scroll-smooth py-1"
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
            Scroll for more items
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Consumer Reservation Card
// ---------------------------------------------------------------------

function ConsumerReservationCard({
  reservation,
  index,
}: {
  reservation: ReservationDTO;
  index: number;
}) {
  const router = useRouter();
  const { cancelReservation, isCancelling } = useCancelReservation();
  const [copied, setCopied] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const handleCancel = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    try {
      await cancelReservation({ id: reservation.id });
      toast.success("Reservation cancelled");
    } catch {
      toast.error("Failed to cancel reservation");
    }
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!reservation.pickupCode) return;
    navigator.clipboard.writeText(reservation.pickupCode);
    setCopied(true);
    toast.success("Pickup code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const isUpcoming = new Date(reservation.pickupTime) > new Date();
  const isPending = reservation.status === "pending";
  const isConfirmed = reservation.status === "confirmed";
  const isPickedUp = reservation.status === "picked_up";
  const isCancelled = reservation.status === "cancelled";

  const foodImage =
    reservation.food?.images && reservation.food.images.length > 0
      ? (reservation.food.images.find((img) => img.isPrimary) || reservation.food.images[0]).url
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => router.push(`/protected/reservation/${reservation.id}`)}
      className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800/80 hover:border-blue-500/40 dark:hover:border-blue-500/40 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
    >
      <div className="flex flex-col md:flex-row">
        {/* Image / Fallback Container */}
        <div className="relative w-full md:w-64 h-48 md:h-auto bg-gray-100 dark:bg-slate-800 shrink-0 overflow-hidden">
          {foodImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={foodImage}
              alt={reservation.food?.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
              <FaShoppingBag className="w-12 h-12 text-blue-300 dark:text-slate-600" />
            </div>
          )}

          {/* Status Badge Over Image */}
          <div className="absolute top-3 left-3">
            <span
              className={`px-3 py-1 text-xs font-black rounded-full shadow-md uppercase tracking-wider backdrop-blur-md inline-flex items-center gap-1.5 ${
                isPickedUp
                  ? "bg-emerald-600 text-white"
                  : isConfirmed
                    ? "bg-emerald-500 text-white"
                    : isPending
                      ? "bg-amber-500 text-white"
                      : isCancelled
                        ? "bg-rose-500 text-white"
                        : "bg-gray-600 text-white"
              }`}
            >
              {isPickedUp && <FaCheckCircle className="w-3 h-3" />}
              {isConfirmed && <FaCheckCircle className="w-3 h-3" />}
              {isPending && <FaClock className="w-3 h-3" />}
              {isCancelled && <FaTimesCircle className="w-3 h-3" />}
              <span>{reservation.status.replace("_", " ")}</span>
            </span>
          </div>

          {/* Price Tag Over Image */}
          <div className="absolute bottom-3 right-3">
            <span className="px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md text-white text-xs font-extrabold shadow-md flex items-center gap-1">
              {reservation.totalPrice === 0 ? (
                <span className="text-emerald-400">Free Rescue</span>
              ) : (
                <>
                  <FaRupeeSign className="w-2.5 h-2.5" />
                  <span>{reservation.totalPrice}</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
              <div>
                <h4 className="font-extrabold text-gray-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {reservation.food?.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1 font-medium">
                  <FaStore className="text-blue-500" />
                  <span>Supplier: {reservation.food?.supplierName || "Community Partner"}</span>
                </p>
              </div>

              {/* Portions Box */}
              <div className="sm:text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200/60 dark:border-blue-900/60">
                  {reservation.quantity} {reservation.food?.quantityUnit || "portions"} reserved
                </span>
              </div>
            </div>

            {/* Pickup Code Highlight Card (for active/upcoming reservations) */}
            {reservation.pickupCode && !isCancelled && (
              <div className="mt-3.5 p-3 rounded-2xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200/70 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                    <FaQrcode />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 block tracking-wider">
                      Your Pickup Pass Code
                    </span>
                    <span className="font-mono font-black text-blue-700 dark:text-blue-400 text-sm tracking-wider">
                      {reservation.pickupCode}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-slate-600 shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FaCopy className="text-xs" />
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FaClock />
                </div>
                <div>
                  <span className="text-gray-400 dark:text-gray-500 block text-[10px]">
                    Pickup Window
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {formatDate(reservation.pickupTime, "PPp")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <FaMapMarkerAlt />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-gray-400 dark:text-gray-500 block text-[10px]">
                    Pickup Location
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 truncate block">
                    {reservation.pickupAddress || "Partner Supplier Location"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 mt-5 pt-3 border-t border-gray-100 dark:border-slate-800">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md text-xs py-2.5"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/protected/reservation/${reservation.id}`);
              }}
            >
              <FaQrcode className="mr-1.5" />
              View Boarding Pass &amp; QR
            </Button>

            {isUpcoming && (isConfirmed || isPending) && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs py-2.5"
                onClick={handleCancel}
                loading={isCancelling}
              >
                Cancel
              </Button>
            )}

            {isPickedUp && (
              <>
                {!reservation.hasReviewedFood && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl text-xs py-2.5"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsReviewModalOpen(true);
                    }}
                  >
                    <FaStar className="mr-1.5" />
                    Leave Review
                  </Button>
                )}
                <Link
                  href={`/protected/food/${reservation.food?.id}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl text-xs py-2.5"
                  >
                    Order Again
                  </Button>
                </Link>
                <ReviewModal
                  isOpen={isReviewModalOpen}
                  onClose={() => setIsReviewModalOpen(false)}
                  reservationId={reservation.id}
                  foodName={reservation.food?.name || "Food"}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------
// Supplier Food Card
// ---------------------------------------------------------------------

function SupplierFoodCard({
  food,
  index,
  tab,
}: {
  food: SharedFoodDTO;
  index: number;
  tab: SupplierTab;
}) {
  const router = useRouter();
  const { deleteFood, isDeleting } = useDeleteFood();

  const handleDeactivate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove "${food.name}" from listings?`)) return;
    try {
      await deleteFood(food.id);
      toast.success("Listing removed");
    } catch {
      toast.error("Failed to remove food listing");
    }
  };

  const expired = isFoodExpired(food) || !food.isActive;
  const reservedPortions =
    food.confirmedQty !== undefined
      ? food.confirmedQty
      : Math.max(0, food.quantity - food.availableQty);
  const pendingCount = food.pendingCount ?? 0;
  const hasPending = pendingCount > 0;
  const isFullyReserved = food.availableQty === 0 && reservedPortions > 0;
  const isPartiallyReserved = food.availableQty > 0 && (reservedPortions > 0 || hasPending);

  const primaryImage =
    food.images && food.images.length > 0
      ? (food.images.find((img) => img.isPrimary) || food.images[0]).url
      : null;

  // Percentage for portions bar
  const availablePct = Math.min(100, Math.max(0, (food.availableQty / (food.quantity || 1)) * 100));
  const reservedPct = Math.min(100 - availablePct, Math.max(0, (reservedPortions / (food.quantity || 1)) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => {
        if (tab === "reserved" || hasPending) {
          router.push(`/protected/food/${food.id}/requests`);
        } else {
          router.push(`/protected/food/${food.id}`);
        }
      }}
      className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800/80 hover:border-purple-500/40 dark:hover:border-purple-500/40 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group cursor-pointer ${
        tab === "expired" ? "opacity-75 grayscale-[20%]" : ""
      }`}
    >
      <div>
        {/* Card Image */}
        <div className="relative h-48 w-full bg-gradient-to-br from-purple-100 dark:from-purple-950 to-pink-100 dark:to-pink-950 overflow-hidden">
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage}
              alt={food.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-purple-300 dark:text-purple-700">
              <FaUtensils className="w-12 h-12" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span
              className={`px-3 py-1 text-xs font-black rounded-full shadow-md backdrop-blur-md uppercase tracking-wider ${
                expired
                  ? "bg-rose-500/95 text-white"
                  : isFullyReserved
                    ? "bg-amber-500/95 text-white"
                    : isPartiallyReserved
                      ? "bg-blue-600/95 text-white"
                      : "bg-emerald-500/95 text-white"
              }`}
            >
              {expired
                ? "Expired"
                : isFullyReserved
                  ? "Fully Reserved"
                  : isPartiallyReserved
                    ? `Partially Reserved (${food.availableQty} Left)`
                    : "Active"}
            </span>
          </div>

          {/* Home Cook Badge */}
          {food.isHomeCooked && (
            <span className="absolute top-3 left-3 px-3 py-1 bg-purple-900/85 backdrop-blur-md text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-md">
              <FaHome size={11} />
              <span>Home Cook</span>
            </span>
          )}

          {/* Pending Requests Alert Pill (Pulsing badge) */}
          {hasPending && (
            <div className="absolute bottom-3 left-3 right-3">
              <span className="w-full px-3 py-1.5 bg-amber-500/95 backdrop-blur-md text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-lg animate-pulse">
                <span>🔔</span>
                <span>{pendingCount} Pending Request{pendingCount === 1 ? "" : "s"} Waiting!</span>
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-5">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h4 className="font-extrabold text-gray-900 dark:text-white text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                {food.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1 font-medium">
                {food.description || "Fresh home-cooked surplus meal"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="font-extrabold text-gray-900 dark:text-white text-base">
                {food.isDonation ? (
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-black">Free Donation</span>
                ) : (
                  formatPrice(food.price)
                )}
              </div>
              {food.discountPct > 0 && !food.isDonation && (
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {food.discountPct}% OFF
                </div>
              )}
            </div>
          </div>

          {/* Visual Portions Availability Bar */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-gray-500 dark:text-gray-400">Portions Status:</span>
              <span className="text-gray-900 dark:text-white">
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{food.availableQty}</span>
                <span className="text-gray-400 font-normal"> / {food.quantity} {food.quantityUnit} left</span>
              </span>
            </div>

            {/* Multi-segment Progress Bar */}
            <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${availablePct}%` }}
                title={`Available: ${food.availableQty}`}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${reservedPct}%` }}
                title={`Reserved: ${reservedPortions}`}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-gray-500 dark:text-gray-400 mt-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Available: {food.availableQty}
              </span>
              {reservedPortions > 0 && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Reserved: {reservedPortions}
                </span>
              )}
            </div>
          </div>

          {/* Expiry Countdown */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <FaClock className="text-gray-400" />
              <span>Expires:</span>
            </span>
            <span
              className={`font-bold ${
                expired
                  ? "text-rose-500"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {formatTimeRemaining(food.expiresAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-5 pt-0 flex gap-2" onClick={(e) => e.stopPropagation()}>
        {tab === "active" && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs py-2.5"
              onClick={handleDeactivate}
              loading={isDeleting}
            >
              <FaTimesCircle className="mr-1" />
              Remove
            </Button>

            {hasPending ? (
              <Link href={`/protected/food/${food.id}/requests`} className="flex-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-xs py-2.5 shadow-md"
                >
                  Review ({pendingCount})
                </Button>
              </Link>
            ) : (
              <Link href={`/protected/food/${food.id}`} className="flex-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl text-xs py-2.5 shadow-md"
                >
                  View Food
                </Button>
              </Link>
            )}
          </>
        )}

        {tab === "reserved" && (
          <>
            <Link href={`/protected/food/${food.id}/requests`} className="flex-2">
              <Button
                size="sm"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs py-2.5 shadow-md"
              >
                Manage Requests ({reservedPortions + pendingCount})
              </Button>
            </Link>
            <Link href="/protected/reservation/pickup" className="flex-1">
              <Button
                size="sm"
                variant="outline"
                className="w-full border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-bold rounded-xl text-xs py-2.5"
              >
                <FaQrcode className="mr-1" /> Scan
              </Button>
            </Link>
          </>
        )}

        {tab === "expired" && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs py-2.5"
              onClick={handleDeactivate}
              loading={isDeleting}
            >
              Delete
            </Button>
            <Link href={`/protected/food/${food.id}`} className="flex-1">
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs py-2.5 rounded-xl border-gray-300 dark:border-slate-700 font-bold"
              >
                Details
              </Button>
            </Link>
          </>
        )}
      </div>
    </motion.div>
  );
}
