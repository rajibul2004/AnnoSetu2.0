import { auth } from "@/auth";
import {
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from "@/services/notificationService";

/**
 * GET /api/notifications/stream
 *
 * Server-Sent Events endpoint for real-time notification delivery.
 *
 * The client opens a persistent HTTP connection. When a new notification is
 * created for the authenticated user, `notificationService.createNotification`
 * pushes an `event: notification` SSE frame directly to that connection.
 *
 * The stream sends a heartbeat every 30 s to prevent proxy timeouts.
 *
 * NOTE: Next.js App Router requires `runtime = "nodejs"` for persistent
 * streaming responses — the default Edge runtime closes streams early.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl;
      subscribeToNotifications(userId, controller);

      // Send initial "connected" event so the client knows the stream is live
      const connected = `event: connected\ndata: ${JSON.stringify({ userId })}\n\n`;
      ctrl.enqueue(new TextEncoder().encode(connected));
    },
    cancel() {
      unsubscribeFromNotifications(userId, controller);
    },
  });

  // Heartbeat — keeps the connection alive through proxies and load balancers
  const heartbeatInterval = setInterval(() => {
    try {
      controller?.enqueue(new TextEncoder().encode(": heartbeat\n\n"));
    } catch {
      clearInterval(heartbeatInterval);
    }
  }, 30_000);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering
    },
  });
}
