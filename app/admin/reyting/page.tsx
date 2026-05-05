'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Filter, Sparkles, Trophy, Users } from 'lucide-react'

type Period = 'week' | 'month' | 'range'

type GroupItem = {
  id: string
  name: string
  subject?: { id: string; name: string } | null
}

type SubjectItem = {
  id: string
  name: string
}

type StudentItem = {
  id: string
  studentId: string | null
  user: { name?: string; username?: string } | null
}

type TopCollectorItem = {
  userId: string
  name: string
  username: string | null
  role: string
  studentId: string | null
  totalEarned: number
  actionCount: number
}

type TopCollectorsResponse = {
  periodLabel: string
  items: TopCollectorItem[]
}

const PERIOD_OPTIONS: Array<{ value: Period; label: string }> = [
  { value: 'week', label: "So'nggi 7 kun" },
  { value: 'month', label: "So'nggi 30 kun" },
  { value: 'range', label: 'Oraliq sanalar' },
]

export default function AdminReytingPage() {
  const [groups, setGroups] = useState<GroupItem[]>([])
  const [students, setStudents] = useState<StudentItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [groupId, setGroupId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [period, setPeriod] = useState<Period>('week')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TopCollectorsResponse | null>(null)
  const [allowedGroupIds, setAllowedGroupIds] = useState<string[]>([])
  const [allowedStudentIds, setAllowedStudentIds] = useState<string[]>([])
  const [savingAccess, setSavingAccess] = useState(false)

  const subjectFilteredGroups = useMemo(() => {
    if (!subjectId) return groups
    return groups.filter((g) => g.subject?.id === subjectId)
  }, [groups, subjectId])

  useEffect(() => {
    const activeGroupAllowed = !groupId || subjectFilteredGroups.some((g) => g.id === groupId)
    if (!activeGroupAllowed) setGroupId('')
  }, [subjectFilteredGroups, groupId])

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/admin/groups', { credentials: 'include' })
      if (!res.ok) {
        setGroups([])
        setSubjects([])
        return
      }

      const data = await res.json()
      const mapped = Array.isArray(data)
        ? data.map((g: GroupItem) => ({
            id: g.id,
            name: g.name,
            subject: g.subject ?? null,
          }))
        : []

      const subjectMap = new Map<string, SubjectItem>()
      for (const g of mapped) {
        if (g.subject?.id) {
          subjectMap.set(g.subject.id, { id: g.subject.id, name: g.subject.name })
        }
      }

      setGroups(mapped)
      setSubjects(Array.from(subjectMap.values()).sort((a, b) => a.name.localeCompare(b.name)))
    } catch {
      setGroups([])
      setSubjects([])
    }
  }

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/admin/students', { credentials: 'include' })
      if (!res.ok) {
        setStudents([])
        return
      }
      const data = await res.json()
      const mapped = Array.isArray(data)
        ? data.map((s: StudentItem) => ({
            id: s.id,
            studentId: s.studentId ?? null,
            user: s.user ?? null,
          }))
        : []
      setStudents(mapped)
    } catch {
      setStudents([])
    }
  }

  const fetchAccess = async () => {
    try {
      const res = await fetch('/api/admin/reyting/access', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      setAllowedGroupIds(Array.isArray(data.allowedGroupIds) ? data.allowedGroupIds : [])
      setAllowedStudentIds(Array.isArray(data.allowedStudentIds) ? data.allowedStudentIds : [])
    } catch {}
  }

  const toggleAllowedGroup = (id: string) => {
    setAllowedGroupIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleAllowedStudent = (id: string) => {
    setAllowedStudentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const saveAccess = async () => {
    setSavingAccess(true)
    try {
      const res = await fetch('/api/admin/reyting/access', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowedGroupIds,
          allowedStudentIds,
        }),
      })
      if (!res.ok) {
        setError("Ruxsatlarni saqlab bo'lmadi")
        return
      }
    } catch {
      setError("Tarmoq xatosi: ruxsatlar saqlanmadi")
    } finally {
      setSavingAccess(false)
    }
  }

  const fetchTopCollectors = async () => {
    if (period === 'range' && (!dateFrom || !dateTo)) {
      setError("Oraliq uchun 'dan' va 'gacha' sanalarini tanlang")
      return
    }

    if (period === 'range' && dateFrom > dateTo) {
      setError("'Dan' sanasi 'gacha' sanasidan keyin bo'lishi mumkin emas")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('period', period)
      params.set('limit', '30')
      if (period === 'range') {
        params.set('dateFrom', dateFrom)
        params.set('dateTo', dateTo)
      }
      if (subjectId) params.set('subjectId', subjectId)
      if (groupId) params.set('groupId', groupId)

      const res = await fetch(`/api/admin/infinity/top-collectors?${params.toString()}`, {
        credentials: 'include',
      })

      if (!res.ok) {
        if (res.status === 403) {
          setError("Sizda reytingni ko'rish huquqi yo'q")
        } else {
          setError("Reyting ma'lumotlarini yuklab bo'lmadi")
        }
        setResult(null)
        return
      }

      const data = (await res.json()) as TopCollectorsResponse
      setResult({
        periodLabel: data.periodLabel || '',
        items: Array.isArray(data.items) ? data.items : [],
      })
    } catch {
      setError("Tarmoq xatosi: reytingni yuklab bo'lmadi")
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchGroups()
    void fetchStudents()
    void fetchAccess()
  }, [])

  useEffect(() => {
    void fetchTopCollectors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, subjectId, groupId])

  const top3 = result?.items.slice(0, 3) ?? []
  const otherRows = result?.items.slice(3) ?? []

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600/30 via-teal-600/25 to-cyan-700/20 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/20 p-2.5">
              <Trophy className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Reyting</h1>
              <p className="text-sm text-emerald-100/90">
                Infinity to'plashi bo'yicha eng faol o'quvchilar ro'yxati
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-700 bg-slate-800 p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Filter className="h-4 w-4 text-cyan-300" />
            <span className="font-semibold">Filtrlar</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="h-10 rounded-lg border border-gray-600 bg-slate-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="h-10 rounded-lg border border-gray-600 bg-slate-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Barcha fanlar</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>

            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="h-10 rounded-lg border border-gray-600 bg-slate-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Barcha guruhlar</option>
              {subjectFilteredGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              disabled={period !== 'range'}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10 rounded-lg border border-gray-600 bg-slate-900 px-3 text-sm text-white disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <input
              type="date"
              disabled={period !== 'range'}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10 rounded-lg border border-gray-600 bg-slate-900 px-3 text-sm text-white disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void fetchTopCollectors()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Yangilash
            </button>

            <span className="inline-flex items-center gap-2 text-xs text-gray-300">
              <CalendarDays className="h-4 w-4 text-cyan-300" />
              Davr: {result?.periodLabel || '-'}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-700 bg-slate-800 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-white font-semibold">Reyting ko'rish ruxsati</h2>
              <p className="text-xs text-gray-400">
                Faqat shu yerda belgilangan o'quvchi yoki guruhlardagi o'quvchilar student panelda reytingni ko'radi.
              </p>
            </div>
            <button
              onClick={() => void saveAccess()}
              disabled={savingAccess}
              className="inline-flex h-9 items-center rounded-lg bg-cyan-500 px-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
            >
              {savingAccess ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-700 bg-slate-900/60 p-3">
              <div className="mb-2 text-sm font-semibold text-white">Guruhlar</div>
              <div className="max-h-52 overflow-auto space-y-1">
                {groups.map((group) => (
                  <label key={group.id} className="flex items-center gap-2 text-sm text-gray-200">
                    <input
                      type="checkbox"
                      checked={allowedGroupIds.includes(group.id)}
                      onChange={() => toggleAllowedGroup(group.id)}
                      className="h-4 w-4 accent-cyan-500"
                    />
                    <span className="truncate">{group.name}</span>
                  </label>
                ))}
                {groups.length === 0 && <p className="text-xs text-gray-400">Guruh topilmadi.</p>}
              </div>
            </div>

            <div className="rounded-lg border border-gray-700 bg-slate-900/60 p-3">
              <div className="mb-2 text-sm font-semibold text-white">O'quvchilar</div>
              <div className="max-h-52 overflow-auto space-y-1">
                {students.map((student) => (
                  <label key={student.id} className="flex items-center gap-2 text-sm text-gray-200">
                    <input
                      type="checkbox"
                      checked={allowedStudentIds.includes(student.id)}
                      onChange={() => toggleAllowedStudent(student.id)}
                      className="h-4 w-4 accent-cyan-500"
                    />
                    <span className="truncate">
                      {student.user?.name || "Noma'lum"} {student.studentId ? `(${student.studentId})` : ''}
                    </span>
                  </label>
                ))}
                {students.length === 0 && <p className="text-xs text-gray-400">O'quvchi topilmadi.</p>}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-gray-700 bg-slate-800 p-8 text-center text-gray-300">
            Reyting yuklanmoqda...
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {top3.length === 0 && (
                <div className="md:col-span-3 rounded-xl border border-gray-700 bg-slate-800 p-8 text-center text-gray-300">
                  Tanlangan filtrlar bo'yicha reyting topilmadi.
                </div>
              )}

              {top3.map((item, idx) => {
                const rank = idx + 1
                const rankBadgeClass =
                  rank === 1
                    ? 'bg-yellow-500/20 text-yellow-200 border-yellow-500/35'
                    : rank === 2
                      ? 'bg-slate-400/20 text-slate-200 border-slate-400/35'
                      : 'bg-amber-700/20 text-amber-200 border-amber-700/35'
                return (
                  <div key={item.userId} className="rounded-xl border border-gray-700 bg-slate-800 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${rankBadgeClass}`}>
                        TOP {rank}
                      </span>
                      <Trophy className="h-5 w-5 text-emerald-300" />
                    </div>
                    <p className="mt-4 text-base font-semibold text-white truncate">{item.name || item.username || 'Nomaʼlum'}</p>
                    <p className="mt-1 text-xs text-gray-400 truncate">
                      {item.username ? `@${item.username}` : "Username yo'q"}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-gray-400">Jami to'plagan</span>
                      <span className="font-bold text-emerald-300">{item.totalEarned} ∞</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-gray-500">Amallar soni</span>
                      <span className="text-cyan-300">{item.actionCount}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {otherRows.length > 0 && (
              <div className="rounded-xl border border-gray-700 bg-slate-800 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-gray-700 px-4 py-3 text-white">
                  <Users className="h-4 w-4 text-cyan-300" />
                  <span className="font-semibold">Qolgan reyting</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-900/70 text-left text-gray-400">
                        <th className="px-4 py-3 font-medium">O'rin</th>
                        <th className="px-4 py-3 font-medium">O'quvchi</th>
                        <th className="px-4 py-3 font-medium">Username</th>
                        <th className="px-4 py-3 font-medium">To'plagan infinity</th>
                        <th className="px-4 py-3 font-medium">Amallar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {otherRows.map((item, idx) => (
                        <tr key={item.userId} className="border-t border-gray-700/60 text-gray-200">
                          <td className="px-4 py-3 font-semibold text-cyan-300">{idx + 4}</td>
                          <td className="px-4 py-3">{item.name || "Noma'lum"}</td>
                          <td className="px-4 py-3 text-gray-400">{item.username ? `@${item.username}` : '-'}</td>
                          <td className="px-4 py-3 font-semibold text-emerald-300">{item.totalEarned} ∞</td>
                          <td className="px-4 py-3">{item.actionCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
