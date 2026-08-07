import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { publishConversationEvent, publishUserEvent } from "@/lib/sseHub";
import type { MessageDTO, SendMessagePayload } from "@/types/message";

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
    const body: SendMessagePayload = await req.json();

    if (!body.content || !body.content.trim()) {
      return NextResponse.json(
        { success: false, message: "Message content cannot be empty" },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        reservation: {
          include: {
            food: true,
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

    const recipientId = conversation.participantIds.find((id) => id !== userId);

    // Create the message in database
    const msg = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: body.content.trim(),
        messageType: body.messageType || "text",
        metadata: body.metadata || undefined,
        isRead: false,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Resolve sender's display name
    const senderProfile = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        individualProfile: { select: { name: true } },
        restaurantProfile: { select: { restaurantName: true } },
        ngoProfile: { select: { ngoName: true } },
      },
    });

    let senderName = senderProfile?.email.split("@")[0] || "User";
    if (senderProfile?.role === "restaurant" && senderProfile.restaurantProfile) {
      senderName = senderProfile.restaurantProfile.restaurantName || senderName;
    } else if (senderProfile?.role === "ngo" && senderProfile.ngoProfile) {
      senderName = senderProfile.ngoProfile.ngoName || senderName;
    } else if (senderProfile?.individualProfile) {
      senderName = senderProfile.individualProfile.name || senderName;
    }

    // Canonical Message DTO broadcasted to the conversation
    const broadcastMessageDTO: MessageDTO = {
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      senderName,
      senderRole: session.user.role,
      content: msg.content,
      messageType: msg.messageType as any,
      metadata: msg.metadata as any,
      isRead: msg.isRead,
      readAt: null,
      createdAt: msg.createdAt.toISOString(),
      // Note: isSelf is computed by the client according to whether current user matches senderId
    };

    // ⚡ REAL-TIME INSTANT PUSH: Broadcast to active SSE stream subscribers in this conversation
    publishConversationEvent(conversationId, "message:new", broadcastMessageDTO);

    // ⚡ REAL-TIME INBOX PUSH: Update inbox conversation list for both parties
    const inboxUpdatePayload = {
      conversationId,
      lastMessage: broadcastMessageDTO,
      lastMessageAt: broadcastMessageDTO.createdAt,
    };
    if (recipientId) {
      publishUserEvent(recipientId, "conversation:new_message", inboxUpdatePayload);
    }
    publishUserEvent(userId, "conversation:new_message", inboxUpdatePayload);

    // Send in-app notification & push to recipient
    if (recipientId) {
      const foodTitle = conversation.reservation?.food?.name
        ? ` regarding ${conversation.reservation.food.name}`
        : "";

      try {
        const notif = await prisma.notification.create({
          data: {
            userId: recipientId,
            type: "new_message",
            priority: "medium",
            title: `New message from ${senderName}`,
            message: `${body.content.slice(0, 80)}${body.content.length > 80 ? "..." : ""}${foodTitle}`,
            actionUrl: `/protected/messages?conversationId=${conversationId}`,
            data: {
              conversationId,
              senderId: userId,
              senderName,
              reservationId: conversation.reservationId,
            },
          },
        });

        // ⚡ REAL-TIME NOTIFICATION PUSH
        publishUserEvent(recipientId, "notification:new", notif);
      } catch (notifErr) {
        console.warn("Failed to create notification for message:", notifErr);
      }
    }

    // Response to POST request (sender's direct response)
    return NextResponse.json({
      success: true,
      data: {
        ...broadcastMessageDTO,
        isSelf: true,
        senderName: "You",
      },
    });
  } catch (error: any) {
    console.error("POST /api/conversations/[id]/messages error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
