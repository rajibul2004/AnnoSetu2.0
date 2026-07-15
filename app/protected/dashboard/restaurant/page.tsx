"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaPlus,
  FaChartBar,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaTrash,
  FaHeart,
  FaStar,
  FaTrophy,
  FaHome,
  FaExchangeAlt,
} from "react-icons/fa";
import { motion } from "framer-motion";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { formatDate, formatTimeRemaining, formatPrice } from "@/lib/formatters";
import { useAuth } from "@/hooks/useAuth";
import { useMySharedFood, useDeleteFood } from "@/hooks/useFoodQueries";
import { isFoodExpired, isFoodReserved, type SharedFoodDTO } from "@/types/food";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FoodTab = "active" | "reserved" | "expired";

interface DashboardStats {
  mealsShared: number;
  active: number;
  reserved: number;
  expired: number;
  peopleFed: number;
  earnings: number;
  avgRating: number;
  totalImpact: number;
  communityRank: number;
  impactBadges: string[];
}

// ---------------------------------------------------------------------------
// Stat computation
// ---------------------------------------------------------------------------

function calculateStats(sharedFoods: SharedFoodDTO[]): DashboardStats {
  const completedListings = sharedFoods.filter(
    (l) => isFoodReserved(l) || isFoodExpired(l),
  );
  const totalMealsShared = completedListings.reduce(
    (sum, l) => sum + l.quantity,
    0,
  );
  const totalEarnings = sharedFoods
    .filter((l) => !l.isDonation && isFoodReserved(l))
    .reduce((sum, l) => sum + (l.price || 0), 0);

  const ratedListings = sharedFoods.filter((l) => l.reviewCount > 0);
  const avgRating =
    ratedListings.length > 0
      ? ratedListings.reduce((sum, l) => sum + (l.averageRating || 0), 0) /
        ratedListings.length
      : 0;

  return {
    mealsShared: sharedFoods.length,
    active: sharedFoods.filter(
      (f) => f.isActive && !isFoodExpired(f) && !isFoodReserved(f),
    ).length,
    reserved: sharedFoods.filter((f) => isFoodReserved(f)).length,
    expired: sharedFoods.filter((f) => isFoodExpired(f) || !f.isActive).length,
    peopleFed: totalMealsShared * 2,
    earnings: totalEarnings,
    avgRating,
    totalImpact: totalMealsShared,
    communityRank: 42,
    impactBadges: [
      totalMealsShared > 0 && "food-sharer",
      avgRating > 4.5 && "top-rated",
    ].filter((v): v is string => Boolean(v)),
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RestaurantDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FoodTab>("active");
  const [stats, setStats] = useState<DashboardStats>({
    mealsShared: 0,
    active: 0,
    reserved: 0,
    expired: 0,
    peopleFed: 0,
    earnings: 0,
    avgRating: 0,
    totalImpact: 0,
    communityRank: 42,
    impactBadges: [],
  });

  const { mySharedFood, isLoading } = useMySharedFood();
  const { deleteFood, isDeleting } = useDeleteFood();

  useEffect(() => {
    setStats(calculateStats(mySharedFood));
  }, [mySharedFood]);

  const filteredFoods = mySharedFood.filter((food) => {
    if (activeTab === "active")
      return food.isActive && !isFoodExpired(food) && !isFoodReserved(food);
    if (activeTab === "reserved") return isFoodReserved(food);
    if (activeTab === "expired") return isFoodExpired(food) || !food.isActive;
    return true;
  });

  const displayName =
    user?.name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-r from-pink-600 via-purple-600 to-blue-600 rounded-3xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white rounded-full" />
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
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Hey {displayName}! 👋
                </h1>
                <p className="text-white/90 flex items-center gap-2">
                  <FaExchangeAlt className="w-4 h-4" />
                  You&apos;re making a difference as both a saver &amp; sharer
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
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

          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-bold">{stats.totalImpact}</div>
              <div className="text-xs text-white/80">Total Impact</div>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: "Total Listings",
              value: stats.mealsShared,
              icon: FaChartBar,
              colors: "from-green-50 dark:from-green-950 to-green-100 dark:to-green-900 border-green-200 dark:border-green-700",
              iconBg: "bg-green-500 dark:bg-green-400",
              textColor: "text-green-800 dark:text-green-100",
              valueColor: "text-green-900 dark:text-green-50",
            },
            {
              label: "Active",
              value: stats.active,
              icon: FaCheckCircle,
              colors: "from-blue-50 dark:from-blue-950 to-blue-100 dark:to-blue-900 border-blue-200 dark:border-blue-700",
              iconBg: "bg-blue-500 dark:bg-blue-400",
              textColor: "text-blue-800 dark:text-blue-100",
              valueColor: "text-blue-900 dark:text-blue-50",
            },
            {
              label: "Reserved",
              value: stats.reserved,
              icon: FaClock,
              colors: "from-purple-50 dark:from-purple-950 to-purple-100 dark:to-purple-900 border-purple-200 dark:border-purple-700",
              iconBg: "bg-purple-500 dark:bg-purple-400",
              textColor: "text-purple-800 dark:text-purple-100",
              valueColor: "text-purple-900 dark:text-purple-50",
            },
            {
              label: "Expired",
              value: stats.expired,
              icon: FaTimesCircle,
              colors: "from-orange-50 dark:from-orange-950 to-red-100 dark:to-orange-900 border-orange-200 dark:border-orange-700",
              iconBg: "bg-red-500 dark:bg-red-400",
              textColor: "text-orange-800 dark:text-orange-100",
              valueColor: "text-orange-900 dark:text-orange-50",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`bg-linear-to-br ${card.colors} border rounded-xl p-6`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${card.textColor}`}>
                    {card.label}
                  </p>
                  <p className={`text-3xl font-bold mt-2 ${card.valueColor}`}>
                    {card.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}
                >
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab bar + Add Food */}
        <div className="card mb-6">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-4">
            <div className="flex space-x-2">
              {(["active", "reserved", "expired"] as FoodTab[]).map((tab) => {
                const count =
                  tab === "active"
                    ? stats.active
                    : tab === "reserved"
                      ? stats.reserved
                      : stats.expired;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 px-3 font-medium text-sm md:text-base border-b-2 transition-colors ${
                      activeTab === tab
                        ? "border-blue-600 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} ({count})
                  </button>
                );
              })}
            </div>
            <div className="hidden md:flex">
              <button
                onClick={() =>
                  router.push("/protected/add-food/restaurant")
                }
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors"
              >
                <FaPlus />
                Add New Food
              </button>
            </div>
          </div>
        </div>

        {/* Food Listings */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner text="Loading your food listings..." />
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-24 h-24 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <FaPlus className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No {activeTab} food listings
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {activeTab === "active"
                ? "Start by adding your surplus food items."
                : `You don't have any ${activeTab} food items.`}
            </p>
            {activeTab === "active" && (
              <button
                onClick={() =>
                  router.push("/protected/add-food/restaurant")
                }
                className="flex items-center gap-2 mx-auto px-5 py-2.5 border-2 border-green-600 text-green-600 dark:text-green-300 dark:border-green-300 font-semibold rounded-xl hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
              >
                <FaPlus />
                Add Your First Food Item
              </button>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {[
                      "Food Item",
                      "Quantity",
                      "Price",
                      "Expires",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredFoods.map((food, index) => {
                    const expired = isFoodExpired(food);
                    const reserved = isFoodReserved(food);
                    return (
                      <motion.tr
                        key={food.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.04 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() =>
                          router.push(`/protected/food/${food.id}`)
                        }
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 h-10 w-10 bg-linear-to-r from-green-100 dark:from-green-800 to-amber-100 dark:to-amber-800 rounded-lg" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {food.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                {food.description?.substring(0, 50)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {food.quantity}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {food.quantityUnit}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {food.isDonation ? "Donation" : formatPrice(food.price)}
                          </div>
                          {food.originalPrice && !food.isDonation && (
                            <div className="text-xs text-gray-400 line-through">
                              {formatPrice(food.originalPrice)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(food.expiresAt, "PPp")}
                          </div>
                          <div
                            className={`text-xs ${
                              expired
                                ? "text-red-500 dark:text-red-300"
                                : "text-yellow-600 dark:text-yellow-300"
                            }`}
                          >
                            {formatTimeRemaining(food.expiresAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              expired
                                ? "bg-red-100 dark:bg-red-800/60 text-red-800 dark:text-red-100"
                                : reserved
                                  ? "bg-yellow-100 dark:bg-yellow-800/60 text-yellow-800 dark:text-yellow-100"
                                  : "bg-green-100 dark:bg-green-800/60 text-green-800 dark:text-green-100"
                            }`}
                          >
                            {expired ? "Expired" : reserved ? "Reserved" : "Active"}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => deleteFood(food.id)}
                            disabled={isDeleting}
                            className="text-red-500 dark:text-red-400 hover:text-red-700 disabled:opacity-40 transition-colors"
                            title="Delete listing"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Safety Reminder */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 rounded-r-xl">
          <div className="flex gap-3">
            <FaClock className="h-5 w-5 text-yellow-500 dark:text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700 dark:text-yellow-200">
              <strong>Food Safety Reminder:</strong> All food listings
              automatically expire at the specified time. Please ensure cooked
              food is properly stored and labelled with preparation time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}