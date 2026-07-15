import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * GET /api/users
 *
 * Returns a minimal list of users (id + email + role) for admin use.
 * Requires the caller to be authenticated with the "admin" role.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "Not authorized to access this route" },
      { status: 401 },
    );
  }

  if (session.user.role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Only admins can list users" },
      { status: 403 },
    );
  }

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, data: users });
}

/**
 * POST /api/users
 *
 * Admin-only route to create a bare user record without going through the
 * full registration flow. Useful for seeding or manual provisioning.
 *
 * Body: { email: string; role?: "individual" | "restaurant" | "ngo" | "admin" }
 */
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "Not authorized to access this route" },
      { status: 401 },
    );
  }

  if (session.user.role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Only admins can create users via this route" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const { email, role = "individual" } = body as {
    email?: string;
    role?: string;
  };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { success: false, message: "A valid email is required" },
      { status: 400 },
    );
  }

  const validRoles = ["individual", "restaurant", "ngo", "admin"];
  if (!validRoles.includes(role)) {
    return NextResponse.json(
      { success: false, message: `Role must be one of: ${validRoles.join(", ")}` },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { success: false, message: "A user with that email already exists" },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: { email, role: role as never },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({ success: true, data: user }, { status: 201 });
}