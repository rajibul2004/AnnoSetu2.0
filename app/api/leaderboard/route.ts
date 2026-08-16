import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLevel } from "@/lib/levels";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "points"; // points, meals, carbon, streak
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  try {
    let users = [];

    if (type === "streak") {
      const streaks = await prisma.userStreak.findMany({
        orderBy: { currentStreak: "desc" },
        take: limit,
        include: {
          user: {
            include: {
              individualProfile: true,
              restaurantProfile: true,
              ngoProfile: true,
              impact: true,
              achievements: true,
            },
          },
        },
      });

      users = streaks.map(streak => {
        const user = streak.user;
        const profile = user.individualProfile || user.restaurantProfile || user.ngoProfile;
        const points = user.impact?.points || 0;
        
        const name = user.individualProfile?.name || user.restaurantProfile?.restaurantName || user.ngoProfile?.ngoName || "Anonymous User";
        const image = user.individualProfile?.profileImage || user.restaurantProfile?.profileImage || user.ngoProfile?.profileImage || null;
        
        return {
          id: user.id,
          name: name,
          image: image,
          role: user.role,
          points: points,
          mealsRescued: user.impact?.mealsRescued || 0,
          mealsDonated: user.impact?.mealsDonated || 0,
          carbonSavedKg: user.impact?.carbonSavedKg || 0,
          currentStreak: streak.currentStreak,
          badgesCount: user.achievements.length,
          level: getLevel(points),
        };
      });
    } else {
      let orderBy = {};
      if (type === "points") orderBy = { points: "desc" };
      else if (type === "meals") orderBy = { mealsRescued: "desc" }; // Simplification, could be rescued+donated
      else if (type === "carbon") orderBy = { carbonSavedKg: "desc" };
      else orderBy = { points: "desc" };

      const impacts = await prisma.userImpact.findMany({
        orderBy,
        take: limit,
        include: {
          user: {
            include: {
              individualProfile: true,
              restaurantProfile: true,
              ngoProfile: true,
              streak: true,
              achievements: true,
            },
          },
        },
      });

      users = impacts.map(impact => {
        const user = impact.user;
        const profile = user.individualProfile || user.restaurantProfile || user.ngoProfile;
        const points = impact.points || 0;

        const name = user.individualProfile?.name || user.restaurantProfile?.restaurantName || user.ngoProfile?.ngoName || "Anonymous User";
        const image = user.individualProfile?.profileImage || user.restaurantProfile?.profileImage || user.ngoProfile?.profileImage || null;

        // If sorting by meals, combine rescued and donated for total
        let sortValue = points;
        if (type === "meals") sortValue = impact.mealsRescued + impact.mealsDonated;
        if (type === "carbon") sortValue = impact.carbonSavedKg;

        return {
          id: user.id,
          name: name,
          image: image,
          role: user.role,
          points: points,
          mealsRescued: impact.mealsRescued,
          mealsDonated: impact.mealsDonated,
          carbonSavedKg: impact.carbonSavedKg,
          currentStreak: user.streak?.currentStreak || 0,
          badgesCount: user.achievements.length,
          level: getLevel(points),
          sortValue, // Include sort value for custom sorting
        };
      });

      // Special case for meals: we had to order by mealsRescued initially, so we re-sort in memory by combined
      if (type === "meals") {
        users.sort((a, b) => b.sortValue - a.sortValue);
      }
    }

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
