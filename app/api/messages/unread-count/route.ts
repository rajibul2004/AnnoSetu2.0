import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const userId = session.user.id;

    if (!prisma?.conversation || !prisma?.message) {
      return NextResponse.json({ success: true, unreadCount: 0 });
    }

    // Find conversation IDs where user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participantIds: {
          has: userId,
        },
      },
      select: { id: true },
    });

    if (conversations.length === 0) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const conversationIds = conversations.map((c) => c.id);

    const count = await prisma.message.count({
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      unreadCount: count,
    });
  } catch (error: any) {
    console.error("GET /api/messages/unread-count error:", error);
    return NextResponse.json({ unreadCount: 0 });
  }
}
