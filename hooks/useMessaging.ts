import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useCallback, useState } from "react";
import toast from "react-hot-toast";
import {
  playMessageSentSound,
  playMessageReceivedSound,
  isSoundEnabled,
  toggleSoundEnabled,
} from "@/lib/notificationAudio";
import type {
  ConversationDTO,
  ConversationDetailDTO,
  SendMessagePayload,
  MessageDTO,
} from "@/types/message";

export function useConversations() {
  return useQuery<ConversationDTO[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const json = await res.json();
      return json.data || [];
    },
    refetchInterval: 5000, // Background polling every 5 seconds
    staleTime: 2000,
  });
}

export function useConversation(conversationId: string | null) {
  const queryClient = useQueryClient();
  const seenMsgIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);
  const currentConvIdRef = useRef<string | null>(conversationId);

  // Reset tracking when conversation ID changes
  useEffect(() => {
    if (currentConvIdRef.current !== conversationId) {
      currentConvIdRef.current = conversationId;
      seenMsgIdsRef.current = new Set();
      isInitialLoadRef.current = true;
    }
  }, [conversationId]);

  const query = useQuery<ConversationDetailDTO>({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      if (!conversationId) throw new Error("No conversation ID");
      const res = await fetch(`/api/conversations/${conversationId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch conversation");
      const json = await res.json();
      return json.data;
    },
    enabled: !!conversationId,
    refetchInterval: 1800, // Fast 1.8s polling for near-instant message delivery
    staleTime: 1000,
  });

  // Accurate incoming message detection — only play sound on genuinely new incoming messages after initial load
  useEffect(() => {
    const messages = query.data?.messages;
    if (!messages || messages.length === 0) return;

    if (isInitialLoadRef.current) {
      // First load: Record all existing message IDs without playing any sound
      messages.forEach((m) => {
        if (m.id) seenMsgIdsRef.current.add(m.id);
      });
      isInitialLoadRef.current = false;
      return;
    }

    // Subsequent updates: Check for newly arrived messages from the other user
    let hasNewIncoming = false;
    for (const msg of messages) {
      if (msg.id && !seenMsgIdsRef.current.has(msg.id)) {
        seenMsgIdsRef.current.add(msg.id);
        if (!msg.isSelf && msg.messageType !== "system") {
          hasNewIncoming = true;
        }
      }
    }

    if (hasNewIncoming) {
      playMessageReceivedSound();
    }
  }, [query.data?.messages]);

  return query;
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

      // Optimistic sound feedback
      playMessageSentSound();

      // Cancel outgoing refetches so they don't overwrite our optimistic update
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

      // Replace optimistic message with actual saved server message
      queryClient.setQueryData<ConversationDetailDTO>(
        ["conversation", conversationId],
        (old) => {
          if (!old) return old;
          const filtered = old.messages.filter((m) => !m.id.startsWith("temp-"));
          return {
            ...old,
            messages: [...filtered, savedMessage],
            lastMessage: savedMessage,
            lastMessageAt: savedMessage.createdAt,
          };
        }
      );

      // Fast invalidate conversation list
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useTypingIndicator(conversationId: string | null) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const isTypingActiveRef = useRef(false);
  const stopTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Poll typing status from server
  const { data } = useQuery<{ typingUsers: string[] }>({
    queryKey: ["typing", conversationId],
    queryFn: async () => {
      if (!conversationId) return { typingUsers: [] };
      const res = await fetch(`/api/conversations/${conversationId}/typing`);
      if (!res.ok) return { typingUsers: [] };
      return res.json();
    },
    enabled: !!conversationId,
    refetchInterval: 2000,
    staleTime: 1500,
  });

  useEffect(() => {
    if (data?.typingUsers) {
      setTypingUsers(data.typingUsers);
    }
  }, [data?.typingUsers]);

  // Send typing signal to server with debouncing
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
        // Silently catch network drops for typing indicators
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
    }, 2800);
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
  return useQuery<{ unreadCount: number }>({
    queryKey: ["unreadMessageCount"],
    queryFn: async () => {
      const res = await fetch("/api/messages/unread-count");
      if (!res.ok) return { unreadCount: 0 };
      const json = await res.json();
      return { unreadCount: json.unreadCount || 0 };
    },
    refetchInterval: 6000,
    staleTime: 3000,
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
