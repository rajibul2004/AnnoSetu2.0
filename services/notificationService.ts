import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";
import type { CreateNotificationInput, NotificationDTO } from "@/types/notification";

// ---------------------------------------------------------------------------
// SSE subscriber registry — maps userId → Set of response controllers.
// In a single-process deployment (dev / single instance) this works well.
// For multi-instance production, replace with Redis pub/sub.
// ---------------------------------------------------------------------------
const subscribers = new Map<string, Set<ReadableStreamDefaultController<Uint8Array>>>();

export function subscribeToNotifications(
  userId: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
) {
  if (!subscribers.has(userId)) subscribers.set(userId, new Set());
  subscribers.get(userId)!.add(controller);
}

export function unsubscribeFromNotifications(
  userId: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
) {
  subscribers.get(userId)?.delete(controller);
  if (subscribers.get(userId)?.size === 0) subscribers.delete(userId);
}

/**
 * Push a server-sent event to all open SSE connections for a user.
 */
function pushToUser(userId: string, event: string, payload: unknown) {
  const controllers = subscribers.get(userId);
  if (!controllers || controllers.size === 0) return;
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  const bytes = new TextEncoder().encode(data);
  for (const ctrl of controllers) {
    try {
      ctrl.enqueue(bytes);
    } catch {
      // Connection already closed — will be cleaned up on disconnect
    }
  }
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

function toDTO(n: {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  data: unknown;
  actionUrl: string | null;
  isRead: boolean;
  isClicked: boolean;
  createdAt: Date;
}): NotificationDTO {
  return {
    id: n.id,
    type: n.type as NotificationDTO["type"],
    priority: n.priority as NotificationDTO["priority"],
    title: n.title,
    message: n.message,
    data: (n.data as Record<string, unknown>) ?? {},
    actionUrl: n.actionUrl,
    isRead: n.isRead,
    isClicked: n.isClicked,
    createdAt: n.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getNotifications(
  userId: string,
  limit = 30,
  offset = 0,
): Promise<{ notifications: NotificationDTO[]; unreadCount: number; total: number }> {
  const [rows, unreadCount, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return {
    notifications: rows.map(toDTO),
    unreadCount,
    total,
  };
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markAsRead(id: string, userId: string): Promise<NotificationDTO | null> {
  const n = await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
  if (n.count === 0) return null;
  const updated = await prisma.notification.findUnique({ where: { id } });
  return updated ? toDTO(updated) : null;
}

export async function markAsClicked(id: string, userId: string): Promise<NotificationDTO | null> {
  const n = await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true, isClicked: true },
  });
  if (n.count === 0) return null;
  const updated = await prisma.notification.findUnique({ where: { id } });
  return updated ? toDTO(updated) : null;
}

export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  // Push a "count reset" event to all open SSE connections
  pushToUser(userId, "unread_count", { count: 0 });
}

export async function deleteNotification(id: string, userId: string): Promise<boolean> {
  const result = await prisma.notification.deleteMany({ where: { id, userId } });
  return result.count > 0;
}

export async function createNotification(input: CreateNotificationInput): Promise<NotificationDTO> {
  const n = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      priority: input.priority ?? "medium",
      title: input.title,
      message: input.message,
      data: (input.data ?? {}) as Prisma.JsonObject,
      actionUrl: input.actionUrl ?? null,
    },
  });
  const dto = toDTO(n);
  // Push real-time event to any open SSE connections for this user
  pushToUser(input.userId, "notification", dto);
  return dto;
}

// ---------------------------------------------------------------------------
// Domain-specific helpers — call these from API route handlers to fire
// the right notification at the right moment without duplicating strings.
// ---------------------------------------------------------------------------

export function notifyReservationRequest(
  supplierId: string,
  reserverName: string,
  foodName: string,
  reservationId: string,
) {
  return createNotification({
    userId: supplierId,
    type: "reservation_request",
    priority: "high",
    title: "New Reservation Request",
    message: `${reserverName} wants to reserve "${foodName}"`,
    data: { reservationId },
    actionUrl: `/protected/reservation/${reservationId}/confirm`,
  });
}

export function notifyReservationConfirmed(
  reserverId: string,
  foodName: string,
  reservationId: string,
  pickupCode: string,
) {
  return createNotification({
    userId: reserverId,
    type: "reservation_confirmed",
    priority: "high",
    title: "Reservation Confirmed! 🎉",
    message: `Your reservation for "${foodName}" is confirmed. Pickup code: ${pickupCode}`,
    data: { reservationId, pickupCode },
    actionUrl: `/protected/reservation/${reservationId}`,
  });
}

export function notifyReservationCancelled(
  userId: string,
  foodName: string,
  reservationId: string,
  cancelledBy: "supplier" | "user",
) {
  return createNotification({
    userId,
    type: "system_alert",
    priority: "medium",
    title: "Reservation Cancelled",
    message:
      cancelledBy === "supplier"
        ? `The supplier cancelled your reservation for "${foodName}"`
        : `Your reservation for "${foodName}" has been cancelled`,
    data: { reservationId },
    actionUrl: `/protected/reservation/${reservationId}`,
  });
}
