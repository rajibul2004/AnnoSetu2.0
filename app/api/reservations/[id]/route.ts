import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveSupplierName, resolveSupplierPhone, resolveSupplierAddress, SUPPLIER_NAME_SELECT } from "@/lib/supplier";
 
export async function GET(
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
 
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      food: {
        select: {
          id: true,
          name: true,
          description: true,
          quantityUnit: true,
          expiresAt: true,
          images: { orderBy: { displayOrder: "asc" } },
        },
      },
      reserver: {
        select: { email: true, ...SUPPLIER_NAME_SELECT },
      },
      supplier: {
        select: { email: true, ...SUPPLIER_NAME_SELECT },
      },
    },
  });
 
  if (!reservation) {
    return NextResponse.json({ success: false, message: "Reservation not found" }, { status: 404 });
  }
 
  const isReserver = reservation.reserverId === session.user.id;
  const isSupplier = reservation.supplierId === session.user.id;
  if (!isReserver && !isSupplier) {
    return NextResponse.json(
      { success: false, message: "You don't have access to this reservation" },
      { status: 403 },
    );
  }
 
  // A real count instead of the original's hardcoded "15 orders" /
  // "4.8 rating" fallback — there's no rating concept for reservers in
  // this schema at all, so that stat is dropped rather than fabricated.
  const totalOrders = await prisma.reservation.count({
    where: { reserverId: reservation.reserverId, status: { in: ["confirmed", "picked_up"] } },
  });
 
  return NextResponse.json({
    success: true,
    data: {
      id: reservation.id,
      status: reservation.status,
      quantity: reservation.quantity,
      totalPrice: reservation.totalPrice,
      pickupTime: reservation.pickupTime,
      pickupCode: reservation.pickupCode,
      createdAt: reservation.createdAt,
      supplierId: reservation.supplierId,
      reserverId: reservation.reserverId,
      pickupAddress: reservation.pickupAddress,
      food: reservation.food,
      reserver: {
        name: resolveSupplierName(reservation.reserver),
        phone: resolveSupplierPhone(reservation.reserver),
        email: reservation.reserver.email,
        address: resolveSupplierAddress(reservation.reserver),
      },
      supplierName: resolveSupplierName(reservation.supplier),
      supplierPhone: resolveSupplierPhone(reservation.supplier),
      supplierEmail: reservation.supplier.email,
      totalOrders,
      isSupplierView: isSupplier,
    },
  });
}