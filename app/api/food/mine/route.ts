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
      // averageRating/reviewCount are already cached directly on Food —
      // no need to pull the nested reviews relation just to count them.
    },
  });
 
  const data = food.map((f) => ({
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
 
  return NextResponse.json({ success: true, data });
}