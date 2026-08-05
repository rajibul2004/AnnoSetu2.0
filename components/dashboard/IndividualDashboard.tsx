"use client";

import { useState, useMemo } from "react";
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
  FaUsers,
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
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Button from "@/components/common/Button";
import { formatDate, formatTimeRemaining, formatPrice } from "@/lib/formatters";
import { useAuth } from "@/hooks/useAuth";
import { useMyReservations, useCancelReservation } from "@/hooks/useReservationQueries";
import { useMySharedFood, useDeleteFood } from "@/hooks/useFoodQueries";
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
  communityRank: number;
  impactBadges: string[];
}

function calculateStats(
  reservedFoods: ReservationDTO[],
  sharedFoods: SharedFoodDTO[],
): DashboardStats {
  const completedReservations = reservedFoods.filter((r) => r.status === "picked_up");
  const totalMealsConsumed = completedReservations.reduce((sum, r) => sum + r.quantity, 0);

  const totalMoneySaved = completedReservations.reduce((sum, r) => {
    if (r.food?.originalPrice) {
      return sum + Math.max(0, r.food.originalPrice * r.quantity - (r.totalPrice || 0));
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
    co2Reduced: totalMealsConsumed * 2.5,
    favoriteRestaurants: new Set(
      completedReservations.map((r) => r.food?.supplierId),
    ).size,
    mealsShared: totalMealsShared,
    peopleFed: totalMealsShared * 2,
    earnings: totalEarnings,
    avgRating,
    totalImpact: totalMealsConsumed + totalMealsShared,
    communityRank: 42,
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

  const isLoading = isReservationsLoading || isMySharedLoading;

  const stats = useMemo(
    () => calculateStats(userReservations, userSharedFood),
    [userReservations, userSharedFood],
  );

  const filteredReservations = userReservations.filter((res) => {
    const now = new Date();
    const pickupTime = new Date(res.pickupTime);

    switch (consumerTab) {
      case "upcoming":
        return (
          (res.status === "confirmed" || res.status === "pending") &&
          pickupTime > now
        );
      case "past":
        return res.status === "picked_up" || pickupTime <= now;
      case "cancelled":
        return res.status === "cancelled";
      default:
        return true;
    }
  });

  const filteredListings = userSharedFood.filter((food) => {
    switch (supplierTab) {
      case "active":
        return food.isActive && !isFoodExpired(food) && food.availableQty > 0;
      case "reserved":
        return food.quantity > food.availableQty;
      case "expired":
        return isFoodExpired(food) || !food.isActive;
      default:
        return true;
    }
  });

  const upcomingPickups = userReservations.filter(
    (r) =>
      (r.status === "confirmed" || r.status === "pending") &&
      new Date(r.pickupTime) > new Date(),
  ).length;

  const activeListings = userSharedFood.filter(
    (f) => f.isActive && !isFoodExpired(f) && f.availableQty > 0,
  ).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <LoadingSpinner text="Loading your dashboard..." />
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] ?? "Friend";

  return (
    <div className="min-h-screen bg-transparent pb-16 pt-24 sm:pt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl p-6 sm:p-10 mb-8 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-700 text-white shadow-2xl overflow-hidden border border-white/10"
        >
          {/* Subtle Ambient Light Gradients */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-pink-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="w-18 h-18 sm:w-20 sm:h-20 bg-white/15 backdrop-blur-md rounded-2xl p-1 border border-white/20 flex items-center justify-center text-3xl shadow-inner">
                {stats.avgRating >= 4.5 ? (
                  <FaTrophy className="text-yellow-300 w-10 h-10" />
                ) : (
                  <FaHeart className="text-pink-200 w-10 h-10" />
                )}
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-2 border border-white/20">
                  <FaShieldAlt className="text-emerald-300" />
                  <span>Individual Partner • Saver &amp; Sharer</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  Welcome back, {firstName}! ✨
                </h1>
                <p className="text-pink-100/90 text-sm sm:text-base mt-1 flex items-center gap-2 font-medium">
                  <FaExchangeAlt className="opacity-80" />
                  Making a greener difference in your local community
                </p>
              </div>
            </div>

            {/* Badges & Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/public/food">
                <Button className="bg-white text-gray-900 hover:bg-white/90 font-bold shadow-lg text-sm rounded-xl py-2.5">
                  <FaShoppingBag className="mr-2 text-pink-600" />
                  Save Food
                </Button>
              </Link>
              <Link href="/protected/add-food?role=individual">
                <Button className="bg-white/20 hover:bg-white/30 text-white font-bold backdrop-blur-md border border-white/30 shadow-lg text-sm rounded-xl py-2.5">
                  <FaPlus className="mr-2 text-yellow-300" />
                  Share Meals
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/15 relative z-10">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all">
              <span className="text-xs text-pink-100/80 font-medium">Total Impact</span>
              <div className="text-2xl sm:text-3xl font-extrabold mt-0.5">
                {stats.totalImpact} <span className="text-sm font-normal">Meals</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all">
              <span className="text-xs text-pink-100/80 font-medium">CO₂ Footprint Saved</span>
              <div className="text-2xl sm:text-3xl font-extrabold mt-0.5 text-emerald-300">
                {stats.co2Reduced} <span className="text-sm font-normal">kg</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all">
              <span className="text-xs text-pink-100/80 font-medium">Community Rank</span>
              <div className="text-2xl sm:text-3xl font-extrabold mt-0.5 text-yellow-300">
                #{stats.communityRank}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all">
              <span className="text-xs text-pink-100/80 font-medium">Cook Rating</span>
              <div className="text-2xl sm:text-3xl font-extrabold mt-0.5 flex items-center gap-1.5">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "New"}
                <FaStar className="text-yellow-300 text-base" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Role Overview Dual Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Consumer (Food Saver) Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-blue-100 dark:border-blue-900/40">
                  <FaShoppingBag />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Food Saver Profile
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Rescuing quality food &amp; saving money
                  </p>
                </div>
              </div>
              <Link href="/public/food">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl"
                >
                  Browse Food <FaArrowRight className="ml-1 text-xs" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3.5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl text-center border border-gray-100 dark:border-slate-700/50">
                <div className="text-2xl font-black text-gray-900 dark:text-white">
                  {stats.mealsConsumed}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                  Meals Saved
                </div>
              </div>
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl text-center border border-emerald-100 dark:border-emerald-900/40">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  ₹{stats.moneySaved.toFixed(0)}
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5 font-medium">
                  Money Saved
                </div>
              </div>
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl text-center border border-indigo-100 dark:border-indigo-900/40">
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {stats.co2Reduced}kg
                </div>
                <div className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5 font-medium">
                  CO₂ Cut
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/30 text-sm">
              <span className="text-blue-900 dark:text-blue-200 font-semibold flex items-center gap-2">
                <FaClock className="text-blue-500" /> Upcoming Pickups
              </span>
              <span className="font-extrabold text-blue-600 dark:text-blue-400 text-base">
                {upcomingPickups}
              </span>
            </div>
          </motion.div>

          {/* Supplier (Home Cook) Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-purple-100 dark:border-purple-900/40">
                  <FaUtensils />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Home Cook &amp; Sharer
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Sharing extra meals with neighbors
                  </p>
                </div>
              </div>
              <Link href="/protected/add-food?role=individual">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-xl"
                >
                  <FaPlus className="mr-1 text-xs" /> Share Food
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3.5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl text-center border border-gray-100 dark:border-slate-700/50">
                <div className="text-2xl font-black text-gray-900 dark:text-white">
                  {stats.mealsShared}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                  Meals Shared
                </div>
              </div>
              <div className="p-3.5 bg-pink-50 dark:bg-pink-950/30 rounded-2xl text-center border border-pink-100 dark:border-pink-900/40">
                <div className="text-2xl font-black text-pink-600 dark:text-pink-400">
                  {stats.peopleFed}
                </div>
                <div className="text-xs text-pink-700 dark:text-pink-300 mt-0.5 font-medium">
                  People Fed
                </div>
              </div>
              <div className="p-3.5 bg-yellow-50 dark:bg-yellow-950/30 rounded-2xl text-center border border-yellow-100 dark:border-yellow-900/40">
                <div className="text-2xl font-black text-yellow-600 dark:text-yellow-400 flex items-center justify-center gap-1">
                  {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "5.0"}
                  <FaStar className="text-xs" />
                </div>
                <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5 font-medium">
                  Rating
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-100 dark:border-purple-900/30 text-sm">
              <span className="text-purple-900 dark:text-purple-200 font-semibold flex items-center gap-2">
                <FaFire className="text-purple-500" /> Active Food Listings
              </span>
              <span className="font-extrabold text-purple-600 dark:text-purple-400 text-base">
                {activeListings}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Interactive Mode Switcher Tabs */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800/80 rounded-2xl p-1.5 flex mb-8 shadow-sm">
          <button
            onClick={() => setActiveTab("consumer")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === "consumer"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <FaShoppingBag />
            <span>My Food Reservations (Saver Mode)</span>
            {userReservations.length > 0 && (
              <span
                className={`ml-1.5 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === "consumer"
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {userReservations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("supplier")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === "supplier"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <FaUtensils />
            <span>My Shared Foods (Sharer Mode)</span>
            {userSharedFood.length > 0 && (
              <span
                className={`ml-1.5 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === "supplier"
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {userSharedFood.length}
              </span>
            )}
          </button>
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
              {/* Subtabs for Consumer */}
              <div className="flex items-center gap-2 bg-gray-100/80 dark:bg-slate-800/80 p-1.5 rounded-2xl w-fit">
                {(["upcoming", "past", "cancelled"] as ConsumerTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setConsumerTab(tab)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold capitalize transition-all cursor-pointer ${
                      consumerTab === tab
                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    {tab} {tab === "upcoming" && `(${upcomingPickups})`}
                  </button>
                ))}
              </div>

              {/* Reservations List */}
              {filteredReservations.length === 0 ? (
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800/80 rounded-3xl p-12 text-center shadow-sm">
                  <div className="w-20 h-20 mx-auto bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mb-4 text-3xl">
                    <FaShoppingBag />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    No {consumerTab} reservations
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm mb-6">
                    {consumerTab === "upcoming"
                      ? "Ready to save delicious food near you and reduce food waste?"
                      : "Your completed pickups and order history will appear right here."}
                  </p>
                  {consumerTab === "upcoming" && (
                    <Link href="/public/food">
                      <Button 
                      variant="secondary"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg">
                        Browse Food Marketplace
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReservations.map((reservation, index) => (
                    <ConsumerReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      index={index}
                    />
                  ))}
                </div>
              )}

              {/* Insights Panel */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaChartLine className="text-blue-600 dark:text-blue-400" />
                  <span>Your Food Saver Insights</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                    <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                      {stats.favoriteRestaurants}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Suppliers Visited
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                    <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
                      {userReservations.length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Total Reservations
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                    <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₹{(stats.moneySaved / (stats.mealsConsumed || 1)).toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl">
                    <FaGift />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Share Your Home Cooking! 🍳</h3>
                    <p className="text-pink-100 text-sm mt-0.5">
                      Got extra wholesome food? Turn it into smiles for your neighbors.
                    </p>
                  </div>
                </div>
                <Link href="/protected/add-food?role=individual">
                  <Button className="bg-white text-purple-700 hover:bg-white/90 font-bold shadow-md rounded-xl text-sm py-2.5">
                    <FaPlus className="mr-2" /> List Food
                  </Button>
                </Link>
              </div>

              {/* Subtabs for Supplier */}
              <div className="flex items-center gap-2 bg-gray-100/80 dark:bg-slate-800/80 p-1.5 rounded-2xl w-fit">
                {(["active", "reserved", "expired"] as SupplierTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSupplierTab(tab)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold capitalize transition-all cursor-pointer ${
                      supplierTab === tab
                        ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    {tab} {tab === "active" && `(${activeListings})`}
                  </button>
                ))}
              </div>

              {/* Supplier Listings Grid */}
              {filteredListings.length === 0 ? (
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800/80 rounded-3xl p-12 text-center shadow-sm">
                  <div className="w-20 h-20 mx-auto bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-3xl flex items-center justify-center mb-4 text-3xl">
                    <FaUtensils />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    No {supplierTab} food listings
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm mb-6">
                    {supplierTab === "active"
                      ? "Ready to share your cooking? List your first home-cooked meal with just a few clicks!"
                      : `You do not have any ${supplierTab} listings right now.`}
                  </p>
                  {supplierTab === "active" && (
                    <Link href="/protected/add-food?role=individual">
                      <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg">
                        <FaPlus className="mr-2" /> Share Your First Meal
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredListings.map((food, index) => (
                    <SupplierFoodCard
                      key={food.id}
                      food={food}
                      index={index}
                      tab={supplierTab}
                    />
                  ))}
                </div>
              )}

              {/* Performance Section */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaChartLine className="text-purple-600 dark:text-purple-400" />
                  <span>Home Cook Reputation &amp; Badges</span>
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="px-4 py-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-2xl text-xs font-bold flex items-center gap-2 border border-purple-100 dark:border-purple-900/40">
                    <FaMedal />
                    <span>Verified Home Cook</span>
                  </div>
                  {stats.mealsShared > 5 && (
                    <div className="px-4 py-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-2xl text-xs font-bold flex items-center gap-2 border border-blue-100 dark:border-blue-900/40">
                      <FaAward />
                      <span>Pro Sharer</span>
                    </div>
                  )}
                  {stats.avgRating > 4.5 && (
                    <div className="px-4 py-2.5 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 rounded-2xl text-xs font-bold flex items-center gap-2 border border-yellow-100 dark:border-yellow-900/40">
                      <FaStar />
                      <span>Top Rated (4.5+ ★)</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    await cancelReservation({ id: reservation.id }).catch(() => {});
  };

  const isUpcoming = new Date(reservation.pickupTime) > new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
    >
      <div className="flex flex-col md:flex-row">
        {/* Image / Fallback Container */}
        <div className="relative w-full md:w-56 h-48 md:h-auto bg-gray-100 dark:bg-slate-800 shrink-0 overflow-hidden">
          {reservation.food?.images && reservation.food.images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={reservation.food.images[0].url}
              alt={reservation.food?.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
              <FaShoppingBag className="w-12 h-12 text-blue-300 dark:text-slate-600" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span
              className={`px-3 py-1 text-xs font-black rounded-full shadow-md uppercase tracking-wider backdrop-blur-md ${
                reservation.status === "confirmed"
                  ? "bg-emerald-500/90 text-white"
                  : reservation.status === "cancelled"
                    ? "bg-red-500/90 text-white"
                    : "bg-amber-500/90 text-white"
              }`}
            >
              {reservation.status}
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
                  <span>{reservation.food?.supplierName}</span>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 flex items-center sm:justify-end">
                  <FaRupeeSign className="text-xs opacity-80" />
                  {reservation.totalPrice}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Qty: {reservation.quantity} {reservation.food?.quantityUnit}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FaClock />
                </div>
                <div>
                  <span className="text-gray-400 dark:text-gray-500 block text-[10px]">
                    Pickup Time
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {formatDate(reservation.pickupTime, "PPp")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <FaMapMarkerAlt />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-gray-400 dark:text-gray-500 block text-[10px]">
                    Location
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 truncate block">
                    {reservation.pickupAddress}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 mt-5 pt-3">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md text-xs py-2.5"
              onClick={() =>
                router.push(`/protected/reservation/${reservation.id}`)
              }
            >
              View Pickup Details
            </Button>

            {isUpcoming && reservation.status === "confirmed" && (
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
  const { deleteFood, isDeleting } = useDeleteFood();

  const handleDeactivate = async () => {
    if (!window.confirm("Remove this food listing?")) return;
    await deleteFood(food.id).catch(() => {});
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between ${
        tab === "expired" ? "opacity-75 grayscale-[20%]" : ""
      }`}
    >
      <div>
        {/* Card Image */}
        <div className="relative h-44 w-full bg-gradient-to-br from-purple-100 dark:from-purple-950 to-pink-100 dark:to-pink-950 overflow-hidden">
          {food.images && food.images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={(food.images.find((img) => img.isPrimary) ?? food.images[0]).url}
              alt={food.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FaUtensils className="w-10 h-10 text-purple-300 dark:text-purple-700" />
            </div>
          )}

          {/* Status Badge */}
          <span
            className={`absolute top-3 right-3 px-3 py-1 text-xs font-black rounded-full shadow-md backdrop-blur-md uppercase tracking-wider ${
              isFoodExpired(food)
                ? "bg-red-500/90 text-white"
                : food.quantity > food.availableQty
                  ? "bg-amber-500/90 text-white"
                  : "bg-emerald-500/90 text-white"
            }`}
          >
            {isFoodExpired(food)
              ? "Expired"
              : food.quantity > food.availableQty
                ? "Reserved"
                : "Active"}
          </span>

          {food.isHomeCooked && (
            <span className="absolute top-3 left-3 px-3 py-1 bg-purple-900/80 backdrop-blur-md text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-md">
              <FaHome size={10} />
              <span>Home Cook</span>
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-5">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white text-base line-clamp-1">
                {food.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                {food.description}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="font-extrabold text-gray-900 dark:text-white text-base">
                {formatPrice(food.price)}
              </div>
              {food.discountPct > 0 && (
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {food.discountPct}% OFF
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 text-xs">
            <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
              <span className="text-gray-400 dark:text-gray-500">Available:</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {food.availableQty} / {food.quantity} {food.quantityUnit}
              </span>
            </div>

            <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
              <span className="text-gray-400 dark:text-gray-500">Expires in:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {formatTimeRemaining(food.expiresAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="p-5 pt-0 flex gap-2">
        {tab === "active" && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs py-2"
              onClick={handleDeactivate}
              loading={isDeleting}
            >
              <FaTimesCircle className="mr-1" />
              Remove
            </Button>
            <Link href={`/protected/food/${food.id}`} className="flex-1">
              <Button
                size="sm"
                variant="secondary"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl text-xs py-2 shadow-md"
              >
                View
              </Button>
            </Link>
          </>
        )}
        {tab === "reserved" && (
          <Link href={`/protected/food/${food.id}/requests`} className="flex-1">
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-xs py-2 shadow-md"
            >
              Manage Reservations
            </Button>
          </Link>
        )}
        {tab === "expired" && (
          <Link href={`/protected/food/${food.id}`} className="flex-1">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs py-2 rounded-xl"
            >
              Details
            </Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
}
