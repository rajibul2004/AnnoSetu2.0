import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { setTypingStatus, getTypingUsers } from "@/lib/typingTracker";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const body = await request.json().catch(() => ({}));
    const isTyping = body.isTyping ?? true;
    const userName = (session.user as any).name || session.user.email?.split("@")[0] || "Partner";

    setTypingStatus(conversationId, session.user.id, userName, isTyping);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ typingUsers: [] });
    }

    const { id: conversationId } = await params;
    const typingUsers = getTypingUsers(conversationId, session.user.id);

    return NextResponse.json({ success: true, typingUsers });
  } catch {
    return NextResponse.json({ typingUsers: [] });
  }
}
