"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast, { showModernToast, showMessageToast } from "@/lib/toast";
import { playNotificationSound, playMessageReceivedSound } from "@/lib/notificationAudio";
import { isConversationActive } from "@/lib/activeChatTracker";
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

import { subscribeToStreamEvent } from "@/lib/clientStreamManager";

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** ⚡ Real-Time Notification SSE Stream Hook */
export function useNotificationStream(enabled: boolean = true) {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const streamUrl = "/api/notifications/stream";
    const channelKey = "user_notifications_stream";

    const cleanup = subscribeToStreamEvent(
      channelKey,
      streamUrl,
      "notification:new",
      (notif: NotificationDTO) => {
        if (!notif?.id) return;

        // 1. Message notification logic
        if (notif.type === "new_message") {
          const convId = (notif.data as Record<string, any>)?.conversationId as string | undefined;

          // Always refresh unread messages badge and conversations list
          queryClient.invalidateQueries({ queryKey: ["unreadMessageCount"] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });

          // If the user is currently chatting in this exact conversation, suppress popup & audio chime
          if (isConversationActive(convId)) {
            return;
          }

          // Otherwise, play chat chime and display rich interactive reply toast
          playMessageReceivedSound();
          const senderName = ((notif.data as Record<string, any>)?.senderName as string) || "Someone";

          showMessageToast({
            senderName,
            senderRole: ((notif.data as Record<string, any>)?.senderRole as string) || undefined,
            message: notif.message,
            conversationId: convId || "",
            onOpen: () => {
              if (convId) router.push(`/protected/messages?conversationId=${convId}`);
            },
          });
          return;
        }

        // 2. Standard system & reservation notifications
        playNotificationSound();

        // Increment unread count in cache immediately
        queryClient.setQueryData<number>(
          ["notifications", "unread-count"],
          (old = 0) => old + 1
        );

        // Invalidate notification lists so fresh item is displayed
        queryClient.invalidateQueries({ queryKey: ["notifications"] });

        showModernToast({
          title: notif.title,
          description: notif.message,
          action: notif.actionUrl
            ? {
                label: "View",
                onClick: () => router.push(notif.actionUrl!),
              }
            : undefined,
        });
      }
    );

    return cleanup;
  }, [enabled, queryClient, router]);
}

/** Full notification list with real-time SSE push & query sync */
export function useNotifications(limit = 30, offset = 0) {
  const query = useQuery({
    queryKey: ["notifications", limit, offset],
    queryFn: () => fetchNotifications(limit, offset),
    retry: false,
    staleTime: 5000,
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

/** Lightweight unread count for navbar bell with real-time SSE stream push */
export function useUnreadCount() {
  const prevCountRef = useRef<number | null>(null);
  const isFirstLoadRef = useRef<boolean>(true);

  const query = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadCount,
    staleTime: 10000,
    refetchInterval: 12000, // Background fallback sync
    refetchOnWindowFocus: true,
    retry: false,
  });

  const count = query.data ?? 0;

  // Track initial load without false chime triggers
  useEffect(() => {
    if (!query.isSuccess) return;

    if (isFirstLoadRef.current) {
      prevCountRef.current = count;
      isFirstLoadRef.current = false;
      return;
    }

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

/** Mark all notifications as read at once. */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllReadRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.setQueryData(["notifications", "unread-count"], 0);
    },
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
  });
}
