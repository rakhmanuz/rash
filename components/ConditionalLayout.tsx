'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { isStudentPanelPath } from '@/lib/student-online-route'

export function ConditionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname() || ''
  const isSimpleLayout =
    pathname.startsWith('/login') ||
    pathname.startsWith('/monitor') ||
    isStudentPanelPath(pathname)
  const isAssistantAdmin = pathname.startsWith('/assistant-admin')

  if (isSimpleLayout) {
    return (
      <div className="min-h-screen flex flex-col relative z-10">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      {!isAssistantAdmin && <Navbar />}
      <main className="flex-grow">{children}</main>
      {!isAssistantAdmin && <Footer />}
    </div>
  )
}
