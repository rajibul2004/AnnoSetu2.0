type SSEListener = (event: string, data: any) => void;

interface SSEHubState {
  conversationSubscribers: Map<string, Set<SSEListener>>;
  userSubscribers: Map<string, Set<SSEListener>>;
}

const globalForSSE = globalThis as unknown as {
  sseHubState?: SSEHubState;
};

if (!globalForSSE.sseHubState) {
  globalForSSE.sseHubState = {
    conversationSubscribers: new Map(),
    userSubscribers: new Map(),
  };
}

const sseHubState: SSEHubState = globalForSSE.sseHubState;

// ---------------------------------------------------------------------------
// Conversation Stream Management
// ---------------------------------------------------------------------------

export function subscribeConversationStream(
  conversationId: string,
  listener: SSEListener
): () => void {
  let subscribers = sseHubState.conversationSubscribers.get(conversationId);
  if (!subscribers) {
    subscribers = new Set();
    sseHubState.conversationSubscribers.set(conversationId, subscribers);
  }
  subscribers.add(listener);

  return () => {
    subscribers?.delete(listener);
    if (subscribers && subscribers.size === 0) {
      sseHubState.conversationSubscribers.delete(conversationId);
    }
  };
}

export function publishConversationEvent(
  conversationId: string,
  event: string,
  data: any
): void {
  const subscribers = sseHubState.conversationSubscribers.get(conversationId);
  if (subscribers && subscribers.size > 0) {
    subscribers.forEach((listener) => {
      try {
        listener(event, data);
      } catch (err) {
        console.warn("SSE conversation listener error:", err);
      }
    });
  }
}

// ---------------------------------------------------------------------------
// User Notifications Stream Management
// ---------------------------------------------------------------------------

export function subscribeUserStream(
  userId: string,
  listener: SSEListener
): () => void {
  let subscribers = sseHubState.userSubscribers.get(userId);
  if (!subscribers) {
    subscribers = new Set();
    sseHubState.userSubscribers.set(userId, subscribers);
  }
  subscribers.add(listener);

  return () => {
    subscribers?.delete(listener);
    if (subscribers && subscribers.size === 0) {
      sseHubState.userSubscribers.delete(userId);
    }
  };
}

export function publishUserEvent(
  userId: string,
  event: string,
  data: any
): void {
  const subscribers = sseHubState.userSubscribers.get(userId);
  if (subscribers && subscribers.size > 0) {
    subscribers.forEach((listener) => {
      try {
        listener(event, data);
      } catch (err) {
        console.warn("SSE user listener error:", err);
      }
    });
  }
}
