// import Navbar from "@/components/layout/Navbar";
"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaFilter,
  FaHeart,
  FaLeaf,
  FaMapMarkedAlt,
  FaSearch,
  FaStore,
  FaArrowRight,
} from "react-icons/fa";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import Select from "@/components/common/Select";
import Button from "@/components/common/Button";
import Link from "next/link";
import { AnimatedNumber } from "@/components/ui/animated-number";

export default function HomePage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && resolvedTheme === "dark";

  const [search, setSearch] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const [showFilters, setShowFilters] = useState(false);

  interface Filters {
    isDonation: string;
    maxDistance: number;
    sortBy: string;
  }

  const [filters, setFilters] = useState<Filters>({
    isDonation: "all",
    maxDistance: 10,
    sortBy: "newest",
  });

  const handleFilterChange = (key: keyof Filters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

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

  const roleGradientMap = {
    individual: "from-pink-700 via-pink-500 to-pink-400",
    restaurant: "from-blue-700 via-blue-500 to-blue-400",
    ngo: "from-purple-700 via-purple-500 to-purple-400",
  };

  return (
    <div className="min-h-screen w-full bg-transparent">
      <div className="w-full relative hero">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-green-800 dark:bg-slate-200 rounded-full filter  blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-950 dark:bg-gray-200 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-40 right-40 w-48 h-48 bg-lime-950 dark:bg-zinc-200 rounded-full filter blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center text-gray-800 dark:text-white"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="inline-flex items-center gap-2 px-4 py-2 dark:bg-white/20 bg-black/40 backdrop-blur-sm rounded-full mb-8 border border-black/50 dark:border-white/30"
            >
              <FaLeaf className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium">
                Save Food • Save Planet
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
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
              className="text-sm lg:text-lg mb-10 max-w-2xl mx-auto "
            >
              Connect with restaurants and home cooks to rescue surplus food
              before it goes to waste. Make a difference today!
            </motion.p>

            {/* search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative group">
                <input
                  type="text"
                  value={search || ""}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-6 py-1 lg:px-12 lg:py-3 pl-14 pr-4  rounded-2xl border-2 dark:border-white/30 border-black/30 dark:bg-white/20 bg-black/40 backdrop-blur-md dark:placeholder-white/70 placeholder-black/70 focus:outline-none dark:focus:border-white focus:border-black/10 focus:ring-4 dark:focus:ring-white/30 focus:ring-black/20 transition-all duration-300 text-lg"
                />
                <FaSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 dark:text-white/70 text-black/50 text-xl" />
                {!search && (
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 overflow-hidden h-7 pointer-events-none">
                    <motion.div
                      animate={{ y: -placeholderIndex * 28 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-0.5"
                    >
                      {PLACEHOLDERS.map((text, i) => (
                        <div
                          key={i}
                          className="h-7 dark:text-white/70 text-black"
                        >
                          {text}
                        </div>
                      ))}
                    </motion.div>
                  </div>
                )}
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1 dark:bg-black/60 bg-white/60 text-green-600 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 hidden md:block cursor-pointer"
                >
                  Search
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-3xl mx-auto"
            >
              <div className=" card  backdrop-blur-sm rounded-xl p-4 ">
                {/* <AnimatedNumber value={8.2} suffix="T" decimals={1} duration={2.5} className="mb-2" /> */}
                <AnimatedNumber
                  value={12.5}
                  decimals={1}
                  suffix="K+"
                  duration={0.5}
                  className="mb-2"
                />
                <div className="text-sm ">Meals Saved</div>
              </div>
              <div className="card backdrop-blur-sm rounded-xl p-4 ">
                <AnimatedNumber value={150} duration={2} className="mb-2" />
                <div className="text-sm ">Partner Restaurants</div>
              </div>
              <div className="card backdrop-blur-sm rounded-xl p-4 ">
                <AnimatedNumber
                  value={8.2}
                  decimals={1}
                  suffix="T"
                  duration={1}
                  className="mb-2"
                />{" "}
                <div className="text-sm ">CO₂ Reduced</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
        <div className="absolute -bottom-px left-0 right-0 leading-none ">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
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
                    onChange={(e) =>
                      setFilters({ ...filters, isDonation: e.target.value })
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
                    onChange={(e) =>
                      setFilters({ ...filters, maxDistance: e.target.value })
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
                    onChange={(e) =>
                      setFilters({ ...filters, sortBy: e.target.value })
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
                    onClick={() => setFilters({ ...filters })}
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
          transition={{ delay: 0.9 }}
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
                  {/* {activeListings} */}0
                </p>
              </div>
            </div>
          </div>

          <div className="card rounded-2xl p-6 border border-green-200 ">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-linear-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaHeart className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 dark:text-green-300 font-medium">
                  Donations
                </p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-600">
                  {/* {donationsCount} */}0
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
                  {/* {uniqueRestaurants} */}0
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              Available Food{" "}
              <span className="text-green-600">
                {/* ({activeListings}) */}0
              </span>
            </h2>
            <Link
              href="/all-food"
              className="text-green-600 hover:text-green-700 font-medium flex items-center gap-2 group"
            >
              View All
              <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
        </motion.div>

        {/* if no user */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-16 card rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white dark:bg-gray-900/40 rounded-full filter blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white dark:bg-gray-900/40 rounded-full filter blur-3xl"></div>
          </div>

          <div className="relative">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Join AnnoSetu Today!
            </h3>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Whether you're a restaurant with surplus food or someone looking
              to save food and money, AnnoSetu helps you make a difference.
            </p>

            <div className=" flex flex-col md:flex-row flex-wrap justify-center gap-4 w-[80%] mx-auto">
              <Link href="/register?role=individual" className="flex-1">
                <Button
                  type="button"
                  className={`flex w-full group items-center gap-2 bg-linear-to-r ${roleGradientMap.individual} hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200`}
                >
                  👤 Register as Individual
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/register?role=restaurant" className="flex-1">
                <Button
                  type="button"
                  className={`flex w-full group items-center gap-2 bg-linear-to-r ${roleGradientMap.restaurant} hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200`}
                >
                  🏪 Register as Restaurant
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/register?role=ngo" className="flex-1">
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
    </div>
  );
}

const PLACEHOLDERS = [
  "Search for pizza, biryani, pasta...",
  "Find restaurants near you...",
  "Discover home-cooked meals...",
  "Browse donations in your area...",
];
