"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
  FaMagic,
  FaArrowRight,
  FaCompass,
  FaUsers,
  FaShieldAlt,
  FaMicrophone,
  FaFire,
  FaCheckCircle,
  FaLayerGroup,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAllFood, type FoodFilters } from "@/hooks/useFoodQueries";
import FoodCard from "@/components/food/FoodCard";
import SmartMatcherDashboard from "@/components/matcher/SmartMatcherDashboard";
import VoiceToListingModal from "@/components/food/VoiceToListingModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import type { PublicFoodDTO } from "@/types/food";
import type { ParsedFoodListing } from "@/lib/ai/foodParser";

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
  { value: "all", label: "All Listings (Free & Paid)" },
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
  { value: "newest", label: "Newest Added" },
  { value: "expiring", label: "Expiring Soonest ⚡" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "popular", label: "Highest Rated ⭐" },
];

const QUICK_FILTERS = [
  { id: "all", label: "All Food", icon: FaUtensils, color: "emerald" },
  { id: "donations", label: "Free Donations", icon: FaHandHoldingHeart, color: "emerald" },
  { id: "expiring", label: "Expiring Soon", icon: FaClock, color: "rose" },
  { id: "home_cooks", label: "Home Kitchens", icon: FaHome, color: "amber" },
  { id: "restaurants", label: "Restaurants", icon: FaStore, color: "blue" },
  { id: "ngos", label: "NGO Hubs", icon: FaBuilding, color: "purple" },
  { id: "under50", label: "Under ₹50", icon: FaTag, color: "teal" },
];

