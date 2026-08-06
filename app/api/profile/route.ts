import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadProfileImage, uploadVerificationDocument } from "@/lib/cloudinary";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "Not authorized to access this route" },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      individualProfile: true,
      restaurantProfile: true,
      ngoProfile: true,
    },
  });

  if (!user) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
  }

  // Derive dynamic verification badges based on profile documents and role
  const badges = new Set<string>(user.verificationBadges ?? []);

  const base = {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    language: user.language,
    notifications: user.notifications,
    dietaryPreferences: user.dietaryPreferences ?? [],
    customDietaryPreferences: user.customDietaryPreferences ?? [],
  };

  let data;
  if (user.role === "individual" && user.individualProfile) {
    const p = user.individualProfile;
    const isVerified =
      p.foodSafetyStatus === "verified" || p.govtIdStatus === "verified";

    data = {
      ...base,
      name: p.name,
      phone: p.phone,
      address: p.address,
      bio: p.bio,
      profileImage: p.profileImage,
      gender: p.gender,
      dateOfBirth: p.dateOfBirth,
      cookingExpertise: p.cookingExpertise,
      foodSafetyDoc: p.foodSafetyDoc,
      foodSafetyStatus: p.foodSafetyStatus,
      govtIdDoc: p.govtIdDoc,
      govtIdStatus: p.govtIdStatus,
      customDietaryTags: p.customDietaryTags ?? [],
      isVerified,
      verificationBadges: Array.from(badges),
    };
  } else if (user.role === "restaurant" && user.restaurantProfile) {
    const p = user.restaurantProfile;
    if (p.fssaiStatus === "verified") badges.add("fssai_verified");
    if (p.gstStatus === "verified") badges.add("business_license_verified");
    if (p.foodSafetyStatus === "verified") badges.add("food_safety_verified");

    const isVerified =
      p.fssaiStatus === "verified" ||
      p.gstStatus === "verified" ||
      p.foodSafetyStatus === "verified";

    data = {
      ...base,
      restaurantName: p.restaurantName,
      restaurantType: p.restaurantType,
      phone: p.phone,
      address: p.address,
      bio: p.bio,
      profileImage: p.profileImage,
      fssaiLicense: p.fssaiLicense,
      fssaiDocument: p.fssaiDocument,
      fssaiStatus: p.fssaiStatus,
      gstNumber: p.gstNumber,
      gstDocument: p.gstDocument,
      gstStatus: p.gstStatus,
      foodSafetyDoc: p.foodSafetyDoc,
      foodSafetyStatus: p.foodSafetyStatus,
      website: p.website,
      isVerified,
      verificationBadges: Array.from(badges),
    };
  } else if (user.role === "ngo" && user.ngoProfile) {
    const p = user.ngoProfile;
    if (p.registrationStatus === "verified") badges.add("ngo_80g_certified");
    if (p.taxExemptionStatus === "verified") badges.add("business_license_verified");
    if (p.foodSafetyStatus === "verified") badges.add("food_safety_verified");

    const isVerified =
      p.registrationStatus === "verified" ||
      p.taxExemptionStatus === "verified" ||
      p.foodSafetyStatus === "verified";

    data = {
      ...base,
      ngoName: p.ngoName,
      ngoType: p.ngoType,
      registrationId: p.registrationId,
      registrationDoc: p.registrationDoc,
      registrationStatus: p.registrationStatus,
      taxExemptionDoc: p.taxExemptionDoc,
      taxExemptionStatus: p.taxExemptionStatus,
      foodSafetyDoc: p.foodSafetyDoc,
      foodSafetyStatus: p.foodSafetyStatus,
      establishedYear: p.establishedYear,
      phone: p.phone,
      address: p.address,
      bio: p.bio,
      profileImage: p.profileImage,
      website: p.website,
      isVerified,
      verificationBadges: Array.from(badges),
    };
  } else {
    data = {
      ...base,
      phone: null,
      address: null,
      bio: "",
      profileImage: "",
      verificationBadges: Array.from(badges),
    };
  }

  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "Not authorized to access this route" },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      individualProfile: true,
      restaurantProfile: true,
      ngoProfile: true,
    },
  });

  if (!user) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const get = (key: string) => {
    const value = formData.get(key);
    return value === null ? undefined : String(value);
  };

  // 1. User base settings
  const language = get("language");
  const notificationsRaw = formData.get("notifications");
  const customDietaryRaw = get("customDietaryPreferences");
  const dietaryRaw = get("dietaryPreferences");

  let customDietaryPreferences: string[] | undefined;
  if (customDietaryRaw) {
    try {
      const parsed = JSON.parse(customDietaryRaw);
      if (Array.isArray(parsed)) customDietaryPreferences = parsed;
    } catch {
      // ignore
    }
  }

  let dietaryPreferences: string[] | undefined;
  if (dietaryRaw) {
    try {
      const parsed = JSON.parse(dietaryRaw);
      if (Array.isArray(parsed)) dietaryPreferences = parsed;
    } catch {
      // ignore
    }
  }

  // 2. Avatar upload
  let profileImageUrl: string | undefined;
  const imageFile = formData.get("profileImage");
  if (imageFile instanceof File && imageFile.size > 0) {
    if (imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "Image size should be less than 5MB" },
        { status: 400 },
      );
    }
    profileImageUrl = await uploadProfileImage(imageFile);
  }

  // Helper for document uploads
  const uploadDoc = async (key: string): Promise<string | undefined> => {
    const docFile = formData.get(key);
    if (docFile instanceof File && docFile.size > 0) {
      if (docFile.size > 10 * 1024 * 1024) {
        throw new Error(`${key} file size exceeds 10MB limit`);
      }
      return await uploadVerificationDocument(docFile);
    }
    return undefined;
  };

  const phone = get("phone");
  const address = get("address");
  const bio = get("bio");

  // Track badges to update on User model
  const activeBadges = new Set<string>(user.verificationBadges ?? []);

  try {
    if (user.role === "individual") {
      const foodSafetyDocUrl = await uploadDoc("foodSafetyDoc");
      const govtIdDocUrl = await uploadDoc("govtIdDoc");

      const foodSafetyStatus = get("foodSafetyStatus") ?? (foodSafetyDocUrl ? "verified" : undefined);
      const govtIdStatus = get("govtIdStatus") ?? (govtIdDocUrl ? "verified" : undefined);

      if (foodSafetyStatus === "verified") activeBadges.add("food_safety_verified");
      if (govtIdStatus === "verified") activeBadges.add("identity_verified");

      await prisma.individualProfile.update({
        where: { userId: user.id },
        data: {
          ...(get("name") ? { name: get("name") } : {}),
          ...(phone !== undefined ? { phone } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(bio !== undefined ? { bio } : {}),
          ...(profileImageUrl ? { profileImage: profileImageUrl } : {}),
          ...(get("gender") ? { gender: get("gender") as never } : {}),
          ...(get("dateOfBirth") ? { dateOfBirth: new Date(get("dateOfBirth")!) } : {}),
          ...(get("cookingExpertise") !== undefined
            ? { cookingExpertise: get("cookingExpertise") }
            : {}),
          ...(foodSafetyDocUrl ? { foodSafetyDoc: foodSafetyDocUrl } : {}),
          ...(foodSafetyStatus ? { foodSafetyStatus } : {}),
          ...(govtIdDocUrl ? { govtIdDoc: govtIdDocUrl } : {}),
          ...(govtIdStatus ? { govtIdStatus } : {}),
          ...(customDietaryPreferences ? { customDietaryTags: customDietaryPreferences } : {}),
        },
      });
    } else if (user.role === "restaurant") {
      const fssaiDocUrl = await uploadDoc("fssaiDocument");
      const gstDocUrl = await uploadDoc("gstDocument");
      const foodSafetyDocUrl = await uploadDoc("foodSafetyDoc");

      const fssaiStatus = get("fssaiStatus") ?? (fssaiDocUrl ? "verified" : undefined);
      const gstStatus = get("gstStatus") ?? (gstDocUrl ? "verified" : undefined);
      const foodSafetyStatus = get("foodSafetyStatus") ?? (foodSafetyDocUrl ? "verified" : undefined);

      if (fssaiStatus === "verified") activeBadges.add("fssai_verified");
      if (gstStatus === "verified") activeBadges.add("business_license_verified");
      if (foodSafetyStatus === "verified") activeBadges.add("food_safety_verified");

      await prisma.restaurantProfile.update({
        where: { userId: user.id },
        data: {
          ...(get("restaurantName") ? { restaurantName: get("restaurantName") } : {}),
          ...(get("restaurantType") !== undefined ? { restaurantType: get("restaurantType") } : {}),
          ...(phone !== undefined ? { phone } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(bio !== undefined ? { bio } : {}),
          ...(profileImageUrl ? { profileImage: profileImageUrl } : {}),
          ...(get("fssaiLicense") !== undefined ? { fssaiLicense: get("fssaiLicense") } : {}),
          ...(fssaiDocUrl ? { fssaiDocument: fssaiDocUrl } : {}),
          ...(fssaiStatus ? { fssaiStatus } : {}),
          ...(get("gstNumber") !== undefined ? { gstNumber: get("gstNumber") } : {}),
          ...(gstDocUrl ? { gstDocument: gstDocUrl } : {}),
          ...(gstStatus ? { gstStatus } : {}),
          ...(foodSafetyDocUrl ? { foodSafetyDoc: foodSafetyDocUrl } : {}),
          ...(foodSafetyStatus ? { foodSafetyStatus } : {}),
        },
      });
    } else if (user.role === "ngo") {
      const registrationDocUrl = await uploadDoc("registrationDoc");
      const taxExemptionDocUrl = await uploadDoc("taxExemptionDoc");
      const foodSafetyDocUrl = await uploadDoc("foodSafetyDoc");

      const registrationStatus =
        get("registrationStatus") ?? (registrationDocUrl ? "verified" : undefined);
      const taxExemptionStatus =
        get("taxExemptionStatus") ?? (taxExemptionDocUrl ? "verified" : undefined);
      const foodSafetyStatus =
        get("foodSafetyStatus") ?? (foodSafetyDocUrl ? "verified" : undefined);

      if (registrationStatus === "verified") activeBadges.add("ngo_80g_certified");
      if (taxExemptionStatus === "verified") activeBadges.add("business_license_verified");
      if (foodSafetyStatus === "verified") activeBadges.add("food_safety_verified");

      await prisma.ngoProfile.update({
        where: { userId: user.id },
        data: {
          ...(get("ngoName") ? { ngoName: get("ngoName") } : {}),
          ...(get("ngoType") !== undefined ? { ngoType: get("ngoType") } : {}),
          ...(get("registrationId") !== undefined ? { registrationId: get("registrationId") } : {}),
          ...(registrationDocUrl ? { registrationDoc: registrationDocUrl } : {}),
          ...(registrationStatus ? { registrationStatus } : {}),
          ...(taxExemptionDocUrl ? { taxExemptionDoc: taxExemptionDocUrl } : {}),
          ...(taxExemptionStatus ? { taxExemptionStatus } : {}),
          ...(foodSafetyDocUrl ? { foodSafetyDoc: foodSafetyDocUrl } : {}),
          ...(foodSafetyStatus ? { foodSafetyStatus } : {}),
          ...(get("establishedYear")
            ? { establishedYear: parseInt(get("establishedYear")!, 10) }
            : {}),
          ...(phone !== undefined ? { phone } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(bio !== undefined ? { bio } : {}),
          ...(profileImageUrl ? { profileImage: profileImageUrl } : {}),
          ...(get("website") !== undefined ? { website: get("website") } : {}),
        },
      });
    }

    // Update user root fields & badges
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(language ? { language: language as never } : {}),
        ...(notificationsRaw !== null ? { notifications: notificationsRaw === "true" } : {}),
        ...(dietaryPreferences ? { dietaryPreferences: dietaryPreferences as never } : {}),
        ...(customDietaryPreferences ? { customDietaryPreferences } : {}),
        verificationBadges: Array.from(activeBadges),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile and verification details updated successfully",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}