'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { Bot, CheckCircle2, Search, Sparkles } from 'lucide-react'

export default function StudentAiTekshiruvPage() {
  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl p-4 sm:p-6 text-white">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" />
            AI tekshiruv
          </h1>
          <p className="text-cyan-100 mt-2 text-sm sm:text-base">
            Topshiriqlar va faoliyatingiz bo&apos;yicha AI tavsiyalari shu yerda ko&apos;rinadi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-slate-800 rounded-xl border border-gray-700 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">Holat</h2>
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-sm text-gray-300">Bo&apos;lim tayyor. Natijalar keyingi bosqichda ulanadi.</p>
          </div>

          <div className="bg-slate-800 rounded-xl border border-gray-700 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">Tahlil</h2>
              <Search className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-sm text-gray-300">Topshiriqlar bo&apos;yicha avtomatik tekshiruv natijalari chiqadi.</p>
          </div>

          <div className="bg-slate-800 rounded-xl border border-gray-700 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">Tavsiyalar</h2>
              <Sparkles className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-sm text-gray-300">AI sizga rivojlanish uchun qisqa tavsiyalar beradi.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
