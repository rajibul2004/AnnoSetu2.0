"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  FaHandHoldingHeart,
  FaBolt,
  FaUndo,
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
  maxDistance: 15,
  minPrice: "",
  maxPrice: "",
  cuisineType: "all",
  sortBy: "newest",
};

const supplierOptions = [
  { value: "all", label: "All Suppliers" },
  { value: "restaurant", label: "Restaurants & Cafes" },
  { value: "individual", label: "Home Cooks & Bakers" },
  { value: "ngo", label: "NGOs & Community Hubs" },
];

const donationOptions = [
  { value: "all", label: "All Items (Free & Paid)" },
  { value: "true", label: "Free Donations Only" },
  { value: "false", label: "Paid Surplus Deals" },
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
  { value: "bakery", label: "Bakery & Desserts" },
  { value: "other", label: "Other Specialties" },
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "expiring", label: "Expiring Soonest" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "popular", label: "Highest Rated" },
];

export default function AllFoodPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FoodFilters>(DEFAULT_FILTERS);

  // Debounced search
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
    12,
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

  const hasActiveFilters =
    filters.supplierType !== "all" ||
    filters.isDonation !== "all" ||
    filters.cuisineType !== "all" ||
    filters.sortBy !== "newest" ||
    filters.maxDistance !== 15 ||
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice) ||
    Boolean(searchTerm);

  return (
    <div className="min-h-screen w-full bg-transparent overflow-x-hidden pb-16">
      {/* Hero Header Section */}
      <div className="w-full pb-8 pt-4 relative overflow-hidden bg-linear-to-b from-emerald-100/50 via-teal-50/30 to-transparent dark:from-[#0A192F] dark:via-slate-900/80 dark:to-transparent">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-6 left-1/4 w-80 h-80 bg-emerald-400 dark:bg-emerald-600 rounded-full filter blur-3xl" />
          <div className="absolute bottom-6 right-1/4 w-80 h-80 bg-teal-400 dark:bg-teal-600 rounded-full filter blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-950/80 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-4 backdrop-blur-md">
              <FaLeaf className="w-3.5 h-3.5 text-emerald-500" />
              Live Surplus Food Rescue Hub
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3 text-gray-900 dark:text-white">
              Discover & Rescue{" "}
              <span className="bg-linear-to-r from-emerald-600 via-teal-600 to-green-500 dark:from-emerald-400 dark:via-teal-300 dark:to-green-400 bg-clip-text text-transparent">
                Surplus Food
              </span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              Wholesome, delicious meals from certified restaurants, cloud kitchens, and home chefs at high discounts or free donation.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-6">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search by food name, restaurant, or cuisine..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full px-6 py-4 pl-12 pr-10 rounded-2xl border-2 border-gray-200 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 shadow-xl transition-all"
                />
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 text-lg pointer-events-none" />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer p-1"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filter Category Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
              {[
                {
                  label: "🌟 All Food",
                  active:
                    filters.supplierType === "all" &&
                    filters.isDonation === "all" &&
                    filters.sortBy === "newest",
                  onClick: () => clearFilters(),
                },
                {
                  label: "🎁 Free Donations",
                  active: filters.isDonation === "true",
                  onClick: () =>
                    handleFilterChange(
                      "isDonation",
                      filters.isDonation === "true" ? "all" : "true",
                    ),
                },
                {
                  label: "🍽️ Restaurants",
                  active: filters.supplierType === "restaurant",
                  onClick: () =>
                    handleFilterChange(
                      "supplierType",
                      filters.supplierType === "restaurant" ? "all" : "restaurant",
                    ),
                },
                {
                  label: "🍳 Home Cooks",
                  active: filters.supplierType === "individual",
                  onClick: () =>
                    handleFilterChange(
                      "supplierType",
                      filters.supplierType === "individual" ? "all" : "individual",
                    ),
                },
                {
                  label: "⚡ Expiring Soon",
                  active: filters.sortBy === "expiring",
                  onClick: () =>
                    handleFilterChange(
                      "sortBy",
                      filters.sortBy === "expiring" ? "newest" : "expiring",
                    ),
                },
                {
                  label: "⭐ Top Rated",
                  active: filters.sortBy === "popular",
                  onClick: () =>
                    handleFilterChange(
                      "sortBy",
                      filters.sortBy === "popular" ? "newest" : "popular",
                    ),
                },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={chip.onClick}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    chip.active
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105"
                      : "bg-white/90 dark:bg-slate-900/90 hover:bg-emerald-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-slate-800"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Marketplace Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Showing{" "}
              <span className="text-emerald-600 dark:text-emerald-400 font-black">
                {meta?.count || 0}
              </span>{" "}
              of <span className="font-bold">{meta?.total || 0}</span> live listings
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-2 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <FaUndo className="w-2.5 h-2.5" />
                Reset Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Mobile Filters Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-md text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer"
            >
              <FaSlidersH className="text-emerald-500" />
              <span>{showFilters ? "Hide Filters" : "Filters"}</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              )}
            </button>

            {/* Sort Dropdown */}
            <Select
              value={filters.sortBy}
              onChange={(value) => handleFilterChange("sortBy", String(value))}
              options={sortOptions}
              className="w-full sm:w-48"
            />

            {/* View Mode Toggle (Grid / List) */}
            <div className="flex bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-1 shadow-sm shrink-0">
              <button
                type="button"
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
                type="button"
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

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Sidebar Filter Panel */}
          <div
            className={`${
              showFilters ? "block" : "hidden"
            } md:block md:w-80 w-full shrink-0`}
          >
            <div className="rounded-3xl p-6 bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800 shadow-xl sticky top-24 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                <h3 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                  <FaFilter className="text-emerald-600 dark:text-emerald-400" />
                  Filter Listings
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

              {/* Supplier Category */}
              <div>
                <Select
                  label="Supplier Type"
                  value={filters.supplierType}
                  onChange={(value) =>
                    handleFilterChange("supplierType", String(value))
                  }
                  options={supplierOptions}
                />
              </div>

              {/* Listing Type */}
              <div>
                <Select
                  label="Listing Type"
                  value={filters.isDonation}
                  onChange={(value) =>
                    handleFilterChange("isDonation", String(value))
                  }
                  options={donationOptions}
                />
              </div>

              {/* Cuisine Category */}
              <div>
                <Select
                  label="Cuisine Category"
                  value={filters.cuisineType}
                  onChange={(value) =>
                    handleFilterChange("cuisineType", String(value))
                  }
                  options={cuisineOptions}
                />
              </div>

              {/* Distance Radius */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Max Distance
                  </label>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                    {filters.maxDistance} km
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={filters.maxDistance}
                  onChange={(e) =>
                    handleFilterChange("maxDistance", Number(e.target.value))
                  }
                  className="w-full accent-emerald-600 cursor-pointer h-2 bg-gray-200 dark:bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-semibold">
                  <span>1 km</span>
                  <span>25 km</span>
                  <span>50 km</span>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2">
                  Price Range (₹)
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) =>
                      handleFilterChange("minPrice", e.target.value)
                    }
                    className="w-1/2 text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      handleFilterChange("maxPrice", e.target.value)
                    }
                    className="w-1/2 text-xs"
                  />
                </div>

                {/* Quick Price Buttons */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { label: "Free", min: "0", max: "0" },
                    { label: "< ₹50", min: "0", max: "50" },
                    { label: "< ₹100", min: "0", max: "100" },
                    { label: "Any", min: "", max: "" },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        handleFilterChange("minPrice", p.min);
                        handleFilterChange("maxPrice", p.max);
                      }}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                        filters.minPrice === p.min && filters.maxPrice === p.max
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Listings Marketplace Content */}
          <div className="flex-1 w-full min-w-0">
            {isLoading ? (
              <div className="flex justify-center py-24">
                <LoadingSpinner text="Searching available surplus food..." />
              </div>
            ) : allFood.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl p-12 text-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl"
              >
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
                  <FaUtensils />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                  No Food Listings Found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto text-sm leading-relaxed">
                  No surplus food matches your current search and filter combination. Try adjusting your distance radius or removing price limits.
                </p>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg cursor-pointer"
                  onClick={clearFilters}
                >
                  Reset All Filters
                </Button>
              </motion.div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allFood.map((food, index) => (
                  <motion.div
                    key={food.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ y: -4 }}
                  >
                    <FoodCard
                      food={food}
                      onReserve={handleReserve}
                      isAuthenticated={isAuthenticated}
                      userRole={user?.role}
                      variant="grid"
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {allFood.map((food, index) => (
                  <motion.div
                    key={food.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <FoodCard
                      food={food}
                      onReserve={handleReserve}
                      isAuthenticated={isAuthenticated}
                      userRole={user?.role}
                      variant="list"
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <nav className="flex items-center gap-2 bg-white dark:bg-slate-900/90 backdrop-blur-xl p-2 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-md">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs text-gray-700 dark:text-gray-200"
                    aria-label="Previous Page"
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
                          className={`w-10 h-10 rounded-xl font-black text-sm transition-all cursor-pointer ${
                            currentPage === pageNum
                              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105"
                              : "border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300"
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
                        <span key={pageNum} className="px-1 text-gray-400 font-bold">
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
                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs text-gray-700 dark:text-gray-200"
                    aria-label="Next Page"
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