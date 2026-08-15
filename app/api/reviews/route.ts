import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { SUPPLIER_NAME_SELECT, resolveSupplierName } from "@/lib/supplier";

// Schema for creating a review
const createReviewSchema = z.object({
  reservationId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
    }

    const { reservationId, rating, comment } = parsed.data;

    // Verify the reservation exists, belongs to the user, and is eligible for review
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { food: true, review: true },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    if (reservation.reserverId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: You are not the reserver" }, { status: 403 });
    }

    if (reservation.status !== "picked_up") {
      return NextResponse.json({ error: "Can only review picked up reservations" }, { status: 400 });
    }

    if (reservation.review) {
      return NextResponse.json({ error: "A review already exists for this reservation" }, { status: 400 });
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        foodId: reservation.foodId,
        reviewerId: session.user.id,
        reservationId: reservation.id,
        rating,
        comment,
      },
    });

    // Calculate new average rating for the food
    const allFoodReviews = await prisma.review.findMany({
      where: { foodId: reservation.foodId, isVisible: true, deletedAt: null },
      select: { rating: true },
    });

    const newReviewCount = allFoodReviews.length;
    const newTotalRating = allFoodReviews.reduce((sum, r) => sum + r.rating, 0);
    const newAverageRating = newTotalRating / newReviewCount;

    // Update food stats
    await prisma.food.update({
      where: { id: reservation.foodId },
      data: {
        reviewCount: newReviewCount,
        averageRating: newAverageRating,
      },
    });

    // Send notification to supplier
    await prisma.notification.create({
      data: {
        userId: reservation.supplierId,
        type: "review_received",
        priority: "medium",
        title: "New Review Received",
        message: `You received a ${rating}-star review for ${reservation.food.name}.`,
        actionUrl: "/protected/dashboard",
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const foodId = searchParams.get("foodId");
    const supplierId = searchParams.get("supplierId");
    const reviewerId = searchParams.get("reviewerId");

    const whereClause: any = {
      isVisible: true,
      deletedAt: null,
    };

    if (foodId) {
      whereClause.foodId = foodId;
    }
    
    if (supplierId) {
      whereClause.food = { supplierId };
    }
    
    if (reviewerId) {
      whereClause.reviewerId = reviewerId;
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        reviewer: {
          select: {
            ...SUPPLIER_NAME_SELECT,
            email: true,
            individualProfile: { select: { name: true, phone: true, address: true, profileImage: true } }
          },
        },
        food: {
          select: {
            name: true,
            supplier: {
              select: SUPPLIER_NAME_SELECT
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // limit to 50 for now
    });

    // Transform reviews for easier frontend consumption
    const transformedReviews = reviews.map(r => ({
      ...r,
      reviewerName: resolveSupplierName(r.reviewer as any) || r.reviewer.email?.split('@')[0] || "Anonymous",
      reviewerImage: r.reviewer.individualProfile?.profileImage || "",
      supplierReply: r.supplierReply,
    }));

    return NextResponse.json({ reviews: transformedReviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
