// app/page.tsx
"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
import { useState, useEffect, useMemo } from "react";
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
        ? `/food?search=${encodeURIComponent(search.trim())}`
        : "/food",
    );
  };

  const { stats, isLoading: statsLoading } = useFoodStats();
  const { foods: previewFoods, isLoading: foodsLoading } = useAllFood(
    appliedFilters,
    "",
    1,
    3,
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
    <div className="min-h-screen w-full bg-transparent">
      {/* ================= HERO ================= */}
      <div className="w-full relative overflow-hidden bg-linear-to-b from-transparent dark:from-gray-600 via-green-100 dark:via-slate-900 to-green-300 dark:to-zinc-950 dark:text-white text-gray-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-green-800 dark:bg-slate-200 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-700 dark:bg-gray-200 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-40 right-40 w-48 h-48 bg-lime-950 dark:bg-zinc-200 rounded-full filter blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-28 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center gap-2 px-4 py-2 dark:bg-white/20 bg-black/40 backdrop-blur-sm rounded-full mb-8 border border-black/50 dark:border-white/30"
            >
              <FaLeaf className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium">
                <span className="logotext font-semibold">অন্নসেতু</span> — the
                food bridge
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-5xl md:text-6xl bg-linear-to-r from-gray-600 dark:text-white via-gray-700 to-gray-950 bg-clip-text text-transparent font-bold mb-6 leading-tight"
            >
              Save Food!
              <br />
              <span className="bg-linear-to-r from-amber-500 via-amber-700 to-amber-950 bg-clip-text text-transparent">
                Serve Community!
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm lg:text-lg mb-10 max-w-2xl mx-auto"
            >
              Every day, restaurants and home cooks have food left over — and
              every day, someone nearby could use it. Connect, rescue surplus
              food, and make a difference today.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              <form onSubmit={handleSearchSubmit} className="relative group">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-6 py-1 lg:px-12 lg:py-3 pl-14 pr-4 rounded-2xl border-2 dark:border-white/30 border-black/30 dark:bg-white/20 bg-black/40 backdrop-blur-md dark:placeholder-white/70 placeholder-black/70 focus:outline-none dark:focus:border-white focus:border-black/10 focus:ring-4 dark:focus:ring-white/30 focus:ring-black/20 transition-all duration-300 text-lg"
                />
                <FaSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 dark:text-white/70 text-black/50 text-xl pointer-events-none" />
                {!search && (
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 overflow-hidden h-7 pointer-events-none">
                    <motion.div
                      animate={{ y: -placeholderIndex * 28 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-0.5"
                    >
                      {PLACEHOLDERS.map((text) => (
                        <div
                          key={text}
                          className="h-7 dark:text-white/70 text-black"
                        >
                          {text}
                        </div>
                      ))}
                    </motion.div>
                  </div>
                )}
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1 dark:bg-black/60 bg-white/60 text-green-600 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 hidden md:block cursor-pointer"
                >
                  Search
                </button>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-3xl mx-auto"
            >
              <div className="card backdrop-blur-sm rounded-xl p-4">
                <AnimatedNumber
                  value={12.5}
                  decimals={1}
                  suffix="K+"
                  duration={0.5}
                  className="mb-2"
                />
                <div className="text-sm">Meals Saved</div>
              </div>
              <div className="card backdrop-blur-sm rounded-xl p-4">
                <AnimatedNumber value={150} duration={2} className="mb-2" />
                <div className="text-sm">Partner Restaurants</div>
              </div>
              <div className="card backdrop-blur-sm rounded-xl p-4">
                <AnimatedNumber
                  value={8.2}
                  decimals={1}
                  suffix="T"
                  duration={1}
                  className="mb-2"
                />
                <div className="text-sm">CO₂ Reduced</div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute -bottom-px left-0 right-0 leading-none">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="block w-full h-full"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill={isDark ? "#0A192F" : "#ffff"}
            />
          </svg>
        </div>
      </div>

      {/* ================= FILTERS + LISTINGS ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card rounded-2xl shadow-xl p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-950 transition-colors duration-200 lg:hidden"
              >
                <FaFilter className="text-gray-600 dark:text-gray-300" />
                <span className="font-medium">Filters</span>
              </button>
              <div className="hidden lg:flex items-center gap-2">
                <FaFilter className="text-green-500" />
                <span className="font-medium text-gray-700 dark:text-gray-200">
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
                    className="w-full lg:w-auto px-6 py-3 cursor-pointer bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
                  >
                    Apply Filters
                  </button>
                </motion.div>
              </div>
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="card rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaMapMarkedAlt className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">
                  Active Listings
                </p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-600">
                  {statsLoading ? "…" : stats.activeListings}
                </p>
              </div>
            </div>
          </div>

          <div className="card rounded-2xl p-6 border border-green-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-linear-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaHeart className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 dark:text-green-300 font-medium">
                  Donations
                </p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-600">
                  {statsLoading ? "…" : stats.donations}
                </p>
              </div>
            </div>
          </div>

          <div className="card rounded-2xl p-6 border border-pink-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-linear-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaStore className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-pink-600 dark:text-pink-300 font-medium">
                  Restaurants
                </p>
                <p className="text-3xl font-bold text-pink-900 dark:text-pink-600">
                  {statsLoading ? "…" : stats.uniqueRestaurants}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              Available Food{" "}
              <span className="text-green-600">
                ({statsLoading ? "…" : stats.activeListings})
              </span>
            </h2>
            <Link
              href="/public/food"
              className="text-green-600 hover:text-green-700 font-medium flex items-center gap-2 group"
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
            <div className="card rounded-2xl p-12 text-center">
              <FaUtensils className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No food matches your filters right now — check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {previewFoods.map((food, index) => (
                <motion.div
                  key={food.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <FoodCard
                    food={food}
                    isAuthenticated={isAuthenticated}
                    userRole={user?.role}
                    onReserve={(f) =>
                      router.push(
                        isAuthenticated ? `/protected/food/${f.id}/reserve` : "/auth/login",
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
      <div className="bg-linear-to-b from-transparent dark:from-gray-600 via-green-50 dark:via-slate-900 to-white dark:to-zinc-950 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <FaLeaf className="w-6 h-6 text-green-600 dark:text-green-300 mx-auto mb-4" />
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
              className="relative rounded-3xl overflow-hidden h-72 md:h-96 shadow-xl"
            >
              <Image
                src="https://images.unsplash.com/photo-1593113598332-cd288d649433?w=900"
                alt="Volunteers serving a shared community meal"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
              <p className="absolute bottom-4 left-4 right-4 text-white text-sm">
                Community meal-sharing in action
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden h-72 md:h-96 shadow-xl"
            >
              <Image
                src="https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?w=900"
                alt="Volunteers preparing food to share with the community"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
              <p className="absolute bottom-4 left-4 right-4 text-white text-sm">
                Every portion has someone&apos;s name on it, eventually
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ================= CTA ================= */}
      {!isAuthenticated && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-white dark:bg-gray-900/40 rounded-full filter blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white dark:bg-gray-900/40 rounded-full filter blur-3xl"></div>
            </div>

            <div className="relative">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Join AnnoSetu Today!
              </h3>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                Whether you&apos;re a restaurant with surplus food or someone
                looking to save food and money, AnnoSetu helps you make a
                difference.
              </p>

              <div className="flex flex-col md:flex-row flex-wrap justify-center gap-4 w-[80%] mx-auto">
                <Link href="/auth/register?role=individual" className="flex-1">
                  <Button
                    type="button"
                    className={`flex w-full group items-center gap-2 bg-linear-to-r ${roleGradientMap.individual} hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200`}
                  >
                    👤 Register as Individual
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/auth/register?role=restaurant" className="flex-1">
                  <Button
                    type="button"
                    className={`flex w-full group items-center gap-2 bg-linear-to-r ${roleGradientMap.restaurant} hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200`}
                  >
                    🏪 Register as Restaurant
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/auth/register?role=ngo" className="flex-1">
                  <Button
                    type="button"
                    className={`flex w-full group items-center gap-2 bg-linear-to-r ${roleGradientMap.ngo} hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200`}
                  >
                    🏥 Register as NGO
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
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
