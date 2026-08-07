import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isUserOnline, getUserLastSeen } from "@/lib/presenceTracker";
import type { ConversationDTO } from "@/types/message";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Find conversations where user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participantIds: {
          has: userId,
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
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

    // Fetch details for all other participants
    const allOtherIds = new Set<string>();
    for (const conv of conversations) {
      const otherId = conv.participantIds.find((id) => id !== userId);
      if (otherId) allOtherIds.add(otherId);
    }

    const otherUsers = await prisma.user.findMany({
      where: { id: { in: Array.from(allOtherIds) } },
      include: {
        individualProfile: { select: { name: true, profileImage: true } },
        restaurantProfile: { select: { restaurantName: true, profileImage: true } },
        ngoProfile: { select: { ngoName: true, profileImage: true } },
      },
    });

    const userMap = new Map<string, any>();
    for (const u of otherUsers) {
      let name = u.email.split("@")[0];
      let profileImage: string | null = null;

      if (u.role === "restaurant" && u.restaurantProfile) {
        name = u.restaurantProfile.restaurantName || name;
        profileImage = u.restaurantProfile.profileImage || null;
      } else if (u.role === "ngo" && u.ngoProfile) {
        name = u.ngoProfile.ngoName || name;
        profileImage = u.ngoProfile.profileImage || null;
      } else if (u.individualProfile) {
        name = u.individualProfile.name || name;
        profileImage = u.individualProfile.profileImage || null;
      }

      userMap.set(u.id, {
        id: u.id,
        name,
        email: u.email,
        role: u.role,
        profileImage,
        isOnline: isUserOnline(u.id),
        lastSeen: getUserLastSeen(u.id)
          ? new Date(getUserLastSeen(u.id)!).toISOString()
          : null,
      });
    }

    // Get unread counts per conversation
    const unreadCounts = await prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: { in: conversations.map((c) => c.id) },
        senderId: { not: userId },
        isRead: false,
      },
      _count: {
        id: true,
      },
    });

    const unreadMap = new Map<string, number>();
    for (const uc of unreadCounts) {
      unreadMap.set(uc.conversationId, uc._count.id);
    }

    const responseList: ConversationDTO[] = conversations.map((conv) => {
      const otherId = conv.participantIds.find((id) => id !== userId) || "";
      const otherParticipant = userMap.get(otherId) || {
        id: otherId,
        name: "AnnoSetu User",
        email: "",
        role: "individual",
        profileImage: null,
      };

      const lastMsg = conv.messages[0]
        ? {
            id: conv.messages[0].id,
            conversationId: conv.messages[0].conversationId,
            senderId: conv.messages[0].senderId,
            content: conv.messages[0].content,
            messageType: conv.messages[0].messageType as any,
            metadata: conv.messages[0].metadata as any,
            isRead: conv.messages[0].isRead,
            readAt: conv.messages[0].readAt ? conv.messages[0].readAt.toISOString() : null,
            createdAt: conv.messages[0].createdAt.toISOString(),
            isSelf: conv.messages[0].senderId === userId,
          }
        : null;

      let foodInfo = null;
      if (conv.reservation?.food) {
        const primaryImg = conv.reservation.food.images[0]?.url || null;
        foodInfo = {
          id: conv.reservation.food.id,
          name: conv.reservation.food.name,
          imageUrl: primaryImg,
          quantity: conv.reservation.quantity,
          quantityUnit: conv.reservation.food.quantityUnit,
          pickupTime: conv.reservation.pickupTime.toISOString(),
          pickupAddress: conv.reservation.pickupAddress,
          status: conv.reservation.status,
        };
      }

      return {
        id: conv.id,
        reservationId: conv.reservationId,
        foodId: conv.foodId,
        participantIds: conv.participantIds,
        otherParticipant,
        lastMessage: lastMsg,
        unreadCount: unreadMap.get(conv.id) || 0,
        lastMessageAt: conv.lastMessageAt.toISOString(),
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
        foodInfo,
      };
    });

    return NextResponse.json({
      success: true,
      data: responseList,
    });
  } catch (error: any) {
    console.error("GET /api/conversations error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await req.json();
    const { reservationId, recipientId, foodId } = body;

    let targetReservationId = reservationId || null;
    let targetFoodId = foodId || null;
    let otherParticipantId = recipientId || null;

    if (reservationId) {
      // Find the reservation to get both participants
      const resv = await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: { food: true },
      });

      if (!resv) {
        return NextResponse.json(
          { success: false, message: "Reservation not found" },
          { status: 404 }
        );
      }

      if (resv.reserverId !== userId && resv.supplierId !== userId) {
        return NextResponse.json(
          { success: false, message: "Access denied to this reservation" },
          { status: 403 }
        );
      }

      targetFoodId = resv.foodId;
      otherParticipantId = resv.reserverId === userId ? resv.supplierId : resv.reserverId;

      // Check if conversation already exists for this reservation
      let existing = await prisma.conversation.findUnique({
        where: { reservationId: resv.id },
      });

      if (existing) {
        return NextResponse.json({
          success: true,
          data: { id: existing.id },
        });
      }

      // Create new conversation linked to reservation
      const newConv = await prisma.conversation.create({
        data: {
          reservationId: resv.id,
          foodId: targetFoodId,
          participantIds: [resv.reserverId, resv.supplierId],
          lastMessageAt: new Date(),
        },
      });

      // Add a system starter message
      await prisma.message.create({
        data: {
          conversationId: newConv.id,
          senderId: "system",
          content: `Conversation opened for Reservation #${resv.pickupCode || resv.id.slice(-6).toUpperCase()} (${resv.food.name}).`,
          messageType: "system",
        },
      });

      return NextResponse.json({
        success: true,
        data: { id: newConv.id },
      });
    }

    if (!otherParticipantId) {
      return NextResponse.json(
        { success: false, message: "Recipient ID or Reservation ID required" },
        { status: 400 }
      );
    }

    // Check for existing conversation with participants
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participantIds: { has: userId } },
          { participantIds: { has: otherParticipantId } },
          { reservationId: null },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        data: { id: existing.id },
      });
    }

    const created = await prisma.conversation.create({
      data: {
        participantIds: [userId, otherParticipantId],
        foodId: targetFoodId,
        lastMessageAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: created.id },
    });
  } catch (error: any) {
    console.error("POST /api/conversations error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create conversation" },
      { status: 500 }
    );
  }
}
