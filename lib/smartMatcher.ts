import type { Allergen, QuantityUnit } from "@/types/food";

export type FoodTag = string;

export interface MatchCriteria {
  userLat?: number | null;
  userLng?: number | null;
  maxDistanceKm?: number;
  partySize?: number;
  dietaryTags?: string[];
  avoidAllergens?: Allergen[];
  urgency?: "any" | "urgent_only" | "relaxed";
  pricePreference?: "all" | "donations_only" | "discount_only";
  cuisineType?: string;
  isNGO?: boolean;
}

export interface MatchResultItem {
  foodId: string;
  foodName: string;
  description: string | null;
  supplierId: string;
  supplierName: string;
  supplierType: "restaurant" | "individual" | "ngo" | "admin";
  averageRating: number;
  reviewCount: number;
  images: { id: string; url: string }[];
  
  availableQty: number;
  pendingCount?: number;
  quantityUnit: QuantityUnit;
  isDonation: boolean;
  price: number;
  originalPrice: number | null;
  discountPct: number;
  cuisineType: string | null;
  allergens: Allergen[];
  tags: FoodTag[];
  expiresAt: string;
  pickupAddress: string | null;
  
  // Smart Match Metrics
  matchScore: number; // 0 to 100
  matchGrade: "PERFECT" | "EXCELLENT" | "GOOD" | "FAIR";
  distanceKm: number | null;
  etaMinutes: number | null;
  hoursUntilExpiry: number;
  
  // Explainability
  matchReasons: string[];
  warnings: string[];
  scoringBreakdown: {
    distanceScore: number;
    urgencyScore: number;
    dietaryScore: number;
    quantityScore: number;
    priceScore: number;
  };
}

export interface NgoMatchItem {
  id: string;
  name: string;
  type: string | null;
  address: string | null;
  phone: string | null;
  bio: string;
  profileImage: string;
  distanceKm: number | null;
  matchScore: number;
  matchReasons: string[];
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function calculateFoodMatchScore(
  food: {
    id: string;
    name: string;
    description: string | null;
    supplierId: string;
    supplierName: string;
    supplierType: "restaurant" | "individual" | "ngo" | "admin";
    averageRating: number;
    reviewCount: number;
    images: { id: string; url: string }[];
    availableQty: number;
    pendingCount?: number;
    quantityUnit: QuantityUnit;
    isDonation: boolean;
    price: number;
    originalPrice: number | null;
    discountPct: number;
    cuisineType: string | null;
    allergens: Allergen[];
    tags: FoodTag[];
    expiresAt: string | Date;
    pickupAddress: string | null;
    latitude: number | null;
    longitude: number | null;
  },
  criteria: MatchCriteria
): MatchResultItem {
  const matchReasons: string[] = [];
  const warnings: string[] = [];

  const expiresDate = new Date(food.expiresAt);
  const now = new Date();
  const diffMs = expiresDate.getTime() - now.getTime();
  const hoursUntilExpiry = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);

  // 1. Distance Calculation & Score (Weight 30%)
  let distanceKm: number | null = null;
  let etaMinutes: number | null = null;
  let distanceScore = 70; // Default when location is unknown

  if (
    criteria.userLat != null &&
    criteria.userLng != null &&
    food.latitude != null &&
    food.longitude != null
  ) {
    distanceKm = haversineDistanceKm(
      criteria.userLat,
      criteria.userLng,
      food.latitude,
      food.longitude
    );
    // Estimated ETA in traffic (~3.5 min/km + 5 min prep)
    etaMinutes = Math.max(5, Math.round(distanceKm * 3.5 + 5));

    if (distanceKm <= 1.5) {
      distanceScore = 100;
      matchReasons.push(`📍 Very Close (${distanceKm} km away - ~${etaMinutes} mins)`);
    } else if (distanceKm <= 4) {
      distanceScore = 90;
      matchReasons.push(`📍 Nearby (${distanceKm} km away)`);
    } else if (distanceKm <= 8) {
      distanceScore = 75;
    } else if (distanceKm <= 15) {
      distanceScore = 55;
    } else {
      distanceScore = 30;
      warnings.push(`Distance is ${distanceKm} km away`);
    }
  }

  // 2. Urgency & Rescue Freshness Score (Weight 25%)
  let urgencyScore = 60;
  if (hoursUntilExpiry <= 2) {
    urgencyScore = 100;
    matchReasons.push(`⚡ Urgent Rescue! Expiring in ${hoursUntilExpiry}h - Save this meal`);
  } else if (hoursUntilExpiry <= 4) {
    urgencyScore = 90;
    matchReasons.push(`⏰ Fresh window (Expires in ${hoursUntilExpiry}h)`);
  } else if (hoursUntilExpiry <= 8) {
    urgencyScore = 75;
  } else {
    urgencyScore = 60;
  }

