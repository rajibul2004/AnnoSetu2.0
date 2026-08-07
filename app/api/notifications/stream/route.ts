import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { subscribeUserStream } from "@/lib/sseHub";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`: ok\n\nevent: connected\ndata: ${JSON.stringify({ userId })}\n\n`)
        );

        const unsubscribe = subscribeUserStream(userId, (event, data) => {
          try {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          } catch {
            // Stream closed
          }
        });

        const pingInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`event: ping\ndata: {}\n\n`));
          } catch {
            clearInterval(pingInterval);
          }
        }, 15000);

        req.signal.addEventListener("abort", () => {
          clearInterval(pingInterval);
          unsubscribe();
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
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    console.error("Notifications SSE stream error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
