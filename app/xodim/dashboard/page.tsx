'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Briefcase, UserCircle2, ArrowRight, ClipboardList, Calendar, DollarSign, TrendingUp } from 'lucide-react'

export default function XodimDashboardPage() {
  const { data: session } = useSession()

  return (
    <DashboardLayout role="XODIM">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-xl border border-slate-700 bg-gradient-to-r from-slate-800 to-slate-700 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-violet-500/20 p-3">
              <Briefcase className="h-7 w-7 text-violet-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Xodim paneliga xush kelibsiz, {session?.user?.name || 'Xodim'}
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                Bu bo&apos;lim xodimlar uchun alohida ish paneli. Profilingizdagi ma&apos;lumotlarni
                yangilashingiz mumkin.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Tezkor bo&apos;limlar</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/xodim/tasks"
              className="group flex items-center justify-between rounded-lg border border-slate-600 bg-slate-700/40 px-4 py-3 transition-colors hover:border-violet-500/60 hover:bg-slate-700"
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-violet-300" />
                <div>
                  <p className="font-medium text-white">Topshiriqlar</p>
                  <p className="text-xs text-slate-400">Admin bergan vazifalar ro&apos;yxati</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-violet-300" />
            </Link>
            <Link
              href="/xodim/jadval"
              className="group flex items-center justify-between rounded-lg border border-slate-600 bg-slate-700/40 px-4 py-3 transition-colors hover:border-violet-500/60 hover:bg-slate-700"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-violet-300" />
                <div>
                  <p className="font-medium text-white">Ish jadvali</p>
                  <p className="text-xs text-slate-400">Sizga biriktirilgan ish vaqtlari</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-violet-300" />
            </Link>
            <Link
              href="/xodim/payments"
              className="group flex items-center justify-between rounded-lg border border-slate-600 bg-slate-700/40 px-4 py-3 transition-colors hover:border-violet-500/60 hover:bg-slate-700"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-violet-300" />
                <div>
                  <p className="font-medium text-white">To&apos;lovlar</p>
                  <p className="text-xs text-slate-400">Xodimga tegishli to&apos;lov ma&apos;lumotlari</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-violet-300" />
            </Link>
            <Link
              href="/xodim/faoliyat-paneli"
              className="group flex items-center justify-between rounded-lg border border-slate-600 bg-slate-700/40 px-4 py-3 transition-colors hover:border-violet-500/60 hover:bg-slate-700"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-violet-300" />
                <div>
                  <p className="font-medium text-white">Faoliyat paneli</p>
                  <p className="text-xs text-slate-400">Ish faoliyati bo&apos;yicha ko&apos;rsatkichlar</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-violet-300" />
            </Link>
            <Link
              href="/xodim/profile"
              className="group flex items-center justify-between rounded-lg border border-slate-600 bg-slate-700/40 px-4 py-3 transition-colors hover:border-violet-500/60 hover:bg-slate-700"
            >
              <div className="flex items-center gap-3">
                <UserCircle2 className="h-5 w-5 text-violet-300" />
                <div>
                  <p className="font-medium text-white">Profil</p>
                  <p className="text-xs text-slate-400">Ism, telefon va parolni boshqarish</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-violet-300" />
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
