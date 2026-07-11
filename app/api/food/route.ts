import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadFoodImage } from "@/lib/cloudinary";
 
const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB, matches the original UI's copy
 
export async function POST(request: NextRequest) {
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
  const safetyGuidelines = formData.get("safetyGuidelines")
    ? String(formData.get("safetyGuidelines"))
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
  if (!isDonation && (isNaN(price) || price < 0)) errors.price = "Valid price is required";
  if (isRaw) errors.isRaw = "Only cooked, ready-to-eat food can be listed";
  if (!expiresAtRaw) {
    errors.expiresAt = "Expiry time is required";
  } else if (new Date(expiresAtRaw).getTime() <= Date.now()) {
    errors.expiresAt = "Expiry time must be in the future";
  }
 
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ success: false, message: "Validation failed", errors }, { status: 400 });
  }
 
  // --- Resolve pickup location ---
  // The original component always overwrote whatever the user picked in
  // the location step with the profile's saved address/location,
  // regardless of what "Use Current Location"/"Map" selection they made.
  // Here, an explicitly-picked location takes priority, falling back to
  // the user's profile address only if they didn't pick one.
  const pickedAddress = formData.get("pickupAddress");
  const pickedLat = formData.get("latitude");
  const pickedLng = formData.get("longitude");
 
  let pickupAddress: string | null = pickedAddress ? String(pickedAddress) : null;
  let latitude: number | null = pickedLat ? parseFloat(String(pickedLat)) : null;
  let longitude: number | null = pickedLng ? parseFloat(String(pickedLng)) : null;
 
  if (!pickupAddress) {
    const [individual, restaurant, ngo] = await Promise.all([
      prisma.individualProfile.findUnique({ where: { userId: session.user.id } }),
      prisma.restaurantProfile.findUnique({ where: { userId: session.user.id } }),
      prisma.ngoProfile.findUnique({ where: { userId: session.user.id } }),
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
  if (imageFiles.some((file) => file.size > MAX_IMAGE_BYTES)) {
    return NextResponse.json(
      { success: false, message: "Each image must be 5MB or smaller" },
      { status: 400 },
    );
  }
 
  const uploadedUrls = await Promise.all(imageFiles.map((file) => uploadFoodImage(file)));
 
  const food = await prisma.food.create({
    data: {
      supplierId: session.user.id,
      name,
      description,
      quantity,
      availableQty: quantity, // starts fully available
      quantityUnit: quantityUnit as never,
      isDonation,
      price,
      originalPrice,
      discountPct,
      isRaw,
      isHomeCooked: session.user.role === "individual",
      allergens: allergens as never,
      safetyGuidelines,
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
}