"use client";
 
import { useEffect, useState } from "react";
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
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Button from "@/components/common/Button";
import { formatDate, formatTimeRemaining, formatPrice } from "@/lib/formatters";
import { useAuth } from "@/hooks/useAuth";
import { useMyReservations, useCancelReservation } from "@/hooks/useReservationQueries";
import { useMySharedFood, useDeleteFood } from "@/hooks/useFoodQueries";
import type { ReservationDTO } from "@/types/reservation";
import { isFoodExpired, isFoodReserved, type SharedFoodDTO } from "@/types/food";
 
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
 
const EMPTY_STATS: DashboardStats = {
  mealsConsumed: 0,
  moneySaved: 0,
  co2Reduced: 0,
  favoriteRestaurants: 0,
  mealsShared: 0,
  peopleFed: 0,
  earnings: 0,
  avgRating: 0,
  totalImpact: 0,
  // Not backed by any real ranking system yet — the original hardcoded
  // this to 42 too. Kept as a placeholder rather than inventing a
  // leaderboard query; flag if you want this wired up for real.
  communityRank: 42,
  impactBadges: ["newcomer"],
};
 
function calculateStats(
  reservedFoods: ReservationDTO[],
  sharedFoods: SharedFoodDTO[],
): DashboardStats {
  const completedReservations = reservedFoods.filter((r) => r.status === "picked_up");
  const totalMealsConsumed = completedReservations.reduce((sum, r) => sum + r.quantity, 0);
  const totalMoneySaved = completedReservations.reduce((sum, r) => {
    if (r.food?.originalPrice && r.totalPrice) {
      return sum + (r.food.originalPrice - r.totalPrice);
    }
    return sum + (r.totalPrice || 0);
  }, 0);
 
  const completedListings = sharedFoods.filter((l) => isFoodReserved(l) || isFoodExpired(l));
  const totalMealsShared = completedListings.reduce((sum, l) => sum + l.quantity, 0);
  const totalEarnings = sharedFoods
    .filter((l) => !l.isDonation && isFoodReserved(l))
    .reduce((sum, l) => sum + (l.price || 0), 0);
 
  // Food caches averageRating/reviewCount directly — no need to fetch a
  // nested reviews array just to check "has this been reviewed".
  const ratedListings = sharedFoods.filter((l) => l.reviewCount > 0);
  const avgRating =
    ratedListings.length > 0
      ? ratedListings.reduce((sum, l) => sum + (l.averageRating || 0), 0) / ratedListings.length
      : 0;
 
  return {
    mealsConsumed: totalMealsConsumed,
    moneySaved: totalMoneySaved,
    co2Reduced: totalMealsConsumed * 2.5,
    favoriteRestaurants: new Set(reservedFoods.map((r) => r.food?.supplierId)).size,
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
  const [showWelcome, setShowWelcome] = useState(true);
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
 
  const { reservations: userReservations, isLoading: isReservationsLoading } = useMyReservations();
  const { mySharedFood: userSharedFood, isLoading: isMySharedLoading } = useMySharedFood();
 
  const isLoading = isReservationsLoading || isMySharedLoading;
 
  useEffect(() => {
    if (!isLoading) {
      setStats(calculateStats(userReservations, userSharedFood));
    }
  }, [userReservations, userSharedFood, isLoading]);
 
  const filteredReservations = userReservations.filter((res) => {
    const now = new Date();
    const pickupTime = new Date(res.pickupTime);
 
    switch (consumerTab) {
      case "upcoming":
        return res.status === "confirmed" && pickupTime > now;
      case "past":
        return res.status === "picked_up" || res.status === "cancelled" || pickupTime <= now;
      case "cancelled":
        return res.status === "cancelled";
      default:
        return true;
    }
  });
 
  const filteredListings = userSharedFood.filter((food) => {
    switch (supplierTab) {
      case "active":
        return food.isActive && !isFoodExpired(food) && !isFoodReserved(food);
      case "reserved":
        return isFoodReserved(food);
      case "expired":
        return isFoodExpired(food) || !food.isActive;
      default:
        return true;
    }
  });
 
  const upcomingPickups = userReservations.filter(
    (r) => r.status === "confirmed" && new Date(r.pickupTime) > new Date(),
  ).length;
 
  const activeListings = userSharedFood.filter(
    (f) => f.isActive && !isFoodExpired(f) && !isFoodReserved(f),
  ).length;
 
  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <LoadingSpinner text="Loading your dashboard..." />
      </div>
    );
  }
 
  const firstName = user?.name?.split(" ")[0] ?? "there";
 
  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Toast */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-20 right-4 z-40 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4 border-l-4 border-pink-500 max-w-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-linear-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                  <FaHeart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    Welcome back, {firstName}! 🎉
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    You have {upcomingPickups} upcoming pickups
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
 
        {/* Header with Dual Role Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-r from-pink-600 via-purple-600 to-blue-600 rounded-3xl shadow-2xl p-8 mb-8 mt-20 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gray-600 rounded-full"></div>
          </div>
 
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                {stats.avgRating >= 4.5 ? (
                  <FaTrophy className="w-10 h-10 text-yellow-300" />
                ) : (
                  <FaHome className="w-10 h-10" />
                )}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Hey {firstName}! 👋</h1>
                <p className="text-white/90 flex items-center gap-2">
                  <FaExchangeAlt className="w-4 h-4" />
                  You&apos;re making a difference as both a saver &amp; sharer
                </p>
              </div>
            </div>
 
            <div className="flex flex-wrap gap-2">
              {stats.impactBadges.includes("food-saver") && (
                <div className="bg-green-500/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 border border-white/30">
                  <FaLeaf className="w-4 h-4" />
                  <span className="text-sm">Food Saver</span>
                </div>
              )}
              {stats.impactBadges.includes("food-sharer") && (
                <div className="bg-purple-500/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 border border-white/30">
                  <FaHeart className="w-4 h-4" />
                  <span className="text-sm">Food Sharer</span>
                </div>
              )}
              {stats.avgRating > 4.5 && (
                <div className="bg-yellow-500/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 border border-white/30">
                  <FaStar className="w-4 h-4" />
                  <span className="text-sm">Top Rated</span>
                </div>
              )}
            </div>
          </div>
 
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-bold">{stats.totalImpact}</div>
              <div className="text-xs text-white/80">Total Impact</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-bold">{stats.co2Reduced}kg</div>
              <div className="text-xs text-white/80">CO₂ Saved</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-bold">#{stats.communityRank}</div>
              <div className="text-xs text-white/80">Community Rank</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-bold">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "New"}
              </div>
              <div className="text-xs text-white/80">Avg Rating</div>
            </div>
          </div>
        </motion.div>
 
        {/* Role Stats Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Consumer Stats Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-linear-to-br from-blue-50 dark:from-blue-950 to-blue-100 dark:to-blue-900 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-6 relative overflow-hidden group hover:shadow-xl transition-all"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 dark:bg-blue-700 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform"></div>
 
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-linear-to-br from-blue-500 dark:from-blue-400 to-blue-600 dark:to-blue-300 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                    <FaShoppingBag className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Food Saver
                  </h3>
                </div>
                <Link href="/">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900"
                  >
                    Browse Food
                  </Button>
                </Link>
              </div>
 
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-white/60 dark:bg-gray-900/60 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.mealsConsumed}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Meals Saved</div>
                </div>
                <div className="text-center p-3 bg-white/60 dark:bg-gray-900/60 rounded-xl">
                  <div className="text-xl font-bold text-green-600">
                    ₹{stats.moneySaved.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Money Saved</div>
                </div>
                <div className="text-center p-3 bg-white/60 dark:bg-gray-900/60 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                    {stats.co2Reduced}kg
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">CO₂ Reduced</div>
                </div>
              </div>
 
              <div className="flex justify-between items-center text-sm bg-white/60 dark:bg-gray-900/60 p-3 rounded-xl">
                <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                  <FaClock className="text-blue-500 dark:text-blue-300" />
                  Upcoming pickups:
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-300 text-lg">
                  {upcomingPickups}
                </span>
              </div>
            </div>
          </motion.div>
 
          {/* Supplier Stats Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-linear-to-br from-purple-50 dark:from-purple-950 to-pink-100 dark:to-pink-900 border-2 border-purple-200 dark:border-purple-700 rounded-2xl p-6 relative overflow-hidden group hover:shadow-xl transition-all"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 dark:bg-purple-700 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform"></div>
 
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-linear-to-br from-purple-500 dark:from-purple-400 to-pink-600 dark:to-pink-300 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                    <FaUtensils className="w-6 h-6 text-white dark:text-gray-900" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Food Sharer
                  </h3>
                </div>
                <Link href="/user/add-food">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900"
                  >
                    <FaPlus className="mr-1" /> Share Food
                  </Button>
                </Link>
              </div>
 
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-white/60 dark:bg-gray-900/60 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.mealsShared}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Meals Shared</div>
                </div>
                <div className="text-center p-3 bg-white/60 dark:bg-gray-900/60 rounded-xl">
                  <div className="text-2xl font-bold text-yellow-600">{stats.peopleFed}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">People Fed</div>
                </div>
                <div className="text-center p-3 bg-white/60 dark:bg-gray-900/60 rounded-xl">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-300">
                    {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "New"}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center justify-center">
                    <FaStar className="text-yellow-500 dark:text-yellow-400 mr-1" /> Rating
                  </div>
                </div>
              </div>
 
              <div className="flex justify-between items-center text-sm bg-white/60 dark:bg-gray-900/60 p-3 rounded-xl">
                <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                  <FaFire className="text-orange-500 dark:text-orange-400" />
                  Active listings:
                </span>
                <span className="font-bold text-purple-600 dark:text-purple-300 text-lg">
                  {activeListings}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
 
        <div className="mb-8">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-lg p-2 flex">
            <button
              onClick={() => setActiveTab("consumer")}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === "consumer"
                  ? "bg-gradient-to-r from-blue-500 dark:from-blue-400 to-blue-600 dark:to-blue-300 text-white dark:text-gray-900 shadow-md"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              }`}
            >
              <FaShoppingBag className="mr-2" />
              <span>Food Saver</span>
              {stats.mealsConsumed > 0 && (
                <span className="ml-2 bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-100 text-xs px-2 py-1 rounded-full">
                  {stats.mealsConsumed}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("supplier")}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === "supplier"
                  ? "bg-gradient-to-r from-purple-500 dark:from-purple-400 to-pink-600 dark:to-pink-300 text-white dark:text-gray-900 shadow-md"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              }`}
            >
              <FaUtensils className="mr-2" />
              <span>Food Sharer</span>
              {stats.mealsShared > 0 && (
                <span className="ml-2 bg-purple-200 dark:bg-purple-700 text-purple-800 dark:text-purple-100 text-xs px-2 py-1 rounded-full">
                  {stats.mealsShared}
                </span>
              )}
            </button>
          </div>
        </div>
 
        {/* Impact Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500 dark:from-green-400 to-emerald-600 dark:to-emerald-300 rounded-2xl p-8 mb-8 text-white dark:text-gray-900 relative overflow-hidden"
        >
          <div className="relative flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-16 h-16 bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
                <FaLeaf className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Amazing Impact!</h3>
                <p className="text-green-100 dark:text-green-800 mt-1">
                  You&apos;ve helped save{" "}
                  <span className="font-bold text-2xl">{stats.totalImpact}</span> meals from
                  going to waste
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold">#{stats.communityRank}</div>
                <div className="text-xs text-green-100 dark:text-green-800">Community Rank</div>
              </div>
              <div className="h-12 w-px bg-white/30 dark:bg-gray-900/30"></div>
              <Link href="/impact">
                <Button
                  variant="outline"
                  className="border-white dark:border-gray-900 text-white dark:text-gray-900 hover:bg-white/20 hover:bg-gray-900/20"
                >
                  View Full Impact
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
 
        <AnimatePresence mode="wait">
          {activeTab === "consumer" && (
            <motion.div
              key="consumer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-1 flex flex-wrap">
                {(["upcoming", "past", "cancelled"] as ConsumerTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setConsumerTab(tab)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm capitalize transition-all ${
                      consumerTab === tab
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                        : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 cursor-pointer"
                    }`}
                  >
                    {tab} {tab === "upcoming" && `(${upcomingPickups})`}
                  </button>
                ))}
              </div>
 
              {filteredReservations.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-12 text-center">
                  <div className="w-24 h-24 mx-auto bg-linear-to-br from-blue-100 dark:from-blue-900 to-purple-100 dark:to-purple-900 rounded-full flex items-center justify-center mb-4">
                    <FaShoppingBag className="w-12 h-12 text-blue-600 dark:text-blue-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
                    No {consumerTab} reservations
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                    {consumerTab === "upcoming"
                      ? "Ready to save some food? Check out what's available near you!"
                      : "Your reservation history will appear here once you start saving food."}
                  </p>
                  {consumerTab === "upcoming" && (
                    <Link href="/">
                      <Button>Browse Available Food</Button>
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
 
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
                  <FaChartLine className="text-blue-600 dark:text-blue-300" />
                  Your Food Saving Insights
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-300 mb-1">
                      {stats.favoriteRestaurants}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Suppliers Visited
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-300 mb-1">
                      {userReservations.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Total Orders</div>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-300 mb-1">
                      ₹{(stats.moneySaved / (stats.mealsConsumed || 1)).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Avg Savings/Meal
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
 
          {activeTab === "supplier" && (
            <motion.div
              key="supplier"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-linear-to-r from-purple-600 dark:from-purple-300 via-pink-600 dark:via-pink-300 to-orange-600 dark:to-orange-100 rounded-2xl p-6 text-white dark:text-gray-900 relative overflow-hidden">
                <div className="relative flex flex-col md:flex-row justify-between items-center">
                  <div className="flex items-center mb-4 md:mb-0">
                    <div className="w-16 h-16 bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
                      <FaGift className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Share Your Home-Cooked Love! 🍳</h3>
                      <p className="text-pink-100 dark:text-pink-800 ">
                        Got extra food? Turn it into smiles for others!
                      </p>
                    </div>
                  </div>
                  <Link href="/user/add-food">
                    <Button className="bg-white dark:bg-gray-900 text-purple-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900 shadow-lg">
                      <FaPlus className="mr-2" />
                      List New Food
                    </Button>
                  </Link>
                </div>
              </div>
 
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-1 flex flex-wrap">
                {(["active", "reserved", "expired"] as SupplierTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSupplierTab(tab)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm capitalize transition-all ${
                      supplierTab === tab
                        ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200"
                        : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 cursor-pointer"
                    }`}
                  >
                    {tab} {tab === "active" && `(${activeListings})`}
                  </button>
                ))}
              </div>
 
              {filteredListings.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-12 text-center">
                  <div className="w-24 h-24 mx-auto bg-linear-to-br from-purple-100 dark:from-purple-900/30 to-pink-100 dark:to-pink-900/30 rounded-full flex items-center justify-center mb-4">
                    <FaUtensils className="w-12 h-12 text-purple-600 dark:text-purple-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
                    No {supplierTab} food listings
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                    {supplierTab === "active"
                      ? "Ready to share your cooking? List your first homemade meal!"
                      : `You don't have any ${supplierTab} food items yet.`}
                  </p>
                  {supplierTab === "active" && (
                    <Link href="/user/add-food">
                      <Button>
                        <FaPlus className="mr-2" />
                        Share Your First Meal
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredListings.map((food, index) => (
                    <SupplierFoodCard key={food.id} food={food} index={index} />
                  ))}
                </div>
              )}
 
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                    <FaChartLine className="text-purple-600 dark:text-purple-300" />
                    Your Home Cook Performance
                  </h3>
                </div>
 
                {/*
                  NOTE: response rate / on-time-pickup / repeat-buyers below
                  were static mock percentages in the original component
                  (98%, 95%, 72%) with no backing query — kept as-is for
                  visual parity rather than inventing an analytics endpoint
                  that doesn't exist yet.
                */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Response Rate
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-50">98%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "98%" }}
                        className="bg-green-500 dark:bg-green-400 h-2 rounded-full"
                      />
                    </div>
                  </div>
 
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        On-time Pickup
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-50">95%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "95%" }}
                        className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full"
                      />
                    </div>
                  </div>
 
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Food Quality
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-1">
                        {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "4.8"}
                        <FaStar className="text-yellow-500 w-3 h-3" />
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "96%" }}
                        className="bg-yellow-500 dark:bg-yellow-400 h-2 rounded-full"
                      />
                    </div>
                  </div>
 
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Repeat Buyers
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-50">72%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "72%" }}
                        className="bg-purple-500 dark:bg-purple-400 h-2 rounded-full"
                      />
                    </div>
                  </div>
                </div>
 
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Your Achievements:
                    </span>
                    <div className="flex gap-2">
                      {stats.mealsShared > 0 && (
                        <div className="px-3 py-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 rounded-full text-xs flex items-center gap-1">
                          <FaMedal className="w-3 h-3" />
                          First Share
                        </div>
                      )}
                      {stats.mealsShared > 5 && (
                        <div className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-full text-xs flex items-center gap-1">
                          <FaAward className="w-3 h-3" />
                          Pro Sharer
                        </div>
                      )}
                      {stats.avgRating > 4.5 && (
                        <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200 rounded-full text-xs flex items-center gap-1">
                          <FaStar className="w-3 h-3" />
                          Top Rated
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
 
        {/*
          NOTE: "Community Activity" below was a hardcoded array of three
          fake events in the original — not wired to any feed/API. Kept
          for visual parity; flag if you want this backed by a real
          activity-feed query.
        */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
              <FaUsers className="text-blue-600 dark:text-blue-300" />
              Community Activity
            </h3>
          </div>
 
          <div className="space-y-4">
            {[
              {
                icon: FaLeaf,
                bg: "bg-green-100 dark:bg-green-900/30",
                iconColor: "text-green-600 dark:text-green-300",
                message: "You saved 3 meals from Green Bistro 🎉",
                time: "2 hours ago",
              },
              {
                icon: FaUtensils,
                bg: "bg-purple-100 dark:bg-purple-900/30",
                iconColor: "text-purple-600 dark:text-purple-300",
                message: "Maria shared Homemade Biryani with 4 people",
                time: "5 hours ago",
              },
              {
                icon: FaStar,
                bg: "bg-yellow-100 dark:bg-yellow-900/30",
                iconColor: "text-yellow-600 dark:text-yellow-300",
                message: "You received a 5-star rating from Rahul for your Pasta!",
                time: "Yesterday",
              },
            ].map((item, i) => (
              <motion.div
                key={item.message}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className={`w-10 h-10 ${item.bg} rounded-full flex items-center justify-center mr-3`}>
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-gray-100">{item.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
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
  const { cancelReservation, isCancelling } = useCancelReservation();
 
  const handleCancel = async () => {
    if (!window.confirm("Cancel this reservation?")) return;
    // Errors are already toasted inside useCancelReservation's onError —
    // no local try/catch needed here.
    await cancelReservation(reservation.id).catch(() => {});
  };
 
  const isUpcoming = new Date(reservation.pickupTime) > new Date();
 
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-gray-800 dark:text-gray-900 rounded-xl shadow-sm hover:shadow-md transition-all p-6 border border-gray-100 dark:border-gray-800"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="flex items-start space-x-4 mb-4 md:mb-0">
          <div className="w-16 h-16 bg-linear-to-br from-blue-100 dark:from-blue-900/30 to-purple-100 dark:to-purple-900/30 rounded-xl flex items-center justify-center">
            <FaShoppingBag className="w-8 h-8 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-50 text-lg">
              {reservation.food?.name}
            </h4>
            <p className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
              {reservation.food?.supplierName}
            </p>
            <div className="flex items-center mt-1 text-sm">
              <FaMapMarkerAlt className="w-3 h-3 text-gray-400 dark:text-gray-500 mr-1" />
              <span className="text-gray-500 dark:text-gray-400 truncate max-w-xs">
                {reservation.pickupAddress}
              </span>
            </div>
          </div>
        </div>
 
        <div className="flex flex-col items-end">
          <div className="flex items-center space-x-2 mb-2">
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                reservation.status === "confirmed"
                  ? "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100"
                  : reservation.status === "cancelled"
                    ? "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              }`}
            >
              {reservation.status}
            </span>
            {isUpcoming && reservation.status === "confirmed" && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
                onClick={handleCancel}
                loading={isCancelling}
              >
                Cancel
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
            <FaClock className="w-3 h-3" />
            {formatDate(reservation.pickupTime, "PPp")}
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mt-1">
            {reservation.quantity} {reservation.food?.quantityUnit}
          </p>
        </div>
      </div>
 
      {reservation.status === "confirmed" && isUpcoming && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm">
              <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg font-mono font-bold">
                {reservation.pickupCode}
              </span>
              <span className="ml-2 text-gray-500 dark:text-gray-400">Pickup code</span>
            </div>
            <button className="text-blue-600 dark:text-blue-300 text-sm hover:text-blue-700 dark:hover:text-blue-200 font-medium flex items-center gap-1">
              <FaMapMarkerAlt className="w-3 h-3" />
              Directions
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
 
// ---------------------------------------------------------------------
// Supplier Food Card
// ---------------------------------------------------------------------
 
function SupplierFoodCard({ food, index }: { food: SharedFoodDTO; index: number }) {
  const { deleteFood, isDeleting } = useDeleteFood();
 
  const handleDeactivate = async () => {
    if (!window.confirm("Remove this listing?")) return;
    // deleteFood() now exists and is wired to a real /api/food/[id]
    // DELETE route — the original called a service function
    // (foodService.deleteFood) that was commented out entirely.
    await deleteFood(food.id).catch(() => {});
  };
 
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100 dark:border-gray-800"
    >
      <div className="relative">
        <div className="h-40 w-full bg-linear-to-br from-purple-100 dark:from-purple-800 to-pink-100 dark:to-pink-800">
          {food.images && food.images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={(food.images.find((img) => img.isPrimary) ?? food.images[0]).url}
              alt={food.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FaUtensils className="w-10 h-10 text-purple-400 dark:text-purple-500" />
            </div>
          )}
        </div>
 
        <span
          className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full ${
            isFoodExpired(food)
              ? "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-100"
              : isFoodReserved(food)
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-100"
                : "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-100"
          }`}
        >
          {isFoodExpired(food) ? "Expired" : isFoodReserved(food) ? "Reserved" : "Active"}
        </span>
 
        {food.isHomeCooked && (
          <span className="absolute top-2 left-2 px-2 py-1 bg-purple-100 dark:bg-purple-800/30 text-purple-800 dark:text-purple-100 text-xs font-medium rounded-full flex items-center gap-1">
            <FaHome size={10} />
            Home Cook
          </span>
        )}
      </div>
 
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-50">{food.name}</h4>
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{food.description}</p>
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-900 dark:text-gray-50">
              {formatPrice(food.price)}
            </div>
            {food.discountPct > 0 && (
              <div className="text-xs text-green-600 dark:text-green-300">
                {food.discountPct}% off
              </div>
            )}
          </div>
        </div>
 
        <div className="space-y-2 mt-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 dark:text-gray-400">Quantity:</span>
            <span className="font-medium text-gray-900 dark:text-gray-50">
              {food.quantity} {food.quantityUnit}
            </span>
          </div>
 
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 dark:text-gray-400">Expires:</span>
            <span
              className={`font-medium ${
                new Date(food.expiresAt).getTime() - Date.now() < 3600000
                  ? "text-red-600 dark:text-red-300"
                  : "text-orange-600 dark:text-orange-300"
              }`}
            >
              {formatTimeRemaining(food.expiresAt)}
            </span>
          </div>
 
          {food.reviewCount > 0 && (
            <div className="flex items-center gap-1">
              <FaStar className="w-3 h-3 text-yellow-500 dark:text-yellow-400" />
              <span className="text-xs font-medium text-gray-900 dark:text-gray-50">
                {food.averageRating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({food.reviewCount})
              </span>
            </div>
          )}
        </div>
 
        <div className="flex gap-2 mt-4">
          {food.isActive && !isFoodExpired(food) && !isFoodReserved(food) && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-red-600 dark:text-red-300 border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs"
              onClick={handleDeactivate}
              loading={isDeleting}
            >
              <FaTimesCircle className="mr-1" />
              Remove
            </Button>
          )}
          <Link href={`/protected/food/${food.id}`} className="flex-1">
            <Button size="sm" className="w-full bg-linear-to-r from-purple-600 to-pink-600 text-xs">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
