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

  // Fetch reservation + food name in one query so we have everything needed
  // for the notification without an extra round-trip.
  const existing = await prisma.reservation.findUnique({
    where: { id },
    include: { food: { select: { name: true } } },
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

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const pickupCode = generatePickupCode();
      const reservation = await prisma.reservation.update({
        where: { id },
        data: {
          status: "confirmed",
          pickupCode,
          readyAt: new Date(),
        },
      });

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