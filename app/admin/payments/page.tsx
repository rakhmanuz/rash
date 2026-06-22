'use client'

import Link from 'next/link'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CreditCard, Wallet } from 'lucide-react'

export default function PaymentsPage() {
  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">To&apos;lovlar</h1>
          <p className="text-sm sm:text-base text-gray-400">
            To&apos;lovlar moduli qayta qurilmoqda. Eski tizim to&apos;liq tozalandi.
          </p>
        </div>

        <div className="rounded-xl border border-gray-700 bg-slate-800 p-6">
          <p className="text-sm text-gray-300 leading-6">
            Bu bo&apos;lim ataylab bo&apos;sh holatga o&apos;tkazildi. Yangi to&apos;lov arxitekturasi noldan
            quriladi.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/admin/payments/xodimlar-maosh"
            className="group flex items-center justify-between rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-4 transition-colors hover:border-violet-400/50 hover:bg-violet-500/20"
          >
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-violet-300" />
              <span className="font-semibold text-white">Xodimlar maosh</span>
            </div>
          </Link>

          <Link
            href="/admin/payments/oquvchilar-tolovi"
            className="group flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 transition-colors hover:border-emerald-400/50 hover:bg-emerald-500/20"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-emerald-300" />
              <span className="font-semibold text-white">O&apos;quvchilar to&apos;lovi</span>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
