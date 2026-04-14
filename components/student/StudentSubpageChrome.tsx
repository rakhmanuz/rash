'use client'

import Link from 'next/link'
import {
  Activity,
  Calendar,
  ChevronRight,
  LayoutDashboard,
  RefreshCw,
} from 'lucide-react'

const linkBase =
  'group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left shadow-[0_2px_12px_rgba(0,0,0,0.2)] transition-all duration-200 touch-manipulation min-h-[52px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070a0f] active:scale-[0.99]'

export function StudentSubpageHeader({
  title,
  subtitle,
  onRefresh,
  refreshing,
  updatedAt,
}: {
  title: string
  subtitle: string
  onRefresh?: () => void
  refreshing?: boolean
  updatedAt?: Date | null
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{title}</h1>
        <p className="text-slate-400 text-sm sm:text-base mt-1.5 leading-relaxed max-w-2xl">{subtitle}</p>
        {updatedAt ? (
          <p className="text-[11px] text-slate-600 mt-2 tabular-nums">
            Yangilangan:{' '}
            {updatedAt.toLocaleString('uz-UZ', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        ) : null}
      </div>
      {onRefresh ? (
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-[#161b22] px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-emerald-500/35 hover:bg-[#1c2433] hover:text-white disabled:opacity-50 transition-colors min-h-[44px] shrink-0"
          aria-label="Maʼlumotlarni yangilash"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Yangilash
        </button>
      ) : null}
    </div>
  )
}

/** Ikkinchi havola: davomat sahifasida — ko'rsatkichlar; ko'rsatkichlar sahifasida — davomat */
export function StudentQuickNavGrid({ secondary }: { secondary: 'attendance' | 'metrics' }) {
  const second =
    secondary === 'attendance' ? (
      <Link
        href="/student/attendance"
        className={`${linkBase} border-white/10 bg-[#161b22] hover:border-sky-500/45 hover:shadow-[0_4px_24px_rgba(56,189,248,0.1)] focus-visible:ring-sky-500/50`}
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-700/10 text-sky-400 border border-sky-500/25 shadow-inner">
            <Calendar className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold text-white group-hover:text-sky-50 transition-colors">Davomat</span>
            <span className="block text-xs text-slate-500 mt-0.5">Fan bo&apos;yicha darslar</span>
          </span>
        </span>
        <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-sky-400/80 transition-colors shrink-0" />
      </Link>
    ) : (
      <Link
        href="/student/fan-korsatkichlar"
        className={`${linkBase} border-white/10 bg-[#161b22] hover:border-violet-500/45 hover:shadow-[0_4px_24px_rgba(167,139,250,0.1)] focus-visible:ring-violet-500/50`}
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-900/10 text-violet-300 border border-violet-500/25 shadow-inner">
            <Activity className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold text-white group-hover:text-violet-50 transition-colors">
              Fanlar bo&apos;yicha ko&apos;rsatkichlar
            </span>
            <span className="block text-xs text-slate-500 mt-0.5">Topshiriq, o&apos;zlashtirish, qobiliyat</span>
          </span>
        </span>
        <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-violet-400/80 transition-colors shrink-0" />
      </Link>
    )

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link
        href="/student/dashboard"
        className={`${linkBase} border-white/10 bg-[#161b22] hover:border-emerald-500/45 hover:shadow-[0_4px_24px_rgba(16,185,129,0.12)] focus-visible:ring-emerald-500/50`}
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/10 text-emerald-400 border border-emerald-500/25 shadow-inner">
            <LayoutDashboard className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold text-white group-hover:text-emerald-50 transition-colors">
              Barcha fanlar
            </span>
            <span className="block text-xs text-slate-500 mt-0.5">Diagrammalar va umumiy ko&apos;rinish</span>
          </span>
        </span>
        <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-emerald-400/80 transition-colors shrink-0" />
      </Link>
      {second}
    </div>
  )
}

export function StudentPageSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-5 max-w-4xl mx-auto animate-pulse" aria-hidden>
      <div className="h-9 w-48 rounded-lg bg-slate-800/80" />
      <div className="h-4 w-full max-w-md rounded bg-slate-800/60" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-[52px] rounded-2xl bg-slate-800/70 border border-white/5" />
        <div className="h-[52px] rounded-2xl bg-slate-800/70 border border-white/5" />
      </div>
      <div className="rounded-2xl border border-white/[0.06] bg-[#101318] overflow-hidden">
        <div className="h-14 border-b border-white/5 bg-slate-800/40" />
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="h-28 rounded-xl bg-slate-800/50" />
          <div className="h-28 rounded-xl bg-slate-800/50" />
          <div className="h-28 rounded-xl bg-slate-800/50" />
          <div className="h-28 rounded-xl bg-slate-800/50" />
        </div>
      </div>
      <div className="rounded-2xl border border-white/[0.06] bg-[#101318] overflow-hidden">
        <div className="h-14 border-b border-white/5 bg-slate-800/40" />
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="h-28 rounded-xl bg-slate-800/50" />
          <div className="h-28 rounded-xl bg-slate-800/50" />
          <div className="h-28 rounded-xl bg-slate-800/50" />
          <div className="h-28 rounded-xl bg-slate-800/50" />
        </div>
      </div>
    </div>
  )
}
