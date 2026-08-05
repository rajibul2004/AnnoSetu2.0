"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  FaSearch,
  FaFilter,
  FaMapMarkerAlt,
  FaTh,
  FaList,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaStar,
  FaClock,
  FaUtensils,
  FaStore,
  FaHome,
  FaBuilding,
  FaSlidersH,
  FaLeaf,
  FaTag,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAllFood, type FoodFilters } from "@/hooks/useFoodQueries";
import FoodCard from "@/components/food/FoodCard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import type { PublicFoodDTO } from "@/types/food";

const DEFAULT_FILTERS: FoodFilters = {
  supplierType: "all",
  isDonation: "all",
  maxDistance: 10,
  minPrice: "",
  maxPrice: "",
  cuisineType: "all",
  sortBy: "newest",
};

const supplierOptions = [
  { value: "all", label: "All Suppliers" },
  { value: "restaurant", label: "Restaurants" },
  { value: "individual", label: "Home Cooks" },
  { value: "ngo", label: "NGOs" },
];

const donationOptions = [
  { value: "all", label: "All Items" },
  { value: "true", label: "Donations Only" },
  { value: "false", label: "Paid Items Only" },
];

const cuisineOptions = [
  { value: "all", label: "All Cuisines" },
  { value: "north_indian", label: "North Indian" },
  { value: "south_indian", label: "South Indian" },
  { value: "bengali", label: "Bengali" },
  { value: "punjabi", label: "Punjabi" },
  { value: "gujarati", label: "Gujarati" },
  { value: "chinese", label: "Chinese" },
  { value: "italian", label: "Italian" },
  { value: "mexican", label: "Mexican" },
  { value: "thai", label: "Thai" },
  { value: "continental", label: "Continental" },
  { value: "fast_food", label: "Fast Food" },
  { value: "street_food", label: "Street Food" },
  { value: "bakery", label: "Bakery" },
  { value: "other", label: "Other" },
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "expiring", label: "Expiring Soon" },
  { value: "popular", label: "Most Popular" },
];