function FoodSkeletonCard({ viewMode }: { viewMode: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 animate-pulse flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-48 h-36 bg-gray-200 dark:bg-slate-800 rounded-xl shrink-0" />
        <div className="flex-1 space-y-3 py-1">
          <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/2" />
          <div className="flex gap-2 pt-2">
            <div className="h-6 w-20 bg-gray-200 dark:bg-slate-800 rounded-full" />
            <div className="h-6 w-24 bg-gray-200 dark:bg-slate-800 rounded-full" />
          </div>
          <div className="flex justify-between items-center pt-2">
            <div className="h-6 w-16 bg-gray-200 dark:bg-slate-800 rounded" />
            <div className="h-9 w-28 bg-gray-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm animate-pulse">
      <div className="h-48 bg-gray-200 dark:bg-slate-800 w-full" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-4/5" />
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-3/5" />
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-16 bg-gray-200 dark:bg-slate-800 rounded-full" />
          <div className="h-6 w-20 bg-gray-200 dark:bg-slate-800 rounded-full" />
        </div>
        <div className="pt-4 flex justify-between items-center border-t border-gray-100 dark:border-slate-800">
          <div className="h-6 w-16 bg-gray-200 dark:bg-slate-800 rounded" />
          <div className="h-9 w-28 bg-gray-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function FoodExplorerContent() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab State: "smart-match" | "browse"
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"smart-match" | "browse">(
    tabParam === "smart-match" ? "smart-match" : "browse"
  );

  // Sync tab with URL search parameter
  useEffect(() => {
    if (tabParam === "smart-match" && activeTab !== "smart-match") {
      setActiveTab("smart-match");
    } else if (tabParam === "browse" && activeTab !== "browse") {
      setActiveTab("browse");
    }
  }, [tabParam]);

  const handleTabChange = (newTab: "smart-match" | "browse") => {
    setActiveTab(newTab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", newTab);
    router.replace(`/public/food?${params.toString()}`, { scroll: false });
  };

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FoodFilters>(DEFAULT_FILTERS);
  const [activeQuickFilter, setActiveQuickFilter] = useState("all");
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

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
    12
  );
  const totalPages = meta?.totalPages || 1;
  const totalItems = meta?.total ?? allFood?.length ?? 0;

  const handleFilterChange = <K extends keyof FoodFilters>(
    key: K,
    value: FoodFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
    // Unset quick filter if changing manually
    if (key !== "sortBy") {
      setActiveQuickFilter("custom");
    }
  };

  const applyQuickFilter = (id: string) => {
    setActiveQuickFilter(id);
    setCurrentPage(1);

    switch (id) {
      case "all":
        setFilters(DEFAULT_FILTERS);
        setSearchInput("");
        setSearchTerm("");
        break;
      case "donations":
        setFilters({ ...DEFAULT_FILTERS, isDonation: "true" });
        break;
      case "expiring":
        setFilters({ ...DEFAULT_FILTERS, sortBy: "expiring" });
        break;
      case "home_cooks":
        setFilters({ ...DEFAULT_FILTERS, supplierType: "individual" });
        break;
      case "restaurants":
        setFilters({ ...DEFAULT_FILTERS, supplierType: "restaurant" });
        break;
      case "ngos":
        setFilters({ ...DEFAULT_FILTERS, supplierType: "ngo" });
        break;
      case "under50":
        setFilters({ ...DEFAULT_FILTERS, minPrice: "0", maxPrice: "50" });
        break;
      default:
        break;
    }
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchInput("");
    setSearchTerm("");
    setActiveQuickFilter("all");
    setCurrentPage(1);
  };

  const handleReserve = (food: PublicFoodDTO) => {
    if (!isAuthenticated) {
      toast.error("Please log in to claim or reserve food");
      router.push("/auth/login");
      return;
    }
    router.push(`/protected/food/${food.id}/reserve`);
  };

  const handleVoiceDataParsed = (parsed: ParsedFoodListing) => {
    try {
      sessionStorage.setItem("annosetu_voice_draft", JSON.stringify(parsed));
    } catch {
      // ignore storage fail
    }
    setIsVoiceModalOpen(false);
    toast.success("Voice listing captured! Taking you to create listing...");
    if (user?.role === "restaurant") {
      router.push("/protected/restaurant/add-food");
    } else {
      router.push("/protected/individual/add-food");
    }
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
    <div className="min-h-screen w-full bg-slate-50/50 dark:bg-[#070D18] text-slate-900 dark:text-slate-100 overflow-x-hidden pb-20">
      {/* Dynamic Background Ambient Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-teal-500/10 dark:bg-teal-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Hero Header Section */}
      <section className="relative z-10 pt-6 sm:pt-10 pb-6 px-4 sm:px-6 lg:px-8 border-b border-gray-200/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          {/* Top Banner Tag */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-950/80 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider shadow-xs backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <FaLeaf className="w-3.5 h-3.5 text-emerald-500" />
              Live Surplus Food Rescue Hub
            </div>

            {/* Temporarily disabled AI features - Voice-to-Listing
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md hover:shadow-emerald-500/25 transition-all duration-200 cursor-pointer"
            >
              <FaMicrophone className="text-amber-300 animate-bounce" />
              <span>Voice-to-Listing (AI)</span>
            </button>
            */}
          </div>

          {/* Hero Titles & Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
                Discover & Match{" "}
                <span className="bg-linear-to-r from-emerald-600 via-teal-500 to-green-500 dark:from-emerald-400 dark:via-teal-300 dark:to-green-400 bg-clip-text text-transparent">
                  Fresh Surplus Meals
                </span>
              </h1>
              <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                Connect surplus food from verified restaurants, caterers, and home kitchens to hungry neighbors and certified NGOs in real-time.
              </p>
            </div>

            {/* Live Metrics Card */}
            <div className="lg:col-span-4 flex sm:grid sm:grid-cols-3 lg:grid-cols-3 gap-3 overflow-x-auto pb-2 sm:pb-0">
              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-gray-200/80 dark:border-slate-800 shadow-sm backdrop-blur-xl shrink-0 min-w-[120px] sm:min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">
                  <FaUtensils className="text-emerald-500" />
                  <span>Available</span>
                </div>
                <div className="text-xl font-black text-gray-900 dark:text-white">
                  {totalItems > 0 ? `${totalItems}+` : "Live"}
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Active Meals</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-gray-200/80 dark:border-slate-800 shadow-sm backdrop-blur-xl shrink-0 min-w-[120px] sm:min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">
                  <FaHandHoldingHeart className="text-rose-500" />
                  <span>Free Deals</span>
                </div>
                <div className="text-xl font-black text-gray-900 dark:text-white">100%</div>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">Donation Ready</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-gray-200/80 dark:border-slate-800 shadow-sm backdrop-blur-xl shrink-0 min-w-[120px] sm:min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">
                  <FaBolt className="text-amber-500" />
                  <span>Verified</span>
                </div>
                <div className="text-xl font-black text-gray-900 dark:text-white">Instant</div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Fast Pickup</span>
              </div>
            </div>
          </div>

          {/* Mode Header */}
          <div className="mt-8 pt-4 border-t border-gray-200/60 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/50 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs sm:text-sm">
              <FaUtensils className="text-emerald-500" />
              <span>Food Marketplace Catalog</span>
              {totalItems > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-600 text-white">
                  {totalItems} Active
                </span>
              )}
            </div>

            {/* Quick Helper Description */}
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center sm:text-right">
              Browsing live surplus food sorted by freshness and proximity
            </div>
          </div>
        </div>
      </section>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 relative z-10">
        <AnimatePresence mode="wait">
          {/* Temporarily disabled SmartMatcher tab
          {activeTab === "smart-match" ? (
            <motion.div
              key="smart-matcher-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <SmartMatcherDashboard />
            </motion.div>
          ) : ( */}
            <motion.div
              key="browse-marketplace-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {/* Search & Quick Category Bar */}
              <div className="space-y-4 mb-6">
                {/* Search Bar with Integrated Clear & Voice Action */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-linear-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 rounded-2xl blur-md -z-10 group-focus-within:from-emerald-500/20 group-focus-within:to-indigo-500/20 transition-all duration-300" />
                  <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl border-2 border-gray-200/90 dark:border-slate-800 shadow-lg px-4 py-2 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 transition-all duration-200">
                    <FaSearch className="text-emerald-500 text-base shrink-0 mr-3" />
                    <input
                      type="text"
                      placeholder="Search surplus meals (e.g., Biryani, Paneer, Rice, Bakery, Restaurant name)..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-sm sm:text-base font-semibold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        onClick={() => setSearchInput("")}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                        title="Clear search"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Filters Pill Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {QUICK_FILTERS.map((q) => {
                    const Icon = q.icon;
                    const isSelected = activeQuickFilter === q.id;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => applyQuickFilter(q.id)}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
                          isSelected
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105"
                            : "bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 hover:border-emerald-400/80 hover:bg-emerald-50/50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <Icon className={isSelected ? "text-white" : "text-emerald-500"} />
                        <span>{q.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Filter Chips / Dismiss Bar */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 mb-6 p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 text-xs">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1 mr-1">
                    <FaFilter className="text-[10px]" />
                    Active Filters:
                  </span>

                  {searchTerm && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-500/30 font-semibold text-gray-800 dark:text-gray-200">
                      Query: &quot;{searchTerm}&quot;
                      <button onClick={() => { setSearchInput(""); setSearchTerm(""); }} className="hover:text-rose-500 cursor-pointer">
                        <FaTimes className="text-[10px]" />
                      </button>
                    </span>
                  )}

                  {filters.isDonation !== "all" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-500/30 font-semibold text-gray-800 dark:text-gray-200">
                      {filters.isDonation === "true" ? "Free Donations Only" : "Paid Surplus Deals"}
                      <button onClick={() => handleFilterChange("isDonation", "all")} className="hover:text-rose-500 cursor-pointer">
                        <FaTimes className="text-[10px]" />
                      </button>
                    </span>
                  )}

                  {filters.supplierType !== "all" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-500/30 font-semibold text-gray-800 dark:text-gray-200">
                      Supplier: {filters.supplierType}
                      <button onClick={() => handleFilterChange("supplierType", "all")} className="hover:text-rose-500 cursor-pointer">
                        <FaTimes className="text-[10px]" />
                      </button>
                    </span>
                  )}

                  {filters.cuisineType !== "all" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-500/30 font-semibold text-gray-800 dark:text-gray-200">
                      Cuisine: {filters.cuisineType.replace("_", " ")}
                      <button onClick={() => handleFilterChange("cuisineType", "all")} className="hover:text-rose-500 cursor-pointer">
                        <FaTimes className="text-[10px]" />
                      </button>
                    </span>
                  )}

                  {filters.sortBy !== "newest" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-500/30 font-semibold text-gray-800 dark:text-gray-200">
                      Sorted: {filters.sortBy}
                      <button onClick={() => handleFilterChange("sortBy", "newest")} className="hover:text-rose-500 cursor-pointer">
                        <FaTimes className="text-[10px]" />
                      </button>
                    </span>
                  )}

                  {(filters.minPrice || filters.maxPrice) && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-500/30 font-semibold text-gray-800 dark:text-gray-200">
                      Price: ₹{filters.minPrice || 0} - ₹{filters.maxPrice || "Any"}
                      <button onClick={() => { handleFilterChange("minPrice", ""); handleFilterChange("maxPrice", ""); }} className="hover:text-rose-500 cursor-pointer">
                        <FaTimes className="text-[10px]" />
                      </button>
                    </span>
                  )}

                  <button
                    onClick={clearFilters}
                    className="ml-auto text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <FaUndo className="text-[10px]" />
                    Reset All
                  </button>
                </div>
              )}

              {/* Main Catalog Area: Toolbar + Sidebar + Grid */}
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Desktop Filter Sidebar (Sticky) */}
                <aside className="hidden lg:block w-72 shrink-0 sticky top-24 rounded-3xl p-5 bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                    <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <FaSlidersH className="text-emerald-500" />
                      Refine Search
                    </h2>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                      >
                        Reset All
                      </button>
                    )}
                  </div>

                  {/* Listing Type */}
                  <div>
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 block">
                      Listing Type
                    </label>
                    <Select
                      options={donationOptions}
                      value={filters.isDonation}
                      onChange={(val) =>
                        handleFilterChange("isDonation", String(val) as FoodFilters["isDonation"])
                      }
                      className="text-xs"
                    />
                  </div>

                  {/* Supplier Category */}
                  <div>
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 block">
                      Supplier Origin
                    </label>
                    <Select
                      options={supplierOptions}
                      value={filters.supplierType}
                      onChange={(val) =>
                        handleFilterChange("supplierType", String(val) as FoodFilters["supplierType"])
                      }
                      className="text-xs"
                    />
                  </div>

                  {/* Cuisine Category */}
                  <div>
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 block">
                      Cuisine Category
                    </label>
                    <Select
                      options={cuisineOptions}
                      value={filters.cuisineType}
                      onChange={(val) =>
                        handleFilterChange("cuisineType", String(val))
                      }
                      className="text-xs"
                    />
                  </div>

                  {/* Distance Radius */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Max Distance
                      </label>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
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
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
                      <span>1 km</span>
                      <span>25 km</span>
                      <span>50 km</span>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 block">
                      Price Range (₹)
                    </label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) =>
                          handleFilterChange("minPrice", e.target.value)
                        }
                        className="text-xs py-1.5"
                      />
                      <span className="text-gray-400 font-bold">-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) =>
                          handleFilterChange("maxPrice", e.target.value)
                        }
                        className="text-xs py-1.5"
                      />
                    </div>
                  </div>
                </aside>

                {/* Main Food Content Area */}
                <div className="flex-1 w-full min-w-0">
                  {/* Results Count & View Mode / Sort Toolbar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                      {/* Mobile Filter Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setShowMobileFilters(true)}
                        className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 cursor-pointer"
                      >
                        <FaFilter className="w-3.5 h-3.5" />
                        <span>Filter Drawer</span>
                        {hasActiveFilters && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        )}
                      </button>

                      <div className="text-xs font-bold text-gray-600 dark:text-gray-400">
                        Showing{" "}
                        <span className="text-gray-900 dark:text-white font-black text-sm">
                          {totalItems}
                        </span>{" "}
                        surplus items
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      {/* Sort Dropdown */}
                      <div className="w-48">
                        <Select
                          options={sortOptions}
                          value={filters.sortBy}
                          onChange={(val) =>
                            handleFilterChange("sortBy", String(val) as FoodFilters["sortBy"])
                          }
                          className="text-xs py-2 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-xl"
                        />
                      </div>

                      {/* Grid / List View Toggle */}
                      <div className="flex items-center bg-gray-200/80 dark:bg-slate-800/80 p-1 rounded-xl border border-gray-300/80 dark:border-slate-700">
                        <button
                          onClick={() => setViewMode("grid")}
                          className={`p-2 rounded-lg text-sm transition-all cursor-pointer ${
                            viewMode === "grid"
                              ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                          }`}
                          aria-label="Grid View"
                          title="Grid View"
                        >
                          <FaTh />
                        </button>
                        <button
                          onClick={() => setViewMode("list")}
                          className={`p-2 rounded-lg text-sm transition-all cursor-pointer ${
                            viewMode === "list"
                              ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                          }`}
                          aria-label="List View"
                          title="List View"
                        >
                          <FaList />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Listings Render */}
                  {isLoading ? (
                    <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <FoodSkeletonCard key={i} viewMode={viewMode} />
                      ))}
                    </div>
                  ) : allFood.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-3xl p-12 text-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl"
                    >
                      <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
                        <FaUtensils />
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                        No Surplus Meals Found
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto text-sm leading-relaxed">
                        We couldn&apos;t find any active surplus food matching your exact search filters. Try adjusting your distance radius or jump into our AI Smart Matcher.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg cursor-pointer"
                          onClick={clearFilters}
                        >
                          Clear All Filters
                        </Button>
                        <Button
                          className="bg-linear-to-r from-indigo-600 to-purple-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg cursor-pointer"
                          onClick={() => handleTabChange("smart-match")}
                        >
                          Launch AI Matcher ✨
                        </Button>
                      </div>
                    </motion.div>
                  ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {allFood.map((food, index) => (
                        <motion.div
                          key={food.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
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
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
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

                  {/* Modern Glass Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-12 flex justify-center">
                      <nav className="flex items-center gap-2 bg-white dark:bg-slate-900/90 backdrop-blur-xl p-2 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-md">
                        <button
                          onClick={() => {
                            setCurrentPage((prev) => Math.max(prev - 1, 1));
                            window.scrollTo({ top: 300, behavior: "smooth" });
                          }}
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
                                onClick={() => {
                                  setCurrentPage(pageNum);
                                  window.scrollTo({ top: 300, behavior: "smooth" });
                                }}
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
                          onClick={() => {
                            setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                            window.scrollTo({ top: 300, behavior: "smooth" });
                          }}
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
            </motion.div>
          {/* )} */}
        </AnimatePresence>
      </main>

      {/* Mobile Slide-Over Filter Drawer */}
      <AnimatePresence>
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between z-10"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
                  <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <FaSlidersH className="text-emerald-500" />
                    Filters & Sorting
                  </h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Listing Type */}
                <div>
                  <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 block">
                    Listing Type
                  </label>
                  <Select
                    options={donationOptions}
                    value={filters.isDonation}
                    onChange={(val) =>
                      handleFilterChange("isDonation", String(val) as FoodFilters["isDonation"])
                    }
                  />
                </div>

                {/* Supplier Origin */}
                <div>
                  <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 block">
                    Supplier Origin
                  </label>
                  <Select
                    options={supplierOptions}
                    value={filters.supplierType}
                    onChange={(val) =>
                      handleFilterChange("supplierType", String(val) as FoodFilters["supplierType"])
                    }
                  />
                </div>

                {/* Cuisine */}
                <div>
                  <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 block">
                    Cuisine Category
                  </label>
                  <Select
                    options={cuisineOptions}
                    value={filters.cuisineType}
                    onChange={(val) =>
                      handleFilterChange("cuisineType", String(val))
                    }
                  />
                </div>

                {/* Distance Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Max Distance
                    </label>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
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
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 block">
                    Price Range (₹)
                  </label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) =>
                        handleFilterChange("minPrice", e.target.value)
                      }
                      className="text-xs py-1.5"
                    />
                    <span className="text-gray-400 font-bold">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) =>
                        handleFilterChange("maxPrice", e.target.value)
                      }
                      className="text-xs py-1.5"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-slate-800 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 py-3 font-bold text-xs"
                  onClick={clearFilters}
                >
                  Reset
                </Button>
                <Button
                  className="flex-1 py-3 bg-emerald-600 text-white font-bold text-xs shadow-lg"
                  onClick={() => setShowMobileFilters(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Temporarily disabled AI Voice Modal
      {isVoiceModalOpen && (
        <VoiceToListingModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onApplyParsedData={handleVoiceDataParsed}
          userType={user?.role === "restaurant" ? "restaurant" : "individual"}
        />
      )}
      */}
    </div>
  );
}

export default function AllFoodPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center py-20">
          <LoadingSpinner text="Loading Live Food Hub..." />
        </div>
      }
    >
      <FoodExplorerContent />
    </Suspense>
  );
}