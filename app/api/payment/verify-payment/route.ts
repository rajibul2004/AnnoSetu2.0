import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generatePickupCode } from "@/lib/pickupCode";
import { Prisma } from "@/app/generated/prisma";
import { notifyReservationConfirmed } from "@/services/notificationService";

/**
 * POST /api/payment/verify-payment
 *
 * Called by the client after the Razorpay modal closes with a successful
 * payment. Verifies the HMAC signature, then creates the Reservation record.
 *
 * Body: {
 *   razorpay_order_id:   string;
 *   razorpay_payment_id: string;
 *   razorpay_signature:  string;
 *   foodId:              string;
 *   quantity:            number;
 *   pickupTime:          string; // ISO
 * }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    foodId?: string;
    quantity?: number;
    pickupTime?: string;
  };

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    foodId,
    quantity,
    pickupTime,
  } = body;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !foodId ||
    !quantity ||
    !pickupTime
  ) {
    return NextResponse.json({ success: false, message: "Missing payment data" }, { status: 400 });
  }

  // -------------------------------------------------------------------------
  // 1. Verify HMAC-SHA256 signature
  // -------------------------------------------------------------------------
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ success: false, message: "Payment gateway not configured" }, { status: 500 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json(
      { success: false, message: "Payment signature verification failed" },
      { status: 400 },
    );
  }

  // -------------------------------------------------------------------------
  // 2. Load food and build the reservation
  // -------------------------------------------------------------------------
  const food = await prisma.food.findUnique({ where: { id: foodId } });

  if (!food || !food.isActive || food.deletedAt || new Date(food.expiresAt) <= new Date()) {
    return NextResponse.json({ success: false, message: "Food not found or no longer available" }, { status: 404 });
  }

  if (quantity > food.availableQty) {
    return NextResponse.json(
      { success: false, message: `Only ${food.availableQty} ${food.quantityUnit} available` },
      { status: 400 },
    );
  }

  if (!food.pickupAddress) {
    return NextResponse.json(
      { success: false, message: "This listing has no pickup address" },
      { status: 400 },
    );
  }

  const totalPrice = food.price * quantity;

  // -------------------------------------------------------------------------
  // 3. Create reservation + immediately confirm it (payment already received)
  //    with retry logic for pickupCode uniqueness
  // -------------------------------------------------------------------------
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const pickupCode = generatePickupCode();

      const [reservation] = await prisma.$transaction([
        prisma.reservation.create({
          data: {
            foodId: food.id,
            reserverId: session.user.id,
            supplierId: food.supplierId,
            quantity,
            pricePerUnit: food.price,
            totalPrice,
            discountApplied: food.discountPct,
            // Payment is already confirmed → set to confirmed immediately
            status: "confirmed",
            paymentStatus: "paid",
            pickupTime: new Date(pickupTime),
            pickupAddress: food.pickupAddress,
            pickupCode,
            readyAt: new Date(),
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            acceptedTerms: true,
          },
        }),
        prisma.food.update({
          where: { id: food.id },
          data: {
            availableQty: { decrement: quantity },
            reservationCount: { increment: 1 },
          },
        }),
      ]);

      // Notify the reserver (non-blocking)
      void notifyReservationConfirmed(
        session.user.id,
        food.name,
        reservation.id,
        pickupCode,
      );

      return NextResponse.json({
        success: true,
        data: { id: reservation.id, pickupCode },
      });
    } catch (error) {
      const isUniqueClash =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!isUniqueClash || attempt === 4) {
        console.error("[payment/verify-payment]", error);
        return NextResponse.json(
          { success: false, message: "Failed to create reservation. Please contact support." },
          { status: 500 },
        );
      }
    }
  }

  return NextResponse.json(
    { success: false, message: "Unexpected error. Please contact support." },
    { status: 500 },
  );
}
