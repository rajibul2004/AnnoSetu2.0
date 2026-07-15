import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getNotifications,
  markAllAsRead,
} from "@/services/notificationService";

/** GET /api/notifications — paginated notification list + unread count */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 30), 50);
  const offset = Number(searchParams.get("offset") ?? 0);

  const result = await getNotifications(session.user.id, limit, offset);
  return NextResponse.json({ success: true, data: result });
}

/** POST /api/notifications — mark all as read */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await markAllAsRead(session.user.id);
  return NextResponse.json({ success: true });
}
