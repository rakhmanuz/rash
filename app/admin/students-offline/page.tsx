'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'

export default function AdminOfflineStudentsEntry() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/students?mode=offline')
  }, [router])

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6">
          <h1 className="text-2xl font-bold text-white">Offline o'quvchilar</h1>
          <p className="mt-2 text-slate-300">
            Offline oqim talabalari alohida filter orqali boshqariladi.
          </p>
        </div>
        <Link
          href="/admin/students?mode=offline"
          className="inline-flex rounded-lg border border-violet-500/40 bg-violet-500/10 px-4 py-2 font-medium text-violet-300"
        >
          Offline o'quvchilar ro'yxatini ochish
        </Link>
      </div>
    </DashboardLayout>
  )
}

