import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadProfileImage } from "@/lib/cloudinary";
 
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
 
  const base = {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    language: user.language,
    notifications: user.notifications,
  };
 
  let data;
  if (user.role === "individual" && user.individualProfile) {
    const p = user.individualProfile;
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
      dietaryPreferences: user.dietaryPreferences,
    };
  } else if (user.role === "restaurant" && user.restaurantProfile) {
    const p = user.restaurantProfile;
    data = {
      ...base,
      restaurantName: p.restaurantName,
      restaurantType: p.restaurantType,
      phone: p.phone,
      address: p.address,
      bio: p.bio,
      profileImage: p.profileImage,
      fssaiLicense: p.fssaiLicense,
      gstNumber: p.gstNumber,
      website: p.website,
    };
  } else if (user.role === "ngo" && user.ngoProfile) {
    const p = user.ngoProfile;
    data = {
      ...base,
      ngoName: p.ngoName,
      ngoType: p.ngoType,
      registrationId: p.registrationId,
      establishedYear: p.establishedYear,
      phone: p.phone,
      address: p.address,
      bio: p.bio,
      profileImage: p.profileImage,
      website: p.website,
    };
  } else {
    data = { ...base, phone: null, address: null, bio: "", profileImage: "" };
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
 
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
  }
 
  const formData = await request.formData();
  const get = (key: string) => {
    const value = formData.get(key);
    return value === null ? undefined : String(value);
  };
 
  // Fields that live on User itself, available regardless of role.
  const language = get("language");
  const notificationsRaw = formData.get("notifications");
 
  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(language ? { language: language as never } : {}),
      ...(notificationsRaw !== null ? { notifications: notificationsRaw === "true" } : {}),
    },
  });
 
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
 
  const phone = get("phone");
  const address = get("address");
  const bio = get("bio");
 
  if (user.role === "individual") {
    const dietaryRaw = get("dietaryPreferences");
    let dietaryPreferences: string[] | undefined;
    if (dietaryRaw) {
      try {
        const parsed = JSON.parse(dietaryRaw);
        if (Array.isArray(parsed)) dietaryPreferences = parsed;
      } catch {
        // ignore malformed input
      }
    }
 
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
      },
    });
 
    if (dietaryPreferences) {
      await prisma.user.update({
        where: { id: user.id },
        data: { dietaryPreferences: dietaryPreferences as never },
      });
    }
  } else if (user.role === "restaurant") {
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
        ...(get("gstNumber") !== undefined ? { gstNumber: get("gstNumber") } : {}),
      },
    });
  } else if (user.role === "ngo") {
    await prisma.ngoProfile.update({
      where: { userId: user.id },
      data: {
        ...(get("ngoName") ? { ngoName: get("ngoName") } : {}),
        ...(get("ngoType") !== undefined ? { ngoType: get("ngoType") } : {}),
        ...(get("registrationId") !== undefined ? { registrationId: get("registrationId") } : {}),
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
 
  return NextResponse.json({ success: true });
}