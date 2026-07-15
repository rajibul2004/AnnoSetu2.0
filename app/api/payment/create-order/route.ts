import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient } from "@/lib/razorpay";

/**
 * POST /api/payment/create-order
 *
 * Creates a Razorpay order for a food reservation.
 * Body: { foodId: string; quantity: number }
 *
 * Returns: { order, keyId } — the client uses keyId + order.id to open
 * the Razorpay checkout modal.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as {
    foodId?: string;
    quantity?: number;
  };

  const { foodId, quantity } = body;

  if (!foodId || !quantity || quantity < 1) {
    return NextResponse.json(
      { success: false, message: "foodId and quantity are required" },
      { status: 400 },
    );
  }

  const food = await prisma.food.findUnique({ where: { id: foodId } });

  if (!food || !food.isActive || food.deletedAt || new Date(food.expiresAt) <= new Date()) {
    return NextResponse.json({ success: false, message: "Food not found or unavailable" }, { status: 404 });
  }

  if (food.isDonation || food.price === 0) {
    return NextResponse.json(
      { success: false, message: "This item is a free donation — no payment required" },
      { status: 400 },
    );
  }

  if (food.supplierId === session.user.id) {
    return NextResponse.json(
      { success: false, message: "You cannot reserve your own listing" },
      { status: 400 },
    );
  }

  if (quantity > food.availableQty) {
    return NextResponse.json(
      { success: false, message: `Only ${food.availableQty} ${food.quantityUnit} available` },
      { status: 400 },
    );
  }

  const totalPaise = Math.round(food.price * quantity * 100); // Razorpay uses paise (smallest INR unit)

  try {
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: totalPaise,
      currency: "INR",
      receipt: `rcpt_${session.user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        foodId,
        quantity: String(quantity),
        reserverId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        order,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    console.error("[payment/create-order]", err);
    return NextResponse.json(
      { success: false, message: "Failed to create payment order. Please try again." },
      { status: 500 },
    );
  }
}
