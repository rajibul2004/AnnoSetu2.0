"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaPlus,
  FaChartBar,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaTrash,
  FaTrophy,
  FaStore,
  FaUtensils,
  FaShieldAlt,
  FaInfoCircle,
  FaExclamationTriangle,
  FaChevronRight,
  FaBell,
  FaCheck,
  FaQrcode,
  FaChevronDown,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { formatDate, formatTimeRemaining, formatPrice } from "@/lib/formatters";
import { useAuth } from "@/hooks/useAuth";
import { useMySharedFood, useDeleteFood } from "@/hooks/useFoodQueries";
import {
  isFoodExpired,
  type SharedFoodDTO,
} from "@/types/food";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FoodTab = "active" | "reserved" | "expired";

interface DashboardStats {
  mealsShared: number;
  active: number;
  activePortions: number;
  reserved: number;
  reservedPortions: number;
  pendingRequests: number;
  pendingPortions: number;
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
  let activeCount = 0;
  let activePortions = 0;
  let reservedCount = 0;
  let reservedPortions = 0;
  let pendingRequests = 0;
  let pendingPortions = 0;
  let expiredCount = 0;
  let totalMealsShared = 0;
  let totalEarnings = 0;

  sharedFoods.forEach((f) => {
    const expired = isFoodExpired(f) || !f.isActive;
    const reservedQty =
      f.confirmedQty !== undefined
        ? f.confirmedQty
        : Math.max(0, f.quantity - f.availableQty);
    const pendQty = f.pendingQty ?? 0;
    const pendCount = f.pendingCount ?? 0;

    totalMealsShared += f.quantity - f.availableQty;
    if (!f.isDonation && f.price) {
      totalEarnings += (f.quantity - f.availableQty) * f.price;
    }

    if (expired) {
      expiredCount++;
    } else {
      // 1. Food with remaining available portion is Active
      if (f.availableQty > 0) {
        activeCount++;
        activePortions += f.availableQty;
      }
      // 2. Food with confirmed/held reserved quantity is Reserved
      if (reservedQty > 0 || (f.quantity > f.availableQty)) {
        reservedCount++;
        reservedPortions += reservedQty > 0 ? reservedQty : (f.quantity - f.availableQty);
      }
      // 3. Track pending confirmation requests
      if (pendCount > 0) {
        pendingRequests += pendCount;
        pendingPortions += pendQty;
      }
    }
  });

  const ratedListings = sharedFoods.filter((l) => l.reviewCount > 0);
  const avgRating =
    ratedListings.length > 0
      ? ratedListings.reduce((sum, l) => sum + (l.averageRating || 0), 0) /
        ratedListings.length
      : 0;

  return {
    mealsShared: sharedFoods.length,
    active: activeCount,
    activePortions,
    reserved: reservedCount,
    reservedPortions,
    pendingRequests,
    pendingPortions,
    expired: expiredCount,
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

// ---------------------------------------------------------------------
// Reusable Scrollable Container with Gradient Overflow Indicators
// ---------------------------------------------------------------------

function ScrollableContainer({
  children,
  maxHeight = "max-h-[750px] sm:max-h-[820px]",
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
            Scroll for more items
          </span>
        </div>
      )}
    </div>
  );
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

  // Tab Filtering Logic
  const filteredFoods = useMemo(() => {
    return mySharedFood.filter((food) => {
      const isExpired = isFoodExpired(food) || !food.isActive;
      const reservedQty =
        food.confirmedQty !== undefined
          ? food.confirmedQty
          : Math.max(0, food.quantity - food.availableQty);
      const hasReservations = reservedQty > 0 || food.quantity > food.availableQty;
      const hasPending = (food.pendingCount ?? 0) > 0;
      const hasAvailable = food.availableQty > 0;

      if (activeTab === "expired") {
        return isExpired;
      }

      if (activeTab === "reserved") {
        return !isExpired && (hasReservations || hasPending);
      }

      if (activeTab === "active") {
        return !isExpired && hasAvailable;
      }

      return false;
    });
  }, [mySharedFood, activeTab]);

  const displayName =
    user?.name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Partner";

