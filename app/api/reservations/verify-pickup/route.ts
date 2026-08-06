import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyPickupCompleted } from "@/services/notificationService";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "Not authorized to access this route" },
      { status: 401 },
    );
  }

  const { pickupCode } = (await request.json()) as { pickupCode?: string };
  if (!pickupCode) {
    return NextResponse.json({ success: false, message: "Pickup code is required" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { pickupCode: pickupCode.trim().toUpperCase() },
    include: { food: { select: { name: true } } },
  });

  if (!reservation) {
    return NextResponse.json({ success: false, message: "Invalid pickup code" }, { status: 404 });
  }
  if (reservation.supplierId !== session.user.id) {
    return NextResponse.json(
      { success: false, message: "This reservation doesn't belong to your listings" },
      { status: 403 },
    );
  }
  if (reservation.status !== "confirmed") {
    return NextResponse.json(
      { success: false, message: `This reservation is ${reservation.status}, not ready for pickup` },
      { status: 400 },
    );
  }

  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: { status: "picked_up", actualPickupTime: new Date() },
  });

  // Notify the user who reserved the food that pickup is verified
  void notifyPickupCompleted(
    reservation.reserverId,
    reservation.food.name,
    reservation.quantity,
    reservation.id,
  );

  return NextResponse.json({
    success: true,
    data: {
      id: updated.id,
      foodName: reservation.food.name,
      quantity: reservation.quantity,
    },
  });
}