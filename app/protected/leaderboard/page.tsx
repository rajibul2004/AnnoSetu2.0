"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaCrown, FaMedal, FaStar, FaFire, FaLeaf, FaUtensils, FaTrophy } from "react-icons/fa";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { LevelInfo } from "@/lib/levels";
import { useAuth } from "@/hooks/useAuth";

interface LeaderboardUser {
  id: string;
  name: string;
  image: string | null;
  role: string;
  points: number;
  mealsRescued: number;
  mealsDonated: number;
  carbonSavedKg: number;
  currentStreak: number;
  badgesCount: number;
  level: LevelInfo;
}

type TabType = "points" | "meals" | "carbon" | "streak";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("points");

  const { data: users = [], isLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ["leaderboard", activeTab],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?type=${activeTab}&limit=50`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed to fetch leaderboard");
      return json.data;
    },
  });

  const getMetricIcon = (tab: TabType) => {
    switch (tab) {
      case "points": return <FaStar className="text-amber-500" />;
      case "meals": return <FaUtensils className="text-blue-500" />;
      case "carbon": return <FaLeaf className="text-emerald-500" />;
      case "streak": return <FaFire className="text-orange-500" />;
    }
  };

  const getMetricValue = (user: LeaderboardUser, tab: TabType) => {
    switch (tab) {
      case "points": return user.points;
      case "meals": return user.mealsRescued + user.mealsDonated;
      case "carbon": return user.carbonSavedKg.toFixed(1);
      case "streak": return user.currentStreak;
    }
  };

  const getMetricLabel = (tab: TabType) => {
    switch (tab) {
      case "points": return "XP";
      case "meals": return "Meals";
      case "carbon": return "kg CO₂";
      case "streak": return "Days";
    }
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: "points", label: "Top XP", icon: FaStar },
    { id: "meals", label: "Top Meals", icon: FaUtensils },
    { id: "carbon", label: "Top Carbon", icon: FaLeaf },
    { id: "streak", label: "Top Streaks", icon: FaFire },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-24 sm:pt-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 mb-4 shadow-inner"
          >
            <FaTrophy className="w-8 h-8 text-amber-500" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
            Community <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-400">Leaderboard</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Top contributors making an impact</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-105"
                  : "bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              <tab.icon className={activeTab === tab.id ? "text-amber-400" : ""} />
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {users.map((u, index) => {
                const isCurrentUser = u.id === user?.id;
                const isTop3 = index < 3;
                
                return (
                  <motion.div
                    key={u.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Link href={`/protected/profile/${u.id}`} className="block">
                      <div className={`relative flex items-center p-4 sm:p-5 rounded-2xl transition-all duration-300 ${
                        isCurrentUser 
                          ? "bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 dark:border-amber-500 shadow-md z-10" 
                          : "bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:shadow-lg hover:-translate-y-1 hover:border-gray-300 dark:hover:border-slate-700"
                      }`}>
                        
                        {/* Rank Badge */}
                        <div className={`flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl font-black mr-4 ${
                          index === 0 ? "bg-gradient-to-br from-amber-200 to-yellow-500 text-white shadow-lg shadow-yellow-500/30" :
                          index === 1 ? "bg-gradient-to-br from-slate-200 to-gray-400 text-white shadow-lg shadow-gray-400/30" :
                          index === 2 ? "bg-gradient-to-br from-orange-200 to-amber-700 text-white shadow-lg shadow-amber-700/30" :
                          "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}>
                          {index === 0 ? <FaCrown className="w-5 sm:w-6 h-5 sm:h-6" /> : `#${index + 1}`}
                        </div>

                        {/* Avatar */}
                        <div className="flex-shrink-0 w-12 sm:w-14 h-12 sm:h-14 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-950 overflow-hidden relative shadow-sm">
                          {u.image ? (
                            <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl text-slate-400 font-bold">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="ml-4 flex-grow overflow-hidden">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                              {u.name}
                            </h3>
                            {isCurrentUser && (
                              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            <span className="flex items-center gap-1 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                              <span>{u.level.icon}</span> Lvl {u.level.level}
                            </span>
                            <span className="flex items-center gap-1">
                              <FaMedal className="text-purple-400" /> {u.badgesCount}
                            </span>
                          </div>
                        </div>

                        {/* Highlighted Metric */}
                        <div className="ml-4 text-right flex flex-col items-end">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            {getMetricIcon(activeTab)}
                            <span className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white font-mono tracking-tight">
                              {getMetricValue(u, activeTab)}
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {getMetricLabel(activeTab)}
                          </div>
                        </div>

                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {users.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                No users found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
