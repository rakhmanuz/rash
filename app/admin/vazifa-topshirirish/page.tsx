'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { ClipboardCheck, Send, Users } from 'lucide-react'

export default function AdminVazifaTopshiririshPage() {
  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-4 sm:p-6 text-white">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            Vazifa topshirirish
          </h1>
          <p className="text-violet-100 mt-2 text-sm sm:text-base">
            Guruhlar va o&apos;quvchilarga vazifa berish, holatini kuzatish — hozircha bo&apos;lim ochildi, funksiyalar keyin qo&apos;shiladi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-slate-800 rounded-xl border border-gray-700 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">Topshiriq berish</h2>
              <Send className="h-5 w-5 text-violet-400" />
            </div>
            <p className="text-sm text-gray-300">
              Vazifa yaratish va guruhga yuborish formasi shu yerda bo&apos;ladi.
            </p>
          </div>

          <div className="bg-slate-800 rounded-xl border border-gray-700 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">O&apos;quvchilar</h2>
              <Users className="h-5 w-5 text-sky-400" />
            </div>
            <p className="text-sm text-gray-300">
              Kim topshirgan, muddat va baho — jadval ko&apos;rinishida chiqariladi.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
