'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { ClipboardCheck, Inbox, Sparkles } from 'lucide-react'

export default function StudentVazifaTopshiririshPage() {
  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-4 sm:p-6 text-white">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            Vazifa topshirirish
          </h1>
          <p className="text-emerald-100 mt-2 text-sm sm:text-base">
            Bu yerda berilgan vazifalar va topshirishlar ko&apos;rinadi. Hozircha bo&apos;lim tayyorlanmoqda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-slate-800 rounded-xl border border-gray-700 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">Mening vazifalarim</h2>
              <Inbox className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-sm text-gray-300">
              Yangi topshiriqlar shu yerda ro&apos;yxat ko&apos;rinishida chiqadi.
            </p>
          </div>

          <div className="bg-slate-800 rounded-xl border border-gray-700 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">Keyingi qadam</h2>
              <Sparkles className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-sm text-gray-300">
              Topshirish va baholash oqimi keyingi yangilanishda ulanadi.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
