'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'

export default function AdminOnlineStudentsEntry() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/students?mode=online')
  }, [router])

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6">
          <h1 className="text-2xl font-bold text-white">Online o'quvchilar</h1>
          <p className="mt-2 text-slate-300">
            Online oqim talabalari alohida filter orqali boshqariladi.
          </p>
        </div>
        <Link
          href="/admin/students?mode=online"
          className="inline-flex rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-2 font-medium text-blue-300"
        >
          Online o'quvchilar ro'yxatini ochish
        </Link>
      </div>
    </DashboardLayout>
  )
}

