"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaMagic,
  FaMapMarkerAlt,
  FaClock,
  FaUsers,
  FaFilter,
  FaHeart,
  FaUtensils,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowRight,
  FaSearch,
  FaCompass,
  FaPhoneAlt,
  FaComments,
  FaLeaf,
  FaShieldAlt,
  FaTag,
  FaHandHoldingHeart,
  FaBolt,
  FaFire,
} from "react-icons/fa";
import type { MatchResultItem, NgoMatchItem } from "@/lib/smartMatcher";
import type { Allergen } from "@/types/food";
import toast from "react-hot-toast";

interface SmartMatcherDashboardProps {
  initialMode?: "food" | "ngo";
}

const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian", icon: "🌱" },
  { id: "vegan", label: "Vegan", icon: "🌿" },
  { id: "jain", label: "Jain Safe", icon: "🕊️" },
  { id: "halal", label: "Halal", icon: "☪️" },
  { id: "gluten_free", label: "Gluten-Free", icon: "🌾" },
  { id: "high_protein", label: "High Protein", icon: "💪" },
];

const ALLERGEN_AVOID_OPTIONS: { id: Allergen; label: string; icon: string }[] = [
  { id: "nuts", label: "No Nuts", icon: "🥜" },
  { id: "dairy", label: "No Dairy", icon: "🥛" },
  { id: "gluten", label: "No Gluten", icon: "🌾" },
  { id: "eggs", label: "No Eggs", icon: "🥚" },
  { id: "seafood", label: "No Seafood", icon: "🐟" },
  { id: "soy", label: "No Soy", icon: "🌱" },
];

