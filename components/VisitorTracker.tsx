'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function VisitorTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Generate or get session ID
    let sessionId = sessionStorage.getItem('visitor_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('visitor_session_id', sessionId)
    }

    // Track page visit
    const trackVisit = async () => {
      try {
        await fetch('/api/visitors/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            page: pathname,
            userAgent: navigator.userAgent,
          }),
        })
      } catch (error) {
        console.error('Error tracking visitor:', error)
      }
    }

    trackVisit()

    // Track activity every 30 seconds
    const interval = setInterval(() => {
      trackVisit()
    }, 30000) // 30 soniyada bir marta

    // Cleanup
    return () => clearInterval(interval)
  }, [pathname])

  return null // This component doesn't render anything
}
