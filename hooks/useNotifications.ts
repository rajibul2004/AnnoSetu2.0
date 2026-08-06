"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { playNotificationSound } from "@/lib/notificationAudio";
import type { NotificationDTO, NotificationListResponse } from "@/types/notification";

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchNotifications(limit = 30, offset = 0): Promise<NotificationListResponse> {
  const res = await fetch(`/api/notifications?limit=${limit}&offset=${offset}`, {
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Failed to load notifications");
  return json.data;
}

async function fetchUnreadCount(): Promise<number> {
  const res = await fetch("/api/notifications/unread-count", {
    cache: "no-store",
  });
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

/** Full notification list with pagination and real-time live sync. */
export function useNotifications(limit = 30, offset = 0) {
  const query = useQuery({
    queryKey: ["notifications", limit, offset],
    queryFn: () => fetchNotifications(limit, offset),
    retry: false,
    staleTime: 0,
    refetchInterval: 4_000, // fast background sync so it updates without page reload
    refetchOnWindowFocus: true,
  });

  return {
    notifications: query.data?.notifications ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

/** Lightweight unread count for navbar bell with chime on new notifications. */
export function useUnreadCount() {
  const prevCountRef = useRef<number | null>(null);
  const isFirstLoadRef = useRef<boolean>(true);

  const query = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadCount,
    refetchInterval: 4_000,
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: false,
  });

  const count = query.data ?? 0;

  useEffect(() => {
    if (!query.isSuccess) return;

    if (isFirstLoadRef.current) {
      // Initialize without playing sound on first load
      prevCountRef.current = count;
      isFirstLoadRef.current = false;
      return;
    }

    // Only play sound if new unread notifications arrive while user is active
    if (prevCountRef.current !== null && count > prevCountRef.current) {
      playNotificationSound();
    }
    prevCountRef.current = count;
  }, [count, query.isSuccess]);

  return count;
}

/** Mark a single notification as read. */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markReadRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
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
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });
}

/** Mark all notifications as read. */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllReadRequest,
    onSuccess: () => {
      queryClient.setQueryData(["notifications", "unread-count"], 0);
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
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---------------------------------------------------------------------------
// Real-time SSE subscription
// ---------------------------------------------------------------------------

/**
 * Opens a persistent SSE connection to /api/notifications/stream.
 * When a new notification arrives:
 * 1. Plays a notification sound chime
 * 2. Invalidates and refetches React Query cache instantly
 * 3. Shows a toast for quick awareness
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
        
        // Play notification audio chime
        playNotificationSound();

        // Invalidate and refetch immediately
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
        
        if (notification.type === "reservation_request") {
          queryClient.invalidateQueries({ queryKey: ["incoming-reservations"] });
          queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
        } else if (
          notification.type === "reservation_confirmed" ||
          notification.type === "system_alert"
        ) {
          queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
          queryClient.invalidateQueries({ queryKey: ["food"] });
        }

        // Show a visual toast notification
        toast(notification.message, {
          icon:
            notification.priority === "urgent"
              ? "🚨"
              : notification.priority === "high"
              ? "🔔"
              : "✨",
          duration: 5000,
        });
      } catch {
        // Ignore parse error
      }
    });

    es.addEventListener("unread_count", (e: MessageEvent) => {
      try {
        const { count } = JSON.parse(e.data) as { count: number };
        queryClient.setQueryData(["notifications", "unread-count"], count);
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } catch {
        // Ignore parse error
      }
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      // Reconnect after 3 s
      setTimeout(connect, 3_000);
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