export default function AllFoodPage() {
  const { user, isAuthenticated } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const router = useRouter();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FoodFilters>(DEFAULT_FILTERS);

  useEffect(() => {
    const id = setTimeout(() => setSearchTerm(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const { foods: allFood, isLoading, meta } = useAllFood(
    filters,
    searchTerm,
    currentPage,
    9,
  );
  const totalPages = meta?.totalPages || 1;

  const handleFilterChange = <K extends keyof FoodFilters>(
    key: K,
    value: FoodFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleReserve = (food: PublicFoodDTO) => {
    if (!isAuthenticated) {
      toast.error("Please log in to reserve food");
      router.push("/auth/login");
      return;
    }
    router.push(`/protected/food/${food.id}/reserve`);
  };

  const getSupplierIcon = (type: string) => {
    switch (type) {
      case "restaurant":
        return <FaStore className="w-4 h-4 text-blue-500" />;
      case "individual":
        return <FaHome className="w-4 h-4 text-pink-500" />;
      case "ngo":
        return <FaBuilding className="w-4 h-4 text-purple-500" />;
      default:
        return <FaUtensils className="w-4 h-4 text-emerald-500" />;
    }
  };

  const hasActiveFilters =
    filters.supplierType !== "all" ||
    filters.isDonation !== "all" ||
    filters.cuisineType !== "all" ||
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice);

  return (
    <div className="min-h-screen w-full bg-transparent overflow-x-hidden">
      {/* Header Banner */}
      <div className="w-full pb-6 sm:pb-12 lg:pb-16 relative overflow-hidden bg-gradient-to-b from-emerald-100/60 via-green-50/40 to-white dark:from-[#0A192F] dark:via-slate-900/90 dark:to-[#0A192F] text-gray-900 dark:text-white transition-colors duration-300">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-400 dark:bg-emerald-600 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-300 dark:bg-amber-500 rounded-full filter blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
              <FaLeaf className="w-3.5 h-3.5 text-emerald-500" />
              Live Community Marketplace
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-gray-900 dark:text-white">
              Discover & Rescue{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-amber-600 dark:from-emerald-400 dark:via-green-300 dark:to-amber-300 bg-clip-text text-transparent">
                Surplus Food
              </span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Find fresh, wholesome meals from restaurants, bakeries, and home chefs nearby before good food goes to waste.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search by food name, restaurant, or cuisine..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full px-6 py-3.5 pl-12 pr-10 rounded-2xl border-2 border-gray-300/80 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 shadow-xl transition-all"
                />
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 text-lg pointer-events-none" />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Wave Divider */}
        <div className="relative z-10 -bottom-px left-0 right-0 leading-none">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="block w-full h-full"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill={isDark ? "#0A192F" : "#ffffff"}
            />
          </svg>
        </div>
      </div>

      {/* Main Marketplace Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Showing{" "}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {meta?.count || 0}
              </span>{" "}
              of <span className="font-bold">{meta?.total || 0}</span> available listings
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Mobile Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-md text-sm font-semibold text-gray-800 dark:text-gray-200 cursor-pointer"
            >
              <FaSlidersH className="text-emerald-500" />
              <span>{showFilters ? "Hide Filters" : "Filters"}</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              )}
            </button>

            {/* Sort Dropdown */}
            <Select
              value={filters.sortBy}
              onChange={(value) => handleFilterChange("sortBy", String(value))}
              options={sortOptions}
              className="w-full md:w-48"
            />

            {/* View Mode Toggle */}
            <div className="flex bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-300 hover:text-emerald-600"
                }`}
                title="Grid View"
              >
                <FaTh className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-300 hover:text-emerald-600"
                }`}
                title="List View"
              >
                <FaList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filter Sidebar */}
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`${
                showFilters ? "block" : "hidden"
              } md:block md:w-80 space-y-4`}
            >
              <div className="rounded-3xl p-6 bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800 shadow-xl sticky top-24">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
                  <h3 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-2 text-base">
                    <FaFilter className="text-emerald-600 dark:text-emerald-400" />
                    Filters
                  </h3>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                <div className="mb-4">
                  <Select
                    label="Supplier Type"
                    value={filters.supplierType}
                    onChange={(value) =>
                      handleFilterChange("supplierType", String(value))
                    }
                    options={supplierOptions}
                  />
                </div>

                <div className="mb-4">
                  <Select
                    label="Listing Type"
                    value={filters.isDonation}
                    onChange={(value) =>
                      handleFilterChange("isDonation", String(value))
                    }
                    options={donationOptions}
                  />
                </div>

                <div className="mb-4">
                  <Select
                    label="Cuisine Category"
                    value={filters.cuisineType}
                    onChange={(value) =>
                      handleFilterChange("cuisineType", String(value))
                    }
                    options={cuisineOptions}
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2">
                    Max Distance: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{filters.maxDistance} km</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={filters.maxDistance}
                    onChange={(e) =>
                      handleFilterChange("maxDistance", Number(e.target.value))
                    }
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1 km</span>
                    <span>25 km</span>
                    <span>50 km</span>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2">
                    Price Range (₹)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) =>
                        handleFilterChange("minPrice", e.target.value)
                      }
                      className="w-1/2"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) =>
                        handleFilterChange("maxPrice", e.target.value)
                      }
                      className="w-1/2"
                    />
                  </div>
                </div>

                {/* Quick Tag Pills */}
                <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                    Quick Filters
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleFilterChange("isDonation", "true")}
                      className="px-3 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-semibold hover:bg-purple-200 cursor-pointer transition-colors"
                    >
                      🎁 Free Donations
                    </button>
                    <button
                      onClick={() => handleFilterChange("isDonation", "false")}
                      className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold hover:bg-emerald-200 cursor-pointer transition-colors"
                    >
                      🏷️ Discounted
                    </button>
                    <button
                      onClick={() => handleFilterChange("sortBy", "expiring")}
                      className="px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-semibold hover:bg-amber-200 cursor-pointer transition-colors"
                    >
                      ⏳ Expiring Soon
                    </button>
                    <button
                      onClick={() =>
                        handleFilterChange("supplierType", "individual")
                      }
                      className="px-3 py-1 bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 rounded-xl text-xs font-semibold hover:bg-pink-200 cursor-pointer transition-colors"
                    >
                      🏠 Home Cooked
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Listings Grid / List */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <LoadingSpinner text="Loading delicious surplus food..." />
              </div>
            ) : allFood.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl p-12 text-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl"
              >
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 text-2xl">
                  <FaUtensils />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  No food listings found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto text-sm">
                  We couldn&apos;t find any food items matching your exact filters. Try clearing some filters or widening your search radius.
                </p>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg"
                  onClick={clearFilters}
                >
                  Clear All Filters
                </Button>
              </motion.div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allFood.map((food, index) => (
                  <motion.div
                    key={food.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    whileHover={{ y: -4 }}
                  >
                    <FoodCard
                      food={food}
                      onReserve={handleReserve}
                      isAuthenticated={isAuthenticated}
                      userRole={user?.role}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {allFood.map((food, index) => (
                  <motion.div
                    key={food.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl shadow-md hover:shadow-xl border border-gray-200/80 dark:border-slate-800 overflow-hidden transition-all duration-300 p-5 flex flex-col sm:flex-row gap-5 items-center"
                    onClick={() => handleReserve(food)}
                  >
                    <div className="w-full sm:w-44 h-36 bg-gradient-to-br from-emerald-100 dark:from-slate-800 to-amber-100 dark:to-slate-700 rounded-xl overflow-hidden relative shrink-0">
                      {food.images && food.images.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            (
                              food.images.find((img) => img.isPrimary) ??
                              food.images[0]
                            ).url
                          }
                          alt={food.name}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaUtensils className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {food.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 font-medium">
                              {getSupplierIcon(food.supplierType)}
                              <span>{food.supplierName}</span>
                            </div>
                            {food.averageRating > 0 && (
                              <div className="flex items-center gap-1 text-amber-500 font-semibold text-xs">
                                <FaStar className="w-3 h-3" />
                                <span>{food.averageRating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                            ₹{food.price}
                          </div>
                          {food.originalPrice !== null &&
                            food.originalPrice > food.price && (
                              <div className="text-xs text-gray-400 line-through">
                                ₹{food.originalPrice}
                              </div>
                            )}
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2 leading-relaxed">
                        {food.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2.5 mt-4">
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <FaClock className="w-3 h-3 text-emerald-500" />
                          {new Date(food.expiresAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <FaMapMarkerAlt className="w-3 h-3 text-rose-500" />
                          {food.distance !== null
                            ? `${food.distance.toFixed(1)} km`
                            : "Nearby"}
                        </span>
                        {food.isDonation && (
                          <span className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-[10px] font-bold rounded-full">
                            FREE DONATION
                          </span>
                        )}
                        {food.discountPct > 0 && (
                          <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full">
                            {food.discountPct}% OFF
                          </span>
                        )}
                        {food.isHomeCooked && (
                          <span className="px-2.5 py-0.5 bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 text-[10px] font-bold rounded-full">
                            HOME COOKED
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-10 flex justify-center">
                <nav className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
                  >
                    <FaChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - currentPage) <= 2
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                            currentPage === pageNum
                              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                              : "border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (
                      pageNum === currentPage - 3 ||
                      pageNum === currentPage + 3
                    ) {
                      return (
                        <span key={pageNum} className="px-1 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
                  >
                    <FaChevronRight className="w-3.5 h-3.5" />
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}