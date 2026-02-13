'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

export function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [scrolled, setScrolled] = useState(false)
  const [visitorCount, setVisitorCount] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch visitor count (faqat tizimga kirmaganlar uchun)
  useEffect(() => {
    if (status === 'unauthenticated') {
      const fetchVisitorCount = async () => {
        try {
          const response = await fetch('/api/visitors/count')
          const data = await response.json()
          if (data.count !== undefined) {
            setVisitorCount(data.count)
          }
        } catch (error) {
          console.error('Error fetching visitor count:', error)
        }
      }

      // Initial fetch
      fetchVisitorCount()

      // Update every 60 seconds
      const interval = setInterval(fetchVisitorCount, 60000)

      return () => clearInterval(interval)
    }
  }, [status])

  // Bosh sahifa va login sahifasida Navbar'ni ko'rsatmaslik
  if (pathname === '/' || pathname === '/login') {
    return null
  }

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-slate-900/80 backdrop-blur-md border-b border-gray-800/50' 
          : 'bg-transparent'
      }`}
      style={{
        willChange: 'transform, background-color',
        transform: 'translateZ(0)',
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
        </div>
      </div>
    </nav>
  )
}
