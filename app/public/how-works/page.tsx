"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUtensils,
  FaShoppingBag,
  FaHandsHelping,
  FaQrcode,
  FaShieldAlt,
  FaLeaf,
  FaClock,
  FaArrowRight,
  FaCheckCircle,
  FaMagic,
  FaHeart,
  FaStore,
  FaUsers,
  FaChevronDown,
  FaChevronUp,
  FaQuestionCircle,
} from "react-icons/fa";
import Button from "@/components/common/Button";

type RoleWorkflow = "consumer" | "restaurant" | "ngo";

interface Step {
  number: string;
  title: string;
  description: string;
  icon: any;
  badge: string;
}

const WORKFLOWS: Record<RoleWorkflow, { title: string; subtitle: string; gradient: string; steps: Step[] }> = {
  consumer: {
    title: "For Food Savers & Foodies",
    subtitle: "Discover high-quality surplus meals, discounted bakery treats, and free community donations near you.",
    gradient: "from-emerald-600 via-teal-600 to-green-600",
    steps: [
      {
        number: "01",
        title: "Browse or AI Smart Match",
        description: "Filter by location, dietary tags, or tell our AI voice assistant what you're craving in English, Hindi, or Bengali.",
        icon: FaUtensils,
        badge: "Explore Meals",
      },
      {
        number: "02",
        title: "Reserve in 1-Click",
        description: "Choose your portion quantity and select an estimated pickup window before the listing's expiry time.",
        icon: FaShoppingBag,
        badge: "Fast Booking",
      },
      {
        number: "03",
        title: "Pickup & QR Verification",
        description: "Head to the kitchen or home cook, show your secure 6-digit pickup pass or QR code, and enjoy your meal.",
        icon: FaQrcode,
        badge: "Zero Waiting",
      },
      {
        number: "04",
        title: "Track Impact & Badges",
        description: "Watch your personal CO2 savings and rescued meals tally up on your gamified eco-profile.",
        icon: FaLeaf,
        badge: "Eco Hero",
      },
    ],
  },
  restaurant: {
    title: "For Restaurants & Kitchens",
    subtitle: "Turn unsold fresh portions into revenue and corporate sustainability badges with zero friction.",
    gradient: "from-blue-600 via-indigo-600 to-cyan-600",
    steps: [
      {
        number: "01",
        title: "List Surplus in 30 Seconds",
        description: "Snap a photo, speak your description, or type your available boxes. Our AI auto-fills prices and expiry.",
        icon: FaStore,
        badge: "Voice & AI Powered",
      },
      {
        number: "02",
        title: "Receive Instant Notifications",
        description: "Get real-time audio and browser alerts the moment a local rescuer or verified NGO requests portions.",
        icon: FaClock,
        badge: "Real-Time Alerts",
      },
      {
        number: "03",
        title: "Instant Pass Scanning",
        description: "Scan the customer's QR code or verify their pass on the Pickup Station in your Partner Dashboard.",
        icon: FaShieldAlt,
        badge: "Food Safety Verified",
      },
      {
        number: "04",
        title: "ESG & Tax Analytics",
        description: "Download verified sustainability and waste-reduction reports for tax compliance and brand trust.",
        icon: FaCheckCircle,
        badge: "Green Certification",
      },
    ],
  },
  ngo: {
    title: "For NGOs & Food Banks",
    subtitle: "Coordinate large-scale surplus bulk pickups for shelters, disaster relief, and community feeding drives.",
    gradient: "from-purple-600 via-pink-600 to-indigo-600",
    steps: [
      {
        number: "01",
        title: "Verified Non-Profit Portal",
        description: "Submit 80G/12A or trust registration credentials to unlock priority access to bulk banquet & caterer surplus.",
        icon: FaHandsHelping,
        badge: "Priority Allocation",
      },
      {
        number: "02",
        title: "Bulk Reservation Claims",
        description: "Reserve 50+ plates in a single confirmation with scheduled van arrival times and cold-chain safety notes.",
        icon: FaUsers,
        badge: "Large Volumes",
      },
      {
        number: "03",
        title: "Direct Supplier Coordination",
        description: "Message head chefs and event managers directly in the built-in pickup chat for hassle-free loading.",
        icon: FaQrcode,
        badge: "Direct Logistics",
      },
      {
        number: "04",
        title: "Transparent Community Impact",
        description: "Generate verifiable distribution manifests and celebrate volunteer milestones on the leaderboard.",
        icon: FaHeart,
        badge: "Community Growth",
      },
    ],
  },
};

