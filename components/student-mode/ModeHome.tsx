'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/DashboardLayout'
import {
  BookOpen,
  ClipboardCheck,
  DollarSign,
  ShoppingCart,
  Activity,
  Zap,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'

type Props = {
  mode: 'ONLINE' | 'OFFLINE'
  basePath: '/student-online' | '/student-offline'
}

const items = [
  { key: 'lessons', label: 'Darslar', href: '/lessons', icon: BookOpen },
  { key: 'tasks', label: 'Topshiriq', href: '/tasks', icon: ClipboardCheck },
  { key: 'market', label: 'Marketpleys', href: '/market', icon: ShoppingCart },
  { key: 'payments', label: "To'lov", href: '/payments', icon: DollarSign },
]

type StudentStatsPayload = {
  attendanceRate: number
  assignmentRate: number
  classMastery: number
  weeklyWrittenRate: number
  pendingTasks: number
  completedTasks: number
  debt: number
  lastResults?: {
    attendance?: { percentage: number } | null
    homework?: { percentage: number } | null
    test?: { percentage: number } | null
    writtenWork?: { percentage: number } | null
  }
}

export function ModeHome({ mode, basePath }: Props) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StudentStatsPayload | null>(null)
  const [infinityPoints, setInfinityPoints] = useState(0)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const [statsRes, infinityRes] = await Promise.all([
          fetch('/api/student/stats', { credentials: 'include' }),
          fetch('/api/user/infinity', { credentials: 'include' }),
        ])

        if (statsRes.ok) {
          const payload = (await statsRes.json()) as StudentStatsPayload
          setStats(payload)
        } else {
          setStats(null)
        }

        if (infinityRes.ok) {
          const infinityPayload = await infinityRes.json()
          setInfinityPoints(Number(infinityPayload?.infinityPoints || 0))
        } else {
          setInfinityPoints(0)
        }
      } catch {
        setStats(null)
        setInfinityPoints(0)
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [])

  const kpis = useMemo(() => {
    const attendance = stats?.lastResults?.attendance?.percentage ?? stats?.attendanceRate ?? 0
    const homework = stats?.lastResults?.homework?.percentage ?? stats?.assignmentRate ?? 0
    const mastery = stats?.lastResults?.test?.percentage ?? stats?.classMastery ?? 0
    const ability = stats?.lastResults?.writtenWork?.percentage ?? stats?.weeklyWrittenRate ?? 0
    return [
      { key: 'attendance', label: 'Davomat', value: attendance, color: 'text-emerald-300' },
      { key: 'homework', label: 'Topshiriq', value: homework, color: 'text-sky-300' },
      { key: 'mastery', label: "O'zlashtirish", value: mastery, color: 'text-yellow-300' },
      { key: 'ability', label: 'Qobiliyat', value: ability, color: 'text-violet-300' },
    ]
  }, [stats])

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-700 bg-gradient-to-r from-slate-900/80 to-slate-800/70 p-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-300" />
            {mode === 'ONLINE' ? 'Online o\'quvchi paneli' : 'Offline o\'quvchi paneli'}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Sizning bo&apos;limlaringiz alohida oqimda ishlaydi: xatoliklar boshqa oqimlarga ta&apos;sir qilmaydi.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((v) => (
              <div key={v} className="h-28 rounded-xl border border-slate-700 bg-slate-900/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.key} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <p className="text-xs text-slate-400">{kpi.label}</p>
                <p className={`mt-2 text-3xl font-bold ${kpi.color}`}>{Math.round(kpi.value)}%</p>
                <div className="mt-3 h-2 rounded bg-slate-700">
                  <div
                    className="h-2 rounded bg-emerald-400"
                    style={{ width: `${Math.max(0, Math.min(100, Math.round(kpi.value)))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Zap className="h-4 w-4 text-emerald-300" />
              Infinity balansi
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-300">{infinityPoints}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-rose-300" />
              Qarzdorlik
            </p>
            <p className="mt-2 text-3xl font-bold text-rose-300">
              {Number(stats?.debt || 0).toLocaleString()} so&apos;m
            </p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-sky-300" />
              Vazifalar holati
            </p>
            <p className="mt-2 text-sm text-slate-200">
              Bajarilgan: <span className="font-semibold text-emerald-300">{stats?.completedTasks ?? 0}</span>
            </p>
            <p className="text-sm text-slate-200">
              Kutilmoqda: <span className="font-semibold text-yellow-300">{stats?.pendingTasks ?? 0}</span>
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.key}
                href={`${basePath}${item.href}`}
                className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 transition hover:border-emerald-500/60 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-emerald-400" />
                  <span className="font-medium text-white">{item.label}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}

