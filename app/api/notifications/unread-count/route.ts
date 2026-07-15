import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUnreadCount } from "@/services/notificationService";

/** GET /api/notifications/unread-count — lightweight unread badge count */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const count = await getUnreadCount(session.user.id);
  return NextResponse.json({ success: true, data: { count } });
}
