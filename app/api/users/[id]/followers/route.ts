import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: followingId } = await params;

    const followers = await prisma.follow.findMany({
      where: {
        followingId,
      },
      include: {
        follower: {
          include: {
            individualProfile: true,
            restaurantProfile: true,
            ngoProfile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: followers });
  } catch (error) {
    console.error("Followers GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
