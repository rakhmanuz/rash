'use client'

import Link from 'next/link'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ArrowLeft } from 'lucide-react'

export default function TeacherSalaryDetailPage() {
  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
              O&apos;qituvchi maoshi
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Bu bo&apos;lim qayta qurilmoqda. Eski funksiyalar o&apos;chirildi.
            </p>
          </div>
          <Link
            href="/admin/payments/xodimlar-maosh"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:border-violet-500/50 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Orqaga
          </Link>
        </div>

        <div className="rounded-xl border border-gray-700 bg-slate-800 p-6">
          <p className="text-sm text-gray-300 leading-6">
            O&apos;qituvchi maoshi funksiyalari noldan ishlab chiqiladi.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
