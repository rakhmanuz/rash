'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { VazifaStudentLockdownPortal } from '@/components/vazifa/VazifaStudentLockdownPortal'

export default function StudentVazifaTopshiririshPage() {
  return (
    <DashboardLayout role="STUDENT">
      <VazifaStudentLockdownPortal />
    </DashboardLayout>
  )
}
