import { prisma } from "@/lib/prisma";
import { resolveSupplierName, SUPPLIER_NAME_SELECT } from "@/lib/supplier";
import type { Prisma } from "@/app/generated/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FoodListFilters {
  search?: string;
  supplierType?: string;
  isDonation?: string;
  cuisineType?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
  maxDistance?: number;
  /** Requesting user's origin for distance calculation */
  originLat?: number | null;
  originLng?: number | null;
}

export interface FoodListResult {
  data: ReturnType<typeof mapFoodToPublic>[];
  total: number;
  totalPages: number;
  count: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_CANDIDATES_FOR_DISTANCE_FILTER = 300;

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function mapFoodToPublic(
  food: Awaited<ReturnType<typeof queryFoodCandidates>>[number],
  originLat: number | null,
  originLng: number | null,
) {
  const distance =
    originLat !== null &&
    originLng !== null &&
    food.latitude !== null &&
    food.longitude !== null
      ? haversineKm(originLat, originLng, food.latitude, food.longitude)
      : null;

  return {
    id: food.id,
    name: food.name,
    description: food.description,
    supplierId: food.supplierId,
    supplierName: resolveSupplierName(food.supplier),
    supplierType: food.supplier?.role,
    isHomeCooked: food.isHomeCooked,
    quantity: food.quantity,
    availableQty: food.availableQty,
    quantityUnit: food.quantityUnit,
    isDonation: food.isDonation,
    price: food.price,
    originalPrice: food.originalPrice,
    discountPct: food.discountPct,
    isRaw: food.isRaw,
    allergens: food.allergens,
    cuisineType: food.cuisineType,
    pickupAddress: food.pickupAddress,
    expiresAt: food.expiresAt,
    images: food.images,
    averageRating: food.averageRating,
    reviewCount: food.reviewCount,
    distance,
  };
}

function queryFoodCandidates(
  where: Prisma.FoodWhereInput,
  orderBy: Prisma.FoodOrderByWithRelationInput,
  take: number,
  skip?: number,
) {
  return prisma.food.findMany({
    where,
    orderBy,
    take,
    skip,
    include: {
      images: { orderBy: { displayOrder: "asc" } },
      supplier: {
        select: {
          role: true,
          individualProfile: { select: { name: true } },
          restaurantProfile: { select: { restaurantName: true } },
          ngoProfile: { select: { ngoName: true } },
        },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Paginated, filtered list of active food listings.
 * Mirrors the logic previously inlined in GET /api/food.
 */
export async function getFoodListings(
  filters: FoodListFilters = {},
): Promise<FoodListResult> {
  const {
    search = "",
    supplierType = "all",
    isDonation = "all",
    cuisineType = "all",
    minPrice,
    maxPrice,
    sortBy = "newest",
    page = 1,
    limit = 9,
    maxDistance,
    originLat = null,
    originLng = null,
  } = filters;

  const where: Prisma.FoodWhereInput = {
    isActive: true,
    deletedAt: null,
    expiresAt: { gt: new Date() },
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (supplierType !== "all") {
    where.supplier = { role: supplierType as Prisma.EnumRoleFilter };
  }

  if (isDonation !== "all") {
    where.isDonation = isDonation === "true";
  }

  if (cuisineType !== "all") {
    where.cuisineType = cuisineType as Prisma.EnumCuisineTypeNullableFilter;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
  }

  const orderBy: Prisma.FoodOrderByWithRelationInput =
    sortBy === "oldest"
      ? { createdAt: "asc" }
      : sortBy === "price_low"
        ? { price: "asc" }
        : sortBy === "price_high"
          ? { price: "desc" }
          : sortBy === "expiring"
            ? { expiresAt: "asc" }
            : sortBy === "popular"
              ? { reservationCount: "desc" }
              : { createdAt: "desc" };

  const applyDistanceFilter = Boolean(
    maxDistance && originLat !== null && originLng !== null,
  );

  const candidates = await queryFoodCandidates(
    where,
    orderBy,
    applyDistanceFilter ? MAX_CANDIDATES_FOR_DISTANCE_FILTER : limit,
    applyDistanceFilter ? undefined : (page - 1) * limit,
  );

  let mapped = candidates.map((food) =>
    mapFoodToPublic(food, originLat, originLng),
  );

  let total: number;
  let totalPages: number;
  let pageData: typeof mapped;

  if (applyDistanceFilter) {
    const maxKm = maxDistance!;
    mapped = mapped.filter((f) => f.distance === null || f.distance <= maxKm);
    total = mapped.length;
    totalPages = Math.max(1, Math.ceil(total / limit));
    pageData = mapped.slice((page - 1) * limit, page * limit);
  } else {
    total = await prisma.food.count({ where });
    totalPages = Math.max(1, Math.ceil(total / limit));
    pageData = mapped;
  }

  return { data: pageData, total, totalPages, count: pageData.length };
}

/**
 * Resolve the requesting user's lat/lng from whichever role-specific
 * profile exists. Returns null for both if not found.
 */
export async function getUserLocation(
  userId: string,
): Promise<{ latitude: number | null; longitude: number | null }> {
  const [individual, restaurant, ngo] = await Promise.all([
    prisma.individualProfile.findUnique({
      where: { userId },
      select: { latitude: true, longitude: true },
    }),
    prisma.restaurantProfile.findUnique({
      where: { userId },
      select: { latitude: true, longitude: true },
    }),
    prisma.ngoProfile.findUnique({
      where: { userId },
      select: { latitude: true, longitude: true },
    }),
  ]);

  const profile = individual ?? restaurant ?? ngo;
  return {
    latitude: profile?.latitude ?? null,
    longitude: profile?.longitude ?? null,
  };
}

/**
 * Fetch a single food item by id, with images, supplier info, and reviews.
 * Returns null if the item is not found or has been deleted/deactivated.
 */
export async function getFoodById(id: string) {
  return prisma.food.findUnique({
    where: { id },
    include: {
      images: { orderBy: { displayOrder: "asc" } },
      supplier: {
        select: { ...SUPPLIER_NAME_SELECT, email: true },
      },
      reviews: {
        where: { isVisible: true, deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: { reviewer: { select: SUPPLIER_NAME_SELECT } },
      },
    },
  });
}

/**
 * Increment the view counter for a food item (fire-and-forget).
 */
export function incrementViewCount(id: string): void {
  prisma.food
    .update({ where: { id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});
}

/**
 * All food listings created by a given supplier, excluding soft-deleted ones.
 */
export async function getFoodBySupplier(supplierId: string) {
  const rows = await prisma.food.findMany({
    where: { supplierId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      images: {
        orderBy: { displayOrder: "asc" },
        select: { id: true, url: true, isPrimary: true, displayOrder: true },
      },
      supplier: { select: SUPPLIER_NAME_SELECT },
    },
  });

  return rows.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description,
    supplierId: f.supplierId,
    supplierName: resolveSupplierName(f.supplier),
    quantity: f.quantity,
    availableQty: f.availableQty,
    quantityUnit: f.quantityUnit,
    isDonation: f.isDonation,
    price: f.price,
    originalPrice: f.originalPrice,
    discountPct: f.discountPct,
    isHomeCooked: f.isHomeCooked,
    isActive: f.isActive,
    deletedAt: f.deletedAt,
    expiresAt: f.expiresAt,
    images: f.images,
    averageRating: f.averageRating,
    reviewCount: f.reviewCount,
  }));
}

/**
 * Aggregate stats for the homepage.
 */
export async function getFoodStats() {
  const activeWhere = {
    isActive: true,
    deletedAt: null,
    expiresAt: { gt: new Date() },
  } as const;

  const [activeListings, donations, restaurantGroups] = await Promise.all([
    prisma.food.count({ where: activeWhere }),
    prisma.food.count({ where: { ...activeWhere, isDonation: true } }),
    prisma.food.groupBy({
      by: ["supplierId"],
      where: { ...activeWhere, supplier: { role: "restaurant" } },
    }),
  ]);

  return {
    activeListings,
    donations,
    uniqueRestaurants: restaurantGroups.length,
  };
}

/**
 * Soft-delete a food item owned by the given supplier.
 * Returns false if the item doesn't exist or doesn't belong to the supplier.
 */
export async function deleteFood(
  id: string,
  supplierId: string,
): Promise<boolean> {
  const existing = await prisma.food.findUnique({ where: { id } });

  if (!existing || existing.supplierId !== supplierId) {
    return false;
  }

  await prisma.food.update({
    where: { id },
    data: { isActive: false, deletedAt: new Date() },
  });

  return true;
}
