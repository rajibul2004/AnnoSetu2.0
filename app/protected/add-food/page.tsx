"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
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
} from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import AddFoodForm from "@/components/food/AddFoodForm";
import { useAuth } from "@/hooks/useAuth";

const SAFETY_STEPS = [
  { title: "Cook Thoroughly", description: "Always cook food to safe internal temperatures" },
  { title: "Clean Utensils", description: "Use sanitized cookware and containers" },
  { title: "Label Everything", description: "Add preparation date and time" },
  { title: "Proper Storage", description: "Keep food at safe temperatures until pickup" },
  { title: "Be Honest", description: "List all ingredients and allergens accurately" },
  { title: "Safe Meeting", description: "Choose public spots for handoffs" },
];

const PROFESSIONAL_TIPS = [
  { title: "High-Quality Photos", description: "Great images increase reservations by 3x" },
  { title: "Accurate Quantities", description: "Set realistic quantities to avoid over-commitment" },
  { title: "Precise Pickup Window", description: "Specific times reduce no-shows significantly" },
  { title: "Allergen Information", description: "Always list all ingredients and allergens" },
  { title: "Fair Pricing", description: "Discounted prices attract more customers" },
  { title: "Consistent Schedule", description: "Regular listings build a loyal customer base" },
];
  // const accentGradient =
    // userType === "restaurant" ? "from-blue-500 to-green-500" : "from-pink-500 to-amber-500";

function AddFoodContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role")?.toLowerCase();
  
  const activeRole = (roleParam === "individual" || roleParam === "restaurant") 
    ? roleParam 
    : user?.role?.toLowerCase() === "individual" 
      ? "individual" 
      : "restaurant";

  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isRestaurant = activeRole === "restaurant";
  const isIndividual = activeRole === "individual";

  const accentGradient =
    isIndividual? "from-blue-500 to-green-500" : "from-pink-500 to-amber-500";

  const firstName = user?.name?.split(" ")[0] ?? "";
  
  const restaurantName = user?.name ?? "";

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className={`w-full relative overflow-hidden bg-linear-to-b from-transparent dark:from-gray-600 ${isRestaurant ? "via-blue-100 dark:via-slate-900 to-blue-200" : "via-green-100 dark:via-slate-900 to-green-300"} dark:to-zinc-950 dark:text-white text-gray-900`}>
        <div className="absolute inset-0 opacity-10">
          <div className={`absolute top-20 left-10 w-64 h-64 ${isRestaurant ? "bg-blue-800" : "bg-green-800"} dark:bg-slate-200 rounded-full filter blur-3xl animate-pulse`} />
          <div className={`absolute bottom-20 right-10 w-96 h-96 ${isRestaurant ? "bg-blue-950" : "bg-green-950"} dark:bg-gray-200 rounded-full filter blur-3xl animate-pulse delay-1000`} />
          <div className={`absolute top-40 right-40 w-48 h-48 ${isRestaurant ? "bg-indigo-950" : "bg-lime-950"} dark:bg-zinc-200 rounded-full filter blur-3xl animate-pulse delay-700`} />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-gray-900 dark:text-gray-100 inline-flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm rounded-full mb-6 border dark:border-white/30 border-gray-900/30"
            >
              {isRestaurant ? (
                <>
                  <FaUtensils className="w-4 h-4" />
                  <span className="text-sm font-medium">Restaurant Partner Portal 🍽️</span>
                </>
              ) : (
                <>
                  <FaHeart className="w-4 h-4" />
                  <span className="text-sm font-medium">Welcome Home Cook! 👩‍🍳</span>
                </>
              )}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              {isRestaurant 
                ? (restaurantName ? `Welcome, ${restaurantName}! 👋` : "List Surplus Food")
                : `Hey ${firstName}! 👋`
              }
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl mb-8 max-w-2xl mx-auto dark:text-white/90 text-gray-900/90"
            >
              {isRestaurant
                ? "Turn surplus into smiles. List your extra meals and reduce waste — while giving your community something delicious. 🌿"
                : "Share your home-cooked love with the community. Every meal shared is a heart fed! 💝"
              }
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto"
            >
              <div className="card backdrop-blur-sm rounded-xl p-4 dark:text-white/80 text-gray-900/80">
                {isRestaurant ? (
                  <>
                    <div className="text-2xl font-bold mb-1"><FaChartBar className="inline mr-2" />Restaurant</div>
                    <div className="text-sm">Professional listing</div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold mb-1">0</div>
                    <div className="text-sm">Meals Shared</div>
                  </>
                )}
              </div>
              <div className="card backdrop-blur-sm rounded-xl p-4 dark:text-white/80 text-gray-900/80">
                {isRestaurant ? (
                  <>
                    <div className="text-2xl font-bold mb-1">0%</div>
                    <div className="text-sm">Platform commission on donations</div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold mb-1">⭐⭐⭐</div>
                    <div className="text-sm">New Cook</div>
                  </>
                )}
              </div>
              <div className="card backdrop-blur-sm rounded-xl p-4 dark:text-white/80 text-gray-900/80">
                {isRestaurant ? (
                  <>
                    <div className="text-2xl font-bold mb-1">⚡ Fast</div>
                    <div className="text-sm">Pickup in minutes</div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold mb-1">0</div>
                    <div className="text-sm">Happy Tummies</div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute -bottom-px left-0 right-0 leading-none">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-full h-full">
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill={mounted ? (isDark ? "#0A192F" : "#ffffff") : "#ffffff"}
            />
          </svg>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <AddFoodForm userType={activeRole as "individual" | "restaurant"} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {isRestaurant ? (
            <>
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
            </>
          ) : (
            <>
              <div className="group bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-pink-100 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-600">
                <div className="w-14 h-14 bg-linear-to-br from-pink-100 dark:from-pink-800 to-pink-200 dark:to-pink-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FaHeart className="w-7 h-7 text-pink-600 dark:text-pink-300" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2 text-lg">Build Community</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Connect with neighbors who appreciate homemade food. Share recipes, stories, and build
                  lasting friendships.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-pink-600 dark:text-pink-300">
                  <FaUsers className="w-4 h-4" />
                  <span>Join 500+ home cooks</span>
                </div>
              </div>
    
              <div className="group bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-green-100 dark:border-green-800 hover:border-green-300 dark:hover:border-green-600">
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 dark:from-green-800 to-green-200 dark:to-green-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FaLeaf className="w-7 h-7 text-green-600 dark:text-green-300" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2 text-lg">Reduce Food Waste</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Turn extra portions into opportunities. Every meal shared saves 2.5kg of CO₂ emissions!
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-green-600 dark:text-green-300">
                  <FaLeaf className="w-4 h-4" />
                  <span>Save the planet, one meal at a time</span>
                </div>
              </div>
    
              <div className="group bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-purple-100 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-600">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 dark:from-purple-800 to-purple-200 dark:to-purple-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FaStar className="w-7 h-7 text-purple-600 dark:text-purple-300" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2 text-lg">Earn Recognition</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Get reviews, build your reputation, and earn badges as a trusted home cook in your
                  community.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-purple-600 dark:text-purple-300">
                  <FaAward className="w-4 h-4" />
                  <span>Earn "Master Chef" badge</span>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Tips / Safety Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`mt-12 bg-linear-to-br ${isRestaurant ? "from-blue-50 dark:from-blue-900 via-lime-50 dark:via-lime-900 to-green-50 dark:to-green-900 border-blue-200 dark:border-blue-700" : "from-blue-50 dark:from-blue-900 via-pink-50 dark:via-pink-900 to-purple-50 dark:to-purple-900 border-pink-200 dark:border-pink-700"} border-2 rounded-2xl p-6 shadow-lg`}
        >
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/3">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 bg-linear-to-br ${isRestaurant ? "from-blue-500 to-indigo-500" : "from-pink-500 dark:from-pink-400 to-purple-500 dark:to-purple-400"} rounded-xl flex items-center justify-center shadow-lg`}>
                  <FaShieldAlt className={`w-7 h-7 ${isRestaurant ? "text-white" : "text-white dark:text-gray-900"}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">{isRestaurant ? "Pro Listing Tips" : "Home Cooking Safety"}</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                {isRestaurant 
                  ? "Follow these guidelines to maximise your reservations and build a trusted reputation on AnnaSetu." 
                  : "Your safety and your customers' health are our top priority. Follow these essential guidelines."
                }
              </p>
              <div className="mt-4 p-4 bg-white/80 dark:bg-gray-900/80 rounded-xl">
                <div className={`flex items-center gap-2 text-sm ${isRestaurant ? "text-blue-600 dark:text-blue-300" : "text-pink-600 dark:text-pink-300"}`}>
                  <FaCheckCircle className="w-4 h-4" />
                  <span className="font-medium">{isRestaurant ? "Restaurant Partner Badge" : "Home Cook Verified"}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {isRestaurant 
                    ? "Your profile shows the verified \"Restaurant\" badge, building trust with customers instantly." 
                    : "Your profile shows the \"Home Cook\" badge, building trust with customers."
                  }
                </p>
              </div>
            </div>

            <div className="lg:w-2/3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(isRestaurant ? PROFESSIONAL_TIPS : SAFETY_STEPS).map((tip, i) => (
                  <div
                    key={tip.title}
                    className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl p-4 border ${isRestaurant ? "border-blue-200 dark:border-blue-700" : "border-pink-200"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 ${isRestaurant ? "bg-blue-100 dark:bg-blue-800" : "bg-pink-100 dark:bg-pink-800"} rounded-lg flex items-center justify-center shrink-0 flex-shrink-0`}>
                        <span className={`${isRestaurant ? "text-blue-600 dark:text-blue-300" : "text-pink-600 dark:text-pink-300"} font-bold`}>{i + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">{tip.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{tip.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`mt-4 p-4 bg-linear-to-r ${isRestaurant ? "from-blue-500 to-indigo-500 text-white" : "from-pink-500 dark:from-pink-400 to-purple-500 dark:to-purple-400 text-white dark:text-gray-900"} rounded-xl`}>
                <div className="flex items-center gap-3">
                  <FaClock className="w-5 h-5" />
                  <p className="text-sm">
                    <strong>{isRestaurant ? "Tip:" : "Remember:"}</strong> {isRestaurant ? "Listings posted between 11am–1pm get 40% more reservations on average." : "Home-cooked food has a maximum expiry of 6 hours for safety"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Impact */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-6 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 ${isRestaurant ? "bg-linear-to-r from-blue-100 dark:from-blue-800 to-indigo-100 dark:to-indigo-800 border-blue-200 dark:border-blue-700" : "bg-gradient-to-r from-pink-100 dark:from-pink-800 to-purple-100 dark:to-pink-800 border-pink-200 dark:border-pink-700"} rounded-full border`}>
            {isRestaurant ? <FaAward className="text-blue-600 dark:text-blue-300" /> : <FaHeart className="text-pink-600 dark:text-pink-300" />}
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {isRestaurant ? "Join 300+ restaurants already reducing waste with AnnaSetu" : "Join 1,200+ home cooks already sharing love through food"}
            </span>
            {isRestaurant ? <FaAward className="text-blue-600 dark:text-blue-300" /> : <FaHeart className="text-pink-600 dark:text-pink-300" />}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function AddFoodPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AddFoodContent />
    </Suspense>
  );
}
