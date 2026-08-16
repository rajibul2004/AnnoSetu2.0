import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Fetch recent food listings
    const recentFoods = await prisma.food.findMany({
      where: { 
        isActive: true,
        createdAt: { gte: yesterday }
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        supplier: {
          include: {
            individualProfile: true,
            restaurantProfile: true,
            ngoProfile: true,
          },
        },
      },
    });

    // 2. Fetch recent successful reservations
    const recentReservations = await prisma.reservation.findMany({
      where: { 
        status: { in: ["confirmed", "picked_up"] },
        createdAt: { gte: yesterday }
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        reserver: {
          include: {
            individualProfile: true,
            restaurantProfile: true,
            ngoProfile: true,
          },
        },
        food: true,
      },
    });

    // 3. Fetch recent achievements (badges)
    const recentBadges = await prisma.userAchievement.findMany({
      where: {
        unlockedAt: { gte: yesterday }
      },
      orderBy: { unlockedAt: "desc" },
      take: 5,
      include: {
        user: {
          include: {
            individualProfile: true,
            restaurantProfile: true,
            ngoProfile: true,
          },
        },
      },
    });

    // 4. Fetch recent follows
    const recentFollows = await prisma.follow.findMany({
      where: {
        createdAt: { gte: yesterday }
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        follower: {
          include: { individualProfile: true, restaurantProfile: true, ngoProfile: true },
        },
        following: {
          include: { individualProfile: true, restaurantProfile: true, ngoProfile: true },
        },
      },
    });

    // 5. Normalize into a unified feed
    const feed = [
      ...recentFoods.map((food) => {
        const supplierName =
          food.supplier?.individualProfile?.name?.split(" ")[0] ||
          food.supplier?.restaurantProfile?.restaurantName ||
          food.supplier?.ngoProfile?.ngoName ||
          "A community member";

        return {
          id: `food_${food.id}`,
          type: "food_shared" as const,
          userName: supplierName,
          action: "shared",
          foodName: food.name,
          timestamp: food.createdAt.toISOString(),
          quantity: food.quantity,
          points: food.quantity * 10,
          userId: food.supplierId,
        };
      }),
      ...recentReservations.map((res) => {
        const reserverName =
          res.reserver?.individualProfile?.name?.split(" ")[0] ||
          res.reserver?.restaurantProfile?.restaurantName ||
          res.reserver?.ngoProfile?.ngoName ||
          "A food hero";

        return {
          id: `res_${res.id}`,
          type: "food_reserved" as const,
          userName: reserverName,
          action: "rescued",
          foodName: res.food?.name || "food",
          timestamp: res.createdAt.toISOString(),
          quantity: res.quantity,
          points: res.quantity * 10,
          userId: res.reserverId,
        };
      }),
      ...recentBadges.map((ach) => {
        const userName =
          ach.user?.individualProfile?.name?.split(" ")[0] ||
          ach.user?.restaurantProfile?.restaurantName ||
          ach.user?.ngoProfile?.ngoName ||
          "A community member";

        return {
          id: `ach_${ach.id}`,
          type: "badge_unlocked" as const,
          userName: userName,
          action: "unlocked a new badge:",
          foodName: ach.badgeId.replace(/_/g, " "),
          timestamp: ach.unlockedAt.toISOString(),
          quantity: 1,
          points: 0,
          userId: ach.userId,
        };
      }),
      ...recentFollows.map((fol) => {
        const followerName =
          fol.follower?.individualProfile?.name?.split(" ")[0] ||
          fol.follower?.restaurantProfile?.restaurantName ||
          fol.follower?.ngoProfile?.ngoName ||
          "A community member";
          
        const followingName =
          fol.following?.individualProfile?.name?.split(" ")[0] ||
          fol.following?.restaurantProfile?.restaurantName ||
          fol.following?.ngoProfile?.ngoName ||
          "someone";

        return {
          id: `fol_${fol.id}`,
          type: "social_follow" as const,
          userName: followerName,
          action: "started following",
          foodName: followingName,
          timestamp: fol.createdAt.toISOString(),
          quantity: 1,
          points: 0,
          userId: fol.followerId,
        };
      }),
    ];

    // 4. Sort by timestamp descending and take top 15
    feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const topFeed = feed.slice(0, 15);

    return NextResponse.json({ success: true, data: topFeed });
  } catch (error) {
    console.error("Community Log Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch community log" },
      { status: 500 }
    );
  }
}
