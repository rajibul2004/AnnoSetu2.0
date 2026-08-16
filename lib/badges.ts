import { IconType } from "react-icons";
import {
  FaSeedling, FaLeaf, FaTree, FaStar, FaShieldAlt,
  FaTrophy, FaCrown, FaBolt, FaGem, FaMedal,
  FaFire, FaHeart, FaGlobe, FaUsers, FaPen,
  FaHandsHelping, FaRecycle, FaAward,
} from "react-icons/fa";

// ─── Badge Category & Rarity ───────────────────────────────────────
export type BadgeCategory = "meals_rescued" | "meals_shared" | "streak" | "carbon" | "points" | "social" | "reviews";
export type BadgeRarity = "common" | "rare" | "epic" | "legendary";

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: IconType;
  color: string;        // tailwind color class stem, e.g. "emerald"
  category: BadgeCategory;
  rarity: BadgeRarity;
  threshold: number;
  thresholdUnit: string;
  imageUrl?: string;
}

// ─── Rarity Styling ────────────────────────────────────────────────
export const RARITY_STYLES: Record<BadgeRarity, { border: string; bg: string; glow: string; label: string }> = {
  common:    { border: "border-gray-300 dark:border-gray-600",     bg: "bg-gray-100 dark:bg-gray-800",       glow: "",                                              label: "Common" },
  rare:      { border: "border-blue-400 dark:border-blue-500",     bg: "bg-blue-50 dark:bg-blue-950/40",     glow: "shadow-blue-400/20 dark:shadow-blue-500/20",    label: "Rare" },
  epic:      { border: "border-purple-400 dark:border-purple-500", bg: "bg-purple-50 dark:bg-purple-950/40", glow: "shadow-purple-400/20 dark:shadow-purple-500/20", label: "Epic" },
  legendary: { border: "border-amber-400 dark:border-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/40",   glow: "shadow-amber-400/30 dark:shadow-amber-500/30",  label: "Legendary" },
};

