import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all"; // all, active, expired, donations, paid
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const now = new Date();
    const where: any = {
      deletedAt: null,
    };

    if (status === "active") {
      where.isActive = true;
      where.expiresAt = { gt: now };
    } else if (status === "expired") {
      where.OR = [{ expiresAt: { lte: now } }, { isActive: false }];
    } else if (status === "donations") {
      where.isDonation = true;
    } else if (status === "paid") {
      where.isDonation = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { pickupAddress: { contains: search, mode: "insensitive" } },
        { supplier: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, listings] = await Promise.all([
      prisma.food.count({ where }),
      prisma.food.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
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
          _count: {
            select: {
              reservations: true,
              reports: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        listings,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error("Admin listings GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch listings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      foodId,
      action,
      isActive,
    }: {
      foodId: string;
      action?: "force_expire" | "toggle_active" | "restore";
      isActive?: boolean;
    } = body;

    if (!foodId) {
      return NextResponse.json(
        { success: false, error: "Missing foodId" },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (action === "force_expire") {
      updateData.expiresAt = new Date();
      updateData.isActive = false;
    } else if (action === "restore") {
      updateData.expiresAt = new Date(Date.now() + 4 * 3600 * 1000);
      updateData.isActive = true;
    } else if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const updated = await prisma.food.update({
      where: { id: foodId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Food listing updated successfully",
    });
  } catch (error: any) {
    console.error("Admin listings PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update listing" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const foodId = searchParams.get("foodId");

    if (!foodId) {
      return NextResponse.json(
        { success: false, error: "Missing foodId" },
        { status: 400 }
      );
    }

    await prisma.food.update({
      where: { id: foodId },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Food listing delisted successfully",
    });
  } catch (error: any) {
    console.error("Admin listings DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete listing" },
      { status: 500 }
    );
  }
}
