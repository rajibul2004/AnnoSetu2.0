import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const type = body.type || "helpful";
    const reviewId = id;
    const userId = session.user.id;

    // Check if the review exists
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return NextResponse.json({ success: false, message: "Review not found" }, { status: 404 });
    }

    // Check if the reaction already exists
    const existingReaction = await prisma.reviewReaction.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Toggle off: remove the reaction and decrement count
        await prisma.$transaction([
          prisma.reviewReaction.delete({ where: { id: existingReaction.id } }),
          prisma.review.update({
            where: { id: reviewId },
            data: { helpfulCount: { decrement: 1 } },
          }),
        ]);
        return NextResponse.json({ success: true, action: "removed", helpfulCount: review.helpfulCount - 1 });
      } else {
        // Change reaction type
        await prisma.reviewReaction.update({
          where: { id: existingReaction.id },
          data: { type },
        });
        return NextResponse.json({ success: true, action: "updated", helpfulCount: review.helpfulCount });
      }
    } else {
      // Add new reaction
      await prisma.$transaction([
        prisma.reviewReaction.create({
          data: { reviewId, userId, type },
        }),
        prisma.review.update({
          where: { id: reviewId },
          data: { helpfulCount: { increment: 1 } },
        }),
      ]);
      return NextResponse.json({ success: true, action: "added", helpfulCount: review.helpfulCount + 1 });
    }
  } catch (error) {
    console.error("Error reacting to review:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process reaction" },
      { status: 500 }
    );
  }
}