  return (
    <div className="min-h-screen bg-transparent pb-16 pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-r from-blue-600 via-indigo-600 to-emerald-600 rounded-3xl shadow-2xl p-6 sm:p-8 mb-8 text-white relative overflow-hidden"
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
                    Restaurant Partner Dashboard
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  Welcome back, {displayName}! 👨‍🍳
                </h1>
                <p className="text-sm text-blue-100 mt-1">
                  Manage surplus meals, accept reservations, and minimize food waste.
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/protected/reservation/pickup">
                <button className="flex items-center gap-2 px-5 py-3.5 bg-emerald-500/90 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-2xl shadow-xl backdrop-blur-md transition-all cursor-pointer">
                  <FaQrcode />
                  <span>Pickup Station</span>
                </button>
              </Link>
              <button
                onClick={() => router.push("/protected/add-food?role=restaurant")}
                className="flex items-center gap-2.5 px-6 py-3.5 bg-white hover:bg-white/90 text-blue-700 font-extrabold text-sm rounded-2xl shadow-xl hover:shadow-2xl hover:scale-103 transition-all cursor-pointer shrink-0"
              >
                <FaPlus className="text-blue-600" />
                <span>List New Surplus Food</span>
              </button>
            </div>
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

        {/* Informative Workflow Banner */}
        <div className="p-4 mb-6 rounded-2xl bg-blue-50/80 dark:bg-slate-900/90 border border-blue-200/80 dark:border-blue-900/40 flex items-start gap-3 text-xs text-gray-600 dark:text-gray-300 shadow-xs">
          <FaInfoCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-gray-900 dark:text-white font-bold">Portion Management:</strong> If you list 100 portions and 50 get reserved, the listing appears in <strong>Active Listings</strong> (50 remaining) and in <strong>Reserved Orders</strong> (50 reserved). When reservations are requested, review and confirm them from the <strong>Reserved Orders</strong> tab.
          </div>
        </div>

        {/* Tab Navigation Pill Bar with Horizontal Scroll for Mobile */}
        <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-2 border border-gray-200/80 dark:border-slate-800 shadow-md mb-6">
          <div className="flex items-center justify-between gap-3">
            <div className="overflow-x-auto custom-scrollbar pb-0.5 flex-1">
              <div className="flex items-center gap-2 min-w-max">
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
                            : "Expired / Inactive"}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-black ${
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
            </div>

            <button
              onClick={() => router.push("/protected/add-food?role=restaurant")}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors shrink-0"
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
                : activeTab === "reserved"
                ? "You have no active reservations. When consumers reserve portions of your active listings, they will show up here."
                : "You do not have any expired food items currently."}
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
          <ScrollableContainer>
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                  <thead className="bg-gray-50/80 dark:bg-slate-800/80 backdrop-blur-xs">
                    <tr>
                      {[
                        "Food Item",
                        "Portions & Availability",
                        "Price / Type",
                        "Expiry Countdown",
                        "Reservation Status",
                        "Actions",
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
                        isFoodExpired(food) || !food.isActive;
                      const reservedPortions =
                        food.confirmedQty !== undefined
                          ? food.confirmedQty
                          : Math.max(0, food.quantity - food.availableQty);
                      const pendingPortions = food.pendingQty ?? 0;
                      const pendingCount = food.pendingCount ?? 0;
                      const hasPending = pendingCount > 0;
                      const isFullyReserved = food.availableQty === 0 && reservedPortions > 0;
                      const isPartiallyReserved =
                        food.availableQty > 0 && (reservedPortions > 0 || hasPending);

                      return (
                        <motion.tr
                          key={food.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.03 }}
                          className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                          onClick={() => {
                            if (activeTab === "reserved" || hasPending) {
                              router.push(`/protected/food/${food.id}/requests`);
                            } else {
                              router.push(`/protected/food/${food.id}`);
                            }
                          }}
                        >
                          {/* Food Name & Image */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3.5">
                              <div className="shrink-0 h-12 w-12 bg-linear-to-br from-blue-100 to-indigo-100 dark:from-slate-800 dark:to-slate-700 rounded-xl overflow-hidden shadow-xs">
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
                                <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                  <span>{food.name}</span>
                                  {hasPending && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black border border-amber-500/30">
                                      {pendingCount} Pending Request{pendingCount === 1 ? "" : "s"}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[220px]">
                                  {food.description || "Fresh surplus meal"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Portions & Availability Breakdown */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {activeTab === "active" && (
                              <div>
                                <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                  {food.availableQty}{" "}
                                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    / {food.quantity} {food.quantityUnit} available
                                  </span>
                                </div>
                                {reservedPortions > 0 && (
                                  <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                                    {reservedPortions} portion{reservedPortions === 1 ? "" : "s"} confirmed reserved
                                  </div>
                                )}
                              </div>
                            )}

                            {activeTab === "reserved" && (
                              <div>
                                <div className="text-sm font-black text-amber-600 dark:text-amber-400">
                                  {reservedPortions}{" "}
                                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    / {food.quantity} {food.quantityUnit} reserved
                                  </span>
                                </div>
                                {food.availableQty > 0 && (
                                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    {food.availableQty} portion{food.availableQty === 1 ? "" : "s"} still available
                                  </div>
                                )}
                              </div>
                            )}

                            {activeTab === "expired" && (
                              <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                {food.quantity}{" "}
                                <span className="text-xs font-normal text-gray-500">
                                  {food.quantityUnit} total
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Price */}
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

                          {/* Expiry Countdown */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              {formatDate(food.expiresAt, "PPp")}
                            </div>
                            <div
                              className={`text-xs font-medium ${
                                expired
                                  ? "text-rose-500 font-bold"
                                  : "text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {formatTimeRemaining(food.expiresAt)}
                            </div>
                          </td>

                          {/* Status Column */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {expired ? (
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200">
                                Expired
                              </span>
                            ) : isFullyReserved ? (
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200">
                                Fully Reserved
                              </span>
                            ) : isPartiallyReserved ? (
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200">
                                Partially Reserved ({food.availableQty} Left)
                              </span>
                            ) : (
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200">
                                Active & Available
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td
                            className="px-6 py-4 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-2">
                              {(reservedPortions > 0 || hasPending) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    router.push(`/protected/food/${food.id}/requests`)
                                  }
                                  className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                                    hasPending
                                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                                      : "bg-blue-600 hover:bg-blue-700 text-white"
                                  }`}
                                  title="Manage requests and reservations"
                                >
                                  <span>{hasPending ? "Confirm Request" : "Manage"}</span>
                                  <FaChevronRight className="w-2.5 h-2.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => deleteFood(food.id)}
                                disabled={isDeleting}
                                className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer disabled:opacity-40 transition-colors"
                                title="Delete listing"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollableContainer>
        )}

        {/* Safety Note Card */}
        <div className="mt-8 bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 p-5 rounded-2xl shadow-sm flex items-start gap-4">
          <FaShieldAlt className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <strong className="font-bold text-gray-900 dark:text-white">
              Food Safety Standard:
            </strong>{" "}
            All surplus food must adhere to local safety regulations. Once a reservation is confirmed by you, the consumer will receive a secure pickup code to present at your restaurant.
          </p>
        </div>
      </div>
    </div>
  );
}
