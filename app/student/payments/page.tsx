'use client'

import { DashboardLayout } from '@/components/DashboardLayout'

export default function StudentPaymentsPage() {
  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
            To&apos;lovlar
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            To&apos;lov bo&apos;limi qayta qurilmoqda. Eski ma&apos;lumotlar ko&apos;rinishi o&apos;chirildi.
          </p>
        </div>

        <div className="rounded-xl border border-gray-700 bg-slate-800 p-6">
          <p className="text-sm text-gray-300 leading-6">
            Yangi student to&apos;lov sahifasi noldan ishlab chiqiladi. Hozircha bu bo&apos;limda aktiv
            funksiyalar yo&apos;q.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
