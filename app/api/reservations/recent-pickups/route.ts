import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
 
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "Not authorized to access this route" },
      { status: 401 },
    );
  }
 
  const pickups = await prisma.reservation.findMany({
    where: { supplierId: session.user.id, status: "picked_up" },
    orderBy: { actualPickupTime: "desc" },
    take: 5,
    select: {
      id: true,
      pickupCode: true,
      actualPickupTime: true,
      food: { select: { name: true } },
    },
  });
 
  return NextResponse.json({
    success: true,
    data: pickups.map((p) => ({
      id: p.id,
      pickupCode: p.pickupCode,
      foodName: p.food.name,
      pickedUpAt: p.actualPickupTime,
    })),
  });
}
 