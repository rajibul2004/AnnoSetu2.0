"use client";

import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { usePublicProfile, useFollowUser, useUnfollowUser } from "@/hooks/useSocial";
import StreakWidget from "@/components/gamification/StreakWidget";
import { BADGE_REGISTRY, getBadge, RARITY_STYLES } from "@/lib/badges";
import { 
  FaUserPlus, 
  FaUserMinus, 
  FaSpinner, 
  FaLeaf, 
  FaUtensils, 
  FaBoxOpen, 
  FaLock, 
  FaStar,
  FaMedal
} from "react-icons/fa";

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const { data: profile, isLoading, isError } = usePublicProfile(userId);
  const followMutation = useFollowUser(userId);
  const unfollowMutation = useUnfollowUser(userId);

  const handleFollowToggle = () => {
    if (!profile) return;
    if (profile.isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const isMutating = followMutation.isPending || unfollowMutation.isPending;

  // Group badges by category
  const badgeCategories = useMemo(() => {
    const categories: Record<string, any[]> = {};
    Object.values(BADGE_REGISTRY).forEach((badge) => {
      if (!categories[badge.category]) {
        categories[badge.category] = [];
      }
      categories[badge.category].push(badge);
    });
    return categories;
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
        <FaSpinner className="animate-spin text-emerald-500 text-4xl" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white">
        <h1 className="text-2xl font-bold mb-2">Profile not found</h1>
        <p className="text-gray-500 dark:text-neutral-400">The user you are looking for does not exist.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6 mt-12 md:mt-0">
        
        {/* Header / Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-gray-200/60 dark:border-white/10 p-5 sm:p-6 md:p-8 shadow-2xl shadow-gray-200/50 dark:shadow-none"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-5 sm:gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-[2rem] bg-gradient-to-tr from-emerald-400 to-teal-400 p-1 flex-shrink-0 shadow-lg shadow-emerald-500/20 rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="w-full h-full rounded-[1.75rem] bg-white dark:bg-neutral-900 flex items-center justify-center overflow-hidden">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl sm:text-4xl font-black text-gray-300 dark:text-neutral-600">{profile.name.charAt(0)}</span>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left space-y-3 w-full">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 justify-between w-full">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent tracking-tight">
                    {profile.name}
                  </h1>
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold mt-1 text-xs sm:text-sm uppercase tracking-widest">{profile.role}</p>
                </div>
                
                {/* Follow Button */}
                <button
                  onClick={handleFollowToggle}
                  disabled={isMutating}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-sm ${
                    profile.isFollowing 
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700 border border-gray-200 dark:border-white/10" 
                      : "bg-emerald-500 text-white hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25 active:translate-y-0"
                  }`}
                >
                  {isMutating ? (
                    <FaSpinner className="animate-spin w-4 h-4" />
                  ) : profile.isFollowing ? (
                    <><FaUserMinus className="w-3.5 h-3.5" /> Unfollow</>
                  ) : (
                    <><FaUserPlus className="w-3.5 h-3.5" /> Follow</>
                  )}
                </button>
              </div>

              {profile.bio && (
                <p className="text-gray-600 dark:text-neutral-300 max-w-2xl text-xs sm:text-sm leading-relaxed mx-auto md:mx-0">
                  {profile.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-center md:justify-start pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg sm:text-xl font-black">{profile.followersCount}</span>
                  <span className="text-gray-500 dark:text-neutral-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Followers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg sm:text-xl font-black">{profile.followingCount}</span>
                  <span className="text-gray-500 dark:text-neutral-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Following</span>
                </div>
                <div className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 px-3 py-1.5 rounded-lg text-xs font-black border border-amber-200 dark:border-amber-400/20 shadow-sm">
                  <FaStar className="w-3 h-3" />
                  <span>Level {profile.level?.number || 1}: {profile.level?.title || 'Seed'}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {[
            { label: "Points", value: profile.points, icon: FaStar, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-400/10" },
            { label: "Rescued", value: profile.mealsRescued, icon: FaBoxOpen, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-400/10" },
            { label: "Shared", value: profile.mealsShared, icon: FaUtensils, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-400/10" },
            { label: "Saved", value: `${profile.carbonSaved}kg`, icon: FaLeaf, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-400/10" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900/60 backdrop-blur-md border border-gray-200/60 dark:border-white/5 rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center">
              <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} mb-2 shadow-sm`}>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</h3>
              <p className="text-gray-500 dark:text-neutral-400 text-[10px] sm:text-xs font-bold mt-0.5 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Middle Row: Streak & Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-5 sm:gap-6"
          >
            {/* Streak Widget Wrapper */}
            <div className="flex-1">
              <StreakWidget 
                currentStreak={profile.currentStreak} 
                longestStreak={profile.longestStreak} 
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-col"
          >
            {/* Activity Feed */}
            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-gray-200/60 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-sm h-full max-h-[400px] overflow-y-auto">
              <h3 className="text-base font-black text-gray-900 dark:text-white mb-4">Recent Activity</h3>
              {profile.recentActivity?.length > 0 ? (
                <div className="space-y-4">
                  {profile.recentActivity.map((activity, idx) => (
                    <div key={activity.id} className="relative pl-5 border-l-2 border-gray-100 dark:border-white/10 pb-4 last:pb-0 last:border-transparent">
                      <div className="absolute w-3 h-3 bg-white dark:bg-neutral-800 border-[2px] border-emerald-500 rounded-full -left-[7px] top-1 shadow-sm"></div>
                      <div className="text-xs sm:text-sm">
                        <p className="font-bold text-gray-800 dark:text-gray-200">
                          {activity.type === 'RESCUE' ? 'Rescued' : 'Shared'} <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1 py-0.5 rounded mx-1">{activity.quantity}x</span> {activity.title}
                        </p>
                        <p className="text-gray-500 dark:text-neutral-500 text-[10px] sm:text-xs mt-1 font-medium">
                          {new Date(activity.createdAt).toLocaleDateString(undefined, { 
                            month: 'short', day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 h-full flex flex-col items-center justify-center">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
                    <FaLeaf className="text-gray-400 w-4 h-4" />
                  </div>
                  <p className="text-gray-500 dark:text-neutral-500 text-xs font-semibold">No recent activity yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

          {/* Badge Showcase */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-gray-200/60 dark:border-white/10 rounded-3xl p-5 sm:p-6 md:p-8 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-500/20 rounded-xl">
                  <FaMedal className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">Badge Showcase</h3>
              </div>
              <div className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                {profile.badges.length} Unlocked
              </div>
            </div>
            
            <div className="space-y-8">
              {Object.entries(badgeCategories).map(([category, badges]) => (
                <div key={category}>
                  <h4 className="text-xs font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-white/10 pb-2">
                    {category}
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                    {badges.map((badge: any) => {
                      const isEarned = profile.badges.includes(badge.id);
                      return <BadgeCard key={badge.id} badge={badge} isEarned={isEarned} />;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// 3D Rotating Badge Card Component
// ---------------------------------------------------------------------

function BadgeCard({ badge, isEarned }: { badge: any; isEarned: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEarned) {
      setIsExpanded(true);
    }
  };

  const closeExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  const rarityStyle = RARITY_STYLES[badge.rarity as keyof typeof RARITY_STYLES];
  const rarityClasses = rarityStyle
    ? `${rarityStyle.border} ${rarityStyle.bg}`
    : "border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800";

  return (
    <>
      {/* Expanded Centered Modal */}
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={closeExpanded}
            />
            
            {/* Modal Card */}
            <motion.div
              layoutId={`badge-${badge.id}`}
              className={`relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-[2.5rem] border-4 ${rarityClasses} shadow-[0_0_80px_rgba(0,0,0,0.4)] perspective-1000 transform-style-3d z-10 w-full max-w-sm cursor-pointer`}
              onClick={closeExpanded}
            >
              <motion.div 
                className={`text-6xl sm:text-7xl mb-6 perspective-1000 transform-style-3d ${isEarned && rarityStyle?.glow ? rarityStyle.glow : ""}`}
                animate={{ 
                  y: [0, -10, 0]
                }}
                transition={{ 
                  y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                {badge.imageUrl ? (
                  <img src={badge.imageUrl} alt={badge.name} className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-2xl" />
                ) : (
                  <span>{badge.icon}</span>
                )}
              </motion.div>
              <h5 className="text-xl sm:text-2xl font-black text-center text-gray-900 dark:text-white leading-tight mb-2">
                {badge.name}
              </h5>
              <span
                className="text-xs sm:text-sm uppercase tracking-widest font-bold opacity-80"
                style={{
                  color: rarityStyle?.border.includes("amber")
                    ? "#d97706"
                    : rarityStyle?.border.includes("purple")
                    ? "#a855f7"
                    : rarityStyle?.border.includes("blue")
                    ? "#3b82f6"
                    : "#6b7280",
                }}
              >
                {badge.rarity}
              </span>
              <p className="mt-6 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                {badge.description}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grid Item */}
      <motion.div
        layoutId={`badge-${badge.id}`}
        onClick={handleClick}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        animate={{ 
          rotateX: isHovered && isEarned && !isExpanded ? 15 : 0,
          rotateY: isHovered && isEarned && !isExpanded ? 15 : 0
        }}
        transition={{ 
          duration: 0.4, 
          type: "spring", 
          stiffness: 100, 
          damping: 15,
          rotateX: { duration: 1.5, repeat: isHovered && !isExpanded ? Infinity : 0, repeatType: "reverse", ease: "easeInOut" },
          rotateY: { duration: 2, repeat: isHovered && !isExpanded ? Infinity : 0, repeatType: "reverse", ease: "easeInOut" }
        }}
        className={`relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 transition-colors duration-300 ${
          isEarned
            ? `${rarityClasses} shadow-sm cursor-pointer hover:-translate-y-1 hover:shadow-md perspective-1000 transform-style-3d`
            : "border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 grayscale opacity-60 cursor-not-allowed"
        } ${isExpanded ? 'opacity-0 pointer-events-none' : ''}`}
      >
        <div
          className={`text-2xl sm:text-3xl mb-2 sm:mb-3 ${
            isEarned && rarityStyle?.glow ? rarityStyle.glow : ""
          }`}
        >
          {isEarned ? (
            badge.imageUrl ? (
              <img src={badge.imageUrl} alt={badge.name} className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-lg" />
            ) : (
              <span>{badge.icon}</span>
            )
          ) : (
            <div className="relative flex items-center justify-center">
              {badge.imageUrl ? (
                <img src={badge.imageUrl} alt={badge.name} className="w-12 h-12 sm:w-16 sm:h-16 object-contain opacity-30 grayscale" />
              ) : (
                <span className="opacity-30">{badge.icon}</span>
              )}
              <FaLock className="absolute text-sm text-gray-400 dark:text-neutral-400" />
            </div>
          )}
        </div>
        <h5 className="text-[10px] sm:text-xs font-black text-center text-gray-900 dark:text-white leading-tight mb-1">
          {badge.name}
        </h5>
        {isEarned && (
          <span
            className="text-[8px] sm:text-[9px] uppercase tracking-widest font-bold opacity-80"
            style={{
              color: rarityStyle?.border.includes("amber")
                ? "#d97706"
                : rarityStyle?.border.includes("purple")
                ? "#a855f7"
                : rarityStyle?.border.includes("blue")
                ? "#3b82f6"
                : "#6b7280",
            }}
          >
            {badge.rarity}
          </span>
        )}
      </motion.div>
    </>
  );
}
