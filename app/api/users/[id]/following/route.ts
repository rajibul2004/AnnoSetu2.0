import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: followerId } = await params;

    const following = await prisma.follow.findMany({
      where: {
        followerId,
      },
      include: {
        following: {
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

    return NextResponse.json({ success: true, data: following });
  } catch (error) {
    console.error("Following GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
