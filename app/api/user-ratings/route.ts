import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const createUserRatingSchema = z.object({
  consumerId: z.string().min(1, "Consumer ID is required"),
  reservationId: z.string().min(1, "Reservation ID is required"),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const supplierId = session.user.id;
    const body = await req.json();
    
    const validatedData = createUserRatingSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { success: false, message: "Invalid data", errors: validatedData.error.format() },
        { status: 400 }
      );
    }

    const { consumerId, reservationId, rating, comment } = validatedData.data;

    // Verify reservation exists and belongs to supplier
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { food: true },
    });

    if (!reservation) {
      return NextResponse.json({ success: false, message: "Reservation not found" }, { status: 404 });
    }

    if (reservation.food.supplierId !== supplierId) {
      return NextResponse.json({ success: false, message: "Unauthorized: Reservation does not belong to you" }, { status: 403 });
    }

    // Check if rating already exists
    const existingRating = await prisma.userRating.findUnique({
      where: { reservationId },
    });

    if (existingRating) {
      return NextResponse.json({ success: false, message: "Consumer already rated for this reservation" }, { status: 400 });
    }

    // Create rating and update consumer's average rating in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.userRating.create({
        data: {
          consumerId,
          supplierId,
          reservationId,
          rating,
          comment,
        },
      });

      const consumerProfile = await tx.individualProfile.findUnique({
        where: { userId: consumerId },
      });

      if (consumerProfile) {
        const newCount = consumerProfile.ratingCount + 1;
        const newAvg = ((consumerProfile.averageRating * consumerProfile.ratingCount) + rating) / newCount;

        await tx.individualProfile.update({
          where: { userId: consumerId },
          data: {
            ratingCount: newCount,
            averageRating: newAvg,
          },
        });
      }
    });

    return NextResponse.json({ success: true, message: "Consumer rated successfully" });
  } catch (error) {
    console.error("Error creating user rating:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process rating" },
      { status: 500 }
    );
  }
}
