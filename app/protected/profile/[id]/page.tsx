"use client";

import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { usePublicProfile, useFollowUser, useUnfollowUser } from "@/hooks/useSocial";
import StreakWidget from "@/components/gamification/StreakWidget";
import LevelProgressBar from "@/components/gamification/LevelProgressBar";
import CommunityLog from "@/components/dashboard/CommunityLog";
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
  FaMedal,
  FaShieldAlt
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
          className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 dark:from-emerald-800 dark:via-teal-800 dark:to-cyan-900 p-6 sm:p-8 md:p-10 shadow-2xl border border-white/10"
        >
          {/* Subtle Ambient Light Gradients */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            {/* Avatar */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-[2rem] bg-white/20 backdrop-blur-md p-1.5 flex-shrink-0 shadow-lg border border-white/30 rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="w-full h-full rounded-[1.75rem] bg-white dark:bg-neutral-900 flex items-center justify-center overflow-hidden">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl sm:text-5xl font-black text-emerald-500/50">{profile.name.charAt(0)}</span>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left space-y-4 w-full">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 justify-between w-full">
                <div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-sm">
                    {profile.name}
                  </h1>
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[10px] sm:text-xs font-semibold text-white uppercase tracking-wider mt-2 border border-white/20">
                    <FaShieldAlt className="w-3 h-3 text-teal-200" />
                    <span>{profile.role === 'restaurant' ? 'Restaurant Partner' : 'Individual Partner'}</span>
                  </div>
                </div>
                
                {/* Follow Button */}
                <button
                  onClick={handleFollowToggle}
                  disabled={isMutating}
                  className={`w-full sm:w-auto px-6 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-black transition-all duration-300 shadow-xl border ${
                    profile.isFollowing 
                      ? "bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md" 
                      : "bg-white text-emerald-600 hover:bg-gray-50 border-white hover:scale-[1.03] hover:-translate-y-0.5"
                  }`}
                >
                  {isMutating ? (
                    <FaSpinner className="animate-spin w-4 h-4" />
                  ) : profile.isFollowing ? (
                    <><FaUserMinus className="w-4 h-4" /> Unfollow</>
                  ) : (
                    <><FaUserPlus className="w-4 h-4" /> Follow</>
                  )}
                </button>
              </div>

              {profile.bio && (
                <p className="text-emerald-50 max-w-2xl text-sm sm:text-base leading-relaxed mx-auto md:mx-0 font-medium">
                  {profile.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-center md:justify-start pt-2">
                <div className="flex items-center gap-2 text-white">
                  <span className="text-xl sm:text-2xl font-black drop-shadow-md">{profile.followersCount}</span>
                  <span className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Followers</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <span className="text-xl sm:text-2xl font-black drop-shadow-md">{profile.followingCount}</span>
                  <span className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Following</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Unified Compact Metrics Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-6"
        >
          {/* Metric 1 */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 backdrop-blur-md rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800/30 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] sm:text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider flex justify-between items-center">
              Total Impact <FaLeaf className="text-emerald-500 w-3 h-3" />
            </span>
            <div className="text-2xl font-black mt-2 text-gray-900 dark:text-white drop-shadow-sm truncate">
              {(profile.mealsRescued + profile.mealsShared).toLocaleString()} <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500">Meals</span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-gray-200/60 dark:border-white/5 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider flex justify-between items-center">
              CO₂ Saved <FaShieldAlt className="text-gray-400 w-3 h-3" />
            </span>
            <div className="text-2xl font-black mt-2 text-gray-900 dark:text-white drop-shadow-sm truncate">
              {profile.carbonSaved.toFixed(1)} <span className="text-xs font-semibold text-gray-500">kg</span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-amber-50 dark:bg-amber-900/20 backdrop-blur-md rounded-2xl p-4 border border-amber-100 dark:border-amber-800/30 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider flex justify-between items-center">
              Impact Points <FaStar className="text-amber-500 w-3 h-3" />
            </span>
            <div className="text-2xl font-black mt-2 text-gray-900 dark:text-white drop-shadow-sm truncate">
              {profile.points.toLocaleString()}
            </div>
          </div>

          {/* Metric 4 */}
          <div className="bg-purple-50 dark:bg-purple-900/20 backdrop-blur-md rounded-2xl p-4 border border-purple-100 dark:border-purple-800/30 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] sm:text-xs text-purple-700 dark:text-purple-400 font-bold uppercase tracking-wider flex justify-between items-center">
              Badges <FaMedal className="text-purple-500 w-3 h-3" />
            </span>
            <div className="text-2xl font-black mt-2 text-gray-900 dark:text-white drop-shadow-sm truncate">
              {profile.badges.length}
            </div>
          </div>

          {/* Metric 5 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 backdrop-blur-md rounded-2xl p-4 border border-blue-100 dark:border-blue-800/30 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider flex justify-between items-center">
              Meals Rescued <FaBoxOpen className="text-blue-500 w-3 h-3" />
            </span>
            <div className="text-2xl font-black mt-2 text-gray-900 dark:text-white drop-shadow-sm truncate">
              {profile.mealsRescued.toLocaleString()}
            </div>
          </div>

          {/* Metric 6 */}
          <div className="bg-orange-50 dark:bg-orange-900/20 backdrop-blur-md rounded-2xl p-4 border border-orange-100 dark:border-orange-800/30 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] sm:text-xs text-orange-700 dark:text-orange-400 font-bold uppercase tracking-wider flex justify-between items-center">
              Meals Shared <FaUtensils className="text-orange-500 w-3 h-3" />
            </span>
            <div className="text-2xl font-black mt-2 text-gray-900 dark:text-white drop-shadow-sm truncate">
              {profile.mealsShared.toLocaleString()}
            </div>
          </div>
        </motion.div>

        {/* Level Progress Bar & Streak Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <LevelProgressBar points={profile.points} />
          </div>
          <div className="lg:col-span-1">
            <StreakWidget 
              currentStreak={profile.currentStreak} 
              longestStreak={profile.longestStreak} 
            />
          </div>
        </div>

        {/* Middle Row: Activity */}
        <div className="grid grid-cols-1 gap-5 sm:gap-6">
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
      
      {/* Community Log at bottom */}
      <div className="mt-12 max-w-7xl mx-auto w-full">
        <CommunityLog />
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