const FAQS = [
  {
    q: "Is the surplus food safe to consume?",
    a: "Yes, absolutely. All food listed on AnnoSetu must adhere to strict FSSAI safety timelines, temperature storage rules, and preparation disclosures. Home cooks and restaurants are verified with food safety checks.",
  },
  {
    q: "How does the pickup pass / QR code work?",
    a: "When you reserve a meal, AnnoSetu generates a unique 6-digit cryptographic pickup pass and QR code. Simply show this at the pickup counter to collect your fresh box.",
  },
  {
    q: "Are donations completely free?",
    a: "Yes! Items marked with the 'FREE DONATION' badge cost ₹0. Other surplus items from partner bakeries and restaurants are offered at steep 50% to 70% discounts.",
  },
  {
    q: "Can individuals share extra home-cooked food?",
    a: "Yes! Any passionate home cook can switch to 'Sharer Mode' or choose 'Home Cook' to share extra portions with neighbors safely.",
  },
];

export default function HowItWorksPage() {
  const [activeRole, setActiveRole] = useState<RoleWorkflow>("consumer");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const current = WORKFLOWS[activeRole];

  return (
    <div className="min-h-screen bg-transparent pt-20 sm:pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-4">
            <FaMagic className="text-emerald-500" />
            <span>How AnnoSetu Works</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            Bridging Surplus Food to <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-indigo-600">
              Hungry Hearts in Real Time
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-4 leading-relaxed">
            Whether you&apos;re looking to save on delicious meals, a restaurant looking to eliminate waste, or an NGO feeding thousands, AnnoSetu makes food rescue seamless.
          </p>
        </motion.div>

        {/* Role Selector Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800 rounded-2xl shadow-lg gap-1 max-w-full overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveRole("consumer")}
              className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeRole === "consumer"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <FaShoppingBag />
              <span>For Food Savers</span>
            </button>

            <button
              onClick={() => setActiveRole("restaurant")}
              className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeRole === "restaurant"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <FaStore />
              <span>For Restaurants</span>
            </button>

            <button
              onClick={() => setActiveRole("ngo")}
              className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeRole === "ngo"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <FaHandsHelping />
              <span>For NGOs &amp; Shelters</span>
            </button>
          </div>
        </div>

        {/* Dynamic Workflow Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-12"
          >
            {/* Header info */}
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                {current.title}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                {current.subtitle}
              </p>
            </div>

            {/* 4 Step Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {current.steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.number}
                    className="relative bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-gray-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between group hover:border-emerald-400/80 transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-600 dark:to-gray-400">
                          {step.number}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300">
                          {step.badge}
                        </span>
                      </div>

                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                        <Icon />
                      </div>

                      <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">
                        {step.title}
                      </h3>

                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 gap-1">
                      <span>Step {idx + 1} of 4</span>
                      <FaArrowRight className="text-[9px]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Action Call to Action Card */}
        <div className="my-16 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="relative z-10 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Ready to eliminate food waste in your neighborhood?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-2">
              Join thousands of community members, certified restaurants, and relief NGOs on AnnoSetu today.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 shrink-0">
            <Link href="/public/food">
              <Button className="bg-white text-gray-900 hover:bg-white/90 font-black px-6 py-3.5 rounded-2xl text-xs sm:text-sm shadow-xl">
                Browse Surplus Food
              </Button>
            </Link>
            <Link href="/protected/add-food?role=restaurant">
              <Button className="bg-white/20 hover:bg-white/30 text-white font-bold backdrop-blur-md border border-white/30 px-6 py-3.5 rounded-2xl text-xs sm:text-sm shadow-xl">
                List Surplus Food
              </Button>
            </Link>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 mb-2">
              <FaQuestionCircle />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/80 dark:border-slate-800 overflow-hidden shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="text-sm font-bold text-gray-900 dark:text-white pr-4">
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <FaChevronUp className="text-emerald-500 shrink-0 text-xs" />
                    ) : (
                      <FaChevronDown className="text-gray-400 shrink-0 text-xs" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-slate-800/60">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
