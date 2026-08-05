"use client";

import { useEffect, useState, useMemo } from "react";
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
  FaStore,
  FaUtensils,
  FaShieldAlt,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { formatDate, formatTimeRemaining, formatPrice } from "@/lib/formatters";
import { useAuth } from "@/hooks/useAuth";
import { useMySharedFood, useDeleteFood } from "@/hooks/useFoodQueries";
import {
  isFoodExpired,
  isFoodReserved,
  type SharedFoodDTO,
} from "@/types/food";

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
    mealsShared: sharedFoods.length,
    active: sharedFoods.filter(
      (f) => f.isActive && !isFoodExpired(f) && f.availableQty > 0,
    ).length,
    reserved: sharedFoods.filter((f) => f.quantity > f.availableQty).length,
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
// Page Component
// ---------------------------------------------------------------------------

export default function RestaurantDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FoodTab>("active");
  const { mySharedFood, isLoading } = useMySharedFood();
  const { deleteFood, isDeleting } = useDeleteFood();

  const stats = useMemo(() => calculateStats(mySharedFood), [mySharedFood]);

  const filteredFoods = mySharedFood.filter((food) => {
    const isExpired = new Date(food.expiresAt) <= new Date() || !food.isActive;
    const hasReservations = food.quantity > food.availableQty;

    if (activeTab === "expired") {
      return isExpired;
    }

    if (activeTab === "reserved") {
      return !isExpired && hasReservations;
    }

    if (activeTab === "active") {
      return !isExpired && food.availableQty > 0;
    }

    return false;
  });

  const displayName =
    user?.name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Partner";

  return (
    <div className="min-h-screen bg-transparent pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 rounded-3xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-white rounded-full blur-2xl" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-400 rounded-full blur-2xl" />
          </div>

          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/25 shadow-lg">
                {stats.avgRating >= 4.5 ? (
                  <FaTrophy className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-300 drop-shadow-md" />
                ) : (
                  <FaStore className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-xs border border-white/20">
                    Restaurant Partner
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  Welcome back, {displayName}! 👨‍🍳
                </h1>
                <p className="text-sm text-blue-100 mt-1">
                  Managing your surplus listings, reducing waste, and feeding the community.
                </p>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => router.push("/protected/add-food?role=restaurant")}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-white hover:bg-white/90 text-blue-700 font-extrabold text-sm rounded-2xl shadow-xl hover:shadow-2xl hover:scale-103 transition-all cursor-pointer shrink-0"
            >
              <FaPlus className="text-blue-600" />
              <span>List New Surplus Food</span>
            </button>
          </div>

          {/* Quick Stat Pill Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/20">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <div className="text-2xl font-black">{stats.mealsShared}</div>
              <div className="text-xs text-blue-100 font-medium">Total Listings Created</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <div className="text-2xl font-black">{stats.peopleFed}</div>
              <div className="text-xs text-blue-100 font-medium">Est. People Fed</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <div className="text-2xl font-black">₹{stats.earnings}</div>
              <div className="text-xs text-blue-100 font-medium">Total Value Generated</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <div className="text-2xl font-black">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "New"} ⭐
              </div>
              <div className="text-xs text-blue-100 font-medium">Quality Rating</div>
            </div>
          </div>
        </motion.div>

        {/* 4 Status Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {[
            {
              label: "All Listings",
              value: stats.mealsShared,
              icon: FaChartBar,
              bg: "from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-800/60",
              iconBg: "bg-blue-500 text-white",
              valColor: "text-blue-600 dark:text-blue-400",
            },
            {
              label: "Active & Available",
              value: stats.active,
              icon: FaCheckCircle,
              bg: "from-emerald-500/10 to-green-500/10 border-emerald-200 dark:border-emerald-800/60",
              iconBg: "bg-emerald-500 text-white",
              valColor: "text-emerald-600 dark:text-emerald-400",
            },
            {
              label: "Currently Reserved",
              value: stats.reserved,
              icon: FaClock,
              bg: "from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800/60",
              iconBg: "bg-amber-500 text-white",
              valColor: "text-amber-600 dark:text-amber-400",
            },
            {
              label: "Expired / Inactive",
              value: stats.expired,
              icon: FaTimesCircle,
              bg: "from-rose-500/10 to-pink-500/10 border-rose-200 dark:border-rose-800/60",
              iconBg: "bg-rose-500 text-white",
              valColor: "text-rose-600 dark:text-rose-400",
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
            </motion.div>
          ))}
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-2 border border-gray-200/80 dark:border-slate-800 shadow-md mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {(["active", "reserved", "expired"] as FoodTab[]).map((tab) => {
                const count =
                  tab === "active"
                    ? stats.active
                    : tab === "reserved"
                      ? stats.reserved
                      : stats.expired;
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>
                      {tab === "active"
                        ? "Active Listings"
                        : tab === "reserved"
                          ? "Reserved Orders"
                          : "Expired"}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => router.push("/protected/add-food?role=restaurant")}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
            >
              <FaPlus />
              <span>Add Food Item</span>
            </button>
          </div>
        </div>

        {/* Food Listings Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner text="Loading restaurant food listings..." />
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-lg">
            <div className="w-20 h-20 mx-auto bg-blue-50 dark:bg-blue-950/60 rounded-3xl flex items-center justify-center mb-4 text-blue-600 text-2xl">
              <FaUtensils />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No {activeTab} food listings
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm max-w-md mx-auto">
              {activeTab === "active"
                ? "You have no active food items currently available for pickup. Add surplus inventory to prevent food waste."
                : `You do not have any ${activeTab} food items currently.`}
            </p>
            {activeTab === "active" && (
              <button
                onClick={() =>
                  router.push("/protected/add-food?role=restaurant")
                }
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg cursor-pointer transition-all hover:scale-103"
              >
                <FaPlus />
                <span>Add Your First Surplus Listing</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                <thead className="bg-gray-50/80 dark:bg-slate-800/80 backdrop-blur-xs">
                  <tr>
                    {[
                      "Food Item",
                      "Available Qty",
                      "Price / Type",
                      "Expiry Countdown",
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
                  {filteredFoods.map((food, index) => {
                    const expired =
                      new Date(food.expiresAt) <= new Date() || !food.isActive;
                    const reserved = food.quantity > food.availableQty;
                    return (
                      <motion.tr
                        key={food.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                        onClick={() => {
                          if (activeTab === "reserved") {
                            router.push(`/protected/food/${food.id}/requests`);
                          } else {
                            router.push(`/protected/food/${food.id}`);
                          }
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className="shrink-0 h-12 w-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-slate-800 dark:to-slate-700 rounded-xl overflow-hidden shadow-xs">
                              {food.images && food.images.length > 0 ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={
                                    (
                                      food.images.find(
                                        (img) => img.isPrimary,
                                      ) || food.images[0]
                                    ).url
                                  }
                                  alt={food.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <FaUtensils />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {food.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[200px]">
                                {food.description || "Fresh surplus meal"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {activeTab === "active" && (
                            <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                              {food.availableQty}{" "}
                              <span className="text-xs font-normal text-gray-500">
                                portions
                              </span>
                            </div>
                          )}
                          {activeTab === "reserved" && (
                            <div className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                              {food.quantity - food.availableQty}{" "}
                              <span className="text-xs font-normal text-gray-500">
                                reserved
                              </span>
                            </div>
                          )}
                          {activeTab === "expired" && (
                            <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                              {food.quantity}{" "}
                              <span className="text-xs font-normal text-gray-500">
                                total
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-black text-gray-900 dark:text-white">
                            {food.isDonation
                              ? "Free Donation"
                              : formatPrice(food.price)}
                          </div>
                          {food.originalPrice && !food.isDonation && (
                            <div className="text-xs text-gray-400 line-through">
                              {formatPrice(food.originalPrice)}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {formatDate(food.expiresAt, "PPp")}
                          </div>
                          <div
                            className={`text-xs font-medium ${
                              expired
                                ? "text-rose-500"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {formatTimeRemaining(food.expiresAt)}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                              expired
                                ? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200"
                                : reserved
                                  ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200"
                                  : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200"
                            }`}
                          >
                            {expired
                              ? "Expired"
                              : reserved
                                ? "Reserved"
                                : "Active"}
                          </span>
                        </td>

                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => deleteFood(food.id)}
                            disabled={isDeleting}
                            className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer disabled:opacity-40 transition-colors"
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

        {/* Safety Note Card */}
        <div className="mt-8 bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 p-5 rounded-2xl shadow-sm flex items-start gap-4">
          <FaShieldAlt className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <strong className="font-bold text-gray-900 dark:text-white">
              Food Quality & Hygiene Standard:
            </strong>{" "}
            All surplus food must adhere to local health standards. Items expiring will automatically be delisted when the countdown completes.
          </p>
        </div>
      </div>
    </div>
  );
}
