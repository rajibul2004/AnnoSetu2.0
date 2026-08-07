import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useCallback, useState } from "react";
import toast from "react-hot-toast";
import {
  playMessageSentSound,
  playMessageReceivedSound,
  isSoundEnabled,
  toggleSoundEnabled,
} from "@/lib/notificationAudio";
import {
  subscribeToStreamEvent,
  subscribeToStreamStatus,
  ConnectionState,
} from "@/lib/clientStreamManager";
import type {
  ConversationDTO,
  ConversationDetailDTO,
  SendMessagePayload,
  MessageDTO,
} from "@/types/message";

export function useConversations(currentUserId?: string) {
  const queryClient = useQueryClient();
  const [typingMap, setTypingMap] = useState<Record<string, string>>({});
  const typingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  const query = useQuery<ConversationDTO[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const json = await res.json();
      return json.data || [];
    },
    staleTime: 5000,
    refetchInterval: 5000,
  });

  // ⚡ REAL-TIME INBOX STREAM: Instant reorder, live typing in inbox list, presence, and read sync
  useEffect(() => {
    if (typeof window === "undefined") return;

    const streamUrl = "/api/notifications/stream";
    const channelKey = "user_notifications_stream";

    // 1. New Message: Move conversation to top & update preview
    const unsubNewMsg = subscribeToStreamEvent(
      channelKey,
      streamUrl,
      "conversation:new_message",
      (payload: { conversationId: string; lastMessage: MessageDTO; lastMessageAt: string }) => {
        if (!payload?.conversationId) return;

        queryClient.setQueryData<ConversationDTO[]>(["conversations"], (oldList) => {
          if (!oldList) return oldList;

          const targetIndex = oldList.findIndex((c) => c.id === payload.conversationId);
          if (targetIndex === -1) {
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
            return oldList;
          }

          const target = oldList[targetIndex];
          const isSender = payload.lastMessage.senderId === currentUserId;
          const updatedTarget: ConversationDTO = {
            ...target,
            lastMessage: payload.lastMessage,
            lastMessageAt: payload.lastMessageAt,
            unreadCount: isSender ? target.unreadCount : target.unreadCount + 1,
          };

          const remaining = oldList.filter((c) => c.id !== payload.conversationId);
          return [updatedTarget, ...remaining];
        });
      }
    );

    // 2. Real-time Typing in Inbox list
    const unsubTyping = subscribeToStreamEvent(
      channelKey,
      streamUrl,
      "conversation:typing",
      (payload: { conversationId: string; userId: string; userName: string; isTyping: boolean }) => {
        if (!payload?.conversationId || payload.userId === currentUserId) return;

        const convId = payload.conversationId;
        if (payload.isTyping) {
          setTypingMap((prev) => ({ ...prev, [convId]: payload.userName }));

          if (typingTimeoutsRef.current[convId]) {
            clearTimeout(typingTimeoutsRef.current[convId]);
          }
          typingTimeoutsRef.current[convId] = setTimeout(() => {
            setTypingMap((prev) => {
              const copy = { ...prev };
              delete copy[convId];
              return copy;
            });
          }, 3500);
        } else {
          setTypingMap((prev) => {
            const copy = { ...prev };
            delete copy[convId];
            return copy;
          });
        }
      }
    );

    // 3. Real-time Read receipts sync for inbox badges
    const unsubRead = subscribeToStreamEvent(
      channelKey,
      streamUrl,
      "conversation:read",
      (payload: { conversationId: string; readBy: string }) => {
        if (!payload?.conversationId) return;

        queryClient.setQueryData<ConversationDTO[]>(["conversations"], (oldList) => {
          if (!oldList) return oldList;
          return oldList.map((c) =>
            c.id === payload.conversationId && payload.readBy === currentUserId
              ? { ...c, unreadCount: 0 }
              : c
          );
        });
      }
    );

    // 4. Live Presence across all contacts in inbox
    const unsubPresence = subscribeToStreamEvent(
      channelKey,
      streamUrl,
      "user:presence",
      (payload: { userId: string; isOnline: boolean; lastSeen?: string }) => {
        if (!payload?.userId || payload.userId === currentUserId) return;

        queryClient.setQueryData<ConversationDTO[]>(["conversations"], (oldList) => {
          if (!oldList) return oldList;
          return oldList.map((c) =>
            c.otherParticipant.id === payload.userId
              ? {
                  ...c,
                  otherParticipant: {
                    ...c.otherParticipant,
                    isOnline: payload.isOnline,
                    lastSeen: payload.lastSeen || c.otherParticipant.lastSeen,
                  },
                }
              : c
          );
        });
      }
    );

    return () => {
      unsubNewMsg();
      unsubTyping();
      unsubRead();
      unsubPresence();
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
    };
  }, [currentUserId, queryClient]);

  return {
    ...query,
    typingMap,
  };
}

