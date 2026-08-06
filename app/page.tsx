// app/page.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  FaFilter,
  FaHeart,
  FaMapMarkedAlt,
  FaSearch,
  FaStore,
  FaArrowRight,
  FaUtensils,
  FaLeaf,
} from "react-icons/fa";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Select from "@/components/common/Select";
import Button from "@/components/common/Button";
import Link from "next/link";
import Image from "next/image";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useAuth } from "@/hooks/useAuth";
import {
  useAllFood,
  useFoodStats,
  type FoodFilters,
} from "@/hooks/useFoodQueries";
import FoodCard from "@/components/food/FoodCard";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const DEFAULT_FILTERS: FoodFilters = {
  supplierType: "all",
  isDonation: "all",
  maxDistance: 10,
  minPrice: "",
  maxPrice: "",
  cuisineType: "all",
  sortBy: "newest",
};

const roleGradientMap = {
  individual: "from-pink-700 via-pink-500 to-pink-400",
  restaurant: "from-blue-700 via-blue-500 to-blue-400",
  ngo: "from-purple-700 via-purple-500 to-purple-400",
};

const PLACEHOLDERS = [
  "Search for pizza, biryani, pasta...",
  "Find restaurants near you...",
  "Discover home-cooked meals...",
  "Browse donations in your area...",
];

