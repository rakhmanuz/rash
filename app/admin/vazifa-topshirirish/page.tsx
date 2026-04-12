'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { AdminVazifaExamManager } from '@/components/vazifa/AdminVazifaExamManager'
import { useSession } from 'next-auth/react'

export default function AdminVazifaTopshiririshPage() {
  const { data: session } = useSession()
  const layoutRole = session?.user?.role === 'MANAGER' ? 'MANAGER' : 'ADMIN'

  return (
    <DashboardLayout role={layoutRole}>
      <AdminVazifaExamManager />
    </DashboardLayout>
  )
}