export default function SmartMatcherDashboard({
  initialMode = "food",
}: SmartMatcherDashboardProps) {
  const [activeMode, setActiveMode] = useState<"food" | "ngo">(initialMode);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>("Detecting Location...");
  const [locationLoading, setLocationLoading] = useState(false);

  // Filter criteria states
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(15);
  const [partySize, setPartySize] = useState<number>(2);
  const [urgency, setUrgency] = useState<"any" | "urgent_only" | "relaxed">("any");
  const [pricePreference, setPricePreference] = useState<"all" | "donations_only" | "discount_only">("all");
  const [selectedDiet, setSelectedDiet] = useState<string[]>(["vegetarian"]);
  const [avoidAllergens, setAvoidAllergens] = useState<Allergen[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<string>("all");

  // Results state
  const [foodMatches, setFoodMatches] = useState<MatchResultItem[]>([]);
  const [ngoMatches, setNgoMatches] = useState<NgoMatchItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [topScore, setTopScore] = useState<number>(0);
  const [urgentCount, setUrgentCount] = useState<number>(0);
  const [donationCount, setDonationCount] = useState<number>(0);

  // Auto-detect GPS on mount
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationName("GPS not supported - Using City Default");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const city =
            data?.address?.city ||
            data?.address?.suburb ||
            data?.address?.town ||
            data?.address?.state_district ||
            "Your GPS Location";
          setLocationName(city);
        } catch {
          setLocationName("Current GPS Location");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        setLocationName("Location permission required");
      },
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  // Fetch Smart Matches
  const fetchMatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = {
        userLat: userLocation?.lat ?? null,
        userLng: userLocation?.lng ?? null,
        maxDistanceKm,
        partySize,
        dietaryTags: selectedDiet,
        avoidAllergens,
        urgency,
        pricePreference,
        cuisineType: selectedCuisine,
        mode: "both",
      };

      const res = await fetch("/api/food/smart-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to calculate matches");
      }

      setFoodMatches(json.data.matches || []);
      setNgoMatches(json.data.ngos || []);
      setTopScore(json.data.meta?.topMatchScore || 0);
      setUrgentCount(json.data.meta?.urgentCount || 0);
      setDonationCount(json.data.meta?.donationCount || 0);
    } catch (err: any) {
      console.error("Match fetch failed:", err);
      toast.error("Could not load smart matches");
    } finally {
      setIsLoading(false);
    }
  }, [
    userLocation,
    maxDistanceKm,
    partySize,
    selectedDiet,
    avoidAllergens,
    urgency,
    pricePreference,
    selectedCuisine,
  ]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const toggleDiet = (diet: string) => {
    setSelectedDiet((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    );
  };

  const toggleAllergenAvoid = (allergen: Allergen) => {
    setAvoidAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
    );
  };

  return (
    <div className="w-full space-y-8">
      {/* Hero / Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-emerald-600 via-teal-600 to-indigo-700 p-6 sm:p-10 text-white shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black tracking-wider uppercase mb-3">
            <FaMagic className="text-amber-300" />
            AI-Powered Surplus & Need Matcher
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
            Smart Food Matcher ✨
          </h1>
          <p className="text-white/90 text-sm sm:text-base mt-2 max-w-2xl">
            Our multi-factor algorithm instantly pairs hungry neighbors & NGOs with fresh surplus meals within minutes — reducing waste and fighting hunger in real-time.
          </p>

          {/* Mode Selector Toggle */}
          <div className="mt-6 inline-flex p-1.5 rounded-2xl bg-black/25 backdrop-blur-md border border-white/20">
            <button
              onClick={() => setActiveMode("food")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 ${
                activeMode === "food"
                  ? "bg-white text-emerald-800 shadow-lg scale-100"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <FaUtensils className={activeMode === "food" ? "text-emerald-600" : ""} />
              <span>I Need Food ({foodMatches.length} Matches)</span>
            </button>

            <button
              onClick={() => setActiveMode("ngo")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 ${
                activeMode === "ngo"
                  ? "bg-white text-indigo-900 shadow-lg scale-100"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <FaUsers className={activeMode === "ngo" ? "text-indigo-600" : ""} />
              <span>I Have Surplus (Find Partner NGOs)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg">
            {topScore}%
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Top Match Score</div>
            <div className="text-sm font-black text-gray-900 dark:text-white">AI Ranked #1</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center font-black text-lg">
            <FaFire className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Urgent Rescues</div>
            <div className="text-sm font-black text-gray-900 dark:text-white">{urgentCount} &lt; 2.5h Left</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-lg">
            <FaHeart className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Free Donations</div>
            <div className="text-sm font-black text-gray-900 dark:text-white">{donationCount} Active</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-lg">
            <FaMapMarkerAlt className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Search Radius</div>
            <div className="text-sm font-black text-gray-900 dark:text-white">Within {maxDistanceKm} km</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Filters / Right Match Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Interactive Preferences & Filters (4 Cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-gray-200/80 dark:border-gray-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <h3 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-2 text-base">
              <FaFilter className="text-emerald-500 text-sm" />
              Match Preferences
            </h3>
            <button
              type="button"
              onClick={detectLocation}
              disabled={locationLoading}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <FaCompass className={locationLoading ? "animate-spin" : ""} />
              <span>{locationLoading ? "Locating..." : "Refresh GPS"}</span>
            </button>
          </div>

          {/* Location Badge */}
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 flex items-center gap-2.5 text-xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <FaMapMarkerAlt />
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Origin Location</span>
              <span className="font-bold text-gray-900 dark:text-white truncate block">
                {locationName}
              </span>
            </div>
          </div>

          {/* Distance Radius Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
              <span>Max Distance Radius</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                {maxDistanceKm} km
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={maxDistanceKm}
              onChange={(e) => setMaxDistanceKm(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>1 km</span>
              <span>25 km</span>
              <span>50 km</span>
            </div>
          </div>

          {/* Party Size / Servings Needed */}
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2">
              Portions / Party Size Needed
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 5, 10, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPartySize(num)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    partySize === num
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {num} {num === 1 ? "meal" : "meals"}
                </button>
              ))}
            </div>
          </div>

          {/* Urgency Window Chips */}
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2">
              Rescue Urgency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "any", label: "Any Time" },
                { id: "urgent_only", label: "⚡ Urgent (<3h)" },
                { id: "relaxed", label: "Next 12h" },
              ].map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setUrgency(u.id as any)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all text-center ${
                    urgency === u.id
                      ? "bg-rose-500 text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Model Filter */}
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2">
              Pricing Preference
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "all", label: "All Items" },
                { id: "donations_only", label: "❤️ 100% Free" },
                { id: "discount_only", label: "🏷️ Deals" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPricePreference(p.id as any)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all text-center ${
                    pricePreference === p.id
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Preferences */}
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2">
              Dietary Preferences
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DIETARY_OPTIONS.map((diet) => {
                const isSelected = selectedDiet.includes(diet.id);
                return (
                  <button
                    key={diet.id}
                    type="button"
                    onClick={() => toggleDiet(diet.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span>{diet.icon}</span>
                    <span>{diet.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Avoid Allergens */}
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2">
              Strictly Avoid Allergens
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALLERGEN_AVOID_OPTIONS.map((a) => {
                const isSelected = avoidAllergens.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAllergenAvoid(a.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                      isSelected
                        ? "bg-red-500 text-white shadow-xs"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    <span>{a.icon}</span>
                    <span>{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Ranked Matches Stream (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {isLoading ? (
            <div className="p-12 text-center rounded-3xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-md">
              <FaMagic className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                AI Matcher is evaluating candidates...
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Calculating proximity distances, expiry decay, and allergen safety matrix...
              </p>
            </div>
          ) : activeMode === "food" ? (
            /* FOOD MATCHES LIST */
            foodMatches.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-md">
                <FaUtensils className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  No active meals match this exact criteria
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Try expanding your search radius (e.g. 25-50 km) or relaxing dietary filters.
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {foodMatches.map((match, idx) => {
                  const isTopRanked = idx === 0 && match.matchScore >= 85;
                  const scoreColor =
                    match.matchScore >= 90
                      ? "text-emerald-500 border-emerald-500 bg-emerald-500/10"
                      : match.matchScore >= 80
                      ? "text-blue-500 border-blue-500 bg-blue-500/10"
                      : "text-amber-500 border-amber-500 bg-amber-500/10";

                  return (
                    <motion.div
                      key={match.foodId}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`relative p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border shadow-lg hover:shadow-2xl transition-all duration-300 ${
                        isTopRanked
                          ? "border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/20"
                          : "border-gray-200/80 dark:border-gray-800"
                      }`}
                    >
                      {isTopRanked && (
                        <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-linear-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                          <FaMagic className="text-amber-300" />
                          Top AI Recommendation
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Left Side: Thumbnail & Food Info */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 border border-gray-200 dark:border-gray-700">
                            {match.images && match.images[0] ? (
                              <Image
                                src={match.images[0].url}
                                alt={match.foodName}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <FaUtensils className="w-6 h-6" />
                              </div>
                            )}

                            {match.isDonation ? (
                              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-purple-600 text-white font-bold text-[9px] uppercase">
                                Free
                              </span>
                            ) : (
                              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[9px]">
                                ₹{match.price}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                {match.supplierName}
                              </span>
                              {match.averageRating > 0 && (
                                <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                  ★ {match.averageRating.toFixed(1)}
                                </span>
                              )}
                            </div>

                            <h4 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                              {match.foodName}
                            </h4>

                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800">
                                📦 {match.availableQty} {match.quantityUnit} left
                              </span>
                              {match.distanceKm !== null && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                                  📍 {match.distanceKm} km {match.etaMinutes ? `(~${match.etaMinutes}m)` : ""}
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                  match.hoursUntilExpiry <= 2
                                    ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold"
                                    : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                                }`}
                              >
                                <FaClock />
                                {match.hoursUntilExpiry <= 2
                                  ? `⚡ ${match.hoursUntilExpiry}h left (Urgent)`
                                  : `${match.hoursUntilExpiry}h window`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Score Progress Badge & CTA */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800">
                          {/* Circular Match Gauge */}
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center font-black ${scoreColor}`}
                            >
                              <span className="text-base leading-none font-black">{match.matchScore}%</span>
                              <span className="text-[9px] uppercase tracking-tighter font-bold">Match</span>
                            </div>
                          </div>

                          <Link
                            href={`/public/food?highlight=${match.foodId}`}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
                          >
                            <span>Claim Food</span>
                            <FaArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>

                      {/* Match Reasons Badges */}
                      <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex flex-wrap items-center gap-2">
                        {match.matchReasons.map((reason, rIdx) => (
                          <span
                            key={rIdx}
                            className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1 border border-emerald-200/60 dark:border-emerald-800/40"
                          >
                            {reason}
                          </span>
                        ))}

                        {match.warnings.map((warn, wIdx) => (
                          <span
                            key={wIdx}
                            className="px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-semibold flex items-center gap-1 border border-amber-200/60 dark:border-amber-800/40"
                          >
                            {warn}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )
          ) : (
            /* NGO MATCHES LIST (For Donors) */
            ngoMatches.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-md">
                <FaUsers className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  No registered NGOs found in this radius
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Try expanding your search radius to find partner organizations.
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {ngoMatches.map((ngo, idx) => (
                  <motion.div
                    key={ngo.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-6 rounded-3xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800 shadow-lg space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 flex items-center justify-center font-black text-xl shrink-0">
                          {ngo.profileImage ? (
                            <Image
                              src={ngo.profileImage}
                              alt={ngo.name}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover rounded-2xl"
                            />
                          ) : (
                            <FaUsers className="w-7 h-7" />
                          )}
                        </div>

                        <div>
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold uppercase mb-1">
                            <FaShieldAlt />
                            {ngo.type || "Verified Hunger Relief NGO"}
                          </div>
                          <h4 className="text-lg font-black text-gray-900 dark:text-white">
                            {ngo.name}
                          </h4>
                          {ngo.address && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                              <FaMapMarkerAlt className="text-rose-500" />
                              {ngo.address}
                              {ngo.distanceKm !== null && ` (${ngo.distanceKm} km away)`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/protected/messages`}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                        >
                          <FaComments />
                          <span>Direct Message NGO</span>
                        </Link>
                      </div>
                    </div>

                    {ngo.bio && (
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {ngo.bio}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      {ngo.matchReasons.map((reason, rIdx) => (
                        <span
                          key={rIdx}
                          className="px-2.5 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 text-[11px] font-semibold flex items-center gap-1 border border-purple-200/60 dark:border-purple-800/40"
                        >
                          <FaCheckCircle className="text-purple-500" />
                          {reason}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )
          )}
        </div>
      </div>
    </div>
  );
}
