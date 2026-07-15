"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  FaUtensils,
  FaLeaf,
  FaStar,
  FaUsers,
  FaShieldAlt,
  FaClock,
  FaCheckCircle,
  FaAward,
  FaChartBar,
} from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import AddFoodForm from "@/components/food/AddFoodForm";
import { useAuth } from "@/hooks/useAuth";

const PROFESSIONAL_TIPS = [
  { title: "High-Quality Photos", description: "Great images increase reservations by 3x" },
  { title: "Accurate Quantities", description: "Set realistic quantities to avoid over-commitment" },
  { title: "Precise Pickup Window", description: "Specific times reduce no-shows significantly" },
  { title: "Allergen Information", description: "Always list all ingredients and allergens" },
  { title: "Fair Pricing", description: "Discounted prices attract more customers" },
  { title: "Consistent Schedule", description: "Regular listings build a loyal customer base" },
];

export default function RestaurantAddFoodPage() {
  const { user, isIndividual, loading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && isIndividual) {
      toast.error("Individuals should use the home cook add-food page");
      router.push("/protected/add-food/individual");
    }
  }, [user, isIndividual, loading, router]);

  const restaurantName = user?.name ?? "";

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="w-full relative overflow-hidden bg-linear-to-b from-transparent dark:from-gray-600 via-blue-100 dark:via-slate-900 to-blue-200 dark:to-zinc-950 dark:text-white text-gray-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-800 dark:bg-slate-200 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-950 dark:bg-gray-200 rounded-full filter blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-40 right-40 w-48 h-48 bg-indigo-950 dark:bg-zinc-200 rounded-full filter blur-3xl animate-pulse delay-700" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-gray-900 dark:text-gray-100 inline-flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm rounded-full mb-6 border dark:border-white/30 border-gray-900/30"
            >
              <FaUtensils className="w-4 h-4" />
              <span className="text-sm font-medium">Restaurant Partner Portal 🍽️</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              {restaurantName ? `Welcome, ${restaurantName}! 👋` : "List Surplus Food"}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl mb-8 max-w-2xl mx-auto dark:text-white/90 text-gray-900/90"
            >
              Turn surplus into smiles. List your extra meals and reduce waste — while giving
              your community something delicious. 🌿
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto"
            >
              <div className="card backdrop-blur-sm rounded-xl p-4 dark:text-white/80 text-gray-900/80">
                <div className="text-2xl font-bold mb-1">
                  <FaChartBar className="inline mr-2" />
                  Restaurant
                </div>
                <div className="text-sm">Professional listing</div>
              </div>
              <div className="card backdrop-blur-sm rounded-xl p-4 dark:text-white/80 text-gray-900/80">
                <div className="text-2xl font-bold mb-1">0%</div>
                <div className="text-sm">Platform commission on donations</div>
              </div>
              <div className="card backdrop-blur-sm rounded-xl p-4 dark:text-white/80 text-gray-900/80">
                <div className="text-2xl font-bold mb-1">⚡ Fast</div>
                <div className="text-sm">Pickup in minutes</div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute -bottom-px left-0 right-0 leading-none">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-full h-full">
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill={isDark ? "#0A192F" : "#ffffff"}
            />
          </svg>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <AddFoodForm userType="restaurant" />
        </motion.div>

        {/* Restaurant Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="group bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-blue-100 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-600">
            <div className="w-14 h-14 bg-linear-to-br from-blue-100 dark:from-blue-800 to-blue-200 dark:to-blue-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <FaUsers className="w-7 h-7 text-blue-600 dark:text-blue-300" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2 text-lg">Reach More Customers</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Thousands of food lovers are actively looking for affordable meals near them. Grow your brand reach.
            </p>
          </div>

          <div className="group bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-green-100 dark:border-green-800 hover:border-green-300 dark:hover:border-green-600">
            <div className="w-14 h-14 bg-linear-to-br from-green-100 dark:from-green-800 to-green-200 dark:to-green-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <FaLeaf className="w-7 h-7 text-green-600 dark:text-green-300" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2 text-lg">Reduce Waste</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Turn surplus inventory into revenue or goodwill. Every meal shared saves 2.5 kg of CO₂ emissions.
            </p>
          </div>

          <div className="group bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-purple-100 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-600">
            <div className="w-14 h-14 bg-linear-to-br from-purple-100 dark:from-purple-800 to-purple-200 dark:to-purple-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <FaStar className="w-7 h-7 text-purple-600 dark:text-purple-300" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2 text-lg">Build Reputation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Get verified reviews, earn badges and appear higher in listings. Turn sharing into a marketing win.
            </p>
          </div>
        </motion.div>

        {/* Professional Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-linear-to-br from-blue-50 dark:from-blue-900 via-indigo-50 dark:via-indigo-900 to-purple-50 dark:to-purple-900 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/3">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FaShieldAlt className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">Pro Listing Tips</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Follow these guidelines to maximise your reservations and build a trusted reputation on AnnaSetu.
              </p>
              <div className="mt-4 p-4 bg-white/80 dark:bg-gray-900/80 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-300">
                  <FaCheckCircle className="w-4 h-4" />
                  <span className="font-medium">Restaurant Partner Badge</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Your profile shows the verified &quot;Restaurant&quot; badge, building trust with customers instantly.
                </p>
              </div>
            </div>

            <div className="lg:w-2/3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PROFESSIONAL_TIPS.map((tip, i) => (
                  <div
                    key={tip.title}
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl p-4 border border-blue-200 dark:border-blue-700"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-blue-600 dark:text-blue-300 font-bold">{i + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">{tip.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{tip.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-linear-to-r from-blue-500 to-indigo-500 rounded-xl text-white">
                <div className="flex items-center gap-3">
                  <FaClock className="w-5 h-5" />
                  <p className="text-sm">
                    <strong>Tip:</strong> Listings posted between 11am–1pm get 40% more reservations on average.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-blue-100 dark:from-blue-800 to-indigo-100 dark:to-indigo-800 rounded-full border border-blue-200 dark:border-blue-700">
            <FaAward className="text-blue-600 dark:text-blue-300" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Join 300+ restaurants already reducing waste with AnnaSetu
            </span>
            <FaAward className="text-blue-600 dark:text-blue-300" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
