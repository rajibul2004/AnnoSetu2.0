import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
 
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
 
  const existing = await prisma.reservation.findUnique({ where: { id } });
 
  // NOTE: field is `reserverId` in this schema, not `userId`.
  if (!existing || existing.reserverId !== session.user.id) {
    return NextResponse.json(
      { success: false, message: "Reservation not found" },
      { status: 404 },
    );
  }
 
  if (existing.status !== "pending" && existing.status !== "confirmed") {
    return NextResponse.json(
      {
        success: false,
        message: `A reservation that is already ${existing.status} can't be cancelled`,
      },
      { status: 400 },
    );
  }
 
  const [reservation] = await prisma.$transaction([
    prisma.reservation.update({
      where: { id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancellationReason: "user_cancelled",
      },
    }),
    // Food has no isReserved/reservedById fields in this schema —
    // availability is tracked purely via availableQty vs. quantity.
    prisma.food.update({
      where: { id: existing.foodId },
      data: { availableQty: { increment: existing.quantity } },
    }),
  ]);
 
  return NextResponse.json({ success: true, data: reservation });
}