"use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
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
import Button from "@/components/common/Button";
import { formatDate, formatTimeRemaining, formatPrice } from "@/lib/formatters";
import { useAuth } from "@/hooks/useAuth";
import { useMySharedFood, useDeleteFood } from "@/hooks/useFoodQueries";
import { isFoodExpired, isFoodReserved, type SharedFoodDTO } from "@/types/food";
 
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
 
function calculateStats(sharedFoods: SharedFoodDTO[]): DashboardStats {
  const completedListings = sharedFoods.filter((l) => isFoodReserved(l) || isFoodExpired(l));
  const totalMealsShared = completedListings.reduce((sum, l) => sum + l.quantity, 0);
  const totalEarnings = sharedFoods
    .filter((l) => !l.isDonation && isFoodReserved(l))
    .reduce((sum, l) => sum + (l.price || 0), 0);
 
  // Food caches averageRating/reviewCount directly, so "has this been
  // reviewed" is reviewCount > 0 — no nested reviews array to check.
  const ratedListings = sharedFoods.filter((l) => l.reviewCount > 0);
  const avgRating =
    ratedListings.length > 0
      ? ratedListings.reduce((sum, l) => sum + (l.averageRating || 0), 0) / ratedListings.length
      : 0;
 
  return {
    mealsShared: sharedFoods.length,
    active: sharedFoods.filter((f) => f.isActive && !isFoodExpired(f) && !isFoodReserved(f)).length,
    reserved: sharedFoods.filter((f) => isFoodReserved(f)).length,
    expired: sharedFoods.filter((f) => isFoodExpired(f) || !f.isActive).length,
    peopleFed: totalMealsShared * 2,
    earnings: totalEarnings,
    avgRating,
    totalImpact: totalMealsShared,
    communityRank: 42,
    impactBadges: [totalMealsShared > 0 && "food-sharer", avgRating > 4.5 && "top-rated"].filter(
      (v): v is string => Boolean(v),
    ),
  };
}
 
export default function RestaurantDashboard() {
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
    impactBadges: ["newcomer"],
  });
 
  // The original declared a separate `foods` state that was never
  // populated (no setFoods call anywhere) and filtered/rendered *that*
  // instead of the real data from the hook — the table always showed
  // "No listings" no matter what was actually in the database. Filtering
  // directly off `mySharedFood` fixes that.
  const { mySharedFood, isLoading } = useMySharedFood();
  const { deleteFood } = useDeleteFood();
 
  useEffect(() => {
    if (!isLoading) {
      setStats(calculateStats(mySharedFood));
    }
  }, [mySharedFood, isLoading]);
 
  const handleDelete = async (foodId: string) => {
    if (!window.confirm("Are you sure you want to delete this food item?")) return;
    // deleteFood() hits the real /api/food/[id] DELETE route and
    // invalidates the ["mysharedfood"] query on success — no manual
    // refetch call needed (the original's commented-out fetchFoods()
    // wouldn't have existed anyway).
    await deleteFood(foodId).catch(() => {});
  };
 
  const filteredFoods = mySharedFood.filter((food) => {
    if (activeTab === "active") return food.isActive && !isFoodExpired(food) && !isFoodReserved(food);
    if (activeTab === "reserved") return isFoodReserved(food);
    if (activeTab === "expired") return isFoodExpired(food) || !food.isActive;
    return true;
  });
 
  const firstName = user?.name?.split(" ")[0] ?? "there";
 
  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-r from-pink-600 via-purple-600 to-blue-600 rounded-3xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white rounded-full"></div>
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
 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-linear-to-br from-green-50 dark:from-green-950 to-green-100 dark:to-green-900 border border-green-200 dark:border-green-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-800 dark:text-green-100 font-medium">
                  Total Listings
                </p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-50 mt-2">
                  {stats.mealsShared}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 dark:bg-green-400 rounded-lg flex items-center justify-center">
                <FaChartBar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
 
          <div className="bg-linear-to-br from-blue-50 dark:from-blue-950 to-blue-100 dark:to-blue-900 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-100 font-medium">Active</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-50 mt-2">
                  {stats.active}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 dark:bg-blue-400 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
 
          <div className="bg-linear-to-br from-purple-50 dark:from-purple-950 to-purple-100 dark:to-purple-900 border border-purple-200 dark:border-purple-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-800 dark:text-purple-100 font-medium">
                  Reserved
                </p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-50 mt-2">
                  {stats.reserved}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 dark:bg-purple-400 rounded-lg flex items-center justify-center">
                <FaClock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
 
          <div className="bg-linear-to-br from-orange-50 dark:from-orange-950 to-red-100 dark:to-orange-900 border border-orange-200 dark:border-orange-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-800 dark:text-orange-100 font-medium">
                  Expired
                </p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-50 mt-2">
                  {stats.expired}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500 dark:bg-red-400 rounded-lg flex items-center justify-center">
                <FaTimesCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
 
        {/* Actions Bar */}
        <div className="card mb-6">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-4">
            <div className="flex space-x-4">
              {(["active", "reserved", "expired"] as FoodTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-2 font-medium text-md md:text-lg border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} (
                  {tab === "active" ? stats.active : tab === "reserved" ? stats.reserved : stats.expired})
                </button>
              ))}
            </div>
            <div className="hidden md:flex">
              <Link href="/restaurant/add-food">
                <Button className="flex items-center">
                  <FaPlus className="mr-2" />
                  Add New Food
                </Button>
              </Link>
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
              <Link href="/restaurant/add-food">
                <Button variant="outline">
                  <FaPlus className="mr-2" />
                  Add Your First Food Item
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Food Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-600 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredFoods.map((food, index) => (
                  <motion.tr
                    key={food.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="shrink-0 h-10 w-10 bg-linear-to-r from-green-100 dark:from-green-800 to-amber-100 dark:to-amber-800 rounded-lg"></div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {food.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {food.description?.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {food.availableQty} / {food.quantity}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {food.quantityUnit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {food.isDonation ? "Donation" : formatPrice(food.price)}
                      </div>
                      {food.originalPrice && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 line-through">
                          {formatPrice(food.originalPrice)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(food.expiresAt, "PPp")}
                      </div>
                      <div
                        className={`text-sm ${
                          isFoodExpired(food)
                            ? "text-red-600 dark:text-red-300"
                            : "text-yellow-600 dark:text-yellow-300"
                        }`}
                      >
                        {formatTimeRemaining(food.expiresAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          isFoodExpired(food)
                            ? "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100"
                            : isFoodReserved(food)
                              ? "bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100"
                              : "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100"
                        }`}
                      >
                        {isFoodExpired(food) ? "Expired" : isFoodReserved(food) ? "Reserved" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDelete(food.id)}
                        className="text-red-600 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
                        aria-label={`Delete ${food.name}`}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
 
        {/* Safety Reminder */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/40 border-l-4 border-yellow-400 dark:border-yellow-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaClock className="h-5 w-5 text-yellow-400 dark:text-yellow-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-200">
                <strong>Food Safety Reminder:</strong> All food listings automatically expire
                at the specified time. Please ensure cooked food is properly stored and
                labelled with preparation time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
 