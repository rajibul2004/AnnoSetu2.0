import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z
  .object({
    email: z.string().email().trim().toLowerCase(),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[a-z]/, "Must contain lowercase letter")
      .regex(/[0-9]/, "Must contain number")
      .regex(/[^A-Za-z0-9]/, "Must contain special character"),

    role: z.enum(["individual", "restaurant", "ngo"]),

    phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),

    address: z.string().min(5).max(200).optional(),

    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),

    acceptedDisclaimer: z.boolean().refine((val) => val === true, {
      message: "You must accept the disclaimer",
    }),

    // Individual fields (go to IndividualProfile)
    name: z.string().min(2).max(100).optional(),
    gender: z.enum(["male", "female", "other", "prefer_not"]).optional(),
    dateOfBirth: z.string().datetime().optional(),
    cookingExpertise: z.string().max(100).optional(),

    // Restaurant fields (go to RestaurantProfile)
    restaurantName: z.string().min(2).max(100).optional(),
    restaurantType: z.string().max(50).optional(),
    fssaiLicense: z.string().min(5).max(50).optional(),
    gstNumber: z.string().min(5).max(20).optional(),
    website: z.string().url().optional(),

    // NGO fields (go to NgoProfile)
    ngoName: z.string().min(2).max(100).optional(),
    ngoType: z.string().max(50).optional(),
    registrationId: z.string().min(3).max(50).optional(),
    establishedYear: z
      .number()
      .int()
      .min(1800)
      .max(new Date().getFullYear())
      .optional(),
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

    if (
      (data.latitude !== undefined && data.longitude === undefined) ||
      (data.latitude === undefined && data.longitude !== undefined)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["latitude"],
        message: "Both latitude and longitude must be provided together",
      });
    }
  });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);
    console.log(validatedData);

    const {
      email,
      password,
      role,
      latitude,
      longitude,
      acceptedDisclaimer = false,
    } = validatedData;

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 },
      );
    }
    } catch (err) {
      console.log("123",err);
    }

    

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          role,
        },
      });

      if (role === "individual") {
        await tx.individualProfile.create({
          data: {
            userId: newUser.id,
            name: validatedData.name!,
            phone: validatedData.phone || null,
            address: validatedData.address || null,
            gender: validatedData.gender || null,
            dateOfBirth: validatedData.dateOfBirth
              ? new Date(validatedData.dateOfBirth)
              : null,
            cookingExpertise: validatedData.cookingExpertise || null,
            acceptedDisclaimer,
            latitude: latitude || null,
            longitude: longitude || null,
            // ...(latitude &&
            //   longitude && {
            //     location: {
            //       type: "Point",
            //       coordinates: [longitude, latitude],
            //     },
            //   }),
          },
        });
      } else if (role === "restaurant") {
        await tx.restaurantProfile.create({
          data: {
            userId: newUser.id,
            restaurantName: validatedData.restaurantName!,
            restaurantType: validatedData.restaurantType || null,
            phone: validatedData.phone || null,
            address: validatedData.address || null,
            fssaiLicense: validatedData.fssaiLicense || null,
            gstNumber: validatedData.gstNumber || null,
            website: validatedData.website || null,
            acceptedDisclaimer,
            latitude: latitude || null,
            longitude: longitude || null,
            ...(latitude &&
              longitude && {
                location: {
                  type: "Point",
                  coordinates: [longitude, latitude],
                },
              }),
          },
        });
      } else if (role === "ngo") {
        await tx.ngoProfile.create({
          data: {
            userId: newUser.id,
            ngoName: validatedData.ngoName!,
            ngoType: validatedData.ngoType || null,
            registrationId: validatedData.registrationId || null,
            establishedYear: validatedData.establishedYear || null,
            phone: validatedData.phone || null,
            address: validatedData.address || null,
            website: validatedData.website || null,
            acceptedDisclaimer,
            latitude: latitude || null,
            longitude: longitude || null,
            ...(latitude &&
              longitude && {
                location: {
                  type: "Point",
                  coordinates: [longitude, latitude],
                },
              }),
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

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
