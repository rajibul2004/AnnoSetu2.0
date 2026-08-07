import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { subscribeConversationStream, publishConversationEvent } from "@/lib/sseHub";
import { trackUserOnline, trackUserOffline } from "@/lib/presenceTracker";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: conversationId } = await params;
    const userId = session.user.id;
    const encoder = new TextEncoder();

    // Mark user online in this conversation and broadcast to peers
    trackUserOnline(userId, conversationId);
    publishConversationEvent(conversationId, "user:presence", {
      userId,
      isOnline: true,
      lastSeen: new Date().toISOString(),
    });

    const stream = new ReadableStream({
      start(controller) {
        // Send initial flush comments and connected event
        controller.enqueue(
          encoder.encode(`: ok\n\nevent: connected\ndata: ${JSON.stringify({ conversationId, userId })}\n\n`)
        );

        // Subscribe to real-time events for this conversation
        const unsubscribe = subscribeConversationStream(
          conversationId,
          (event, data) => {
            try {
              controller.enqueue(
                encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
              );
            } catch {
              // Stream closed
            }
          }
        );

        // Periodic heartbeat ping to keep connection alive and update presence
        const pingInterval = setInterval(() => {
          try {
            trackUserOnline(userId, conversationId);
            controller.enqueue(encoder.encode(`event: ping\ndata: {}\n\n`));
          } catch {
            clearInterval(pingInterval);
          }
        }, 15000);

        // Clean up on disconnect
        req.signal.addEventListener("abort", () => {
          clearInterval(pingInterval);
          unsubscribe();
          trackUserOffline(userId, conversationId);
          publishConversationEvent(conversationId, "user:presence", {
            userId,
            isOnline: false,
            lastSeen: new Date().toISOString(),
          });
          try {
            controller.close();
          } catch {
            // Already closed
          }
        });
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform, no-store",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disables Nginx buffering if deployed behind reverse proxy
      },
    });
  } catch (error: any) {
    console.error("SSE stream route error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
