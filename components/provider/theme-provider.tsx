"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { SessionProvider } from "next-auth/react";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <SessionProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        storageKey="theme" // ← must match localStorage key in inline script
        disableTransitionOnChange={false}
        {...props}
      >
        {children}
      </NextThemesProvider>
    </SessionProvider>
  );
}