export function useConversation(conversationId: string | null, currentUserId?: string) {
  const queryClient = useQueryClient();
  const seenMsgIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);
  const currentConvIdRef = useRef<string | null>(conversationId);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>("connecting");

  // Reset tracking on conversation switch
  useEffect(() => {
    if (currentConvIdRef.current !== conversationId) {
      currentConvIdRef.current = conversationId;
      seenMsgIdsRef.current = new Set();
      isInitialLoadRef.current = true;
    }
  }, [conversationId]);

  // Initial fetch and baseline cache
  const query = useQuery<ConversationDetailDTO>({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      if (!conversationId) throw new Error("No conversation ID");
      const res = await fetch(`/api/conversations/${conversationId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch conversation");
      const json = await res.json();
      const rawData = json.data;
      if (!rawData) return rawData;

      // Normalize isSelf and sender display name
      const normalizedMessages = (rawData.messages || []).map((m: MessageDTO) => {
        const isMsgSelf = Boolean(
          m.isSelf || (currentUserId && m.senderId === currentUserId) || m.id.startsWith("temp-")
        );
        return {
          ...m,
          isSelf: isMsgSelf,
          senderName: isMsgSelf ? "You" : m.senderName,
        };
      });

      return {
        ...rawData,
        messages: normalizedMessages,
      };
    },
    enabled: !!conversationId,
    staleTime: 3000,
    refetchInterval: connectionStatus === "connected" ? 8000 : 2500,
  });

  // Track initial message IDs quietly
  useEffect(() => {
    const messages = query.data?.messages;
    if (!messages || messages.length === 0) return;

    if (isInitialLoadRef.current) {
      messages.forEach((m) => {
        if (m.id) seenMsgIdsRef.current.add(m.id);
      });
      isInitialLoadRef.current = false;
    }
  }, [query.data?.messages]);

  // ⚡ REAL-TIME MULTIPLEXED SSE STREAM: Instant push for messages, read receipts & presence
  useEffect(() => {
    if (!conversationId || typeof window === "undefined") return;

    const streamUrl = `/api/conversations/${conversationId}/stream`;
    const channelKey = `conversation_${conversationId}`;

    const unsubStatus = subscribeToStreamStatus(channelKey, streamUrl, (status) => {
      setConnectionStatus(status);
    });

    // 1. New incoming message
    const unsubMsg = subscribeToStreamEvent(
      channelKey,
      streamUrl,
      "message:new",
      (incomingMsg: MessageDTO) => {
        if (!incomingMsg?.id) return;

        const isMsgSelf = Boolean(
          incomingMsg.isSelf ||
          (currentUserId && incomingMsg.senderId === currentUserId) ||
          incomingMsg.id.startsWith("temp-")
        );

        const normalizedMsg: MessageDTO = {
          ...incomingMsg,
          isSelf: isMsgSelf,
          senderName: isMsgSelf ? "You" : incomingMsg.senderName,
        };

        queryClient.setQueryData<ConversationDetailDTO>(
          ["conversation", conversationId],
          (old) => {
            if (!old) return old;

            const existingIndex = old.messages.findIndex(
              (m) =>
                m.id === normalizedMsg.id ||
                (m.id.startsWith("temp-") &&
                  m.content === normalizedMsg.content &&
                  (m.senderId === normalizedMsg.senderId || isMsgSelf))
            );

            let newMessages: MessageDTO[];
            if (existingIndex !== -1) {
              newMessages = [...old.messages];
              newMessages[existingIndex] = normalizedMsg;
            } else {
              newMessages = [...old.messages, normalizedMsg];
            }

            return {
              ...old,
              messages: newMessages,
              lastMessage: normalizedMsg,
              lastMessageAt: normalizedMsg.createdAt,
            };
          }
        );

        // Sound logic: ONLY play incoming chime if it is genuinely from the other participant
        if (!seenMsgIdsRef.current.has(normalizedMsg.id)) {
          seenMsgIdsRef.current.add(normalizedMsg.id);
          if (!isMsgSelf && normalizedMsg.messageType !== "system") {
            playMessageReceivedSound();
          }
        }

        // Fast update conversation inbox list
        queryClient.setQueryData<ConversationDTO[]>(["conversations"], (oldList) => {
          if (!oldList) return oldList;
          return oldList.map((c) =>
            c.id === conversationId
              ? { ...c, lastMessage: normalizedMsg, lastMessageAt: normalizedMsg.createdAt }
              : c
          );
        });
      }
    );

    // 2. Read receipts (Double Cyan Checks ✓✓)
    const unsubRead = subscribeToStreamEvent(
      channelKey,
      streamUrl,
      "message:read",
      (payload: { readAt?: string }) => {
        const readAt = payload?.readAt || new Date().toISOString();

        queryClient.setQueryData<ConversationDetailDTO>(
          ["conversation", conversationId],
          (old) => {
            if (!old) return old;
            return {
              ...old,
              messages: old.messages.map((m) => {
                if (m.isSelf || (currentUserId && m.senderId === currentUserId)) {
                  return { ...m, isRead: true, readAt };
                }
                return m;
              }),
            };
          }
        );
      }
    );

    // 3. Live Presence & Online Indicator
    const unsubPresence = subscribeToStreamEvent(
      channelKey,
      streamUrl,
      "user:presence",
      (payload: { userId: string; isOnline: boolean; lastSeen?: string }) => {
        if (!payload?.userId || payload.userId === currentUserId) return;

        queryClient.setQueryData<ConversationDetailDTO>(
          ["conversation", conversationId],
          (old) => {
            if (!old || !old.otherParticipant || old.otherParticipant.id !== payload.userId) {
              return old;
            }
            return {
              ...old,
              otherParticipant: {
                ...old.otherParticipant,
                isOnline: payload.isOnline,
                lastSeen: payload.lastSeen || old.otherParticipant.lastSeen,
              },
            };
          }
        );
      }
    );

    return () => {
      unsubStatus();
      unsubMsg();
      unsubRead();
      unsubPresence();
    };
  }, [conversationId, currentUserId, queryClient]);

  return {
    ...query,
    connectionStatus,
  };
}

export function useSendMessage(conversationId: string | null, currentUserId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      if (!conversationId) throw new Error("No conversation ID");
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to send message");
      }
      const json = await res.json();
      return json.data as MessageDTO;
    },
    onMutate: async (newPayload) => {
      if (!conversationId) return;

      // Optimistic 0ms sound feedback
      playMessageSentSound();

      await queryClient.cancelQueries({ queryKey: ["conversation", conversationId] });

      const previousConversation = queryClient.getQueryData<ConversationDetailDTO>([
        "conversation",
        conversationId,
      ]);

      if (previousConversation) {
        const tempId = "temp-" + Date.now();
        const optimisticMsg: MessageDTO = {
          id: tempId,
          conversationId,
          senderId: currentUserId || "me",
          senderName: "You",
          content: newPayload.content,
          messageType: newPayload.messageType || "text",
          metadata: newPayload.metadata || null,
          isRead: false,
          readAt: null,
          createdAt: new Date().toISOString(),
          isSelf: true,
        };

        queryClient.setQueryData<ConversationDetailDTO>(
          ["conversation", conversationId],
          {
            ...previousConversation,
            messages: [...previousConversation.messages, optimisticMsg],
            lastMessage: optimisticMsg,
            lastMessageAt: optimisticMsg.createdAt,
          }
        );
      }

      return { previousConversation };
    },
    onError: (err: any, _newPayload, context) => {
      if (conversationId && context?.previousConversation) {
        queryClient.setQueryData(
          ["conversation", conversationId],
          context.previousConversation
        );
      }
      toast.error(err.message || "Could not send message");
    },
    onSuccess: (savedMessage) => {
      if (!conversationId || !savedMessage) return;

      const confirmedMsg: MessageDTO = {
        ...savedMessage,
        isSelf: true,
        senderName: "You",
      };

      queryClient.setQueryData<ConversationDetailDTO>(
        ["conversation", conversationId],
        (old) => {
          if (!old) return old;

          const existingIndex = old.messages.findIndex(
            (m) =>
              m.id === confirmedMsg.id ||
              (m.id.startsWith("temp-") && m.content === confirmedMsg.content)
          );

          let newMessages: MessageDTO[];
          if (existingIndex !== -1) {
            newMessages = [...old.messages];
            newMessages[existingIndex] = confirmedMsg;
          } else {
            newMessages = [...old.messages.filter((m) => !m.id.startsWith("temp-")), confirmedMsg];
          }

          return {
            ...old,
            messages: newMessages,
            lastMessage: confirmedMsg,
            lastMessageAt: confirmedMsg.createdAt,
          };
        }
      );

      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useTypingIndicator(conversationId: string | null, currentUserId?: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const isTypingActiveRef = useRef(false);
  const stopTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clearRemoteTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ⚡ REAL-TIME TYPING PUSH VIA MULTIPLEXED SSE
  useEffect(() => {
    if (!conversationId || typeof window === "undefined") return;

    const streamUrl = `/api/conversations/${conversationId}/stream`;
    const channelKey = `conversation_${conversationId}`;

    const unsubTyping = subscribeToStreamEvent(
      channelKey,
      streamUrl,
      "user:typing",
      (payload: { userId: string; userName: string; isTyping: boolean }) => {
        if (!payload?.userId || payload.userId === currentUserId) return;

        if (payload.isTyping) {
          setTypingUsers((prev) =>
            prev.includes(payload.userName) ? prev : [...prev, payload.userName]
          );

          if (clearRemoteTypingTimeoutRef.current) {
            clearTimeout(clearRemoteTypingTimeoutRef.current);
          }
          clearRemoteTypingTimeoutRef.current = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((name) => name !== payload.userName));
          }, 3500);
        } else {
          setTypingUsers((prev) => prev.filter((name) => name !== payload.userName));
        }
      }
    );

    return () => {
      unsubTyping();
      if (clearRemoteTypingTimeoutRef.current) {
        clearTimeout(clearRemoteTypingTimeoutRef.current);
      }
    };
  }, [conversationId, currentUserId]);

  const sendTypingPing = useCallback(
    async (isTyping: boolean) => {
      if (!conversationId) return;
      try {
        await fetch(`/api/conversations/${conversationId}/typing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isTyping }),
        });
      } catch {
        // Silently catch
      }
    },
    [conversationId]
  );

  const handleUserTyping = useCallback(() => {
    if (!conversationId) return;

    if (!isTypingActiveRef.current) {
      isTypingActiveRef.current = true;
      void sendTypingPing(true);
    }

    if (stopTypingTimeoutRef.current) {
      clearTimeout(stopTypingTimeoutRef.current);
    }

    stopTypingTimeoutRef.current = setTimeout(() => {
      isTypingActiveRef.current = false;
      void sendTypingPing(false);
    }, 2500);
  }, [conversationId, sendTypingPing]);

  const handleUserStopTyping = useCallback(() => {
    if (stopTypingTimeoutRef.current) {
      clearTimeout(stopTypingTimeoutRef.current);
    }
    isTypingActiveRef.current = false;
    void sendTypingPing(false);
  }, [sendTypingPing]);

  return {
    typingUsers,
    isOtherTyping: typingUsers.length > 0,
    typingText:
      typingUsers.length === 1
        ? `${typingUsers[0]} is typing...`
        : typingUsers.length > 1
        ? `${typingUsers.join(", ")} are typing...`
        : "",
    handleUserTyping,
    handleUserStopTyping,
  };
}

