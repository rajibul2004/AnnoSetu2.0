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
 
  // NOTE: field is `reserverId` in this schema, not `userId`.
  const reservations = await prisma.reservation.findMany({
    where: { reserverId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      food: {
        select: {
          id: true,
          name: true,
          quantityUnit: true,
          originalPrice: true,
          supplierId: true,
          supplier: { select: SUPPLIER_NAME_SELECT },
        },
      },
    },
  });
 
  const data = reservations.map((r) => ({
    id: r.id,
    quantity: r.quantity,
    totalPrice: r.totalPrice,
    status: r.status,
    pickupTime: r.pickupTime,
    pickupAddress: r.pickupAddress,
    pickupCode: r.pickupCode,
    food: {
      id: r.food.id,
      name: r.food.name,
      quantityUnit: r.food.quantityUnit,
      originalPrice: r.food.originalPrice,
      supplierId: r.food.supplierId,
      supplierName: resolveSupplierName(r.food.supplier),
    },
  }));
 
  return NextResponse.json({ success: true, data });
}