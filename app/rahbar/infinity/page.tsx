'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useCallback, useEffect, useState } from 'react'
import {
  TrendingUp,
  Users,
  Wallet,
  Clock,
  Calendar,
  AlertTriangle,
  Info,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
  ArrowUpRight,
  RefreshCw,
  Filter,
  Scale,
  BookOpen,
  ClipboardList,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const PIE_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#14b8a6']

type Analytics = {
  generatedAt: string
  sourceLabels: Record<string, string>
  filters: {
    windowStart: string
    windowEnd: string
    days: number
    groupId: string | null
    source: string | null
    dateFrom: string | null
    dateTo: string | null
    periodLabel: string
  }
  groupsForFilter: Array<{ id: string; name: string }>
  summary: {
    totalStudentBalance: number
    totalStudentsInGroups: number
    averageBalancePerStudent: number
    earnedInPeriod: number
    transactionsInPeriod: number
    nonStudentFlows: {
      label: string
      earnedWindow: number
      txWindow: number
    }
  }
  stability: {
    earnedCurrentWindow: number
    earnedPriorWindow: number
    pctChangeVsPrior: number | null
    trend: 'tez_oshmoqda' | 'barqaror' | 'pasaymoqda' | 'noma_lum'
    windowDaysEffective: number
    totalLiabilityInfinity: number
    avgInfinityPerStudentWeek: number
    liabilityVsPeriodIssuance: number | null
    notes: string[]
  }
  byGroup: Array<{
    groupId: string
    groupName: string
    studentCount: number
    totalBalance: number
    earnedWindow: number
    txWindow: number
    testEvents: number
    writtenEvents: number
    testInfinitySum: number
    writtenInfinitySum: number
    averageBalance: number
    avgEarnedPerStudentWindow: number
    topTestLabel: string | null
    topWrittenLabel: string | null
  }>
  topTests: Array<{
    testId: string
    title: string
    type: string
    groupId: string
    groupName: string
    resultCount: number
    totalInfinity: number
  }>
  topWrittenWorks: Array<{
    writtenWorkId: string
    title: string
    groupId: string
    groupName: string
    resultCount: number
    totalInfinity: number
  }>
  bySourceWindow: Array<{
    source: string
    label: string
    totalAmount: number
    count: number
  }>
  bySourceAllTime: Array<{
    source: string
    label: string
    totalAmount: number
    count: number
  }>
  daily: Array<{
    date: string
    earned: number
    count: number
  }>
  hourly: Array<{ hour: number; total: number }>
  peakHourEarned: { hour: number; total: number }
  byWeekday: Array<{ label: string; earned: number }>
  peakEarnedDayInWindow: { date: string; earned: number; count: number } | null
  peakEarnedDayLast30: { date: string; earned: number } | null
  burstDaysLast30: Array<{ date: string; earned: number; ratio: number }>
  topTransactions: Array<{
    id: string
    amount: number
    source: string
    description: string | null
    createdAt: string
    userName: string
    username: string | null
    groupName: string | null
  }>
  recentTransactions: Array<{
    id: string
    amount: number
    source: string
    description: string | null
    createdAt: string
    userName: string
    username: string | null
    groupName: string | null
  }>
  highFrequencyDays: Array<{
    userId: string
    day: string
    count: number
    userName: string
    username: string | null
    groupName: string | null
  }>
  anomalies: Array<{
    kind: string
    severity: 'info' | 'warn'
    detail: string
    id: string
    userId: string
    amount: number
    source: string
    createdAt: string
    userName: string
    username: string | null
    groupName: string | null
  }>
  insights: string[]
}

const fmt = (n: number) => n.toLocaleString('uz-UZ')

const TREND_LABEL: Record<string, { text: string; className: string }> = {
  tez_oshmoqda: { text: 'Tushum tez oshmoqda', className: 'bg-amber-500/20 text-amber-200 border-amber-500/35' },
  barqaror: { text: 'Nisbatan barqaror', className: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30' },
  pasaymoqda: { text: 'Oldingi davrga nisbatan kamaygan', className: 'bg-sky-500/15 text-sky-200 border-sky-500/30' },
  noma_lum: { text: 'Ma’lumot yetarli emas', className: 'bg-slate-600/30 text-slate-300 border-slate-500/30' },
}

function buildQuery(params: {
  days: number
  groupId: string
  source: string
  dateFrom: string
  dateTo: string
  useCustom: boolean
}): string {
  const sp = new URLSearchParams()
  if (params.useCustom && params.dateFrom && params.dateTo) {
    sp.set('dateFrom', params.dateFrom)
    sp.set('dateTo', params.dateTo)
  } else {
    sp.set('days', String(params.days))
  }
  if (params.groupId) sp.set('groupId', params.groupId)
  if (params.source) sp.set('source', params.source)
  const q = sp.toString()
  return q ? `?${q}` : ''
}

export default function RahbarInfinityPage() {
  const [days, setDays] = useState(90)
  const [groupId, setGroupId] = useState('')
  const [source, setSource] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [useCustom, setUseCustom] = useState(false)

  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const qs = buildQuery({ days, groupId, source, dateFrom, dateTo, useCustom })
      const res = await fetch(`/api/rahbar/infinity-analytics${qs}`, { credentials: 'include' })
      if (!res.ok) {
        setError('Ma’lumot olinmadi')
        setData(null)
        return
      }
      setData(await res.json())
    } catch {
      setError('Tarmoq xatosi')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [days, groupId, source, dateFrom, dateTo, useCustom])

  useEffect(() => {
    load()
  }, [load])

  const pieWindow =
    data?.bySourceWindow
      .map((s) => ({
        name: s.label,
        value: Math.max(0, s.totalAmount),
        count: s.count,
      }))
      .filter((x) => x.value > 0) ?? []

  const dailyChart =
    data?.daily.map((d) => ({
      ...d,
      short: d.date.slice(5),
    })) ?? []

  const trendStyle = data ? TREND_LABEL[data.stability.trend] ?? TREND_LABEL.noma_lum : TREND_LABEL.noma_lum

  return (
    <DashboardLayout role="RAHBAR">
      <div className="space-y-5 sm:space-y-8 max-w-[1700px] mx-auto pb-[max(2rem,env(safe-area-inset-bottom,0px))] min-w-0">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/50 p-4 sm:p-6 lg:p-8 shadow-xl">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-[11px] sm:text-xs font-medium text-emerald-300">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                Rahbar · Infinity tahlili
              </div>
              <h1 className="flex flex-col gap-3 sm:flex-row sm:items-center text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                <span className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/35">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
                <span>Infinity tahlili</span>
              </h1>
              <p className="mt-2 max-w-3xl text-xs sm:text-sm text-slate-400 leading-relaxed">
                ∞ — rag‘bat balli; keyin to‘lovni kamaytirishda ishlatiladi. Tahlil «ko‘payib ketmasin», barqaror bo‘lishi va
                guruh/test bo‘yicha qayerda ko‘p berilayotganini ko‘rsatadi. Filtrlardan foydalaning.
              </p>
              {data?.generatedAt && (
                <p className="mt-2 text-xs text-slate-600">
                  Yangilangan: {new Date(data.generatedAt).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => load()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 self-stretch sm:self-start rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-3 sm:py-2.5 text-sm font-medium text-slate-200 hover:border-emerald-500/40 hover:text-white disabled:opacity-50 min-h-[48px]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Yangilash
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-slate-800/40 p-4 sm:p-5">
          <h2 className="mb-3 sm:mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Filter className="h-4 w-4 text-emerald-400 shrink-0" />
            Filtrlar
          </h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-500">Vaqt oralig‘i</span>
              <select
                value={useCustom ? 'custom' : String(days)}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === 'custom') {
                    setUseCustom(true)
                  } else {
                    setUseCustom(false)
                    setDays(parseInt(v, 10))
                  }
                }}
                className="w-full min-h-[48px] rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2.5 text-sm text-white"
              >
                <option value="30">So‘nggi 30 kun</option>
                <option value="60">So‘nggi 60 kun</option>
                <option value="90">So‘nggi 90 kun</option>
                <option value="180">So‘nggi 180 kun</option>
                <option value="custom">Aniq sana (quyida)</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-500">Guruh</span>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2.5 text-sm text-white"
              >
                <option value="">Barcha guruhlar</option>
                {(data?.groupsForFilter ?? []).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-500">Manba</span>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2.5 text-sm text-white"
              >
                <option value="">Barcha manbalar</option>
                <option value="TEST_RESULT">Kunlik test</option>
                <option value="WRITTEN_WORK_RESULT">Yozma ish</option>
                <option value="ADMIN_ADD">Admin qo‘shdi</option>
              </select>
            </label>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-slate-500">Aniq sana (ixtiyoriy)</span>
              <div className="flex flex-wrap gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value)
                    setUseCustom(true)
                  }}
                  className="flex-1 min-w-0 min-h-[48px] rounded-xl border border-slate-600 bg-slate-900/80 px-2 py-2 text-sm text-white"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value)
                    setUseCustom(true)
                  }}
                  className="flex-1 min-w-0 min-h-[48px] rounded-xl border border-slate-600 bg-slate-900/80 px-2 py-2 text-sm text-white"
                />
              </div>
            </div>
          </div>
          {data?.filters.periodLabel && (
            <p className="mt-3 text-xs text-slate-500">Tanlangan davr: {data.filters.periodLabel}</p>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
        )}

        {loading && !data ? (
          <div className="flex justify-center py-24">
            <div className="h-12 w-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          </div>
        ) : data ? (
          <>
            <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-slate-900/90 to-cyan-950/20 p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <Scale className="h-5 w-5 text-cyan-400" />
                    Barqarorlik va «minusga qolmaslik»
                  </h3>
                  <p className="mt-1 max-w-3xl text-sm text-slate-400">
                    Jami balans (keyinchalik chegirma majburiyati) va davrda berilgan tushum taqqoslanadi. Oldingi{' '}
                    {data.stability.windowDaysEffective} kun bilan solishtiriladi.
                  </p>
                </div>
                <span
                  className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${trendStyle.className}`}
                >
                  {trendStyle.text}
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Jami majburiyat (balans)</p>
                  <p className="mt-1 text-xl font-bold text-white">{fmt(data.stability.totalLiabilityInfinity)} ∞</p>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Tanlangan davr tushumi</p>
                  <p className="mt-1 text-xl font-bold text-emerald-400">+{fmt(data.stability.earnedCurrentWindow)} ∞</p>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Oldingi davr tushumi</p>
                  <p className="mt-1 text-xl font-bold text-slate-200">+{fmt(data.stability.earnedPriorWindow)} ∞</p>
                  {data.stability.pctChangeVsPrior != null && (
                    <p className="mt-1 text-xs text-slate-500">
                      O‘zgarish:{' '}
                      <span
                        className={
                          data.stability.pctChangeVsPrior > 0 ? 'text-amber-300' : data.stability.pctChangeVsPrior < 0 ? 'text-sky-300' : ''
                        }
                      >
                        {data.stability.pctChangeVsPrior > 0 ? '+' : ''}
                        {data.stability.pctChangeVsPrior}%
                      </span>
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Balans ÷ davr tushumi</p>
                  <p className="mt-1 text-xl font-bold text-cyan-300">
                    {data.stability.liabilityVsPeriodIssuance != null
                      ? `${data.stability.liabilityVsPeriodIssuance}×`
                      : '—'}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">Qancha «oy» tushimga teng zaxira (taxminiy)</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-slate-700/60 bg-slate-900/30 p-4">
                <p className="text-xs font-medium text-slate-400 mb-2">O‘quvchi boshiga haftalik tushum (tanlangan davr)</p>
                <p className="text-2xl font-bold text-white">{data.stability.avgInfinityPerStudentWeek} ∞</p>
              </div>
              {data.stability.notes.length > 0 && (
                <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-slate-400">
                  {data.stability.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-700/80 bg-slate-800/40 p-5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Joriy balans</span>
                  <Wallet className="h-5 w-5 text-emerald-400" />
                </div>
                <p className="mt-2 text-2xl font-bold text-white">{fmt(data.summary.totalStudentBalance)} ∞</p>
                <p className="mt-1 text-xs text-slate-500">
                  {fmt(data.summary.totalStudentsInGroups)} o‘quvchi · o‘rtacha {fmt(data.summary.averageBalancePerStudent)} ∞
                </p>
              </div>
              <div className="rounded-2xl border border-slate-700/80 bg-slate-800/40 p-5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Davr tushumi</span>
                  <ArrowUpRight className="h-5 w-5 text-green-400" />
                </div>
                <p className="mt-2 text-2xl font-bold text-green-400">+{fmt(data.summary.earnedInPeriod)} ∞</p>
                <p className="mt-1 text-xs text-slate-500">Filtr bo‘yicha musbat yozuvlar</p>
              </div>
              <div className="rounded-2xl border border-slate-700/80 bg-slate-800/40 p-5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Tushum yozuvlari</span>
                  <BarChart3 className="h-5 w-5 text-sky-400" />
                </div>
                <p className="mt-2 text-2xl font-bold text-sky-300">{fmt(data.summary.transactionsInPeriod)}</p>
                <p className="mt-1 text-xs text-slate-500">Tanlangan davr</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 lg:col-span-1">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                  <Calendar className="h-4 w-4" />
                  Eng ko‘p tushum kunlari
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>
                    <span className="text-slate-500">Davr bo‘yicha:</span>{' '}
                    {data.peakEarnedDayInWindow
                      ? `${data.peakEarnedDayInWindow.date} · +${fmt(data.peakEarnedDayInWindow.earned)} ∞ (${data.peakEarnedDayInWindow.count})`
                      : '—'}
                  </li>
                  <li>
                    <span className="text-slate-500">So‘nggi 30 kun (global):</span>{' '}
                    {data.peakEarnedDayLast30
                      ? `${data.peakEarnedDayLast30.date} · +${fmt(data.peakEarnedDayLast30.earned)} ∞`
                      : '—'}
                  </li>
                </ul>
                {data.peakHourEarned.total > 0 && (
                  <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-emerald-400" />
                    Toshkent: eng ko‘p tushum{' '}
                    <strong className="text-emerald-300">{String(data.peakHourEarned.hour).padStart(2, '0')}:00</strong> —{' '}
                    {fmt(data.peakHourEarned.total)} ∞
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-700/80 bg-slate-800/30 p-5 lg:col-span-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Zap className="h-4 w-4 text-emerald-400" />
                  Qisqa xulosalar
                </h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-400">
                  {data.insights.length === 0 ? (
                    <li>Hozircha matn yo‘q.</li>
                  ) : (
                    data.insights.map((t, i) => (
                      <li key={i} className="leading-relaxed">
                        {t}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>

            {data.summary.nonStudentFlows.txWindow > 0 && (
              <div className="rounded-xl border border-slate-600 bg-slate-800/20 px-4 py-3 text-sm text-slate-400">
                <span className="font-medium text-slate-300">{data.summary.nonStudentFlows.label}:</span>{' '}
                {data.summary.nonStudentFlows.txWindow} yozuv · +{fmt(data.summary.nonStudentFlows.earnedWindow)} ∞
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-700/80 bg-slate-800/30 p-5">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                  <ClipboardList className="h-5 w-5 text-sky-400" />
                  Eng ko‘p topshirilgan testlar (natijalar soni)
                </h3>
                {data.topTests.length === 0 ? (
                  <p className="text-sm text-slate-500">Tanlangan filtrda ma’lumot yo‘q.</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2 text-sm">
                    {data.topTests.slice(0, 15).map((t, i) => (
                      <div
                        key={t.testId}
                        className="flex items-start justify-between gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2"
                      >
                        <div>
                          <span className="text-xs text-slate-500">#{i + 1}</span>
                          <p className="font-medium text-white">{t.title}</p>
                          <p className="text-xs text-slate-500">
                            {t.groupName} · {t.type === 'kunlik_test' ? 'Kunlik test' : t.type}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-emerald-400">{t.resultCount} ta</p>
                          <p className="text-xs text-slate-500">+{fmt(t.totalInfinity)} ∞</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-slate-700/80 bg-slate-800/30 p-5">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                  <BookOpen className="h-5 w-5 text-amber-400" />
                  Eng ko‘p topshirilgan yozma ishlar
                </h3>
                {data.topWrittenWorks.length === 0 ? (
                  <p className="text-sm text-slate-500">Tanlangan filtrda ma’lumot yo‘q.</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2 text-sm">
                    {data.topWrittenWorks.slice(0, 12).map((w, i) => (
                      <div
                        key={w.writtenWorkId}
                        className="flex items-start justify-between gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2"
                      >
                        <div>
                          <span className="text-xs text-slate-500">#{i + 1}</span>
                          <p className="font-medium text-white">{w.title}</p>
                          <p className="text-xs text-slate-500">{w.groupName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-emerald-400">{w.resultCount} ta</p>
                          <p className="text-xs text-slate-500">+{fmt(w.totalInfinity)} ∞</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-700/80 bg-slate-800/30 p-5">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                  Kunlik tushum
                </h3>
                <div className="h-[220px] w-full min-w-0 sm:h-[280px] lg:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="short" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Line type="monotone" dataKey="earned" name="Tushum ∞" stroke="#22c55e" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-700/80 bg-slate-800/30 p-5">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <PieChartIcon className="h-5 w-5 text-emerald-400" />
                  Manbalar (tanlangan davr)
                </h3>
                <div className="h-[240px] w-full min-w-0 sm:h-[280px] lg:h-[300px]">
                  {pieWindow.length === 0 ? (
                    <p className="flex h-full items-center justify-center text-slate-500">Ma’lumot yo‘q</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieWindow}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={72}
                          label={({ name, value }) => `${String(name).slice(0, 10)}${String(name).length > 10 ? '…' : ''}: ${fmt(value as number)}`}
                        >
                          {pieWindow.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                          formatter={(v) => [`${fmt(Number(v ?? 0))} ∞`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  Butun tarix manbalari:{' '}
                  {data.bySourceAllTime
                    .filter((s) => s.totalAmount > 0)
                    .map((s) => `${s.label} (${fmt(s.totalAmount)})`)
                    .join(' · ') || '—'}
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-700/80 bg-slate-800/30 p-5">
                <h3 className="mb-4 text-lg font-semibold text-white">Soat bo‘yicha tushum (Toshkent)</h3>
                <div className="h-[200px] w-full min-w-0 sm:h-[240px] lg:h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.hourly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="hour"
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        tickFormatter={(h) => `${h}h`}
                      />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                        formatter={(v) => [`${fmt(Number(v ?? 0))} ∞`, 'Tushum']}
                      />
                      <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-700/80 bg-slate-800/30 p-5">
                <h3 className="mb-4 text-lg font-semibold text-white">Hafta kuni bo‘yicha tushum</h3>
                <div className="h-[200px] w-full min-w-0 sm:h-[240px] lg:h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.byWeekday}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                        formatter={(v) => [`${fmt(Number(v ?? 0))} ∞`, '']}
                      />
                      <Bar dataKey="earned" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {data.burstDaysLast30.length > 0 && (
              <div className="rounded-2xl border border-orange-500/25 bg-orange-500/5 p-5">
                <h3 className="text-sm font-semibold text-orange-200">Medianadan keskin yuqori kunlar (so‘nggi 30 kun)</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.burstDaysLast30.map((b) => (
                    <span
                      key={b.date}
                      className="rounded-lg border border-orange-500/30 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-200"
                    >
                      {b.date}: +{fmt(b.earned)} ∞ <span className="text-orange-300/80">(~{b.ratio}×)</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-700/80 bg-slate-800/30 p-5">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Users className="h-5 w-5 text-emerald-400" />
                Guruhlar bo‘yicha (test / yozma ish / eng ko‘p ishtirok)
              </h3>
              <div className="overflow-x-auto touch-pan-x -mx-1 px-1 sm:mx-0 sm:px-0 rounded-lg">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-3 py-2">Guruh</th>
                      <th className="px-3 py-2">O‘q.</th>
                      <th className="px-3 py-2">Balans</th>
                      <th className="px-3 py-2">Davr tushumi</th>
                      <th className="px-3 py-2">Yozuv</th>
                      <th className="px-3 py-2">Test nat.</th>
                      <th className="px-3 py-2">Yozma ish</th>
                      <th className="px-3 py-2">Eng ko‘p test</th>
                      <th className="px-3 py-2">Eng ko‘p yozma</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {data.byGroup.map((g) => (
                      <tr key={g.groupId} className="text-slate-300 hover:bg-slate-800/40">
                        <td className="px-3 py-2.5 font-medium text-white">{g.groupName}</td>
                        <td className="px-3 py-2.5">{g.studentCount}</td>
                        <td className="px-3 py-2.5 text-emerald-300">{fmt(g.totalBalance)}</td>
                        <td className="px-3 py-2.5 text-green-400">+{fmt(g.earnedWindow)}</td>
                        <td className="px-3 py-2.5 text-slate-400">{g.txWindow}</td>
                        <td className="px-3 py-2.5">{g.testEvents}</td>
                        <td className="px-3 py-2.5">{g.writtenEvents}</td>
                        <td className="px-3 py-2.5 max-w-[200px] text-xs text-slate-400">{g.topTestLabel ?? '—'}</td>
                        <td className="px-3 py-2.5 max-w-[200px] text-xs text-slate-400">{g.topWrittenLabel ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700/80 bg-slate-800/30 p-5">
              <h3 className="mb-3 text-lg font-semibold text-white">Eng yirik yagona tushumlar</h3>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[420px] overflow-y-auto text-sm">
                {data.topTransactions.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2 text-slate-300"
                  >
                    <span className="font-mono font-bold text-emerald-400">+{fmt(t.amount)}</span>{' '}
                    <span className="text-slate-500">{data.sourceLabels[t.source] || t.source}</span>
                    <p className="text-xs text-white">{t.userName}</p>
                    <p className="text-[11px] text-slate-500">
                      {t.groupName ?? '—'} · {new Date(t.createdAt).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}
                    </p>
                    {t.description && <p className="text-[11px] text-slate-600 line-clamp-2">{t.description}</p>}
                  </li>
                ))}
              </ul>
            </div>

            {data.highFrequencyDays.length > 0 && (
              <div className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-5">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-violet-200">
                  <AlertTriangle className="h-5 w-5" />
                  Bir kunda 8+ marta ∞
                </h3>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {data.highFrequencyDays.map((x, i) => (
                    <li key={`${x.userId}-${x.day}-${i}`} className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm">
                      <p className="font-medium text-white">{x.userName}</p>
                      <p className="text-xs text-violet-300">
                        {x.day} · {x.count} marta
                      </p>
                      <p className="text-[11px] text-slate-500">{x.groupName ?? '—'}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.anomalies.length > 0 && (
              <div className="rounded-2xl border border-amber-500/30 bg-slate-800/30 p-5">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-amber-200">
                  <Info className="h-5 w-5" />
                  Tekshiruv tavsiya etiladi
                </h3>
                <ul className="space-y-2">
                  {data.anomalies.map((a) => (
                    <li
                      key={a.id}
                      className={`flex flex-col gap-1 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                        a.severity === 'warn'
                          ? 'border-red-500/35 bg-red-500/10'
                          : 'border-slate-600 bg-slate-900/40'
                      }`}
                    >
                      <div>
                        <p className="text-sm text-slate-200">{a.detail}</p>
                        <p className="text-xs text-slate-500">
                          {a.userName} · {a.groupName ?? '—'} · {data.sourceLabels[a.source] || a.source} ·{' '}
                          <span className="font-mono">{fmt(a.amount)}</span> ∞
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-600 whitespace-nowrap">
                        {new Date(a.createdAt).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-2xl border border-slate-700/80 bg-slate-800/30 p-5">
              <h3 className="mb-4 text-lg font-semibold text-white">So‘nggi tushumlar</h3>
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto touch-pan-x -mx-1 px-1 sm:mx-0 sm:px-0 rounded-lg">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="sticky top-0 bg-slate-900/95 z-10">
                    <tr className="border-b border-slate-700 text-xs uppercase text-slate-500">
                      <th className="px-3 py-2">Vaqt</th>
                      <th className="px-3 py-2">Foydalanuvchi</th>
                      <th className="px-3 py-2">Guruh</th>
                      <th className="px-3 py-2">Manba</th>
                      <th className="px-3 py-2">∞</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {data.recentTransactions.map((t) => (
                      <tr key={t.id} className="text-slate-300">
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-500">
                          {new Date(t.createdAt).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}
                        </td>
                        <td className="px-3 py-2 text-white">{t.userName}</td>
                        <td className="px-3 py-2 text-xs">{t.groupName ?? '—'}</td>
                        <td className="px-3 py-2 text-xs">{data.sourceLabels[t.source] || t.source}</td>
                        <td className="px-3 py-2 font-mono font-semibold text-emerald-400">+{fmt(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