export function useMarkConversationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await fetch(`/api/conversations/${conversationId}/read`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unreadMessageCount"] });
    },
  });
}

export function useUnreadMessageCount() {
  const queryClient = useQueryClient();

  // Listen to live stream events to zero or increment count
  useEffect(() => {
    if (typeof window === "undefined") return;

    const streamUrl = "/api/notifications/stream";
    const channelKey = "user_notifications_stream";

    const unsubNewMsg = subscribeToStreamEvent(
      channelKey,
      streamUrl,
      "conversation:new_message",
      () => {
        queryClient.invalidateQueries({ queryKey: ["unreadMessageCount"] });
      }
    );

    const unsubRead = subscribeToStreamEvent(
      channelKey,
      streamUrl,
      "conversation:read",
      () => {
        queryClient.invalidateQueries({ queryKey: ["unreadMessageCount"] });
      }
    );

    return () => {
      unsubNewMsg();
      unsubRead();
    };
  }, [queryClient]);

  return useQuery<{ unreadCount: number }>({
    queryKey: ["unreadMessageCount"],
    queryFn: async () => {
      const res = await fetch("/api/messages/unread-count");
      if (!res.ok) return { unreadCount: 0 };
      const json = await res.json();
      return { unreadCount: json.unreadCount || 0 };
    },
    staleTime: 30000,
  });
}

export function useCreateOrGetConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      reservationId?: string;
      recipientId?: string;
      foodId?: string;
    }) => {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to open conversation");
      }
      const json = await res.json();
      return json.data as { id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useChatSoundSetting() {
  const [soundOn, setSoundOn] = useState<boolean>(true);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const toggleSound = useCallback(() => {
    const next = toggleSoundEnabled();
    setSoundOn(next);
    toast.success(next ? "Sound notifications enabled 🔔" : "Sound muted 🔕", {
      duration: 1500,
    });
  }, []);

  return { soundOn, toggleSound };
}
