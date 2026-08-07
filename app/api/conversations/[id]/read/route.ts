import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { publishConversationEvent } from "@/lib/sseHub";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: conversationId } = await params;
    const userId = session.user.id;

    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // ⚡ REAL-TIME PUSH: Notify conversation participants that messages were read
    const readAt = new Date().toISOString();
    publishConversationEvent(conversationId, "message:read", {
      conversationId,
      readBy: userId,
      readAt,
    });

    // Notify the reader's user stream to update unread badge immediately to 0
    try {
      const { publishUserEvent } = await import("@/lib/sseHub");
      publishUserEvent(userId, "conversation:read", {
        conversationId,
        readBy: userId,
        readAt,
      });

      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { participantIds: true },
      });
      if (conv?.participantIds) {
        const otherUserId = conv.participantIds.find((id) => id !== userId);
        if (otherUserId) {
          publishUserEvent(otherUserId, "conversation:read", {
            conversationId,
            readBy: userId,
            readAt,
          });
        }
      }
    } catch {
      // Non-critical background push
    }

    return NextResponse.json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error: any) {
    console.error("POST /api/conversations/[id]/read error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to mark as read" },
      { status: 500 }
    );
  }
}
