'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PaymentsPage() {
  const router = useRouter()
  const [permissions, setPermissions] = useState<any>(null)
  const [permissionsLoading, setPermissionsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/assistant-admin/permissions')
      .then((r) => (r.ok ? r.json() : {}))
      .then(setPermissions)
      .catch(() => setPermissions({}))
      .finally(() => setPermissionsLoading(false))
  }, [])
  useEffect(() => {
    if (permissionsLoading) return
    if (!permissions?.payments?.view) {
      router.replace('/assistant-admin/dashboard')
    }
  }, [permissionsLoading, permissions, router])

  if (permissionsLoading || !permissions?.payments?.view) {
    return (
      <DashboardLayout role="ASSISTANT_ADMIN">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--border-default)] border-t-indigo-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="ASSISTANT_ADMIN">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-primary)] mb-2">To&apos;lovlar</h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            To&apos;lovlar moduli qayta qurilmoqda. Eski tizim o&apos;chirildi.
          </p>
        </div>

        <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
          <p className="text-sm text-[var(--text-secondary)]">
            Bu bo&apos;lim hozircha bo&apos;sh. Yangi to&apos;lov funksiyasi noldan quriladi.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
