import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { setTypingStatus, getTypingUsers } from "@/lib/typingTracker";
import { publishConversationEvent } from "@/lib/sseHub";

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

    // ⚡ REAL-TIME PUSH: Broadcast typing event to conversation participants
    publishConversationEvent(conversationId, "user:typing", {
      userId: session.user.id,
      userName,
      isTyping,
    });

    // Also notify the recipient on their inbox stream so their sidebar list lights up
    try {
      const { prisma } = await import("@/lib/prisma");
      const { publishUserEvent } = await import("@/lib/sseHub");
      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { participantIds: true },
      });
      if (conv?.participantIds) {
        const recipientId = conv.participantIds.find((id) => id !== session.user.id);
        if (recipientId) {
          publishUserEvent(recipientId, "conversation:typing", {
            conversationId,
            userId: session.user.id,
            userName,
            isTyping,
          });
        }
      }
    } catch {
      // Non-critical background push
    }

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
