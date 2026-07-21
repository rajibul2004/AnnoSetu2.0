import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const verifyOtpSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  type: z.enum(["email", "phone"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, otp, type } = verifyOtpSchema.parse(body);

    const normalizedIdentifier = type === "email" ? identifier.trim().toLowerCase() : identifier.replace(/\D/g, "");

    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier: normalizedIdentifier,
        token: otp,
      },
    });

    if (!tokenRecord) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    if (tokenRecord.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: normalizedIdentifier, token: otp } },
      });
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    // Success! Delete the token so it can't be reused
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: normalizedIdentifier, token: otp } },
    });

    return NextResponse.json({ success: true, message: "Verified successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("OTP verify error:", error);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}
