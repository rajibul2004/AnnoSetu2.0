import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadFoodImage } from "@/lib/cloudinary";
import { resolveSupplierName } from "@/lib/supplier";
import type { Prisma } from "@/app/generated/prisma";

const PAGE_SIZE_DEFAULT = 9;
const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

const MAX_CANDIDATES_FOR_DISTANCE_FILTER = 300;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const supplierType = searchParams.get("supplierType") || "all";
    const isDonationFilter = searchParams.get("isDonation") || "all";
    const cuisineType = searchParams.get("cuisineType") || "all";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const maxDistance = searchParams.get("maxDistance");
    const sortBy = searchParams.get("sortBy") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || String(PAGE_SIZE_DEFAULT), 10));

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
      where.supplier = { role: supplierType as any };
    }

    if (isDonationFilter !== "all") {
      where.isDonation = isDonationFilter === "true";
    }

    if (cuisineType !== "all") {
      where.cuisineType = cuisineType as any;
    }

    if (minPrice || maxPrice) {
      where.price = {
        ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
        ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
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

    // Resolve the requesting user's location once, for distance filtering.
    let originLat: number | null = null;
    let originLng: number | null = null;
    if (session?.user) {
      const [individual, restaurant, ngo] = await Promise.all([
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
      const profile = individual ?? restaurant ?? ngo;
      originLat = profile?.latitude ?? null;
      originLng = profile?.longitude ?? null;
    }

    const applyDistanceFilter = Boolean(maxDistance && originLat !== null && originLng !== null);

    const candidates = await prisma.food.findMany({
      where,
      orderBy,
      take: applyDistanceFilter ? MAX_CANDIDATES_FOR_DISTANCE_FILTER : limit,
      skip: applyDistanceFilter ? undefined : (page - 1) * limit,
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

    let mapped = candidates.map((food) => {
      const distance =
        originLat !== null && originLng !== null && food.latitude !== null && food.longitude !== null
          ? haversineKm(originLat, originLng, food.latitude, food.longitude)
          : null;

      const supplierData = food.supplier;

      return {
        id: food.id,
        name: food.name,
        description: food.description,
        supplierId: food.supplierId,
        supplierName: resolveSupplierName(supplierData),
        supplierType: supplierData?.role,
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
    });

    let total: number;
    let totalPages: number;
    let pageData: typeof mapped;

    if (applyDistanceFilter) {
      const maxKm = parseFloat(maxDistance as string);
      mapped = mapped.filter((f) => f.distance === null || f.distance <= maxKm);
      total = mapped.length;
      totalPages = Math.max(1, Math.ceil(total / limit));
      pageData = mapped.slice((page - 1) * limit, page * limit);
    } else {
      total = await prisma.food.count({ where });
      totalPages = Math.max(1, Math.ceil(total / limit));
      pageData = mapped;
    }

    return NextResponse.json({
      success: true,
      data: pageData,
      total,
      totalPages,
      count: pageData.length,
    });
  } catch (error) {
    console.error("Error in GET /api/foods:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Not authorized to access this route" },
        { status: 401 },
      );
    }

    const formData = await request.formData();

    const name = String(formData.get("name") ?? "").trim();
    const description = formData.get("description")
      ? String(formData.get("description"))
      : null;
    const quantity = parseInt(String(formData.get("quantity") ?? ""), 10);
    const quantityUnit = String(formData.get("quantityUnit") ?? "servings");
    const isDonation = formData.get("isDonation") === "true";
    const price = isDonation ? 0 : parseFloat(String(formData.get("price") ?? "0"));
    const originalPriceRaw = formData.get("originalPrice");
    const originalPrice = originalPriceRaw ? parseFloat(String(originalPriceRaw)) : null;
    const discountPctRaw = formData.get("discountPct");
    const discountPct = discountPctRaw ? parseInt(String(discountPctRaw), 10) : 0;
    const isRaw = formData.get("isRaw") === "true";
    const expiresAtRaw = String(formData.get("expiresAt") ?? "");
    const cuisineTypeRaw = formData.get("cuisineType");
    const cuisineType = cuisineTypeRaw ? String(cuisineTypeRaw) : undefined;
    const safetyGuidelinesRaw = formData.get("safetyGuidelines");
    const safetyGuidelines = safetyGuidelinesRaw
      ? String(safetyGuidelinesRaw).trim()
      : undefined;

    let allergens: string[] = [];
    const allergensRaw = formData.get("allergens");
    if (allergensRaw) {
      try {
        const parsed = JSON.parse(String(allergensRaw));
        if (Array.isArray(parsed)) allergens = parsed;
      } catch {
        // ignore malformed input rather than failing the whole request
      }
    }

    // --- Validation ---
    const errors: Record<string, string> = {};
    if (!name) errors.name = "Food name is required";
    if (name.length > 100) errors.name = "Food name must be 100 characters or fewer";
    if (description && description.length > 500) {
      errors.description = "Description must be 500 characters or fewer";
    }
    if (!quantity || quantity <= 0) errors.quantity = "Valid quantity is required";
    if (!isDonation && (isNaN(price) || price <= 0)) errors.price = "Valid price is required";
    if (isRaw) errors.isRaw = "Only cooked, ready-to-eat food can be listed";
    if (!expiresAtRaw) {
      errors.expiresAt = "Expiry time is required";
    } else if (new Date(expiresAtRaw).getTime() <= Date.now() + 15 * 60 * 1000) {
      errors.expiresAt = "Expiry time must be at least 15 minutes in the future";
    }
    const validUnits = ["servings", "plates", "kg", "units", "packets"];
    if (!validUnits.includes(quantityUnit)) errors.quantityUnit = "Invalid quantity unit";
    const validAllergens = ["nuts", "dairy", "gluten", "seafood", "eggs", "soy", "sesame", "shellfish", "mustard", "sulphites", "other"];
    if (allergens.some((a) => !validAllergens.includes(a))) {
      errors.allergens = "Invalid allergens provided";
    }
    if (discountPct < 0 || discountPct > 100) errors.discountPct = "Discount must be between 0 and 100";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, message: "Validation failed", errors }, { status: 400 });
    }

    // --- Resolve pickup location ---
    const pickedAddress = formData.get("pickupAddress");
    const pickedLat = formData.get("latitude");
    const pickedLng = formData.get("longitude");

    let pickupAddress: string | null = pickedAddress ? String(pickedAddress) : null;
    let latitude: number | null = pickedLat ? parseFloat(String(pickedLat)) : null;
    let longitude: number | null = pickedLng ? parseFloat(String(pickedLng)) : null;

    if (!pickupAddress) {
      const [individual, restaurant, ngo] = await Promise.all([
        prisma.individualProfile.findUnique({
          where: { userId: session.user.id },
          select: { address: true, latitude: true, longitude: true },
        }),
        prisma.restaurantProfile.findUnique({
          where: { userId: session.user.id },
          select: { address: true, latitude: true, longitude: true },
        }),
        prisma.ngoProfile.findUnique({
          where: { userId: session.user.id },
          select: { address: true, latitude: true, longitude: true },
        }),
      ]);
      const profile = individual ?? restaurant ?? ngo;
      pickupAddress = profile?.address ?? null;
      latitude = latitude ?? profile?.latitude ?? null;
      longitude = longitude ?? profile?.longitude ?? null;
    }

    if (!pickupAddress) {
      return NextResponse.json(
        {
          success: false,
          message: "A pickup address is required — pick a location or add one to your profile",
        },
        { status: 400 },
      );
    }

    // --- Image uploads ---
    const imageFiles = formData
      .getAll("images")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (imageFiles.length > MAX_IMAGES) {
      return NextResponse.json(
        { success: false, message: `Maximum ${MAX_IMAGES} images allowed` },
        { status: 400 },
      );
    }
    
    for (const file of imageFiles) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { success: false, message: "Uploaded files must be valid images" },
          { status: 400 },
        );
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { success: false, message: "Each image must be 5MB or smaller" },
          { status: 400 },
        );
      }
    }

    let uploadedUrls: string[] = [];
    try {
      uploadedUrls = await Promise.all(imageFiles.map((file) => uploadFoodImage(file)));
    } catch (error) {
      console.error("Error uploading images:", error);
      return NextResponse.json(
        {
          success: false,
          message: error instanceof Error ? error.message : "Failed to process images",
        },
        { status: 500 },
      );
    }

    const food = await prisma.food.create({
      data: {
        supplierId: session.user.id,
        name,
        description: description || null,
        quantity,
        availableQty: quantity,
        quantityUnit: quantityUnit as any,
        isDonation,
        price,
        originalPrice,
        discountPct,
        isRaw,
        isHomeCooked: session.user.role === "individual",
        cuisineType: (cuisineType as any) || undefined,
        allergens: allergens as any,
        safetyGuidelines:
          safetyGuidelines ||
          "Consume within 2 hours of pickup. Store in refrigerator if not consuming immediately.",
        expiresAt: new Date(expiresAtRaw),
        pickupAddress,
        latitude,
        longitude,
        images: {
          create: uploadedUrls.map((url, index) => ({
            url,
            isPrimary: index === 0,
            displayOrder: index,
          })),
        },
      },
      include: { images: true },
    });

    return NextResponse.json({ success: true, data: food }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/food:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}