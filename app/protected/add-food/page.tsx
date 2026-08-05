"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FaHeart,
  FaLeaf,
  FaStar,
  FaUsers,
  FaShieldAlt,
  FaClock,
  FaCheckCircle,
  FaAward,
  FaUtensils,
  FaChartBar,
  FaTruck,
  FaFire,
} from "react-icons/fa";
import { motion } from "framer-motion";
import AddFoodForm from "@/components/food/AddFoodForm";
import { useAuth } from "@/hooks/useAuth";

const SAFETY_STEPS = [
  { title: "Cook Thoroughly", description: "Always cook food to safe internal temperatures before sharing." },
  { title: "Clean Utensils", description: "Use sanitized cookware and food-grade packaging." },
  { title: "Time Stamping", description: "Mark the accurate preparation time and strict pickup limit." },
  { title: "Proper Storage", description: "Maintain safe temperatures until the recipient arrives." },
  { title: "Clear Dietary Tags", description: "Specify allergens, dietary restrictions, and ingredients accurately." },
  { title: "Safe Public Handoff", description: "Hand off food in convenient, safe, and well-lit locations." },
];

const PROFESSIONAL_TIPS = [
  { title: "Vibrant Photos", description: "High-resolution photos increase reservation speed by over 3x." },
  { title: "Accurate Portions", description: "State exact portion sizes so NGOs and customers can plan accordingly." },
  { title: "Definite Windows", description: "Clear pickup windows reduce waiting and no-show occurrences to near 0%." },
  { title: "Menu Transparency", description: "List ingredients clearly so customers with dietary restrictions can order with confidence." },
  { title: "Attractive Pricing", description: "Steep discounts (50-70% off) help recover marginal costs while delighting foodies." },
  { title: "Community Impact", description: "Regular daily listings earn your kitchen top-tier community recognition." },
];

function AddFoodContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role")?.toLowerCase();

  const activeRole =
    roleParam === "individual" || roleParam === "restaurant"
      ? roleParam
      : user?.role?.toLowerCase() === "individual"
      ? "individual"
      : "restaurant";

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isRestaurant = activeRole === "restaurant";
  const firstName = user?.name?.split(" ")[0] ?? "";
  const restaurantName = user?.name ?? "";

  const themeGradient = isRestaurant
    ? "from-blue-600 via-indigo-600 to-cyan-500"
    : "from-rose-500 via-pink-600 to-amber-500";

  return (
    <div className="min-h-screen bg-transparent pt-24 pb-20">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className={`absolute top-20 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-15 dark:opacity-20 bg-linear-to-tr ${themeGradient}`}
        />
        <div
          className={`absolute bottom-20 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-15 dark:opacity-20 bg-linear-to-bl ${themeGradient}`}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 shadow-sm backdrop-blur-md mb-4">
            {isRestaurant ? (
              <>
                <FaUtensils className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                  Restaurant Kitchen Portal 🍽️
                </span>
              </>
            ) : (
              <>
                <FaHeart className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                  Home Cook Community Hub 👩‍🍳
                </span>
              </>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {isRestaurant
              ? restaurantName
                ? `Welcome, ${restaurantName}!`
                : "Post Kitchen Surplus"
              : `Hello, ${firstName || "Chef"}! 🍲`}
          </h1>

          <p className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-300">
            {isRestaurant
              ? "Rescue delicious unsold inventory, minimize organic kitchen waste, and serve neighbors with joy."
              : "Share the love in your kitchen! Every extra portion shared keeps a heart warm and belly full."}
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-xl mx-auto">
            <div className="p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-xs text-center">
              <div className="text-lg font-black text-gray-900 dark:text-white flex items-center justify-center gap-1">
                <FaLeaf className="w-4 h-4 text-emerald-500" />
                <span>2.5 kg</span>
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">CO₂ Saved / Meal</div>
            </div>

            <div className="p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-xs text-center">
              <div className="text-lg font-black text-gray-900 dark:text-white flex items-center justify-center gap-1">
                <FaTruck className="w-4 h-4 text-blue-500" />
                <span>~25 min</span>
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Avg Claim Time</div>
            </div>

            <div className="p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-xs text-center">
              <div className="text-lg font-black text-gray-900 dark:text-white flex items-center justify-center gap-1">
                <FaFire className="w-4 h-4 text-amber-500" />
                <span>100%</span>
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Zero Waste Goal</div>
            </div>
          </div>
        </motion.div>

        {/* Main Food Add Form Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-14"
        >
          <AddFoodForm userType={activeRole as "individual" | "restaurant"} />
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {isRestaurant ? (
            <>
              <div className="p-6 rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-blue-100 dark:border-blue-900/40 shadow-lg hover:shadow-xl transition-all">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <FaUsers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Broaden Customer Base
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Connect with hundreds of conscious food lovers near you and convert surplus buyers into regulars.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-100 dark:border-emerald-900/40 shadow-lg hover:shadow-xl transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <FaLeaf className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Cut Food Waste to Zero
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Transform unavoidable over-prep into fresh community goodwill, tax receipts, or auxiliary revenue.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-purple-100 dark:border-purple-900/40 shadow-lg hover:shadow-xl transition-all">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                  <FaStar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Verified Green Badge
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Earn sustainability leaderboard badges and receive verified reviews as an eco-conscious kitchen.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-6 rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-rose-100 dark:border-rose-900/40 shadow-lg hover:shadow-xl transition-all">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                  <FaHeart className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Spread Kindness
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Cook an extra portion for a student or neighbor who needs wholesome homemade nutrition.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-100 dark:border-emerald-900/40 shadow-lg hover:shadow-xl transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <FaLeaf className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Protect Our Climate
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Every meal rescued avoids methane generation in landfills and helps conserve water resources.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-amber-100 dark:border-amber-900/40 shadow-lg hover:shadow-xl transition-all">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                  <FaAward className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Master Home Cook Karma
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Collect authentic ratings, climb your local culinary leaderboard, and make new neighborhood friends.
                </p>
              </div>
            </>
          )}
        </motion.div>

        {/* Safety Standards Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-8 rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-gray-200/80 dark:border-gray-800/80 shadow-xl"
        >
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="lg:w-1/3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold mb-3">
                <FaCheckCircle className="w-3.5 h-3.5" />
                AnnaSetu Quality Standards
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                {isRestaurant ? "Commercial Listing Standards" : "Home Kitchen Safety Rules"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Safety and hygiene are paramount to our community. Ensure every listing adheres to these principles.
              </p>
              <div className="mt-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60">
                <div className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                  <FaClock className="text-amber-500" />
                  Max 6-Hour Shelf Rule
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Cooked meals are automatically de-listed after their designated safety expiry window.
                </p>
              </div>
            </div>

            <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(isRestaurant ? PROFESSIONAL_TIPS : SAFETY_STEPS).map((tip, idx) => (
                <div
                  key={tip.title}
                  className="p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 flex items-start gap-3"
                >
                  <span className="w-6 h-6 rounded-full bg-linear-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{tip.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function AddFoodPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          Loading listing experience...
        </div>
      }
    >
      <AddFoodContent />
    </Suspense>
  );
}
