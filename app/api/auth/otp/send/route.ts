import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { z } from "zod";

const sendOtpSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  type: z.enum(["email", "phone"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, type } = sendOtpSchema.parse(body);

    // Normalize identifier (e.g. lowercase for email, or strip formatting for phone)
    const normalizedIdentifier = type === "email" ? identifier.trim().toLowerCase() : identifier.replace(/\D/g, "");

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Expires in 10 minutes
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    // Clean up any existing tokens for this identifier
    await prisma.verificationToken.deleteMany({
      where: { identifier: normalizedIdentifier },
    });

    // Save in DB
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedIdentifier,
        token: otp,
        expires,
      },
    });

    // -------------------------------------------------------------
    // TODO: Integrate actual Email (e.g., Resend) / SMS (e.g., Twilio) here
    // -------------------------------------------------------------
    if (type === "email") {
      console.log(`\n📧 [MOCK EMAIL] To: ${normalizedIdentifier}\nSubject: Your Annosetu Verification Code\nBody: Your OTP is ${otp}. It expires in 10 minutes.\n`);
    } else {
      console.log(`\n📱 [MOCK SMS] To: ${normalizedIdentifier}\nMessage: Your Annosetu OTP is ${otp}. Expires in 10 mins.\n`);
    }
    // -------------------------------------------------------------

    return NextResponse.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
