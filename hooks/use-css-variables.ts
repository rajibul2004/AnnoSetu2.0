"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

export function useCSSVariables() {
  const { theme } = useTheme()

  useEffect(() => {
    const root = document.documentElement
    const isDark = theme === "dark"

    // Set CSS variables based on theme
    if (isDark) {
      root.style.setProperty("--background", "10, 10, 10")
      root.style.setProperty("--foreground", "250, 250, 250")
    } else {
      root.style.setProperty("--background", "255, 255, 255")
      root.style.setProperty("--foreground", "10, 10, 10")
    }
  }, [theme])
}