import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveSupplierName, resolveSupplierPhone, SUPPLIER_NAME_SELECT } from "@/lib/supplier";
 
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
 
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id } = await params;
 
  const food = await prisma.food.findUnique({
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
 
  if (!food || !food.isActive || food.deletedAt) {
    return NextResponse.json({ success: false, message: "Food not found" }, { status: 404 });
  }
 
  prisma.food.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
 
  let distance: number | null = null;
  if (session?.user && food.latitude !== null && food.longitude !== null) {
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
    if (profile?.latitude != null && profile?.longitude != null) {
      distance = haversineKm(profile.latitude, profile.longitude, food.latitude, food.longitude);
    }
  }

  const isAuthed = Boolean(session?.user);
 
  return NextResponse.json({
    success: true,
    data: {
      id: food.id,
      name: food.name,
      description: food.description,
      supplierId: food.supplierId,
      supplierName: resolveSupplierName(food.supplier),
      supplierType: food.supplier.role,
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
      safetyGuidelines: food.safetyGuidelines,
      viewCount: food.viewCount + 1,
      supplierPhone: isAuthed ? resolveSupplierPhone(food.supplier) : null,
      supplierEmail: isAuthed ? food.supplier.email : null,
      reviews: food.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        reviewerName: resolveSupplierName(r.reviewer),
      })),
    },
  });
}
 
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "Not authorized to access this route" },
      { status: 401 },
    );
  }
 
  const { id } = await params;
 
  const existing = await prisma.food.findUnique({ where: { id } });
 
  if (!existing || existing.supplierId !== session.user.id) {
    return NextResponse.json(
      { success: false, message: "Food item not found" },
      { status: 404 },
    );
  }
 
  await prisma.food.update({
    where: { id },
    data: { isActive: false, deletedAt: new Date() },
  });
 
  return NextResponse.json({ success: true });
}
 