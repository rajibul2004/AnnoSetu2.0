import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const role = searchParams.get("role") || "all";
    const status = searchParams.get("status") || "all"; // active, inactive, unverified, pending
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (role !== "all") {
      where.role = role;
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { individualProfile: { name: { contains: search, mode: "insensitive" } } },
        { restaurantProfile: { restaurantName: { contains: search, mode: "insensitive" } } },
        { ngoProfile: { ngoName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          individualProfile: true,
          restaurantProfile: true,
          ngoProfile: true,
          _count: {
            select: {
              foods: true,
              reservationsPlaced: true,
              reservationsServed: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error("Admin users GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      isActive,
      role,
      verificationUpdates,
    }: {
      userId: string;
      isActive?: boolean;
      role?: "individual" | "restaurant" | "ngo" | "admin";
      verificationUpdates?: {
        fssaiStatus?: "verified" | "rejected" | "unverified" | "pending";
        govtIdStatus?: "verified" | "rejected" | "unverified" | "pending";
        darpanStatus?: "verified" | "rejected" | "unverified" | "pending";
        taxExemptStatus?: "verified" | "rejected" | "unverified" | "pending";
        verificationBadge?: string;
      };
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        individualProfile: true,
        restaurantProfile: true,
        ngoProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // 1. Update basic user fields
    const userUpdateData: any = {};
    if (isActive !== undefined) userUpdateData.isActive = isActive;
    if (role) userUpdateData.role = role;

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userUpdateData,
      });
    }

    // 2. Update profile verification statuses if specified
    if (verificationUpdates) {
      if (user.restaurantProfile && verificationUpdates.fssaiStatus) {
        await prisma.restaurantProfile.update({
          where: { userId },
          data: { fssaiStatus: verificationUpdates.fssaiStatus },
        });
      }

      if (user.individualProfile && verificationUpdates.govtIdStatus) {
        await prisma.individualProfile.update({
          where: { userId },
          data: { govtIdStatus: verificationUpdates.govtIdStatus },
        });
      }

      if (user.ngoProfile) {
        const ngoData: any = {};
        if (verificationUpdates.darpanStatus)
          ngoData.registrationStatus = verificationUpdates.darpanStatus;
        if (verificationUpdates.taxExemptStatus)
          ngoData.taxExemptionStatus = verificationUpdates.taxExemptStatus;

        if (Object.keys(ngoData).length > 0) {
          await prisma.ngoProfile.update({
            where: { userId },
            data: ngoData,
          });
        }
      }

      // Add verification badge to user if approved
      if (verificationUpdates.verificationBadge) {
        const currentBadges = user.verificationBadges || [];
        if (!currentBadges.includes(verificationUpdates.verificationBadge)) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              verificationBadges: [...currentBadges, verificationUpdates.verificationBadge],
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error: any) {
    console.error("Admin users PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "User soft deleted successfully",
    });
  } catch (error: any) {
    console.error("Admin users DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
