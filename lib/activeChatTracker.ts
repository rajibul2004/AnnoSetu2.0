"use client";

/**
 * In-memory client tracking of the currently active conversation.
 * Prevents redundant toast popups and duplicate sound chimes when
 * the user is already actively chatting inside that specific conversation window.
 */

let activeConversationId: string | null = null;

export function setActiveConversationId(id: string | null): void {
  activeConversationId = id;
}

export function getActiveConversationId(): string | null {
  return activeConversationId;
}

export function isConversationActive(id: string | null | undefined): boolean {
  if (!id || !activeConversationId) return false;
  return activeConversationId === id;
}
