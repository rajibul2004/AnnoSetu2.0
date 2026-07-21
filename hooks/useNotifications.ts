"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { NotificationDTO, NotificationListResponse } from "@/types/notification";

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchNotifications(limit = 30, offset = 0): Promise<NotificationListResponse> {
  const res = await fetch(`/api/notifications?limit=${limit}&offset=${offset}`);
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Failed to load notifications");
  return json.data;
}

async function fetchUnreadCount(): Promise<number> {
  const res = await fetch("/api/notifications/unread-count");
  const json = await res.json();
  if (!res.ok || !json.success) return 0;
  return json.data.count;
}

async function markReadRequest(id: string): Promise<void> {
  await fetch(`/api/notifications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "read" }),
  });
}

async function markClickedRequest(id: string): Promise<void> {
  await fetch(`/api/notifications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "click" }),
  });
}

async function markAllReadRequest(): Promise<void> {
  const res = await fetch("/api/notifications", { method: "POST" });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Failed to mark all as read");
}

async function deleteNotificationRequest(id: string): Promise<void> {
  const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete notification");
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Full notification list with pagination. */
export function useNotifications(limit = 30, offset = 0) {
  const query = useQuery({
    queryKey: ["notifications", limit, offset],
    queryFn: () => fetchNotifications(limit, offset),
    retry: false,
    staleTime: 30_000,
  });

  return {
    notifications: query.data?.notifications ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

/** Lightweight unread count for the navbar bell badge. */
export function useUnreadCount() {
  const query = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadCount,
    refetchInterval: 60_000, // poll every minute as a fallback
    staleTime: 30_000,
    retry: false,
  });

  return query.data ?? 0;
}

/** Mark a single notification as read. */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markReadRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/** Mark a single notification as clicked (also marks it as read). */
export function useMarkAsClicked() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markClickedRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/** Mark all notifications as read. */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllReadRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Delete a single notification. */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNotificationRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---------------------------------------------------------------------------
// Real-time SSE subscription
// ---------------------------------------------------------------------------

/**
 * Opens a persistent SSE connection to /api/notifications/stream.
 * When a new notification arrives the React Query cache is invalidated,
 * triggering an automatic re-fetch of the notification list and count.
 * Falls back gracefully if the connection drops.
 */
export function useNotificationStream(enabled: boolean) {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;
    if (esRef.current) esRef.current.close();

    const es = new EventSource("/api/notifications/stream");
    esRef.current = es;

    es.addEventListener("notification", (e: MessageEvent) => {
      try {
        const notification: NotificationDTO = JSON.parse(e.data);
        // Invalidate so the bell count and list re-fetch
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        
        if (notification.type === "reservation_request") {
          queryClient.invalidateQueries({ queryKey: ["incoming-reservations"] });
        }

        // Show a toast for high-priority notifications
        if (notification.priority === "high" || notification.priority === "urgent") {
          toast(notification.message, {
            icon: notification.priority === "urgent" ? "🚨" : "🔔",
            duration: 5000,
          });
        }
      } catch {
        // malformed event — ignore
      }
    });

    es.addEventListener("unread_count", (e: MessageEvent) => {
      try {
        const { count } = JSON.parse(e.data) as { count: number };
        queryClient.setQueryData(["notifications", "unread-count"], count);
      } catch {
        // ignore
      }
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      // Reconnect after 5 s
      setTimeout(connect, 5_000);
    };
  }, [enabled, queryClient]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect]);
}
