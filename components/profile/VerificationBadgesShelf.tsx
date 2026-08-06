"use client";

import React, { useState } from "react";
import {
  FaShieldAlt,
  FaCertificate,
  FaCheckCircle,
  FaHandHoldingHeart,
  FaIdCard,
  FaBuilding,
  FaLock,
  FaInfoCircle,
  FaAward,
} from "react-icons/fa";
import { VerificationBadge, BadgeId, UserRole } from "@/types/profile";

interface VerificationBadgesShelfProps {
  userRole: UserRole;
  earnedBadgeIds?: string[];
  onOpenVerificationModal?: (badgeId?: BadgeId) => void;
}

const ALL_BADGES: Omit<VerificationBadge, "isEarned">[] = [
  {
    id: "food_safety_verified",
    title: "Food Safety Verified",
    description: "Certified hygienic food handling and safe packaging standards compliant with food regulations.",
    icon: "FaShieldAlt",
    color: "from-emerald-500 to-teal-600 shadow-emerald-500/30",
    category: "safety",
  },
  {
    id: "fssai_verified",
    title: "FSSAI Licensed Partner",
    description: "Official Food Safety and Standards Authority of India (FSSAI) license verified.",
    icon: "FaCertificate",
    color: "from-amber-500 to-orange-600 shadow-amber-500/30",
    category: "compliance",
  },
  {
    id: "business_license_verified",
    title: "Verified Commercial Business",
    description: "GST registration and official municipal trade license verified by Annosetu.",
    icon: "FaBuilding",
    color: "from-blue-500 to-indigo-600 shadow-blue-500/30",
    category: "compliance",
  },
  {
    id: "ngo_80g_certified",
    title: "Govt Certified NGO (80G)",
    description: "NITI Aayog NGO Darpan registered & 80G tax exemption compliant non-profit organisation.",
    icon: "FaHandHoldingHeart",
    color: "from-purple-500 to-pink-600 shadow-purple-500/30",
    category: "compliance",
  },
  {
    id: "identity_verified",
    title: "Govt ID Verified",
    description: "Personal Government photo identity verified for trusted community donation.",
    icon: "FaIdCard",
    color: "from-sky-500 to-cyan-600 shadow-sky-500/30",
    category: "identity",
  },
  {
    id: "verified_donor",
    title: "Community Impact Hero",
    description: "Recognized high-impact verified donor contributing regularly to fight hunger.",
    icon: "FaAward",
    color: "from-rose-500 to-red-600 shadow-rose-500/30",
    category: "community",
  },
];

export default function VerificationBadgesShelf({
  userRole,
  earnedBadgeIds = [],
  onOpenVerificationModal,
}: VerificationBadgesShelfProps) {
  const [selectedBadge, setSelectedBadge] = useState<Omit<VerificationBadge, "isEarned"> | null>(null);

  // Filter badges relevant for current role
  const relevantBadges = ALL_BADGES.filter((b) => {
    if (userRole === "individual") {
      return ["food_safety_verified", "identity_verified", "verified_donor"].includes(b.id);
    }
    if (userRole === "restaurant") {
      return ["food_safety_verified", "fssai_verified", "business_license_verified", "verified_donor"].includes(b.id);
    }
    if (userRole === "ngo") {
      return ["food_safety_verified", "ngo_80g_certified", "business_license_verified", "verified_donor"].includes(b.id);
    }
    return true;
  });

  const earnedCount = relevantBadges.filter((b) => earnedBadgeIds.includes(b.id)).length;
  const progressPercent = Math.round((earnedCount / Math.max(relevantBadges.length, 1)) * 100);

  const renderIcon = (iconName: string, isEarned: boolean) => {
    const props = { className: `text-xl sm:text-2xl ${isEarned ? "text-white" : "text-gray-400 dark:text-gray-500"}` };
    switch (iconName) {
      case "FaShieldAlt":
        return <FaShieldAlt {...props} />;
      case "FaCertificate":
        return <FaCertificate {...props} />;
      case "FaBuilding":
        return <FaBuilding {...props} />;
      case "FaHandHoldingHeart":
        return <FaHandHoldingHeart {...props} />;
      case "FaIdCard":
        return <FaIdCard {...props} />;
      case "FaAward":
      default:
        return <FaAward {...props} />;
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-5 sm:p-6 shadow-sm">
      {/* Header with verification status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-slate-700/60">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <FaShieldAlt className="text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Trust & Verification Badges
                {earnedCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <FaCheckCircle className="mr-1 text-[10px]" /> Verified
                  </span>
                )}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Verified badges build trust with donors, recipients, and food safety inspectors.
              </p>
            </div>
          </div>
        </div>

        {/* Progress pill */}
        <div className="bg-gray-50 dark:bg-slate-900/60 rounded-xl p-3 border border-gray-200/70 dark:border-slate-700/50 min-w-[200px]">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-gray-600 dark:text-gray-300">Verification Level</span>
            <span className="text-emerald-600 dark:text-emerald-400">{earnedCount} of {relevantBadges.length} Active</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-5">
        {relevantBadges.map((badge) => {
          const isEarned = earnedBadgeIds.includes(badge.id);

          return (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`group relative rounded-xl p-4 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isEarned
                  ? "bg-gradient-to-b from-white to-gray-50/50 dark:from-slate-800 dark:to-slate-800/50 border-emerald-300/70 dark:border-emerald-500/40 shadow-sm hover:shadow-md hover:border-emerald-500"
                  : "bg-gray-50/50 dark:bg-slate-900/30 border-dashed border-gray-300 dark:border-slate-700 opacity-80 hover:opacity-100 hover:border-gray-400 dark:hover:border-slate-600"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                      isEarned
                        ? `bg-gradient-to-br ${badge.color} shadow-lg`
                        : "bg-gray-200 dark:bg-slate-800 text-gray-400"
                    }`}
                  >
                    {renderIcon(badge.icon, isEarned)}
                  </div>

                  {isEarned ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                      <FaCheckCircle className="text-[11px]" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700">
                      <FaLock className="text-[10px]" />
                      Required
                    </span>
                  )}
                </div>

                <h4 className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {badge.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {badge.description}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/50 flex items-center justify-between text-xs">
                <span className="text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <FaInfoCircle className="text-[10px]" />
                  {isEarned ? "Verified & Protected" : "Upload proof to unlock"}
                </span>
                {!isEarned && onOpenVerificationModal && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenVerificationModal(badge.id as BadgeId);
                    }}
                    className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    Verify now &rarr;
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal / Details Popup for selected badge */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${selectedBadge.color}`}
              >
                {renderIcon(selectedBadge.icon, true)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedBadge.title}
                </h3>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                  {selectedBadge.category} Verification
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
              {selectedBadge.description}
            </p>

            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl p-3.5 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 space-y-1.5 mb-5">
              <div className="font-semibold flex items-center gap-1.5">
                <FaCheckCircle /> Benefits of this Badge:
              </div>
              <ul className="list-disc pl-4 space-y-1 text-gray-600 dark:text-gray-300">
                <li>Displays green verified seal on all food donation listings</li>
                <li>Priority listing in hunger relief & rescue matchmaking algorithms</li>
                <li>Instant trust approval for recipient reservation pickups</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl transition-colors"
              >
                Close
              </button>
              {onOpenVerificationModal && (
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedBadge.id as BadgeId;
                    setSelectedBadge(null);
                    onOpenVerificationModal(id);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-md shadow-emerald-500/20 transition-all"
                >
                  Submit Verification Documents
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
