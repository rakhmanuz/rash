'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export function ConditionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname() || ''
  const isRash = pathname.startsWith('/rash')

  if (isRash) {
    return (
      <div className="min-h-screen flex flex-col relative z-10">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  )
}
