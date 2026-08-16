"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface XPEvent {
  id: string;
  amount: number;
  label: string;
}

interface GamificationContextType {
  xpEvents: XPEvent[];
  badgeUnlock: string | null;
  showXP: (amount: number, label: string) => void;
  showBadgeUnlock: (badgeId: string) => void;
  dismissBadgeUnlock: () => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [xpEvents, setXpEvents] = useState<XPEvent[]>([]);
  const [badgeUnlock, setBadgeUnlock] = useState<string | null>(null);

  const showXP = useCallback((amount: number, label: string) => {
    const id = Math.random().toString(36).substring(7);
    setXpEvents((prev) => [...prev, { id, amount, label }]);
    setTimeout(() => {
      setXpEvents((prev) => prev.filter((event) => event.id !== id));
    }, 3000);
  }, []);

  const showBadgeUnlock = useCallback((badgeId: string) => {
    setBadgeUnlock(badgeId);
    setTimeout(() => {
      setBadgeUnlock((current) => (current === badgeId ? null : current));
    }, 5000);
  }, []);

  const dismissBadgeUnlock = useCallback(() => {
    setBadgeUnlock(null);
  }, []);

  return (
    <GamificationContext.Provider value={{ xpEvents, badgeUnlock, showXP, showBadgeUnlock, dismissBadgeUnlock }}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamification must be used within a GamificationProvider");
  }
  return context;
}
