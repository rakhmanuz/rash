'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import {
  BookOpen,
  ClipboardCheck,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  ArrowUpRight,
  ClipboardList,
  Star,
} from 'lucide-react'
import {
  OnlineDashboardHeader,
  OnlineKpiCard,
  OnlineQuickLink,
  OnlineStatBlock,
} from '@/components/student-online/online-ui'

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

export function OnlineModeHome() {
  const basePath = '/student-online'
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
        if (statsRes.ok) setStats((await statsRes.json()) as StudentStatsPayload)
        else setStats(null)
        if (infinityRes.ok) {
          const d = await infinityRes.json()
          setInfinityPoints(Number(d?.infinityPoints || 0))
        } else setInfinityPoints(0)
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
      { key: 'a', label: 'Davomat', value: attendance, icon: ArrowUpRight, tone: 'emerald' as const },
      { key: 'b', label: 'Topshiriq', value: homework, icon: ClipboardList, tone: 'sky' as const },
      { key: 'c', label: "O'zlashtirish", value: mastery, icon: TrendingUp, tone: 'amber' as const },
      { key: 'd', label: 'Qobiliyat', value: ability, icon: Star, tone: 'violet' as const },
    ]
  }, [stats])

  const subtitle =
    "Sizning bo'limlaringiz alohida oqimda ishlaydi: xatoliklar boshqa oqimlarga ta'sir qilmaydi."

  return (
    <DashboardLayout role="STUDENT">
      <div className="online-shell online-page-bg mx-auto w-full max-w-6xl space-y-4 px-0 pb-8 pt-1">
        <OnlineDashboardHeader subtitle={subtitle} />

        {loading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="online-skeleton h-[120px]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpis.map((k) => (
              <OnlineKpiCard key={k.key} label={k.label} value={k.value} icon={k.icon} tone={k.tone} />
            ))}
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-3">
          <OnlineStatBlock label="Infinity balansi" visual="infinity">
            <p className="text-4xl font-bold tabular-nums text-green-600">{loading ? '—' : infinityPoints}</p>
          </OnlineStatBlock>

          <OnlineStatBlock label="Qarzdorlik" visual="wallet">
            <p className="text-3xl font-bold tabular-nums text-red-500">
              {loading ? '—' : Number(stats?.debt || 0).toLocaleString('uz-UZ')}
              <span className="ml-1 text-lg font-semibold text-red-400">so&apos;m</span>
            </p>
          </OnlineStatBlock>

          <OnlineStatBlock label="Vazifalar holati" visual="chart">
            <p className="text-sm text-gray-600">
              Bajarilgan: <strong className="text-green-600">{stats?.completedTasks ?? 0}</strong>
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Kutilmoqda: <strong className="text-sky-600">{stats?.pendingTasks ?? 0}</strong>
            </p>
          </OnlineStatBlock>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <OnlineQuickLink href={`${basePath}/lessons`} label="Darslar" icon={BookOpen} />
          <OnlineQuickLink href={`${basePath}/tasks`} label="Topshiriq" icon={ClipboardCheck} />
          <OnlineQuickLink href={`${basePath}/market`} label="Marketpleys" icon={ShoppingCart} />
        </div>
        <OnlineQuickLink href={`${basePath}/payments`} label="To'lov" icon={DollarSign} />
      </div>
    </DashboardLayout>
  )
}
