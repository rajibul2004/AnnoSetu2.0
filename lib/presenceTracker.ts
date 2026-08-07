// In-memory presence tracker for real-time online status and active user heartbeat

interface PresenceEntry {
  userId: string;
  conversationIds: Set<string>;
  lastSeen: number;
}

const globalForPresence = globalThis as unknown as {
  presenceMap?: Map<string, PresenceEntry>;
};

if (!globalForPresence.presenceMap) {
  globalForPresence.presenceMap = new Map<string, PresenceEntry>();
}

const presenceMap = globalForPresence.presenceMap;

const ONLINE_TIMEOUT_MS = 45000; // 45 seconds before considered idle/offline

export function trackUserOnline(userId: string, conversationId?: string) {
  let entry = presenceMap.get(userId);
  if (!entry) {
    entry = {
      userId,
      conversationIds: new Set(),
      lastSeen: Date.now(),
    };
    presenceMap.set(userId, entry);
  } else {
    entry.lastSeen = Date.now();
  }

  if (conversationId) {
    entry.conversationIds.add(conversationId);
  }
}

export function trackUserOffline(userId: string, conversationId?: string) {
  const entry = presenceMap.get(userId);
  if (!entry) return;

  if (conversationId) {
    entry.conversationIds.delete(conversationId);
  }

  entry.lastSeen = Date.now();
}

export function isUserOnline(userId: string): boolean {
  const entry = presenceMap.get(userId);
  if (!entry) return false;
  return Date.now() - entry.lastSeen < ONLINE_TIMEOUT_MS;
}

export function getUserLastSeen(userId: string): number | null {
  const entry = presenceMap.get(userId);
  if (!entry) return null;
  return entry.lastSeen;
}

export function isUserInConversation(userId: string, conversationId: string): boolean {
  const entry = presenceMap.get(userId);
  if (!entry) return false;
  return (
    entry.conversationIds.has(conversationId) &&
    Date.now() - entry.lastSeen < ONLINE_TIMEOUT_MS
  );
}
