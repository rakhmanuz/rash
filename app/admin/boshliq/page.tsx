'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { LeaderOverviewContent } from '@/components/LeaderOverviewContent'

export default function AdminBoshliqOverviewPage() {
  return (
    <DashboardLayout role="ADMIN">
      <LeaderOverviewContent />
    </DashboardLayout>
  )
}
