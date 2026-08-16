import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getLevel } from "@/lib/levels";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        individualProfile: {
          select: { name: true, bio: true, profileImage: true }
        },
        restaurantProfile: {
          select: { restaurantName: true, bio: true, address: true, profileImage: true }
        },
        ngoProfile: {
          select: { ngoName: true, bio: true, profileImage: true }
        },
        impact: true,
        achievements: true,
        streak: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const followerCount = await prisma.follow.count({
      where: { followingId: id },
    });

    const followingCount = await prisma.follow.count({
      where: { followerId: id },
    });

    const recentActivity = await prisma.reservation.findMany({
      where: {
        OR: [
          { reserverId: id },
          { supplierId: id },
        ],
        status: "picked_up",
      },
      take: 10,
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        food: {
          select: {
            name: true,
          }
        }
      }
    });

    let isFollowing = false;
    if (session?.user?.id) {
      const followRecord = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: id,
          },
        },
      });
      isFollowing = !!followRecord;
    }

    const points = user.impact?.points || 0;
    const levelInfo = getLevel(points);

    const image = user.individualProfile?.profileImage || user.restaurantProfile?.profileImage || user.ngoProfile?.profileImage || null;
    const profileData = user.individualProfile || user.restaurantProfile || user.ngoProfile;
    const name = user.individualProfile?.name || user.restaurantProfile?.restaurantName || user.ngoProfile?.ngoName || "Anonymous User";

    const publicProfile = {
      id: user.id,
      name: name,
      email: user.email,
      avatarUrl: image || undefined,
      bio: profileData?.bio || undefined,
      role: user.role,
      points: points,
      mealsRescued: user.impact?.mealsRescued || 0,
      mealsShared: user.impact?.mealsDonated || 0,
      carbonSaved: user.impact?.carbonSavedKg || 0,
      currentStreak: user.streak?.currentStreak || 0,
      longestStreak: user.streak?.longestStreak || 0,
      level: {
        number: levelInfo.level,
        title: levelInfo.title,
        icon: levelInfo.icon,
      },
      badges: user.achievements.map(a => a.badgeId),
      followersCount: followerCount,
      followingCount: followingCount,
      isFollowing,
      recentActivity: recentActivity.map(a => ({
        id: a.id,
        type: a.reserverId === id ? 'RESCUE' : 'SHARE',
        title: a.food.name,
        quantity: a.quantity,
        createdAt: a.createdAt.toISOString()
      }))
    };

    return NextResponse.json(publicProfile);

  } catch (error) {
    console.error("Public Profile GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
