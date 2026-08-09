import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      message,
      targetRole = "all", // all, restaurant, ngo, individual
      priority = "high", // low, medium, high, urgent
    }: {
      title: string;
      message: string;
      targetRole?: "all" | "restaurant" | "ngo" | "individual";
      priority?: "low" | "medium" | "high" | "urgent";
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: "Missing title or message" },
        { status: 400 }
      );
    }

    const whereUser: any = {
      isActive: true,
      deletedAt: null,
    };

    if (targetRole !== "all") {
      whereUser.role = targetRole;
    }

    // Fetch matching user IDs
    const users = await prisma.user.findMany({
      where: whereUser,
      select: { id: true },
    });

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        sentCount: 0,
        message: "No active users found for selected role",
      });
    }

    // Create notifications in batch
    const notificationsData = users.map((u) => ({
      userId: u.id,
      type: "system_alert" as const,
      title,
      message,
      priority: priority as any,
    }));

    await prisma.notification.createMany({
      data: notificationsData,
    });

    return NextResponse.json({
      success: true,
      sentCount: users.length,
      message: `Broadcast successfully dispatched to ${users.length} users`,
    });
  } catch (error: any) {
    console.error("Admin broadcast API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send broadcast" },
      { status: 500 }
    );
  }
}
