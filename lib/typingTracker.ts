// Ephemeral in-memory typing tracker for real-time chat typing indicator
interface TypingEntry {
  userId: string;
  userName?: string;
  expiresAt: number;
}

const globalForTyping = globalThis as unknown as {
  typingMap?: Map<string, Map<string, TypingEntry>>;
};

const typingMap = globalForTyping.typingMap ?? new Map<string, Map<string, TypingEntry>>();
if (process.env.NODE_ENV !== "production") {
  globalForTyping.typingMap = typingMap;
}

const TYPING_TTL_MS = 3500; // 3.5 seconds

export function setTypingStatus(
  conversationId: string,
  userId: string,
  userName?: string,
  isTyping: boolean = true
) {
  let convMap = typingMap.get(conversationId);
  if (!convMap) {
    convMap = new Map();
    typingMap.set(conversationId, convMap);
  }

  if (isTyping) {
    convMap.set(userId, {
      userId,
      userName,
      expiresAt: Date.now() + TYPING_TTL_MS,
    });
  } else {
    convMap.delete(userId);
  }
}

export function getTypingUsers(conversationId: string, excludeUserId: string): string[] {
  const convMap = typingMap.get(conversationId);
  if (!convMap) return [];

  const now = Date.now();
  const typingNames: string[] = [];

  for (const [uid, entry] of convMap.entries()) {
    if (entry.expiresAt < now) {
      convMap.delete(uid);
    } else if (uid !== excludeUserId) {
      typingNames.push(entry.userName || "Someone");
    }
  }

  return typingNames;
}
