'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import {
  StudentPageSkeleton,
  StudentQuickNavGrid,
  StudentSubpageHeader,
} from '@/components/student/StudentSubpageChrome'
import { useCallback, useEffect, useState } from 'react'
import {
  enrollmentLabel,
  fourFromLastResults,
  navScorePercent,
  paletteForIndex,
} from '@/lib/student-dashboard-helpers'
import { formatDateShort } from '@/lib/utils'
import { BookOpen, Calendar, ClipboardCheck, PenTool } from 'lucide-react'

type Enrollment = { groupId: string; groupName: string; subjectName: string | null }

type ScopedStats = {
  attendanceRate: number
  assignmentRate: number
  classMastery: number
  weeklyWrittenRate: number
  lastResults?: {
    attendance?: { date?: string | null; label?: string } | null
    homework?: { date?: string | null; label?: string } | null
    test?: { date?: string | null; label?: string } | null
    writtenWork?: { date?: string | null; label?: string } | null
  }
}

type MetricCell = {
  key: string
  label: string
  value: number
  icon: typeof Calendar
  hint: string | null
  barClass: string
  glowClass: string
  ringHover: string
}

export default function StudentFanKorsatkichlarPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [byGroup, setByGroup] = useState<Record<string, ScopedStats | null>>({})
  const [booting, setBooting] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const load = useCallback(async (opts?: { soft?: boolean }) => {
    if (opts?.soft) setRefreshing(true)
    else setBooting(true)
    setError(null)
    try {
      const res0 = await fetch('/api/student/stats', { credentials: 'include' })
      if (!res0.ok) {
        setError('Maʼlumot olinmadi')
        return
      }
      const baseline = await res0.json()
      if (baseline?.error) {
        setError(String(baseline.error))
        return
      }
      const ens = (baseline.enrollmentsForStats || []) as Enrollment[]
      setEnrollments(ens)
      if (ens.length === 0) {
        setByGroup({})
        setUpdatedAt(new Date())
        return
      }
      const pairs = await Promise.all(
        ens.map(async (e) => {
          const r = await fetch(
            `/api/student/stats?groupId=${encodeURIComponent(e.groupId)}`,
            { credentials: 'include' }
          )
          if (!r.ok) return [e.groupId, null] as const
          const j = await r.json()
          if (j?.error) return [e.groupId, null] as const
          return [
            e.groupId,
            {
              attendanceRate: Number(j.attendanceRate) || 0,
              assignmentRate: Number(j.assignmentRate) || 0,
              classMastery: Number(j.classMastery) || 0,
              weeklyWrittenRate: Number(j.weeklyWrittenRate) || 0,
              lastResults: j.lastResults,
            } satisfies ScopedStats,
          ] as const
        })
      )
      const m: Record<string, ScopedStats | null> = {}
      for (const [id, s] of pairs) m[id] = s
      setByGroup(m)
      setUpdatedAt(new Date())
    } catch {
      setError('Tarmoq xatosi')
    } finally {
      setBooting(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const fmt = (d?: string | null) => {
    if (!d) return null
    try {
      return formatDateShort(new Date(d))
    } catch {
      return null
    }
  }

  if (booting) {
    return (
      <DashboardLayout role="STUDENT">
        <StudentPageSkeleton />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="STUDENT">
      <div className="relative max-w-4xl mx-auto space-y-5 sm:space-y-6">
        <StudentSubpageHeader
          title="Fanlar bo'yicha ko'rsatkichlar"
          subtitle="Har bir fan alohida: davomat, uyda topshiriq, o'zlashtirish va qobiliyat — boshqa fanlar bilan aralashmaydi."
          onRefresh={() => load({ soft: true })}
          refreshing={refreshing}
          updatedAt={updatedAt}
        />

        <StudentQuickNavGrid secondary="attendance" />

        {error ? (
          <div className="rounded-2xl border border-red-500/35 bg-red-950/25 px-4 py-3 text-red-100 text-sm flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => load({ soft: true })}
              className="text-xs font-semibold uppercase tracking-wide text-red-200 underline underline-offset-2 hover:text-white"
            >
              Qayta urinish
            </button>
          </div>
        ) : null}

        {enrollments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-[#101318] p-10 text-center">
            <p className="text-slate-300 font-medium">Faol guruh / fan topilmadi</p>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              Administratorga murojaat qiling yoki guruhga qayta yoziling.
            </p>
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-6">
            {enrollments.map((e, gi) => {
              const accent = paletteForIndex(gi)
              const s = byGroup[e.groupId]
              const title = enrollmentLabel(e)
              const lr = s?.lastResults
              const four = s ? fourFromLastResults(s.lastResults ?? null) : null
              const summaryPct = four ? navScorePercent(four) : null

              const cells: MetricCell[] = s
                ? [
                    {
                      key: 'davomat',
                      label: 'Davomat',
                      value: s.attendanceRate,
                      icon: Calendar,
                      hint: lr?.attendance
                        ? `${lr.attendance.label ?? ''} ${fmt(lr.attendance.date) ?? ''}`.trim() || null
                        : null,
                      barClass: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
                      glowClass: 'bg-emerald-500',
                      ringHover: 'hover:border-emerald-500/30',
                    },
                    {
                      key: 'topshiriq',
                      label: 'Uyda topshiriq',
                      value: s.assignmentRate,
                      icon: ClipboardCheck,
                      hint: lr?.homework
                        ? `${lr.homework.label ?? ''} ${fmt(lr.homework.date) ?? ''}`.trim() || null
                        : null,
                      barClass: 'bg-gradient-to-r from-sky-600 to-sky-400',
                      glowClass: 'bg-sky-500',
                      ringHover: 'hover:border-sky-500/30',
                    },
                    {
                      key: 'ozlashtirish',
                      label: "O'zlashtirish",
                      value: s.classMastery,
                      icon: BookOpen,
                      hint: lr?.test
                        ? `${lr.test.label ?? ''} ${fmt(lr.test.date) ?? ''}`.trim() || null
                        : null,
                      barClass: 'bg-gradient-to-r from-amber-600 to-amber-400',
                      glowClass: 'bg-amber-500',
                      ringHover: 'hover:border-amber-500/30',
                    },
                    {
                      key: 'qobilyat',
                      label: 'Qobiliyat',
                      value: s.weeklyWrittenRate,
                      icon: PenTool,
                      hint: lr?.writtenWork
                        ? `${lr.writtenWork.label ?? ''} ${fmt(lr.writtenWork.date) ?? ''}`.trim() || null
                        : null,
                      barClass: 'bg-gradient-to-r from-violet-600 to-violet-400',
                      glowClass: 'bg-violet-500',
                      ringHover: 'hover:border-violet-500/30',
                    },
                  ]
                : []

              return (
                <section
                  key={e.groupId}
                  className="rounded-2xl border border-white/[0.07] bg-[#101318] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.04]"
                  style={{ borderTopWidth: 3, borderTopColor: accent.color }}
                >
                  <div className="px-4 sm:px-5 py-4 border-b border-white/10 bg-gradient-to-r from-[#12161d] to-transparent flex flex-wrap items-center gap-3 justify-between">
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold tracking-tight break-words" style={{ color: accent.color }}>
                        {title}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Faqat shu guruh uchun hisoblangan ko&apos;rsatkichlar — boshqa fanlar bilan aralashmaydi.
                      </p>
                    </div>
                    {summaryPct != null ? (
                      <div
                        className="shrink-0 rounded-xl border border-white/10 bg-[#161b22] px-3 py-2 text-center shadow-inner"
                        title="Davomat, topshiriq va test bo'yicha umumiy foiz"
                      >
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Umumiy</div>
                        <div className="text-xl font-bold tabular-nums text-white" style={{ color: accent.color }}>
                          {summaryPct}%
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {!s ? (
                    <div className="p-8 text-center text-slate-500 text-sm">Bu fan uchun maʼlumot yuklanmadi.</div>
                  ) : (
                    <div className="p-3 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {cells.map((c) => {
                        const Icon = c.icon
                        const v = Math.min(100, Math.max(0, Math.round(c.value)))
                        return (
                          <div
                            key={c.key}
                            className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#171c28] to-[#11161f] p-4 sm:p-5 transition-all duration-200 ${c.ringHover} hover:shadow-[0_4px_24px_rgba(0,0,0,0.35)]`}
                          >
                            <div
                              className={`pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full blur-3xl opacity-25 ${c.glowClass}`}
                            />
                            <div className="relative flex flex-col gap-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-slate-200 min-w-0">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                                    <Icon className="h-4 w-4 opacity-90" />
                                  </span>
                                  <span className="text-sm font-semibold tracking-tight truncate">{c.label}</span>
                                </div>
                              </div>
                              <div
                                className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-white drop-shadow-sm"
                                style={{ textShadow: '0 0 40px rgba(255,255,255,0.06)' }}
                              >
                                {v}
                                <span className="text-lg font-bold text-slate-500 ml-0.5">%</span>
                              </div>
                              <div className="h-2.5 rounded-full bg-slate-900/90 overflow-hidden border border-white/[0.06] shadow-inner">
                                <div
                                  className={`h-full rounded-full ${c.barClass} transition-[width] duration-700 ease-out shadow-[0_0_12px_rgba(255,255,255,0.15)]`}
                                  style={{ width: `${v}%` }}
                                />
                              </div>
                              {c.hint ? (
                                <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{c.hint}</p>
                              ) : (
                                <p className="text-[11px] text-slate-600 italic">Oxirgi yozuv sanasi ko‘rsatilmagan</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
