'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { formatUzsInteger } from '@/lib/utils'
import {
  downloadStipendRecipientListPdf,
  type StipendRecipientPdfRow,
} from '@/lib/stipendiyaListPdf'
import {
  STIPEND_PROGRAMS,
  isStipendProgramCode,
  stipendMeta,
  type StipendProgramCode,
  type StipendProgramMeta,
} from '@/lib/stipendiya'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Award,
  ChevronDown,
  ChevronRight,
  FileDown,
  Loader2,
  RotateCcw,
  Save,
  Search,
  Users,
} from 'lucide-react'

type StudentRow = {
  id: string
  studentId: string
  currentGroupName?: string | null
  enrollments?: Array<{
    groupName: string
    subjectName?: string | null
  }>
  user: { name: string; username: string }
}

type AwardAdmin = {
  id: string
  program: string
  examTitle: string
  examDate: string
  amountUzs?: number | null
  awardLabel?: string | null
  scorePercent?: number | null
  notes?: string | null
  createdAt: string
  student: { id: string; studentId: string; user: { name: string; username: string } }
}

const UNASSIGNED_LABEL = 'Guruh belgilanmagan'
const MATHEMATICS_KEYWORDS = ['matematika', 'matem']

function isMathematicsText(v?: string | null) {
  const text = (v ?? '').toLowerCase()
  return MATHEMATICS_KEYWORDS.some((kw) => text.includes(kw))
}

function mathematicsEnrollmentsOf(student: StudentRow) {
  const enrollments = student.enrollments ?? []
  return enrollments.filter(
    (e) => isMathematicsText(e.subjectName) || isMathematicsText(e.groupName)
  )
}

function mathematicsLabelForStudent(student: StudentRow) {
  const labels = mathematicsEnrollmentsOf(student).map((e) => {
    if (isMathematicsText(e.subjectName)) {
      return e.subjectName ? `${e.subjectName}: ${e.groupName}` : e.groupName
    }
    return e.groupName
  })
  const unique = Array.from(new Set(labels.filter(Boolean)))
  return unique.join('; ')
}

const PDF_BTN_ACCENT: Record<
  StipendProgramMeta['accent'],
  string
> = {
  amber:
    'border-amber-500/40 bg-amber-950/35 text-amber-100 hover:bg-amber-900/45 hover:border-amber-400/60',
  violet:
    'border-violet-500/40 bg-violet-950/35 text-violet-100 hover:bg-violet-900/45 hover:border-violet-400/60',
  sky:
    'border-sky-500/40 bg-sky-950/35 text-sky-100 hover:bg-sky-900/45 hover:border-sky-400/60',
  emerald:
    'border-emerald-500/40 bg-emerald-950/35 text-emerald-100 hover:bg-emerald-900/45 hover:border-emerald-400/60',
}

