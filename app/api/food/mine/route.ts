import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveSupplierName, SUPPLIER_NAME_SELECT } from "@/lib/supplier";
 
export async function GET() {
  const session = await auth();
 
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "Not authorized to access this route" },
      { status: 401 },
    );
  }
 
  const food = await prisma.food.findMany({
    where: { supplierId: session.user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      images: {
        orderBy: { displayOrder: "asc" },
        select: { id: true, url: true, isPrimary: true, displayOrder: true },
      },
      supplier: { select: SUPPLIER_NAME_SELECT },
      reservations: {
        where: {
          status: { in: ["pending", "confirmed", "picked_up"] },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          quantity: true,
          status: true,
          paymentStatus: true,
          pickupTime: true,
          createdAt: true,
          reserver: { select: SUPPLIER_NAME_SELECT },
        },
      },
    },
  });
 
  const data = food.map((f) => {
    let confirmedQty = 0;
    let pendingQty = 0;
    let pendingCount = 0;
    let confirmedCount = 0;

    const resList = (f.reservations || []).map((r) => {
      if (r.status === "confirmed" || r.status === "picked_up") {
        confirmedQty += r.quantity;
        confirmedCount += 1;
      } else if (r.status === "pending") {
        pendingQty += r.quantity;
        pendingCount += 1;
      }
      return {
        id: r.id,
        quantity: r.quantity,
        status: r.status,
        paymentStatus: r.paymentStatus,
        pickupTime: r.pickupTime.toISOString(),
        createdAt: r.createdAt.toISOString(),
        reserverName: resolveSupplierName(r.reserver),
      };
    });

    return {
      id: f.id,
      name: f.name,
      description: f.description,
      supplierId: f.supplierId,
      supplierName: resolveSupplierName(f.supplier),
      quantity: f.quantity,
      availableQty: f.availableQty,
      confirmedQty,
      pendingQty,
      pendingCount,
      confirmedCount,
      quantityUnit: f.quantityUnit,
      isDonation: f.isDonation,
      price: f.price,
      originalPrice: f.originalPrice,
      discountPct: f.discountPct,
      isHomeCooked: f.isHomeCooked,
      isActive: f.isActive,
      deletedAt: f.deletedAt ? f.deletedAt.toISOString() : null,
      expiresAt: f.expiresAt.toISOString(),
      images: f.images,
      averageRating: f.averageRating,
      reviewCount: f.reviewCount,
      reservations: resList,
    };
  });
 
  return NextResponse.json({ success: true, data });
}