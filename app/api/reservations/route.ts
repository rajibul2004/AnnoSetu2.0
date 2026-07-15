import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveSupplierName, SUPPLIER_NAME_SELECT } from "@/lib/supplier";
import { notifyReservationRequest } from "@/services/notificationService";
 
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
 
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "Not authorized to access this route" },
      { status: 401 },
    );
  }
 
  const body = await request.json();
  const { foodId, quantity, pickupTime, acceptedTerms } = body as {
    foodId?: string;
    quantity?: number;
    pickupTime?: string;
    acceptedTerms?: boolean;
  };
 
  if (!foodId || !quantity || quantity < 1 || !pickupTime) {
    return NextResponse.json(
      { success: false, message: "Missing or invalid reservation details" },
      { status: 400 },
    );
  }
  if (!acceptedTerms) {
    return NextResponse.json(
      { success: false, message: "You must accept the pickup terms" },
      { status: 400 },
    );
  }
 
  const food = await prisma.food.findUnique({ where: { id: foodId } });
 
  if (!food || !food.isActive || food.deletedAt || new Date(food.expiresAt) <= new Date()) {
    return NextResponse.json({ success: false, message: "Food not found" }, { status: 404 });
  }
  if (food.supplierId === session.user.id) {
    return NextResponse.json(
      { success: false, message: "You can't reserve your own listing" },
      { status: 400 },
    );
  }
  if (quantity > food.availableQty) {
    return NextResponse.json(
      { success: false, message: `Only ${food.availableQty} ${food.quantityUnit} available` },
      { status: 400 },
    );
  }
  if (!food.pickupAddress) {
    return NextResponse.json(
      { success: false, message: "This listing has no pickup address set" },
      { status: 400 },
    );
  }
 
  const totalPrice = food.isDonation ? 0 : food.price * quantity;
 
  const [reservation] = await prisma.$transaction([
    prisma.reservation.create({
      data: {
        foodId: food.id,
        reserverId: session.user.id,
        supplierId: food.supplierId,
        quantity,
        pricePerUnit: food.price,
        totalPrice,
        discountApplied: food.discountPct,
        status: "pending",
        pickupTime: new Date(pickupTime),
        // Defaults to the food's own pickup address — the original UI
        // displayed this as a fixed, non-editable "Pickup Location" but
        // never actually sent it in the create payload at all, even
        // though it's a required field on Reservation.
        pickupAddress: food.pickupAddress,
        acceptedTerms: true,
      },
    }),
    prisma.food.update({
      where: { id: food.id },
      data: {
        availableQty: { decrement: quantity },
        reservationCount: { increment: 1 },
      },
    }),
  ]);
 
  // Fire-and-forget notification to the supplier (non-blocking)
  void notifyReservationRequest(
    food.supplierId,
    session.user.name ?? session.user.email ?? "Someone",
    food.name,
    reservation.id,
  );

  return NextResponse.json({ success: true, data: reservation }, { status: 201 });
}
 