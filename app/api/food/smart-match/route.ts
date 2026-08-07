import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveSupplierName } from "@/lib/supplier";
import {
  calculateFoodMatchScore,
  haversineDistanceKm,
  type MatchCriteria,
  type MatchResultItem,
  type NgoMatchItem,
} from "@/lib/smartMatcher";

export async function POST(request: NextRequest) {
  return handleSmartMatch(request);
}

export async function GET(request: NextRequest) {
  return handleSmartMatch(request);
}

async function handleSmartMatch(request: NextRequest) {
  try {
    const session = await auth();
    let body: any = {};

    if (request.method === "POST") {
      try {
        body = await request.json();
      } catch {
        body = {};
      }
    }

    const { searchParams } = new URL(request.url);

    // Merge searchParams and body
    const userLat = body.userLat ?? (searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : null);
    const userLng = body.userLng ?? (searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : null);
    const maxDistanceKm = body.maxDistanceKm ?? (searchParams.get("maxDistance") ? parseFloat(searchParams.get("maxDistance")!) : 25);
    const partySize = body.partySize ?? (searchParams.get("partySize") ? parseInt(searchParams.get("partySize")!, 10) : 1);
    const dietaryTags: string[] = body.dietaryTags ?? (searchParams.get("diet") ? searchParams.get("diet")!.split(",") : []);
    const avoidAllergens = body.avoidAllergens ?? (searchParams.get("allergens") ? searchParams.get("allergens")!.split(",") : []);
    const urgency = body.urgency ?? (searchParams.get("urgency") as any) ?? "any";
    const pricePreference = body.pricePreference ?? (searchParams.get("price") as any) ?? "all";
    const cuisineType = body.cuisineType ?? searchParams.get("cuisine") ?? undefined;
    const mode = body.mode ?? searchParams.get("mode") ?? "food"; // "food" | "ngo" | "both"

    // If userLat/userLng not provided by client, try resolving from authenticated user's profile
    let resolvedLat = userLat;
    let resolvedLng = userLng;

    if (resolvedLat == null && session?.user?.id) {
      const [indiv, rest, ngo] = await Promise.all([
        prisma.individualProfile.findUnique({
          where: { userId: session.user.id },
          select: { latitude: true, longitude: true },
        }),
        prisma.restaurantProfile.findUnique({
          where: { userId: session.user.id },
          select: { latitude: true, longitude: true },
        }),
        prisma.ngoProfile.findUnique({
          where: { userId: session.user.id },
          select: { latitude: true, longitude: true },
        }),
      ]);
      const prof = indiv ?? rest ?? ngo;
      if (prof?.latitude && prof?.longitude) {
        resolvedLat = prof.latitude;
        resolvedLng = prof.longitude;
      }
    }

    const criteria: MatchCriteria = {
      userLat: resolvedLat,
      userLng: resolvedLng,
      maxDistanceKm,
      partySize,
      dietaryTags,
      avoidAllergens,
      urgency,
      pricePreference,
      cuisineType,
      isNGO: session?.user?.role === "ngo",
    };

    let foodMatches: MatchResultItem[] = [];
    let ngoMatches: NgoMatchItem[] = [];

    // 1. Query & Rank Food Listings
    if (mode === "food" || mode === "both") {
      const foodWhere: any = {
        isActive: true,
        deletedAt: null,
        expiresAt: { gt: new Date() },
        availableQty: { gt: 0 },
      };

      if (pricePreference === "donations_only") {
        foodWhere.isDonation = true;
      } else if (pricePreference === "discount_only") {
        foodWhere.isDonation = false;
      }

      if (cuisineType && cuisineType !== "all") {
        foodWhere.cuisineType = cuisineType;
      }

      const activeFoods = await prisma.food.findMany({
        where: foodWhere,
        take: 100,
        orderBy: { createdAt: "desc" },
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

      const scored = activeFoods.map((f) => {
        return calculateFoodMatchScore(
          {
            id: f.id,
            name: f.name,
            description: f.description,
            supplierId: f.supplierId,
            supplierName: resolveSupplierName(f.supplier),
            supplierType: (f.supplier?.role || "individual") as any,
            averageRating: f.averageRating,
            reviewCount: f.reviewCount,
            images: f.images.map((img) => ({ id: img.id, url: img.url })),
            availableQty: f.availableQty,
            quantityUnit: f.quantityUnit,
            isDonation: f.isDonation,
            price: f.price,
            originalPrice: f.originalPrice,
            discountPct: f.discountPct,
            cuisineType: f.cuisineType,
            allergens: f.allergens,
            tags: f.tags,
            expiresAt: f.expiresAt,
            pickupAddress: f.pickupAddress,
            latitude: f.latitude,
            longitude: f.longitude,
          },
          criteria
        );
      });

      // Filter by max distance if distance is known
      foodMatches = scored
        .filter((item) => item.distanceKm === null || item.distanceKm <= maxDistanceKm)
        .sort((a, b) => b.matchScore - a.matchScore);
    }

    // 2. Query & Rank NGO Partners (for donors looking to connect surplus to charities)
    if (mode === "ngo" || mode === "both") {
      const ngos = await prisma.ngoProfile.findMany({
        take: 30,
        where: {
          user: {
            isActive: true,
          },
        },
        select: {
          id: true,
          userId: true,
          ngoName: true,
          ngoType: true,
          address: true,
          phone: true,
          bio: true,
          profileImage: true,
          latitude: true,
          longitude: true,
        },
      });

      ngoMatches = ngos.map((ngo) => {
        let distanceKm: number | null = null;
        let ngoScore = 80;
        const reasons: string[] = ["Verified NGO Community Partner"];

        if (resolvedLat && resolvedLng && ngo.latitude && ngo.longitude) {
          distanceKm = haversineDistanceKm(resolvedLat, resolvedLng, ngo.latitude, ngo.longitude);
          if (distanceKm <= 3) {
            ngoScore = 98;
            reasons.push(`📍 Within ${distanceKm} km of your kitchen`);
          } else if (distanceKm <= 8) {
            ngoScore = 90;
            reasons.push(`📍 Nearby NGO (${distanceKm} km)`);
          } else {
            ngoScore = 75;
          }
        }

        reasons.push("Ready for bulk surplus meal rescue & immediate distribution");

        return {
          id: ngo.userId,
          name: ngo.ngoName,
          type: ngo.ngoType,
          address: ngo.address,
          phone: ngo.phone,
          bio: ngo.bio,
          profileImage: ngo.profileImage,
          distanceKm,
          matchScore: ngoScore,
          matchReasons: reasons,
        };
      }).sort((a, b) => b.matchScore - a.matchScore);
    }

    // Calculate Summary Stats
    const urgentCount = foodMatches.filter((f) => f.hoursUntilExpiry <= 2.5).length;
    const donationCount = foodMatches.filter((f) => f.isDonation).length;
    const topMatchScore = foodMatches.length > 0 ? foodMatches[0].matchScore : (ngoMatches.length > 0 ? ngoMatches[0].matchScore : 0);

    return NextResponse.json({
      success: true,
      data: {
        matches: foodMatches,
        ngos: ngoMatches,
        meta: {
          totalFoodMatches: foodMatches.length,
          totalNgoMatches: ngoMatches.length,
          topMatchScore,
          urgentCount,
          donationCount,
          resolvedLocation: {
            latitude: resolvedLat,
            longitude: resolvedLng,
          },
          criteria,
        },
      },
    });
  } catch (error: any) {
    console.error("Error in /api/food/smart-match:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to calculate smart matches.",
      },
      { status: 500 }
    );
  }
}
