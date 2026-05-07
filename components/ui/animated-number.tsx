"use client"

import React, { useEffect, useRef } from "react"
import { motion, useInView, useSpring, useTransform } from "framer-motion"

interface AnimatedNumberProps {
  value: number
  suffix?: string
  prefix?: string
  decimals?: number
  duration?: number
  className?: string
}

export function AnimatedNumber({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 2,
  className = "",
}: AnimatedNumberProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  const springValue = useSpring(0, {
    stiffness: 50,
    damping: 20,
    duration: duration * 1000,
  })
  
  const displayValue = useTransform(springValue, (latest) => {
    if (decimals > 0) {
      return latest.toFixed(decimals)
    }
    return Math.floor(latest).toLocaleString()
  })
  
  useEffect(() => {
    if (isInView) {
      springValue.set(value)
    }
  }, [isInView, springValue, value])
  
  return (
    <div ref={ref} className={className}>
      <motion.span className="inline-flex items-baseline gap-0.5">
        {prefix && <span className="text-lg font-medium">{prefix}</span>}
        <motion.span className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          {displayValue}
        </motion.span>
        {suffix && <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{suffix}</span>}
      </motion.span>
    </div>
  )
}