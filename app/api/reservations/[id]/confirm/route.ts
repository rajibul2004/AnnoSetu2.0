import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generatePickupCode } from "@/lib/pickupCode";
import { Prisma } from "@/app/generated/prisma";
import { notifyReservationConfirmed } from "@/services/notificationService";

export async function PUT(
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

  // Fetch reservation + food info in one query
  const existing = await prisma.reservation.findUnique({
    where: { id },
    include: { food: { select: { name: true, availableQty: true } } },
  });

  if (!existing) {
    return NextResponse.json({ success: false, message: "Reservation not found" }, { status: 404 });
  }
  if (existing.supplierId !== session.user.id) {
    return NextResponse.json(
      { success: false, message: "Only the supplier can confirm this reservation" },
      { status: 403 },
    );
  }
  if (existing.status !== "pending") {
    return NextResponse.json(
      { success: false, message: `This reservation is already ${existing.status}` },
      { status: 400 },
    );
  }
  if (existing.food.availableQty < existing.quantity) {
    return NextResponse.json(
      { success: false, message: `Only ${existing.food.availableQty} portions remaining. Cannot confirm ${existing.quantity}.` },
      { status: 400 },
    );
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const pickupCode = generatePickupCode();
      const [reservation] = await prisma.$transaction([
        prisma.reservation.update({
          where: { id },
          data: {
            status: "confirmed",
            pickupCode,
            readyAt: new Date(),
          },
        }),
        prisma.food.update({
          where: { id: existing.foodId },
          data: { availableQty: { decrement: existing.quantity } },
        }),
      ]);

      // Notify the reserver about their confirmed pickup code (non-blocking)
      void notifyReservationConfirmed(
        existing.reserverId,
        existing.food.name,
        reservation.id,
        pickupCode,
      );

      return NextResponse.json({ success: true, data: reservation });
    } catch (error) {
      const isUniqueClash =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!isUniqueClash || attempt === 4) throw error;
    }
  }

  return NextResponse.json(
    { success: false, message: "Failed to generate a unique pickup code, please try again" },
    { status: 500 },
  );
}