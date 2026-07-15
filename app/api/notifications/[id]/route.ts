import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  markAsRead,
  markAsClicked,
  deleteNotification,
} from "@/services/notificationService";

/** PATCH /api/notifications/[id] — mark read or clicked */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as { action?: string };
  const action = body.action ?? "read";

  const updated =
    action === "click"
      ? await markAsClicked(id, session.user.id)
      : await markAsRead(id, session.user.id);

  if (!updated) {
    return NextResponse.json({ success: false, message: "Notification not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: updated });
}

/** DELETE /api/notifications/[id] — remove a notification */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteNotification(id, session.user.id);
  if (!deleted) {
    return NextResponse.json({ success: false, message: "Notification not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
