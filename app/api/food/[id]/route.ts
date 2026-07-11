import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
 
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "Not authorized to access this route" },
      { status: 401 },
    );
  }
 
  const { id } = await params;
 
  const existing = await prisma.food.findUnique({ where: { id } });
 
  if (!existing || existing.supplierId !== session.user.id) {
    return NextResponse.json(
      { success: false, message: "Food item not found" },
      { status: 404 },
    );
  }
 
  // The schema has a real deletedAt column now (unlike my earlier draft,
  // which only had isActive) — set both for clarity, matching the
  // [isActive, deletedAt, expiresAt] index.
  await prisma.food.update({
    where: { id },
    data: { isActive: false, deletedAt: new Date() },
  });
 
  return NextResponse.json({ success: true });
}