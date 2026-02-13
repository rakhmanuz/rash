'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const TRACK_THROTTLE_MS = 15000 // 15 soniya - sahifa o'zgarishi tez bo'lsa spam qilmaslik
const TRACK_INTERVAL_MS = 90000 // 90 soniya - har 30s o'rniga, server yukini kamaytirish

export default function VisitorTracker() {
  const pathname = usePathname()
  const lastTrackRef = useRef<number>(0)

  useEffect(() => {
    let sessionId = sessionStorage.getItem('visitor_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('visitor_session_id', sessionId)
    }

    const payload = {
      sessionId,
      page: pathname,
      userAgent: navigator.userAgent,
    }
    const body = JSON.stringify(payload)

    const trackVisit = () => {
      const now = Date.now()
      if (now - lastTrackRef.current < TRACK_THROTTLE_MS) return
      lastTrackRef.current = now

      try {
        if (typeof navigator.sendBeacon === 'function') {
          const blob = new Blob([body], { type: 'application/json' })
          navigator.sendBeacon('/api/visitors/track', blob)
        } else {
          fetch('/api/visitors/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true,
          }).catch(() => {})
        }
      } catch {
        // Ignore - analytics, sayt ishlashiga ta'sir qilmasin
      }
    }

    trackVisit()
    const interval = setInterval(trackVisit, TRACK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [pathname])

  return null
}