// ─── Badge Registry ────────────────────────────────────────────────
export const BADGE_REGISTRY: BadgeDefinition[] = [
  // ── Meals Rescued ──
  { id: "first_rescue",           title: "First Rescue",           description: "Rescued your very first meal",              icon: FaSeedling,      color: "emerald",  category: "meals_rescued", rarity: "common",    threshold: 1,    thresholdUnit: "meals rescued", imageUrl: "/badges/first_rescue.png" },
  { id: "zero_waste_hero",        title: "Zero Waste Hero",        description: "Rescued 10 meals from going to waste",      icon: FaRecycle,       color: "emerald",  category: "meals_rescued", rarity: "common",    threshold: 10,   thresholdUnit: "meals rescued", imageUrl: "/badges/zero_waste_hero.png" },
  { id: "eco_warrior",            title: "Eco Warrior",            description: "Rescued 25 meals — a true eco warrior",     icon: FaLeaf,          color: "emerald",  category: "meals_rescued", rarity: "rare",      threshold: 25,   thresholdUnit: "meals rescued", imageUrl: "/badges/echo_warior.png" },
  { id: "carbon_champion",        title: "Carbon Champion",        description: "Rescued 50 meals and saved over 125kg CO₂", icon: FaShieldAlt,     color: "emerald",  category: "meals_rescued", rarity: "rare",      threshold: 50,   thresholdUnit: "meals rescued", imageUrl: "/badges/carbon_champion.png" },
  { id: "century_rescuer",        title: "Century Rescuer",        description: "An incredible 100 meals rescued",           icon: FaTrophy,        color: "emerald",  category: "meals_rescued", rarity: "epic",      threshold: 100,  thresholdUnit: "meals rescued" },
  { id: "planet_protector",       title: "Planet Protector",       description: "250 meals rescued — protecting the planet",  icon: FaGlobe,         color: "emerald",  category: "meals_rescued", rarity: "epic",      threshold: 250,  thresholdUnit: "meals rescued" },
  { id: "sustainability_legend",  title: "Sustainability Legend",  description: "500 meals rescued — a living legend",        icon: FaCrown,         color: "emerald",  category: "meals_rescued", rarity: "legendary", threshold: 500,  thresholdUnit: "meals rescued" },
  { id: "global_guardian",        title: "Global Guardian",        description: "1000 meals — guardian of the planet",        icon: FaGem,           color: "emerald",  category: "meals_rescued", rarity: "legendary", threshold: 1000, thresholdUnit: "meals rescued" },

  // ── Meals Shared ──
  { id: "first_donation",         title: "First Donation",         description: "Shared your very first meal",               icon: FaSeedling,      color: "blue",     category: "meals_shared",  rarity: "common",    threshold: 1,    thresholdUnit: "meals shared" },
  { id: "community_feeder",       title: "Community Feeder",       description: "Shared 10 meals with the community",        icon: FaHandsHelping,  color: "blue",     category: "meals_shared",  rarity: "common",    threshold: 10,   thresholdUnit: "meals shared" },
  { id: "generous_heart",         title: "Generous Heart",         description: "Shared 25 meals — a generous soul",         icon: FaHeart,         color: "blue",     category: "meals_shared",  rarity: "rare",      threshold: 25,   thresholdUnit: "meals shared" },
  { id: "food_bank_hero",         title: "Food Bank Hero",         description: "50 meals shared — a community hero",        icon: FaShieldAlt,     color: "blue",     category: "meals_shared",  rarity: "rare",      threshold: 50,   thresholdUnit: "meals shared" },
  { id: "neighborhood_pillar",    title: "Neighborhood Pillar",    description: "100 meals — a pillar of your neighborhood", icon: FaTrophy,        color: "blue",     category: "meals_shared",  rarity: "epic",      threshold: 100,  thresholdUnit: "meals shared" },
  { id: "hunger_eradicator",      title: "Hunger Eradicator",      description: "250 meals — eradicating hunger",            icon: FaGlobe,         color: "blue",     category: "meals_shared",  rarity: "epic",      threshold: 250,  thresholdUnit: "meals shared" },
  { id: "philanthropy_master",    title: "Philanthropy Master",    description: "500 meals — mastering philanthropy",        icon: FaCrown,         color: "blue",     category: "meals_shared",  rarity: "legendary", threshold: 500,  thresholdUnit: "meals shared" },
  { id: "impact_titan",           title: "Impact Titan",           description: "1000 meals — a titan of impact",            icon: FaGem,           color: "blue",     category: "meals_shared",  rarity: "legendary", threshold: 1000, thresholdUnit: "meals shared" },

  // ── Streak ──
  { id: "streak_7",               title: "Week Warrior",           description: "Active 7 days in a row",                    icon: FaFire,          color: "orange",   category: "streak",        rarity: "common",    threshold: 7,    thresholdUnit: "day streak" },
  { id: "streak_21",              title: "Habit Builder",          description: "Active 21 days — habit formed!",            icon: FaFire,          color: "orange",   category: "streak",        rarity: "rare",      threshold: 21,   thresholdUnit: "day streak" },
  { id: "streak_50",              title: "Unstoppable Force",      description: "50 days without breaking the chain",        icon: FaFire,          color: "orange",   category: "streak",        rarity: "epic",      threshold: 50,   thresholdUnit: "day streak" },
  { id: "streak_100",             title: "Century Streak",         description: "100 consecutive days of impact",            icon: FaFire,          color: "orange",   category: "streak",        rarity: "legendary", threshold: 100,  thresholdUnit: "day streak" },
  { id: "streak_365",             title: "Year-Round Hero",        description: "365 days — a full year of impact!",         icon: FaBolt,          color: "orange",   category: "streak",        rarity: "legendary", threshold: 365,  thresholdUnit: "day streak" },

  // ── Carbon ──
  { id: "carbon_100",             title: "Carbon Centurion",       description: "Saved 100kg of CO₂ emissions",              icon: FaLeaf,          color: "teal",     category: "carbon",        rarity: "rare",      threshold: 100,  thresholdUnit: "kg CO₂ saved" },
  { id: "carbon_500",             title: "Climate Champion",       description: "Saved 500kg of CO₂ emissions",              icon: FaGlobe,         color: "teal",     category: "carbon",        rarity: "epic",      threshold: 500,  thresholdUnit: "kg CO₂ saved" },
  { id: "carbon_1000",            title: "Earth Guardian",         description: "Saved 1 tonne of CO₂ emissions!",           icon: FaGem,           color: "teal",     category: "carbon",        rarity: "legendary", threshold: 1000, thresholdUnit: "kg CO₂ saved" },

  // ── Points ──
  { id: "points_1000",            title: "Points Millennial",      description: "Accumulated 1,000 impact points",           icon: FaStar,          color: "amber",    category: "points",        rarity: "rare",      threshold: 1000,  thresholdUnit: "points" },
  { id: "points_5000",            title: "Points Master",          description: "Accumulated 5,000 impact points",           icon: FaTrophy,        color: "amber",    category: "points",        rarity: "epic",      threshold: 5000,  thresholdUnit: "points" },
  { id: "points_10000",           title: "Points Legend",          description: "Accumulated 10,000 impact points",          icon: FaCrown,         color: "amber",    category: "points",        rarity: "legendary", threshold: 10000, thresholdUnit: "points" },

  // ── Social ──
  { id: "first_follower",         title: "Rising Star",            description: "Got your first follower",                   icon: FaUsers,         color: "indigo",   category: "social",        rarity: "common",    threshold: 1,    thresholdUnit: "followers" },
  { id: "followers_10",           title: "Community Voice",         description: "10 people are following your journey",      icon: FaUsers,         color: "indigo",   category: "social",        rarity: "rare",      threshold: 10,   thresholdUnit: "followers" },
  { id: "followers_50",           title: "Influencer",             description: "50 followers — you're an influencer!",      icon: FaAward,         color: "indigo",   category: "social",        rarity: "epic",      threshold: 50,   thresholdUnit: "followers" },
  { id: "followers_100",          title: "Community Leader",       description: "100 followers — leading the community",     icon: FaCrown,         color: "indigo",   category: "social",        rarity: "legendary", threshold: 100,  thresholdUnit: "followers" },

  // ── Reviews ──
  { id: "first_review",           title: "First Feedback",         description: "Wrote your first food review",              icon: FaPen,           color: "rose",     category: "reviews",       rarity: "common",    threshold: 1,    thresholdUnit: "reviews" },
  { id: "reviews_10",             title: "Trusted Reviewer",       description: "Wrote 10 thoughtful reviews",               icon: FaPen,           color: "rose",     category: "reviews",       rarity: "rare",      threshold: 10,   thresholdUnit: "reviews" },
  { id: "reviews_25",             title: "Expert Critic",          description: "25 reviews — a true food expert",           icon: FaMedal,         color: "rose",     category: "reviews",       rarity: "epic",      threshold: 25,   thresholdUnit: "reviews" },
];

// ─── Lookup Helpers ────────────────────────────────────────────────
export const BADGE_MAP = new Map(BADGE_REGISTRY.map(b => [b.id, b]));

export function getBadge(badgeId: string): BadgeDefinition | undefined {
  return BADGE_MAP.get(badgeId);
}

export function getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
  return BADGE_REGISTRY.filter(b => b.category === category);
}

export function getNextBadge(
  category: BadgeCategory,
  currentValue: number
): BadgeDefinition | undefined {
  return BADGE_REGISTRY
    .filter(b => b.category === category && b.threshold > currentValue)
    .sort((a, b) => a.threshold - b.threshold)[0];
}
