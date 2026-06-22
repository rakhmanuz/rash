'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'

export default function AdminVazifaTopshiririshPage() {
  const { data: session } = useSession()
  const layoutRole = session?.user?.role === 'MANAGER' ? 'MANAGER' : 'ADMIN'

  return (
    <DashboardLayout role={layoutRole}>
      <h1 className="text-2xl font-bold">Vazifa topshirirish</h1>
    </DashboardLayout>
  )
}