export default function AdminStipendiyaPage() {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [students, setStudents] = useState<StudentRow[]>([])
  const [awards, setAwards] = useState<AwardAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set()
  )
  const [rowOverrides, setRowOverrides] = useState<
    Record<string, { program: string; amount: string }>
  >({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [bulkProgram, setBulkProgram] = useState<StipendProgramCode>('IQMAX')
  const [bulkResetting, setBulkResetting] = useState(false)

  const isInSelectedMonth = useCallback(
    (isoDate: string) => {
      const d = new Date(isoDate)
      if (Number.isNaN(d.getTime())) return false
      const y = d.getUTCFullYear()
      const m = String(d.getUTCMonth() + 1).padStart(2, '0')
      return `${y}-${m}` === selectedMonth
    },
    [selectedMonth]
  )

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/students?includeEnrollment=true')
      if (res.ok) {
        const data = await res.json()
        setStudents(Array.isArray(data) ? data : [])
      } else setStudents([])
    } catch {
      setStudents([])
    }
  }, [])

  const fetchAwards = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stipendiya')
      if (res.ok) {
        const data = await res.json()
        setAwards(Array.isArray(data) ? data : [])
      } else setAwards([])
    } catch {
      setAwards([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchStudents(), fetchAwards()])
  }, [fetchStudents, fetchAwards])

  const awardByStudent = useMemo(() => {
    const m = new Map<string, AwardAdmin>()
    for (const a of awards) {
      if (!isInSelectedMonth(a.examDate)) continue
      const sid = a.student.id
      const prev = m.get(sid)
      if (
        !prev ||
        new Date(a.examDate).getTime() > new Date(prev.examDate).getTime()
      ) {
        m.set(sid, a)
      }
    }
    return m
  }, [awards, isInSelectedMonth])

  /** Joriy stipendiya yozuvi + o‘quvchining guruhi — PDF uchun */
  const recipientRowsByProgram = useMemo(() => {
    const groupByStudentId = new Map<string, string>(
      students.map((s) => {
        const label = mathematicsLabelForStudent(s)
        return [s.id, (label || UNASSIGNED_LABEL) as string]
      })
    )
    const buckets: Record<StipendProgramCode, StipendRecipientPdfRow[]> = {
      SULTONOV: [],
      EXCELLENT: [],
      RASH_UZ: [],
      IQMAX: [],
    }
    for (const award of awardByStudent.values()) {
      if (isStipendProgramCode(award.program)) {
        const sid = award.student.id
        buckets[award.program].push({
          group: groupByStudentId.get(sid) ?? UNASSIGNED_LABEL,
          name: award.student.user.name,
        })
      }
    }
    return buckets
  }, [awardByStudent, students])

  const defaultRow = useCallback(
    (studentId: string) => {
      const a = awardByStudent.get(studentId)
      return {
        program: a?.program ?? 'IQMAX',
        amount:
          a?.amountUzs != null && a.amountUzs > 0
            ? String(a.amountUzs)
            : '',
      }
    },
    [awardByStudent]
  )

  const getRow = useCallback(
    (studentId: string) => rowOverrides[studentId] ?? defaultRow(studentId),
    [rowOverrides, defaultRow]
  )

  const patchRow = useCallback(
    (
      studentId: string,
      patch: Partial<{ program: string; amount: string }>
    ) => {
      setRowOverrides((o) => {
        const base = o[studentId] ?? defaultRow(studentId)
        return { ...o, [studentId]: { ...base, ...patch } }
      })
    },
    [defaultRow]
  )

  const filteredStudents = useMemo(() => {
    const matematikaStudents = students.filter(
      (s) => mathematicsEnrollmentsOf(s).length > 0
    )

    const q = searchQ.trim().toLowerCase()
    if (!q) return matematikaStudents
    return matematikaStudents.filter((s) => {
      const nm = s.user.name.toLowerCase()
      const un = s.user.username.toLowerCase()
      const id = s.studentId.toLowerCase()
      return nm.includes(q) || un.includes(q) || id.includes(q)
    })
  }, [students, searchQ])

  const grouped = useMemo(() => {
    const map = new Map<string, StudentRow[]>()
    for (const s of filteredStudents) {
      const key = (mathematicsLabelForStudent(s) || UNASSIGNED_LABEL) as string
      const list = map.get(key) ?? []
      list.push(s)
      map.set(key, list)
    }
    const keys = [...map.keys()].sort((a, b) => {
      if (a === UNASSIGNED_LABEL) return 1
      if (b === UNASSIGNED_LABEL) return -1
      return a.localeCompare(b, 'uz')
    })
    return keys.map((name) => ({
      name,
      students: (map.get(name) ?? []).slice().sort((a, b) =>
        a.user.name.localeCompare(b.user.name, 'uz')
      ),
    }))
  }, [filteredStudents])

  const didInitExpand = useRef(false)
  useEffect(() => {
    if (didInitExpand.current || grouped.length === 0) return
    didInitExpand.current = true
    setExpandedGroups(new Set(grouped.map((g) => g.name)))
  }, [grouped])

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => {
      const n = new Set(prev)
      if (n.has(name)) n.delete(name)
      else n.add(name)
      return n
    })
  }

  const saveStudent = async (studentId: string) => {
    const row = getRow(studentId)
    const amountNum = Number(row.amount.replace(/\s/g, ''))
    if (!row.amount.trim() || !Number.isFinite(amountNum) || amountNum < 0) {
      alert('Iltimos, musbat stipendiya summasini kiriting.')
      return
    }
    setSavingId(studentId)
    try {
      const res = await fetch('/api/admin/stipendiya', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          program: row.program,
          amountUzs: Math.round(amountNum),
          replaceExisting: true,
          month: selectedMonth,
        }),
      })
      const err = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert((err as { error?: string }).error || 'Xatolik')
        return
      }
      setRowOverrides((o) => {
        const { [studentId]: _, ...rest } = o
        return rest
      })
      await fetchAwards()
    } finally {
      setSavingId(null)
    }
  }

  const resetProgramAmountsToZero = async () => {
    const meta = stipendMeta(bulkProgram)
    const ok = window.confirm(
      `${meta?.title ?? bulkProgram} bo‘yicha barcha stipendiya summalari 0 qilinsinmi?`
    )
    if (!ok) return

    setBulkResetting(true)
    try {
      const res = await fetch('/api/admin/stipendiya', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'zeroByProgram',
          program: bulkProgram,
          month: selectedMonth,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert((data as { error?: string }).error || 'Xatolik')
        return
      }
      await fetchAwards()
      alert(`Bajarildi: ${(data as { updatedCount?: number }).updatedCount ?? 0} ta yozuv 0 qilindi.`)
    } finally {
      setBulkResetting(false)
    }
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Stipendiyalar
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Guruhlar bo‘yicha o‘quvchilarni tanlang: 4 turdagi stipendiyalardan
            bittasi va summa. Saqlanganda o‘quvchi kabinetida katta ko‘rinishda
            chiqadi.
          </p>
        </div>

        <div className="rounded-xl border border-slate-600/80 bg-gradient-to-br from-slate-800/80 to-slate-900/90 p-4 sm:p-5 shadow-lg shadow-black/20">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                PDF: stipendiya olganlar ro‘yxati
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Har bir tur o‘z rangida; har qatorda guruh va o‘quvchi ismi (summa va tartib
                raqami yo‘q). Hozirgi tizimdagi stipendiya yozuviga ko‘ra.
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <label className="mb-1 block text-xs text-slate-400">Hisobot oyi</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value || currentMonth)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 sm:w-48"
              />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {STIPEND_PROGRAMS.map((p) => {
              const cls = PDF_BTN_ACCENT[p.accent]
              return (
                <button
                  key={p.code}
                  type="button"
                  onClick={() =>
                    downloadStipendRecipientListPdf(p.code, recipientRowsByProgram[p.code])
                  }
                  className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${cls}`}
                >
                  <FileDown className="h-4 w-4 shrink-0 opacity-90" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{p.title}</span>
                    <span className="block text-[11px] font-normal opacity-80">PDF yuklab olish</span>
                  </span>
                </button>
              )
            })}
          </div>
          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-950/25 p-3">
            <p className="text-xs text-red-100/90">
              Yangi stipendiya mavsumini boshlash uchun tanlangan tur bo‘yicha hamma summani 0 qilish.
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={bulkProgram}
                onChange={(e) => {
                  if (isStipendProgramCode(e.target.value)) {
                    setBulkProgram(e.target.value)
                  }
                }}
                className="w-full sm:w-64 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-red-400"
              >
                {STIPEND_PROGRAMS.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={bulkResetting}
                onClick={resetProgramAmountsToZero}
                className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-red-500/45 bg-red-900/40 px-3 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-900/55 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {bulkResetting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Tanlangan tur bo‘yicha 0 qilish
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
          <label className="mb-1 block text-xs text-slate-500">
            Qidiruv (ism, login, o‘quvchi ID)
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-emerald-500"
              placeholder="Qidirish..."
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500">Yuklanmoqda...</div>
        ) : grouped.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-600 py-16 text-center text-slate-500">
            <Users className="mx-auto mb-3 h-10 w-10 opacity-50" />
            O‘quvchi topilmadi
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.map((group) => {
              const open = expandedGroups.has(group.name)
              return (
                <div
                  key={group.name}
                  className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/30"
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.name)}
                    className="flex w-full items-center justify-between gap-3 border-b border-slate-700/80 bg-slate-900/40 px-4 py-3 text-left transition hover:bg-slate-900/60"
                  >
                    <span className="flex min-w-0 items-center gap-2 font-semibold text-white">
                      {open ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-emerald-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
                      )}
                      <Users className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{group.name}</span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {group.students.length} o‘quvchi
                    </span>
                  </button>
                  {open && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-700/80 text-xs uppercase text-slate-500">
                            <th className="px-4 py-2.5 font-medium">
                              O‘quvchi
                            </th>
                            <th className="min-w-[200px] px-4 py-2.5 font-medium">
                              Stipendiya turi
                            </th>
                            <th className="min-w-[140px] px-4 py-2.5 font-medium">
                              Summa (so‘m)
                            </th>
                            <th className="min-w-[100px] px-4 py-2.5 text-right font-medium">
                              Amal
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/60">
                          {group.students.map((s) => {
                            const row = getRow(s.id)
                            const award = awardByStudent.get(s.id)
                            const savedMeta = award
                              ? stipendMeta(award.program)
                              : undefined
                            return (
                              <tr
                                key={s.id}
                                className="text-slate-300 transition hover:bg-slate-700/15"
                              >
                                <td className="px-4 py-3">
                                  <p className="font-medium text-white">
                                    {s.user.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    @{s.user.username} · {s.studentId}
                                  </p>
                                  {award?.amountUzs != null &&
                                    award.amountUzs > 0 && (
                                      <p className="mt-1 text-xs text-emerald-400/90">
                                        Hozir: {formatUzsInteger(award.amountUzs)}{' '}
                                        so‘m
                                        {savedMeta
                                          ? ` · ${savedMeta.title}`
                                          : ''}
                                      </p>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                  <select
                                    value={row.program}
                                    onChange={(e) =>
                                      patchRow(s.id, {
                                        program: e.target.value,
                                      })
                                    }
                                    className="w-full max-w-xs rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                                  >
                                    {STIPEND_PROGRAMS.map((p) => (
                                      <option key={p.code} value={p.code}>
                                        {p.title}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={row.amount}
                                    onChange={(e) =>
                                      patchRow(s.id, {
                                        amount: e.target.value,
                                      })
                                    }
                                    placeholder="Masalan: 1500000"
                                    className="w-full min-w-[120px] rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 font-mono text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500"
                                  />
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    disabled={savingId === s.id}
                                    onClick={() => saveStudent(s.id)}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-500 disabled:opacity-50"
                                  >
                                    {savingId === s.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Save className="h-3.5 w-3.5" />
                                    )}
                                    Saqlash
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <p className="flex items-start gap-2 text-xs text-slate-500">
          <Award className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Har bir o‘quvchi uchun yangi saqlash tanlangan oy ichidagi avvalgi
          yozuvni almashtiradi.
        </p>
      </div>
    </DashboardLayout>
  )
}
