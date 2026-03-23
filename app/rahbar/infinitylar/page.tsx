'use client'

import { InfinityManagementPage } from '@/components/infinity/InfinityManagementPage'

export default function RahbarInfinitylarPage() {
  return (
    <InfinityManagementPage
      layoutRole="RAHBAR"
      showVazifaCleanup={false}
      headBadge="Rahbar · IQLASAN"
    />
  )
}
