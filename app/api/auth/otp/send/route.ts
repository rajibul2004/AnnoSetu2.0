import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/email/mailer";
import { sendOtpSms } from "@/lib/sms/fast2sms";
import crypto from "crypto";
import { z } from "zod";

const sendOtpSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  type: z.enum(["email", "phone"]),
  name: z.string().optional(), // Optional display name for the email template
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, type, name } = sendOtpSchema.parse(body);

    const normalizedIdentifier =
      type === "email"
        ? identifier.trim().toLowerCase()
        : identifier.replace(/\D/g, "");

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Expires in 10 minutes
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    // Replace any existing token for this identifier
    await prisma.verificationToken.deleteMany({
      where: { identifier: normalizedIdentifier },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: normalizedIdentifier,
        token: otp,
        expires,
      },
    });

    if (type === "email") {
      await sendOtpEmail({
        to: normalizedIdentifier,
        otp,
        name,
      });
    } else {
      /* Later improved version: Phone SMS OTP Verification
      const smsResult = await sendOtpSms({
        phone: normalizedIdentifier,
        otp,
      });

      if (!smsResult.success) {
        return NextResponse.json(
          { error: smsResult.message || "Failed to send SMS OTP. Please try again." },
          { status: 502 }
        );
      }
      */
      console.log(`[SMS OTP] (${normalizedIdentifier}): ${otp}`);
    }

    return NextResponse.json({
      success: true,
      message: type === "email"
        ? "Verification email sent! Check your inbox."
        : "OTP sent to your phone.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("OTP send error:", error);
    return NextResponse.json(
      { error: "Failed to send verification code. Please try again." },
      { status: 500 }
    );
  }
}
