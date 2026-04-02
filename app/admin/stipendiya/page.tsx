'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { formatUzsInteger } from '@/lib/utils'
import { STIPEND_PROGRAMS, stipendMeta } from '@/lib/stipendiya'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Award,
  ChevronDown,
  ChevronRight,
  Loader2,
  Save,
  Search,
  Users,
} from 'lucide-react'

type StudentRow = {
  id: string
  studentId: string
  currentGroupName?: string | null
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

export default function AdminStipendiyaPage() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [awards, setAwards] = useState<AwardAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set()
  )
  const [rowOverrides, setRowOverrides] = useState<
    Record<string, { program: string; amount: string }>
  >({})
  const [savingId, setSavingId] = useState<string | null>(null)

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
  }, [awards])

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
    const q = searchQ.trim().toLowerCase()
    if (!q) return students
    return students.filter((s) => {
      const nm = s.user.name.toLowerCase()
      const un = s.user.username.toLowerCase()
      const id = s.studentId.toLowerCase()
      return nm.includes(q) || un.includes(q) || id.includes(q)
    })
  }, [students, searchQ])

  const grouped = useMemo(() => {
    const map = new Map<string, StudentRow[]>()
    for (const s of filteredStudents) {
      const key = (s.currentGroupName?.trim() || UNASSIGNED_LABEL) as string
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
          Har bir o‘quvchi uchun yangi saqlash avvalgi yozuvlarni almashtiradi
          (bitta aktual stipendiya).
        </p>
      </div>
    </DashboardLayout>
  )
}
