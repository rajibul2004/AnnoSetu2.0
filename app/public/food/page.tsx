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
 
// Updated to match the real CuisineType enum keys (north_indian,
// south_indian, etc.) — the original list used values like "indian" and
// "fast-food" that aren't valid values for this schema's enum at all.
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
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
 
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FoodFilters>(DEFAULT_FILTERS);
 
  // The original refetched on every keystroke with no debounce at all —
  // each character typed fired a new query. 300ms is a small, deliberate
  // addition, not a behavior change anyone would notice by using it.
  useEffect(() => {
    const id = setTimeout(() => setSearchTerm(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput]);
 
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
 
  const { foods: allFood, isLoading, meta } = useAllFood(filters, searchTerm, currentPage, 9);
  const totalPages = meta?.totalPages || 1;
 
  const handleFilterChange = <K extends keyof FoodFilters>(key: K, value: FoodFilters[K]) => {
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
    if (!user) {
      toast.error("Please login to reserve food");
      router.push("/login");
      return;
    }
    router.push(`/food/${food.id}/reserve`);
  };
 
  const getSupplierIcon = (type: string) => {
    switch (type) {
      case "restaurant":
        return <FaStore className="w-4 h-4" />;
      case "individual":
        return <FaHome className="w-4 h-4" />;
      case "ngo":
        return <FaBuilding className="w-4 h-4" />;
      default:
        return <FaUtensils className="w-4 h-4" />;
    }
  };
 
  const hasActiveFilters =
    filters.supplierType !== "all" ||
    filters.isDonation !== "all" ||
    filters.cuisineType !== "all" ||
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice);
 
  return (
    <div className="min-h-screen w-full bg-transparent">
      {/* Header */}
      <div className="w-full pb-5 sm:pb-10 lg:pb-20 relative overflow-hidden bg-linear-to-b from-transparent dark:from-gray-600 via-green-100 dark:via-slate-900 to-green-300 dark:to-zinc-950 dark:text-white text-gray-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-green-800 dark:bg-slate-200 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-950 dark:bg-gray-200 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-40 right-40 w-48 h-48 bg-lime-950 dark:bg-zinc-200 rounded-full filter blur-3xl animate-pulse delay-700"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-4xl logotext md:text-5xl font-bold mb-4">All Foods</h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto dark:text-white text-gray-900">
              Discover delicious food from restaurants and home cooks near you
            </p>
 
            <div className="max-w-2xl mx-auto">
              <Input
                type="text"
                placeholder="Search by food name, restaurant, or cuisine..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                icon={<FaSearch />}
              />
            </div>
          </motion.div>
        </div>
        <div className="absolute -bottom-px left-0 right-0 leading-none">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-full h-full">
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
               fill={isDark ? "#0A192F" : "#ffff"}
            />
          </svg>
        </div>
      </div>
 
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Showing <span className="font-semibold">{meta?.count || 0}</span> of{" "}
            <span className="font-semibold">{meta?.total || 0}</span> items
          </p>
 
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-transparent border border-gray-500 rounded-lg shadow-md"
            >
              <FaSlidersH className="w-4 h-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
                  !
                </span>
              )}
            </button>
 
            <Select
              value={filters.sortBy}
              onChange={(value) => handleFilterChange("sortBy", String(value))}
              options={sortOptions}
              className="w-full md:w-48"
            />
 
            <div className="flex bg-transparent rounded-lg shadow-md p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-green-100 text-green-600 dark:bg-green-800/40 dark:text-green-300"
                    : "text-gray-600 dark:text-gray-300 cursor-pointer"
                }`}
              >
                <FaTh className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-green-100 dark:bg-green-800/40 text-green-600 dark:text-green-300"
                    : "text-gray-600 dark:text-gray-300 cursor-pointer"
                }`}
              >
                <FaList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
 
        <div className="flex flex-col md:flex-row gap-8">
          {/*
            The original checked `window.innerWidth >= 768` directly in the
            render body to decide whether to show the sidebar — `window`
            doesn't exist during Next.js server-side rendering, so this
            would throw on every server render. Replaced with a pure CSS
            responsive toggle: always mounted, visibility driven by
            Tailwind's `md:` breakpoint plus the showFilters state.
          */}
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`${showFilters ? "block" : "hidden"} md:block md:w-80 space-y-4`}
            >
              <div className="card p-6 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FaFilter className="text-green-600 dark:text-green-300" />
                    Filters
                  </h3>
                  <button onClick={clearFilters} className="text-sm text-green-600 hover:text-green-700">
                    Clear all
                  </button>
                </div>
 
                <div className="mb-4">
                  <Select
                    label="Supplier Type"
                    value={filters.supplierType}
                    onChange={(value) => handleFilterChange("supplierType", String(value))}
                    options={supplierOptions}
                  />
                </div>
 
                <div className="mb-4">
                  <Select
                    label="Item Type"
                    value={filters.isDonation}
                    onChange={(value) => handleFilterChange("isDonation", String(value))}
                    options={donationOptions}
                  />
                </div>
 
                <div className="mb-4">
                  <Select
                    label="Cuisine"
                    value={filters.cuisineType}
                    onChange={(value) => handleFilterChange("cuisineType", String(value))}
                    options={cuisineOptions}
                  />
                </div>
 
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Max Distance (km)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={filters.maxDistance}
                    onChange={(e) => handleFilterChange("maxDistance", Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mt-1">
                    <span>1km</span>
                    <span className="font-medium text-green-600 dark:text-green-300">
                      {filters.maxDistance}km
                    </span>
                    <span>50km</span>
                  </div>
                </div>
 
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Price Range (₹)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                      className="w-1/2"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                      className="w-1/2"
                    />
                  </div>
                </div>
 
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Quick Filters</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleFilterChange("isDonation", "true")}
                      className="px-3 cursor-pointer py-1 bg-purple-100 dark:bg-purple-800/40 text-purple-700 dark:text-purple-200 rounded-full text-sm hover:bg-purple-200 dark:hover:bg-purple-700/40"
                    >
                      🆓 Donations
                    </button>
                    <button
                      onClick={() => handleFilterChange("isDonation", "false")}
                      className="px-3 py-1 bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-200 rounded-full cursor-pointer text-sm hover:bg-green-200 dark:hover:bg-green-700/40"
                    >
                      💰 Discounted
                    </button>
                    <button
                      onClick={() => handleFilterChange("sortBy", "expiring")}
                      className="px-3 py-1 bg-orange-100 dark:bg-orange-800/40 cursor-pointer text-orange-700 dark:text-orange-200 rounded-full text-sm hover:bg-orange-200 dark:hover:bg-orange-700/40"
                    >
                      ⏰ Expiring Soon
                    </button>
                    <button
                      onClick={() => handleFilterChange("supplierType", "individual")}
                      className="px-3 py-1 bg-pink-100 dark:bg-pink-800/40 text-pink-700 dark:text-pink-200 cursor-pointer rounded-full text-sm hover:bg-pink-200 dark:hover:bg-pink-700/40"
                    >
                      🏠 Home Cooked
                    </button>
                  </div>
                </div>
 
                {hasActiveFilters && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Active Filters
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {filters.supplierType !== "all" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-800/40 rounded-lg text-xs">
                          {supplierOptions.find((o) => o.value === filters.supplierType)?.label}
                          <FaTimes
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => handleFilterChange("supplierType", "all")}
                          />
                        </span>
                      )}
                      {filters.isDonation !== "all" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-800/40 rounded-lg text-xs">
                          {donationOptions.find((o) => o.value === filters.isDonation)?.label}
                          <FaTimes
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => handleFilterChange("isDonation", "all")}
                          />
                        </span>
                      )}
                      {filters.cuisineType !== "all" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-800/40 rounded-lg text-xs">
                          {cuisineOptions.find((o) => o.value === filters.cuisineType)?.label}
                          <FaTimes
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => handleFilterChange("cuisineType", "all")}
                          />
                        </span>
                      )}
                      {filters.minPrice && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-800/40 rounded-lg text-xs">
                          Min: ₹{filters.minPrice}
                          <FaTimes
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => handleFilterChange("minPrice", "")}
                          />
                        </span>
                      )}
                      {filters.maxPrice && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-800/40 rounded-lg text-xs">
                          Max: ₹{filters.maxPrice}
                          <FaTimes
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => handleFilterChange("maxPrice", "")}
                          />
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
 
          {/* Food Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner text="Loading delicious food..." />
              </div>
            ) : allFood.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card p-12 text-center"
              >
                <div className="w-24 h-24 bg-linear-to-br from-gray-100 dark:from-gray-800 to-gray-200 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaSearch className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No food found</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Try adjusting your filters or search term
                </p>
                <Button className="dark:bg-gray-900 bg-gray-200" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </motion.div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allFood.map((food, index) => (
                  <motion.div
                    key={food.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <FoodCard food={food} onReserve={handleReserve} isAuthenticated={isAuthenticated} userRole={user?.role} />
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
                    transition={{ delay: index * 0.05 }}
                    className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 relative min-w-full p-4"
                    onClick={() => handleReserve(food)}
                  >
                    <div className="flex gap-4">
                      <div className="w-32 md:w-48 h-32 bg-linear-to-br from-green-100 dark:from-gray-500 via-amber-100 dark:via-gray-600 to-pink-100 dark:to-gray-700 rounded-lg overflow-hidden">
                        {food.images && food.images.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={(food.images.find((img) => img.isPrimary) ?? food.images[0]).url}
                            alt={food.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaUtensils className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                      </div>
 
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                              {food.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                                {getSupplierIcon(food.supplierType)}
                                <span>{food.supplierName}</span>
                              </div>
                              {food.averageRating > 0 && (
                                <div className="flex items-center gap-1">
                                  <FaStar className="w-3 h-3 text-yellow-400 dark:text-yellow-500" />
                                  <span className="text-xs">{food.averageRating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-600 dark:text-green-300">
                              ₹{food.price}
                            </div>
                            {food.originalPrice !== null && food.originalPrice > food.price && (
                              <div className="text-sm text-gray-400 dark:text-gray-500 line-through">
                                ₹{food.originalPrice}
                              </div>
                            )}
                          </div>
                        </div>
 
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                          {food.description}
                        </p>
 
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <FaClock className="w-3 h-3" />
                            {new Date(food.expiresAt).toLocaleTimeString()}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <FaMapMarkerAlt className="w-3 h-3" />
                            {food.distance !== null ? `${food.distance.toFixed(1)}km` : "Nearby"}
                          </span>
                          {food.isDonation && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                              Free
                            </span>
                          )}
                          {food.discountPct > 0 && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              {food.discountPct}% OFF
                            </span>
                          )}
                          {food.isHomeCooked && (
                            <span className="px-2 py-0.5 bg-pink-100 text-pink-700 text-xs rounded-full">
                              Home Cooked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
 
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaChevronLeft className="w-4 h-4" />
                  </button>
 
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    if (pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 2) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-lg font-medium ${
                            currentPage === pageNum
                              ? "bg-primary-600 text-white"
                              : "border border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                      return (
                        <span key={pageNum} className="px-2">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
 
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaChevronRight className="w-4 h-4" />
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