  if (criteria.urgency === "urgent_only" && hoursUntilExpiry > 3) {
    urgencyScore -= 30;
  }

  // 3. Dietary & Allergen Safety Score (Weight 20%)
  let dietaryScore = 80;
  const userAvoids = criteria.avoidAllergens ?? [];
  const foodAllergens = food.allergens || [];

  const conflictingAllergens = foodAllergens.filter((a) => userAvoids.includes(a));
  if (conflictingAllergens.length > 0) {
    dietaryScore = 10;
    warnings.push(`⚠️ Contains ${conflictingAllergens.join(", ")} (You requested to avoid)`);
  } else {
    if (userAvoids.length > 0) {
      matchReasons.push(`🛡️ 100% Free of your flagged allergens`);
      dietaryScore += 10;
    }
  }

  const userDiet = criteria.dietaryTags ?? [];
  const foodTags = (food.tags || []).map((t) => String(t).toLowerCase());

  if (userDiet.includes("vegetarian") || userDiet.includes("vegan")) {
    if (foodTags.includes("vegetarian") || foodTags.includes("vegan") || (!foodAllergens.includes("eggs") && !foodAllergens.includes("seafood"))) {
      dietaryScore += 10;
      matchReasons.push(`🌱 100% Vegetarian Match`);
    }
  }

  // 4. Quantity / Sizing Score (Weight 15%)
  let quantityScore = 80;
  const neededQty = criteria.partySize || (criteria.isNGO ? 15 : 1);
  if (food.availableQty >= neededQty) {
    quantityScore = 100;
    if (neededQty > 1) {
      matchReasons.push(`📦 Fulfills full party size (${food.availableQty} ${food.quantityUnit} available)`);
    }
  } else if (food.availableQty >= neededQty * 0.6) {
    quantityScore = 75;
  } else {
    quantityScore = 45;
    warnings.push(`Only ${food.availableQty} ${food.quantityUnit} available (needed ${neededQty})`);
  }

  // 5. Price & Reputation Score (Weight 10%)
  let priceScore = 70;
  if (food.isDonation) {
    priceScore = 100;
    matchReasons.push(`❤️ 100% Free Community Donation`);
  } else {
    if (food.discountPct >= 50) {
      priceScore = 95;
      matchReasons.push(`🎉 Huge ${food.discountPct}% Discount (₹${food.price})`);
    } else if (food.discountPct >= 20) {
      priceScore = 85;
      matchReasons.push(`🏷️ ${food.discountPct}% Surplus Deal`);
    }
  }

  if (food.averageRating >= 4.5) {
    priceScore += 5;
    matchReasons.push(`⭐ Top-rated Kitchen (${food.averageRating.toFixed(1)}★)`);
  }

  // Calculate Weighted Total Score (0 - 100)
  const rawScore =
    distanceScore * 0.3 +
    urgencyScore * 0.25 +
    dietaryScore * 0.2 +
    quantityScore * 0.15 +
    priceScore * 0.1;

  const finalScore = Math.min(100, Math.max(10, Math.round(rawScore)));

  let matchGrade: "PERFECT" | "EXCELLENT" | "GOOD" | "FAIR" = "GOOD";
  if (finalScore >= 92) matchGrade = "PERFECT";
  else if (finalScore >= 80) matchGrade = "EXCELLENT";
  else if (finalScore >= 60) matchGrade = "GOOD";
  else matchGrade = "FAIR";

  return {
    foodId: food.id,
    foodName: food.name,
    description: food.description,
    supplierId: food.supplierId,
    supplierName: food.supplierName,
    supplierType: food.supplierType,
    averageRating: food.averageRating,
    reviewCount: food.reviewCount,
    images: food.images,
    availableQty: food.availableQty,
    pendingCount: food.pendingCount,
    quantityUnit: food.quantityUnit,
    isDonation: food.isDonation,
    price: food.price,
    originalPrice: food.originalPrice,
    discountPct: food.discountPct,
    cuisineType: food.cuisineType,
    allergens: food.allergens,
    tags: food.tags,
    expiresAt: expiresDate.toISOString(),
    pickupAddress: food.pickupAddress,
    matchScore: finalScore,
    matchGrade,
    distanceKm,
    etaMinutes,
    hoursUntilExpiry,
    matchReasons: matchReasons.slice(0, 4),
    warnings: warnings.slice(0, 2),
    scoringBreakdown: {
      distanceScore: Math.round(distanceScore),
      urgencyScore: Math.round(urgencyScore),
      dietaryScore: Math.round(dietaryScore),
      quantityScore: Math.round(quantityScore),
      priceScore: Math.round(priceScore),
    },
  };
}
