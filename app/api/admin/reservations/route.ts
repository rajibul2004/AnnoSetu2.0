import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { pickupCode: { contains: search, mode: "insensitive" } },
        { food: { name: { contains: search, mode: "insensitive" } } },
        { reserver: { email: { contains: search, mode: "insensitive" } } },
        { supplier: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, reservations] = await Promise.all([
      prisma.reservation.count({ where }),
      prisma.reservation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          food: {
            select: {
              id: true,
              name: true,
              pickupAddress: true,
              isDonation: true,
              price: true,
              expiresAt: true,
            },
          },
          reserver: {
            select: {
              id: true,
              email: true,
              role: true,
              individualProfile: { select: { name: true, phone: true } },
              restaurantProfile: { select: { restaurantName: true, phone: true } },
              ngoProfile: { select: { ngoName: true, phone: true } },
            },
          },
          supplier: {
            select: {
              id: true,
              email: true,
              role: true,
              individualProfile: { select: { name: true, phone: true } },
              restaurantProfile: { select: { restaurantName: true, phone: true } },
              ngoProfile: { select: { ngoName: true, phone: true } },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        reservations,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error("Admin reservations GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      reservationId,
      status,
      cancellationReason,
    }: {
      reservationId: string;
      status: "pending" | "confirmed" | "picked_up" | "cancelled" | "expired";
      cancellationReason?: string;
    } = body;

    if (!reservationId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing reservationId or status" },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
    };

    if (status === "picked_up") {
      updateData.actualPickupTime = new Date();
    } else if (status === "cancelled") {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = "other";
      updateData.cancellationNote = cancellationReason || "Admin Override";
    }

    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Reservation status changed to ${status}`,
    });
  } catch (error: any) {
    console.error("Admin reservations PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update reservation" },
      { status: 500 }
    );
  }
}
