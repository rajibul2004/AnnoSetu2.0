"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeDebug() {
  const { theme, resolvedTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white text-xs p-2 rounded z-50">
      <p>theme: {theme}</p>
      <p>resolved: {resolvedTheme}</p>
      <p>system: {systemTheme}</p>
    </div>
  );
}