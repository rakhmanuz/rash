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
  const [infinityPoints, setInfinityPoints] = useState(0)

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

      // Update every 10 seconds
      const interval = setInterval(fetchVisitorCount, 10000)

      return () => clearInterval(interval)
    }
  }, [status])

  // Fetch infinity points (tizimga kirganlar uchun)
  useEffect(() => {
    if (status === 'authenticated' && session) {
      const fetchInfinityPoints = async () => {
        try {
          const response = await fetch('/api/user/infinity')
          if (response.ok) {
            const data = await response.json()
            setInfinityPoints(data.infinityPoints || 0)
          }
        } catch (error) {
          console.error('Error fetching infinity points:', error)
        }
      }

      // Initial fetch
      fetchInfinityPoints()

      // Update every 5 seconds
      const interval = setInterval(fetchInfinityPoints, 5000)

      return () => clearInterval(interval)
    }
  }, [status, session])

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
          {/* Infinity Counter */}
          <div className="flex items-center space-x-3 ml-auto">
            {/* Infinity Counter - faqat kirilgan foydalanuvchilar uchun */}
            {status === 'authenticated' && session?.user ? (
              <div className="relative flex items-center space-x-2 bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-md border border-green-500/40 rounded-full px-4 py-2 shadow-xl shadow-green-500/30 hover:shadow-green-500/40 transition-all duration-300 hover:scale-105">
                {/* Infinity Symbol with enhanced styling */}
                <div className="relative">
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.6)] animate-pulse">
                    ∞
                  </span>
                  {/* Glow effect */}
                  <div className="absolute inset-0 text-2xl font-black text-green-400/30 blur-sm animate-pulse">
                    ∞
                  </div>
                </div>
                <span className="text-white text-base font-bold tracking-wide">
                  {infinityPoints}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  )
}
