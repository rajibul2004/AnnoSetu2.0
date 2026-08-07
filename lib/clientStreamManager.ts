/**
 * ⚡ Ultra-Resilient Centralized Real-Time Client SSE Stream Hub
 * Manages singleton EventSource connections per user and per active conversation.
 * Handles automatic multiplexing, event dispatching, and reconnection status.
 */

export type ConnectionState = "connecting" | "connected" | "reconnecting" | "offline";

type ListenerCallback = (data: any) => void;

interface ChannelSubscription {
  eventSource: EventSource | null;
  refCount: number;
  listeners: Map<string, Set<ListenerCallback>>;
  statusListeners: Set<(status: ConnectionState) => void>;
  status: ConnectionState;
  reconnectTimer: any;
  retryCount: number;
}

const channels = new Map<string, ChannelSubscription>();

function getChannel(channelKey: string, url: string): ChannelSubscription {
  let channel = channels.get(channelKey);
  if (!channel) {
    channel = {
      eventSource: null,
      refCount: 0,
      listeners: new Map(),
      statusListeners: new Set(),
      status: "connecting",
      reconnectTimer: null,
      retryCount: 0,
    };
    channels.set(channelKey, channel);
  }
  return channel;
}

function updateChannelStatus(channel: ChannelSubscription, newStatus: ConnectionState) {
  channel.status = newStatus;
  channel.statusListeners.forEach((listener) => {
    try {
      listener(newStatus);
    } catch (err) {
      console.warn("Status listener error:", err);
    }
  });
}

function connectChannel(channelKey: string, url: string) {
  if (typeof window === "undefined") return;
  const channel = channels.get(channelKey);
  if (!channel || channel.refCount <= 0) return;

  if (channel.eventSource) {
    channel.eventSource.close();
    channel.eventSource = null;
  }

  updateChannelStatus(channel, channel.retryCount > 0 ? "reconnecting" : "connecting");

  try {
    const es = new EventSource(url, { withCredentials: true });
    channel.eventSource = es;

    es.onopen = () => {
      channel.retryCount = 0;
      updateChannelStatus(channel, "connected");
    };

    es.addEventListener("connected", () => {
      channel.retryCount = 0;
      updateChannelStatus(channel, "connected");
    });

    es.addEventListener("ping", () => {
      channel.retryCount = 0;
      if (channel.status !== "connected") {
        updateChannelStatus(channel, "connected");
      }
    });

    // Attach all registered event listeners
    channel.listeners.forEach((callbacks, eventName) => {
      es.addEventListener(eventName, (e: MessageEvent) => {
        try {
          const parsed = e.data ? JSON.parse(e.data) : null;
          callbacks.forEach((cb) => cb(parsed));
        } catch {
          callbacks.forEach((cb) => cb(e.data));
        }
      });
    });

    es.onerror = (err) => {
      console.warn(`SSE [${channelKey}] connection error, reconnecting...`, err);
      es.close();
      channel.eventSource = null;
      updateChannelStatus(channel, "reconnecting");

      // Auto-reconnect with exponential backoff (1s -> 2s -> 4s -> max 6s)
      channel.retryCount = Math.min(channel.retryCount + 1, 4);
      const delay = Math.min(1000 * Math.pow(1.5, channel.retryCount), 6000);

      if (channel.reconnectTimer) clearTimeout(channel.reconnectTimer);
      channel.reconnectTimer = setTimeout(() => {
        if (channel.refCount > 0) {
          connectChannel(channelKey, url);
        }
      }, delay);
    };
  } catch (err) {
    console.warn("SSE connection init error:", err);
    updateChannelStatus(channel, "offline");
  }
}

/**
 * Subscribe to a specific SSE event on a given stream URL.
 * Automatically manages connection pooling and multiplexing.
 */
export function subscribeToStreamEvent(
  channelKey: string,
  url: string,
  event: string,
  callback: ListenerCallback
): () => void {
  if (typeof window === "undefined") return () => {};

  const channel = getChannel(channelKey, url);
  channel.refCount++;

  let eventCallbacks = channel.listeners.get(event);
  if (!eventCallbacks) {
    eventCallbacks = new Set();
    channel.listeners.set(event, eventCallbacks);

    // If already connected, register this event on the active EventSource
    if (channel.eventSource) {
      channel.eventSource.addEventListener(event, (e: MessageEvent) => {
        try {
          const parsed = e.data ? JSON.parse(e.data) : null;
          const currentCallbacks = channel.listeners.get(event);
          currentCallbacks?.forEach((cb) => cb(parsed));
        } catch {
          const currentCallbacks = channel.listeners.get(event);
          currentCallbacks?.forEach((cb) => cb(e.data));
        }
      });
    }
  }
  eventCallbacks.add(callback);

  // If no EventSource exists yet, connect immediately
  if (!channel.eventSource && channel.refCount > 0) {
    connectChannel(channelKey, url);
  }

  return () => {
    eventCallbacks?.delete(callback);
    channel.refCount = Math.max(0, channel.refCount - 1);

    if (channel.refCount === 0) {
      if (channel.reconnectTimer) clearTimeout(channel.reconnectTimer);
      if (channel.eventSource) {
        channel.eventSource.close();
        channel.eventSource = null;
      }
      channel.listeners.clear();
      channel.statusListeners.clear();
      channels.delete(channelKey);
    }
  };
}

/**
 * Subscribe to the connection status of an SSE channel.
 */
export function subscribeToStreamStatus(
  channelKey: string,
  url: string,
  callback: (status: ConnectionState) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const channel = getChannel(channelKey, url);
  channel.statusListeners.add(callback);
  callback(channel.status);

  return () => {
    channel.statusListeners.delete(callback);
  };
}