export default function HomePage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && resolvedTheme === "dark";
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [search, setSearch] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<FoodFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FoodFilters>(DEFAULT_FILTERS);

  const handleFilterChange = <K extends keyof FoodFilters>(
    key: K,
    value: FoodFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setLoading(true);
    setAppliedFilters(filters);
    setShowFilters(false);
    setLoading(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(
      search.trim()
        ? `/public/food?search=${encodeURIComponent(search.trim())}`
        : "/public/food",
    );
  };

  const { stats, isLoading: statsLoading } = useFoodStats();
  const { foods: previewFoods, isLoading: foodsLoading } = useAllFood(
    appliedFilters,
    "",
    1,
    6,
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full bg-transparent overflow-x-hidden">
      {/* ================= 1. HERO WITH FULL BACKGROUND VIDEO ================= */}
      <div className="w-full relative overflow-hidden min-h-[90vh] md:min-h-[85vh] flex flex-col justify-between text-gray-900 dark:text-white transition-colors duration-500">
        {/* Full-Cover Background Video & Ambient Adaptive Gradient Overlays */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover scale-105"
          >
            <source src="/donation_video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          {/* Multi-layered adaptive gradient overlays: subtle bluish-navy tint with high transparency for maximum video visibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/15 to-white/65 dark:from-[#0A192F]/55 dark:via-[#0c1f3d]/35 dark:to-[#0A192F]/70 transition-colors duration-500" />
          <div className="absolute inset-0 bg-radial from-transparent via-transparent to-white/35 dark:from-transparent dark:via-transparent dark:to-[#0A192F]/40 pointer-events-none transition-colors duration-500" />
        </div>

        {/* Ambient Glowing Blobs in Background with gentle transparency */}
        <div className="absolute inset-0 opacity-20 dark:opacity-15 pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400 dark:bg-teal-500/40 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-300 dark:bg-blue-600/40 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-40 right-40 w-48 h-48 bg-green-300 dark:bg-cyan-400/30 rounded-full filter blur-3xl animate-pulse delay-700"></div>
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-28 md:pb-20 text-center flex-1 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Pill Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/40 dark:bg-white/15 backdrop-blur-md rounded-full mb-8 border border-emerald-500/30 dark:border-white/25 shadow-md dark:shadow-lg"
            >
              <FaLeaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-bounce" />
              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                <span className="logotext font-semibold text-emerald-950 dark:text-white">অন্নসেতু</span> — the food bridge
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6 leading-tight drop-shadow-xs dark:drop-shadow-md"
            >
              Save Food! <br />
              <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-amber-600 dark:from-emerald-400 dark:via-green-300 dark:to-amber-300 bg-clip-text text-transparent">
                Serve Community!
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Every day, restaurants and home cooks have food left over — and
              every day, someone nearby could use it. Connect, rescue surplus
              food, and make a real difference today.
            </motion.p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <form onSubmit={handleSearchSubmit} className="relative group">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-6 py-3.5 pl-14 pr-28 rounded-2xl border-2 border-gray-300/60 dark:border-white/30 bg-white/40 dark:bg-black/40 backdrop-blur-xl placeholder-gray-500 dark:placeholder-gray-300 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/30 transition-all duration-300 text-base sm:text-lg shadow-xl dark:shadow-2xl"
                />
                <FaSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-emerald-600 dark:text-emerald-400 text-xl pointer-events-none" />
                {!search && (
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 overflow-hidden h-7 pointer-events-none">
                    <motion.div
                      animate={{ y: -placeholderIndex * 28 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-0.5 text-left"
                    >
                      {PLACEHOLDERS.map((text) => (
                        <div
                          key={text}
                          className="h-7 text-gray-600 dark:text-gray-300 text-base sm:text-lg font-normal"
                        >
                          {text}
                        </div>
                      ))}
                    </motion.div>
                  </div>
                )}
                <button
                  type="submit"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl font-semibold shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer hidden md:block"
                >
                  Search
                </button>
              </form>
            </motion.div>

            {/* Action CTA Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="flex flex-wrap items-center justify-center gap-4 text-sm sm:text-base font-semibold"
            >
              <Link
                href="/public/food"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-xl hover:shadow-emerald-500/30 hover:scale-105 transition-all duration-200"
              >
                <FaUtensils className="w-4 h-4" />
                Browse Available Food
              </Link>
              <Link
                href="/protected/add-food"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300/60 dark:border-white/30 bg-white/40 dark:bg-white/15 hover:bg-white/50 dark:hover:bg-white/25 text-gray-900 dark:text-white backdrop-blur-md shadow-lg hover:scale-105 transition-all duration-200"
              >
                <FaHeart className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                Donate / Share Food
              </Link>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 mt-12 sm:mt-16 max-w-4xl mx-auto"
            >
              <div className="backdrop-blur-xl bg-white/40 dark:bg-black/35 border border-gray-200/60 dark:border-white/20 rounded-2xl p-5 text-center shadow-lg dark:shadow-2xl hover:border-emerald-500/50 dark:hover:border-emerald-400/50 transition-all">
                <AnimatedNumber
                  value={12.5}
                  decimals={1}
                  suffix="K+"
                  duration={0.5}
                  className="mb-1"
                />
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Meals Saved</div>
              </div>
              <div className="backdrop-blur-xl bg-white/40 dark:bg-black/35 border border-gray-200/60 dark:border-white/20 rounded-2xl p-5 text-center shadow-lg dark:shadow-2xl hover:border-amber-500/50 dark:hover:border-amber-400/50 transition-all">
                <AnimatedNumber
                  value={150}
                  duration={2}
                  className="mb-1"
                />
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Partner Donors</div>
              </div>
              <div className="backdrop-blur-xl bg-white/40 dark:bg-black/35 border border-gray-200/60 dark:border-white/20 rounded-2xl p-5 text-center shadow-lg dark:shadow-2xl hover:border-teal-500/50 dark:hover:border-teal-400/50 transition-all">
                <AnimatedNumber
                  value={8.2}
                  decimals={1}
                  suffix="T"
                  duration={1}
                  className="mb-1"
                />
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">CO₂ Reduced</div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Wave Divider */}
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

      {/* ================= FILTERS + LISTINGS ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filter Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card rounded-2xl shadow-xl p-6 mb-8 border border-gray-200/80 dark:border-slate-800 backdrop-blur-md"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-950 transition-colors duration-200 lg:hidden cursor-pointer"
              >
                <FaFilter className="text-gray-600 dark:text-gray-300" />
                <span className="font-medium">Filters</span>
              </button>
              <div className="hidden lg:flex items-center gap-2">
                <FaFilter className="text-emerald-500" />
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  Filter by:
                </span>
              </div>
            </div>
            <AnimatePresence>
              <div className={`${showFilters ? "block" : "hidden"} lg:block`}>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col p-1 px-2 lg:flex-row items-start lg:items-center gap-4 overflow-hidden"
                >
                  <Select
                    value={filters.isDonation}
                    onChange={(value) =>
                      handleFilterChange("isDonation", String(value))
                    }
                    options={[
                      { value: "all", label: "All Types" },
                      { value: "true", label: "Donations Only" },
                      { value: "false", label: "Discounted Food" },
                    ]}
                    className="w-60 lg:w-45"
                  />
                  <Select
                    value={filters.maxDistance}
                    onChange={(value) =>
                      handleFilterChange("maxDistance", Number(value))
                    }
                    options={[
                      { value: "5", label: "Within 5km" },
                      { value: "10", label: "Within 10km" },
                      { value: "20", label: "Within 20km" },
                      { value: "50", label: "Within 50km" },
                    ]}
                    className="w-60 lg:w-35"
                  />
                  <Select
                    value={filters.sortBy}
                    onChange={(value) =>
                      handleFilterChange("sortBy", String(value))
                    }
                    options={[
                      { value: "newest", label: "Newest First" },
                      { value: "expiring", label: "Expiring Soon" },
                      { value: "price_low", label: "Price: Low to High" },
                      { value: "price_high", label: "Price: High to Low" },
                    ]}
                    className="w-60 lg:w-50"
                  />
                  <button
                    onClick={handleApplyFilters}
                    className="w-full lg:w-auto px-6 py-3 cursor-pointer bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    Apply Filters
                  </button>
                </motion.div>
              </div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Real-time 3 Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <motion.div
            whileHover={{ y: -4 }}
            className="card rounded-2xl p-6 border border-blue-200/80 dark:border-blue-500/20 shadow-md hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg text-white">
                <FaMapMarkedAlt className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">
                  Active Listings
                </p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-400">
                  {statsLoading ? "…" : stats.activeListings}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="card rounded-2xl p-6 border border-emerald-200/80 dark:border-emerald-500/20 shadow-md hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg text-white">
                <FaHeart className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-300 font-medium">
                  Donations
                </p>
                <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-400">
                  {statsLoading ? "…" : stats.donations}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="card rounded-2xl p-6 border border-pink-200/80 dark:border-pink-500/20 shadow-md hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg text-white">
                <FaStore className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-pink-600 dark:text-pink-300 font-medium">
                  Restaurants
                </p>
                <p className="text-3xl font-bold text-pink-900 dark:text-pink-400">
                  {statsLoading ? "…" : stats.uniqueRestaurants}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Food Listings Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              Available Food{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                ({statsLoading ? "…" : stats.activeListings})
              </span>
            </h2>
            <Link
              href="/public/food"
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold flex items-center gap-2 group transition-colors"
            >
              View All
              <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>

          {foodsLoading || loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner text="Loading available food..." />
            </div>
          ) : previewFoods.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card rounded-2xl p-12 text-center border border-gray-200 dark:border-slate-800"
            >
              <FaUtensils className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No food matches your filters right now — check back soon!
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {previewFoods.map((food, index) => (
                <motion.div
                  key={food.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <FoodCard
                    food={food}
                    isAuthenticated={isAuthenticated}
                    userRole={user?.role}
                    onReserve={(f) =>
                      router.push(
                        isAuthenticated
                          ? `/protected/food/${f.id}/reserve`
                          : "/auth/login",
                      )
                    }
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ================= COMMUNITY (photography) ================= */}
      <div className="bg-gradient-to-b from-transparent dark:from-gray-900/50 via-green-50/50 dark:via-slate-900/80 to-white dark:to-zinc-950 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <FaLeaf className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Behind every listing, a hand that cooked
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Home cooks sharing an extra portion. Restaurants closing out the
              night without waste. Neighbors picking up a warm meal instead of a
              delivery fee. This is what the bridge actually looks like.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="relative rounded-3xl overflow-hidden h-72 md:h-96 shadow-xl group border border-white/20"
            >
              <Image
                src="https://images.unsplash.com/photo-1593113598332-cd288d649433?w=900"
                alt="Volunteers serving a shared community meal"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <p className="absolute bottom-4 left-4 right-4 text-white text-sm font-medium">
                Community meal-sharing in action
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="relative rounded-3xl overflow-hidden h-72 md:h-96 shadow-xl group border border-white/20"
            >
              <Image
                src="https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?w=900"
                alt="Volunteers preparing food to share with the community"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <p className="absolute bottom-4 left-4 right-4 text-white text-sm font-medium">
                Every portion has someone&apos;s name on it, eventually
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ================= CTA (EXACT PREVIOUS CONTENT WITH SMOOTH ANIMATIONS) ================= */}
      {!isAuthenticated && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-2xl border border-gray-200/80 dark:border-slate-800"
          >
            {/* Ambient Background Glowing Blobs */}
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-400 dark:bg-emerald-500 rounded-full filter blur-3xl animate-pulse"></div>
              <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-amber-400 dark:bg-amber-500 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10">
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white"
              >
                Join AnnoSetu Today!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-xl mb-8 max-w-2xl mx-auto text-gray-600 dark:text-gray-300"
              >
                Whether you&apos;re a restaurant with surplus food or someone
                looking to save food and money, AnnoSetu helps you make a
                difference.
              </motion.p>

              <div className="flex flex-col md:flex-row flex-wrap justify-center gap-4 w-full sm:w-[85%] md:w-[80%] mx-auto">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="flex-1">
                  <Link href="/auth/register?role=individual" className="block w-full">
                    <Button
                      type="button"
                      className={`flex w-full group items-center justify-center gap-2 bg-gradient-to-r ${roleGradientMap.individual} hover:shadow-xl transition-all duration-200 py-3.5`}
                    >
                      👤 Register as Individual
                      <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="flex-1">
                  <Link href="/auth/register?role=restaurant" className="block w-full">
                    <Button
                      type="button"
                      className={`flex w-full group items-center justify-center gap-2 bg-gradient-to-r ${roleGradientMap.restaurant} hover:shadow-xl transition-all duration-200 py-3.5`}
                    >
                      🏪 Register as Restaurant
                      <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="flex-1">
                  <Link href="/auth/register?role=ngo" className="block w-full">
                    <Button
                      type="button"
                      className={`flex w-full group items-center justify-center gap-2 bg-gradient-to-r ${roleGradientMap.ngo} hover:shadow-xl transition-all duration-200 py-3.5`}
                    >
                      🏥 Register as NGO
                      <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </motion.div>
              </div>

              <p className="mt-6 text-sm dark:text-white/80 text-gray-900/80">
                🌱 Join 5,000+ users already saving food and reducing waste
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
