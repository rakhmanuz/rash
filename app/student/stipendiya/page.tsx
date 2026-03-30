'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { formatDateShort } from '@/lib/utils'
import { STIPEND_PROGRAMS, stipendMeta } from '@/lib/stipendiya'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Award, Calendar, Hash, Info, Medal, Sparkles } from 'lucide-react'

type AwardRow = {
  id: string
  program: string
  examTitle: string
  examDate: string
  awardLabel?: string | null
  scorePercent?: number | null
  notes?: string | null
  createdAt: string
}

const accentStyles: Record<
  'amber' | 'violet' | 'sky' | 'emerald',
  { ring: string; badge: string; glow: string }
> = {
  amber: {
    ring: 'border-amber-500/35 hover:border-amber-400/50',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    glow: 'shadow-[0_0_40px_-12px_rgba(245,158,11,0.35)]',
  },
  violet: {
    ring: 'border-violet-500/35 hover:border-violet-400/50',
    badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    glow: 'shadow-[0_0_40px_-12px_rgba(139,92,246,0.35)]',
  },
  sky: {
    ring: 'border-sky-500/35 hover:border-sky-400/50',
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    glow: 'shadow-[0_0_40px_-12px_rgba(14,165,233,0.35)]',
  },
  emerald: {
    ring: 'border-emerald-500/35 hover:border-emerald-400/50',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    glow: 'shadow-[0_0_40px_-12px_rgba(52,211,153,0.35)]',
  },
}

export default function StudentStipendiyaPage() {
  const [rows, setRows] = useState<AwardRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAwards = useCallback(async () => {
    try {
      const res = await fetch('/api/student/stipendiya')
      if (res.ok) {
        const data = await res.json()
        setRows(Array.isArray(data) ? data : [])
      } else {
        setRows([])
      }
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAwards()
  }, [fetchAwards])

  const byProgram = useMemo(() => {
    const m = new Map<string, AwardRow[]>()
    for (const p of STIPEND_PROGRAMS) m.set(p.code, [])
    for (const r of rows) {
      const list = m.get(r.program) ?? []
      list.push(r)
      m.set(r.program, list)
    }
    return m
  }, [rows])

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-2xl border border-slate-600/40 bg-gradient-to-br from-slate-800/90 via-slate-900/95 to-slate-950 p-6 sm:p-8 shadow-xl">
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-emerald-400/90">
                <Sparkles className="h-3.5 w-3.5" />
                O‘quvchi kabineti
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Stipendiyalar
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                SULTONOV, EXCELLENT, rash.uz va IQMax stipendiyalari{' '}
                <span className="text-slate-300">oflayn imtihonlar</span> va
                tanlovlar natijalariga asosan belgilanadi. Tasdiqlangan
                yutuqlaringiz shu yerda ko‘rinadi.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-600/50 bg-slate-900/60 px-4 py-3">
              <Medal className="h-10 w-10 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-white">{rows.length}</p>
                <p className="text-xs text-slate-500">jami yozuv</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 rounded-xl border border-blue-500/25 bg-blue-500/5 px-4 py-3 text-sm text-slate-300">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
          <p>
            Platformada test ballari avtomatik hisoblanadi; stipendiya esa
            alohida oflayn imtihon protokoliga ko‘ra admin tomonidan
            qayd etiladi. Savollar bo‘lsa, markaz boshlig‘iga murojaat qiling.
          </p>
        </div>

        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Award className="h-5 w-5 text-amber-400" />
            Dasturlar bo‘yicha
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {STIPEND_PROGRAMS.map((p) => {
              const list = byProgram.get(p.code) ?? []
              const st = accentStyles[p.accent]
              return (
                <div
                  key={p.code}
                  className={`rounded-xl border bg-slate-900/40 p-5 transition-colors ${st.ring} ${st.glow}`}
                >
                  <span
                    className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${st.badge}`}
                  >
                    {p.code === 'RASH_UZ' ? 'rash.uz' : p.code}
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-white">
                    {p.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                    {p.subtitle}
                  </p>
                  <p className="mt-4 text-sm text-slate-400">
                    {list.length > 0 ? (
                      <>
                        <span className="font-semibold text-white">
                          {list.length}
                        </span>{' '}
                        tasdiqlangan natija
                      </>
                    ) : (
                      <span className="text-slate-500">
                        Hozircha yozuv yo‘q
                      </span>
                    )}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Calendar className="h-5 w-5 text-sky-400" />
            Natijalar tarixi
          </h2>

          {loading ? (
            <div className="py-16 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500" />
              <p className="mt-4 text-slate-500">Yuklanmoqda...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/30 py-16 text-center">
              <Medal className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-slate-400">
                Hozircha stipendiya yozuvlari yo‘q
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Oflayn imtihon natijangiz tasdiqlangandan keyin admin qo‘shganda
                bu yerda paydo bo‘ladi.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => {
                const meta = stipendMeta(r.program)
                const ac = meta
                  ? accentStyles[meta.accent]
                  : accentStyles.emerald
                return (
                  <div
                    key={r.id}
                    className={`rounded-xl border border-slate-700/80 bg-slate-800/40 p-4 sm:p-5 ${ac.glow}`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-medium ${ac.badge}`}
                          >
                            {meta?.title ?? r.program}
                          </span>
                          {r.awardLabel && (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-900/60 px-2 py-0.5 text-xs text-slate-300">
                              <Hash className="h-3 w-3" />
                              {r.awardLabel}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-white">{r.examTitle}</p>
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDateShort(r.examDate)}
                          </span>
                          {r.scorePercent != null && (
                            <span>Ball / foiz: {r.scorePercent}%</span>
                          )}
                        </p>
                        {r.notes && (
                          <p className="text-sm text-slate-500">{r.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
