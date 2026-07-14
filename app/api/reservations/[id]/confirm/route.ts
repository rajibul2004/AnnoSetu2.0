import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generatePickupCode } from "@/lib/pickupCode";
import { Prisma } from "@/app/generated/prisma";
 
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
      const reservation = await prisma.reservation.update({
        where: { id },
        data: {
          status: "confirmed",
          pickupCode: generatePickupCode(),
          readyAt: new Date(),
        },
      });
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