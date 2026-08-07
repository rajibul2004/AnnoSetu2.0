import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isUserOnline, getUserLastSeen } from "@/lib/presenceTracker";
import type { ConversationDetailDTO, MessageDTO } from "@/types/message";

export async function GET(
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

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        reservation: {
          include: {
            food: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: "Conversation not found" },
        { status: 404 }
      );
    }

    if (!conversation.participantIds.includes(userId)) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // Identify other participant
    const otherId = conversation.participantIds.find((id) => id !== userId) || "";
    const otherUser = await prisma.user.findUnique({
      where: { id: otherId },
      include: {
        individualProfile: { select: { name: true, profileImage: true } },
        restaurantProfile: { select: { restaurantName: true, profileImage: true } },
        ngoProfile: { select: { ngoName: true, profileImage: true } },
      },
    });

    let otherName = otherUser?.email.split("@")[0] || "AnnoSetu User";
    let otherProfileImg: string | null = null;
    let otherRole = otherUser?.role || "individual";

    if (otherUser?.role === "restaurant" && otherUser.restaurantProfile) {
      otherName = otherUser.restaurantProfile.restaurantName || otherName;
      otherProfileImg = otherUser.restaurantProfile.profileImage || null;
    } else if (otherUser?.role === "ngo" && otherUser.ngoProfile) {
      otherName = otherUser.ngoProfile.ngoName || otherName;
      otherProfileImg = otherUser.ngoProfile.profileImage || null;
    } else if (otherUser?.individualProfile) {
      otherName = otherUser.individualProfile.name || otherName;
      otherProfileImg = otherUser.individualProfile.profileImage || null;
    }

    // Auto-mark unread incoming messages as read
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

    const messagesDTO: MessageDTO[] = conversation.messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: m.senderId === userId ? "You" : m.senderId === "system" ? "AnnoSetu Bot" : otherName,
      senderRole: m.senderId === userId ? session.user.role : otherRole,
      content: m.content,
      messageType: m.messageType as any,
      metadata: m.metadata as any,
      isRead: m.isRead,
      readAt: m.readAt ? m.readAt.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
      isSelf: m.senderId === userId,
    }));

    let foodInfo = null;
    if (conversation.reservation?.food) {
      const primaryImg = conversation.reservation.food.images[0]?.url || null;
      foodInfo = {
        id: conversation.reservation.food.id,
        name: conversation.reservation.food.name,
        imageUrl: primaryImg,
        quantity: conversation.reservation.quantity,
        quantityUnit: conversation.reservation.food.quantityUnit,
        pickupTime: conversation.reservation.pickupTime.toISOString(),
        pickupAddress: conversation.reservation.pickupAddress,
        status: conversation.reservation.status,
      };
    }

    const detail: ConversationDetailDTO = {
      id: conversation.id,
      reservationId: conversation.reservationId,
      foodId: conversation.foodId,
      participantIds: conversation.participantIds,
      otherParticipant: {
        id: otherId,
        name: otherName,
        email: otherUser?.email || "",
        role: otherRole,
        profileImage: otherProfileImg,
        isOnline: isUserOnline(otherId),
        lastSeen: getUserLastSeen(otherId)
          ? new Date(getUserLastSeen(otherId)!).toISOString()
          : null,
      },
      lastMessage: messagesDTO[messagesDTO.length - 1] || null,
      unreadCount: 0,
      lastMessageAt: conversation.lastMessageAt.toISOString(),
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      foodInfo,
      messages: messagesDTO,
    };

    return NextResponse.json({
      success: true,
      data: detail,
    });
  } catch (error: any) {
    console.error("GET /api/conversations/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}
