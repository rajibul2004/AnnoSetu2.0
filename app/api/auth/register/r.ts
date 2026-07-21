import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
 
function normalizePhone(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, "");
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return digitsOnly.slice(2);
  }
  return digitsOnly;
}
 
const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
 
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[a-z]/, "Must contain lowercase letter")
      .regex(/[0-9]/, "Must contain number")
      .regex(/[^A-Za-z0-9]/, "Must contain special character"),
 
    role: z.enum(["individual", "restaurant", "ngo"]),
 
    phone: z
      .string()
      .transform((val) => normalizePhone(val))
      .refine((val) => /^[6-9]\d{9}$/.test(val), {
        message: "Invalid Indian phone number",
      }),
 
    address: z.string().min(5).max(200),
 
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
 
    acceptedDisclaimer: z.boolean().refine((val) => val === true, {
      message: "You must accept the disclaimer",
    }),
 
    // Individual fields
    name: z.string().min(2).max(100).optional(),
 
    // Restaurant fields
    restaurantName: z.string().min(2).max(100).optional(),
 
    // NGO fields
    ngoName: z.string().min(2).max(100).optional(),
    registrationId: z.string().min(3).max(50).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "individual" && !data.name) {
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message: "Name is required for individual",
      });
    }
 
    if (data.role === "restaurant" && !data.restaurantName) {
      ctx.addIssue({
        code: "custom",
        path: ["restaurantName"],
        message: "Restaurant name is required",
      });
    }
 
    if (data.role === "ngo") {
      if (!data.ngoName) {
        ctx.addIssue({
          code: "custom",
          path: ["ngoName"],
          message: "NGO name is required",
        });
      }
 
      if (!data.registrationId) {
        ctx.addIssue({
          code: "custom",
          path: ["registrationId"],
          message: "Registration ID is required",
        });
      }
    }
 
    const hasLatitude = data.latitude !== undefined;
    const hasLongitude = data.longitude !== undefined;
 
    if (hasLatitude !== hasLongitude) {
      ctx.addIssue({
        code: "custom",
        path: ["location"],
        message: "Both latitude and longitude must be provided together",
      });
    }
 
    if ((data.role === "ngo" || data.role === "restaurant") && (!hasLatitude || !hasLongitude)) {
      ctx.addIssue({
        code: "custom",
        path: ["location"],
        message: "Location is required for NGOs and Restaurants",
      });
    }
  });
 
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
 
    const validatedData = registerSchema.parse(body);
 
    const { email, password, role, latitude, longitude, acceptedDisclaimer } =
      validatedData;
 
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
 
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 },
      );
    }
 
    const hashedPassword = await bcrypt.hash(password, 10);
 
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
        },
      });
 
      if (role === "individual") {
        await tx.individualProfile.create({
          data: {
            userId: newUser.id,
            name: validatedData.name!,
            phone: validatedData.phone,
            address: validatedData.address ?? null,
            acceptedDisclaimer,
            latitude: latitude ?? null,
            longitude: longitude ?? null,
          },
        });
      }
 
      if (role === "restaurant") {
        await tx.restaurantProfile.create({
          data: {
            userId: newUser.id,
            restaurantName: validatedData.restaurantName!,
            phone: validatedData.phone,
            address: validatedData.address ?? null,
            acceptedDisclaimer,
            latitude: latitude ?? null,
            longitude: longitude ?? null,
          },
        });
      }
 
      if (role === "ngo") {
        await tx.ngoProfile.create({
          data: {
            userId: newUser.id,
            ngoName: validatedData.ngoName!,
            registrationId: validatedData.registrationId,
            phone: validatedData.phone,
            address: validatedData.address ?? null,
            acceptedDisclaimer,
            latitude: latitude ?? null,
            longitude: longitude ?? null,
          },
        });
      }
 
      return newUser;
    });
 
    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
 
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 },
      );
    }
 
    console.error("Registration error:", error);
 
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}