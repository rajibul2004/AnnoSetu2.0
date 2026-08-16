import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { evaluateBadges } from "@/services/impactService";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: followingId } = await params;
    const followerId = session.user.id;

    if (followerId === followingId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json({ success: true, isFollowing: true });
    }

    await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    const followerCount = await prisma.follow.count({
      where: { followingId },
    });

    await evaluateBadges(followingId, followerCount, "social");

    return NextResponse.json({ success: true, isFollowing: true });
  } catch (error) {
    console.error("Follow error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: followingId } = await params;
    const followerId = session.user.id;

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!existingFollow) {
      return NextResponse.json({ success: true, isFollowing: false });
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return NextResponse.json({ success: true, isFollowing: false });
  } catch (error) {
    console.error("Unfollow error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
