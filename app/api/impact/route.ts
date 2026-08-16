import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLevel } from "@/lib/levels";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const impact = await prisma.userImpact.findUnique({
      where: { userId: session.user.id },
    });

    const achievements = await prisma.userAchievement.findMany({
      where: { userId: session.user.id },
      orderBy: { unlockedAt: "desc" },
    });

    const streak = await prisma.userStreak.findUnique({
      where: { userId: session.user.id },
    });

    // Calculate dynamic Community Rank based on total points
    let communityRank = 0;
    let points = 0;
    if (impact) {
      points = impact.points;
      const higherScorersCount = await prisma.userImpact.count({
        where: { points: { gt: impact.points } },
      });
      communityRank = higherScorersCount + 1;
    }

    const level = getLevel(points);

    return NextResponse.json({
      success: true,
      data: {
        impact: impact || {
          points: 0,
          mealsRescued: 0,
          mealsDonated: 0,
          carbonSavedKg: 0,
        },
        achievements,
        communityRank,
        streak: streak || {
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: null,
        },
        level,
      },
    });
  } catch (error) {
    console.error("Error fetching impact data:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
