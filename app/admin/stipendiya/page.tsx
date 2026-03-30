'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { formatDateShort } from '@/lib/utils'
import { STIPEND_PROGRAMS } from '@/lib/stipendiya'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Award,
  Calendar,
  Edit,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'

type StudentOpt = {
  id: string
  studentId: string
  user: { name: string; username: string }
}

type AwardAdmin = {
  id: string
  program: string
  examTitle: string
  examDate: string
  awardLabel?: string | null
  scorePercent?: number | null
  notes?: string | null
  createdAt: string
  student: StudentOpt
  recordedBy?: {
    id: string
    name: string
    username: string
  } | null
}

const emptyForm = {
  studentId: '',
  program: 'IQMAX',
  examTitle: '',
  examDate: '',
  awardLabel: '',
  scorePercent: '',
  notes: '',
}

export default function AdminStipendiyaPage() {
  const [awards, setAwards] = useState<AwardAdmin[]>([])
  const [students, setStudents] = useState<StudentOpt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')
  const [programFilter, setProgramFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [selected, setSelected] = useState<AwardAdmin | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchAwards = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (searchQ.trim()) params.set('q', searchQ.trim())
      if (programFilter) params.set('program', programFilter)
      const url =
        params.toString().length > 0
          ? `/api/admin/stipendiya?${params}`
          : '/api/admin/stipendiya'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setAwards(Array.isArray(data) ? data : [])
      } else setAwards([])
    } catch {
      setAwards([])
    } finally {
      setLoading(false)
    }
  }, [searchQ, programFilter])

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/students')
      if (res.ok) {
        const data = await res.json()
        setStudents(Array.isArray(data) ? data : [])
      }
    } catch {
      setStudents([])
    }
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true)
      fetchAwards()
    }, 300)
    return () => clearTimeout(t)
  }, [fetchAwards])

  const openAdd = () => {
    setForm(emptyForm)
    setShowAdd(true)
  }

  const openEdit = (a: AwardAdmin) => {
    setSelected(a)
    setForm({
      studentId: a.student.id,
      program: a.program,
      examTitle: a.examTitle,
      examDate: a.examDate.slice(0, 10),
      awardLabel: a.awardLabel ?? '',
      scorePercent:
        a.scorePercent != null ? String(a.scorePercent) : '',
      notes: a.notes ?? '',
    })
    setShowEdit(true)
  }

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/stipendiya', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: form.studentId,
          program: form.program,
          examTitle: form.examTitle,
          examDate: form.examDate,
          awardLabel: form.awardLabel || null,
          scorePercent: form.scorePercent || null,
          notes: form.notes || null,
        }),
      })
      const err = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(err.error || 'Xatolik')
        return
      }
      setShowAdd(false)
      setForm(emptyForm)
      fetchAwards()
    } finally {
      setSaving(false)
    }
  }

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/stipendiya/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program: form.program,
          examTitle: form.examTitle,
          examDate: form.examDate,
          awardLabel: form.awardLabel || null,
          scorePercent: form.scorePercent || null,
          notes: form.notes || null,
        }),
      })
      const err = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(err.error || 'Xatolik')
        return
      }
      setShowEdit(false)
      setSelected(null)
      fetchAwards()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yozuvni o‘chirishni tasdiqlaysizmi?')) return
    try {
      const res = await fetch(`/api/admin/stipendiya/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) fetchAwards()
    } catch {
      /* noop */
    }
  }

  const programLabel = useMemo(() => {
    const m = new Map<string, string>(
      STIPEND_PROGRAMS.map((p) => [p.code, p.title])
    )
    return (code: string) => m.get(code) ?? code
  }, [])

  const formFields = (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-400">
            Stipendiya turi
          </label>
          <select
            value={form.program}
            onChange={(e) =>
              setForm((f) => ({ ...f, program: e.target.value }))
            }
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          >
            {STIPEND_PROGRAMS.map((p) => (
              <option key={p.code} value={p.code}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-400">
            Imtihon / tanlov nomi
          </label>
          <input
            required
            value={form.examTitle}
            onChange={(e) =>
              setForm((f) => ({ ...f, examTitle: e.target.value }))
            }
            placeholder="Masalan: 2026 yozgi oflayn saralash"
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">
            Imtihon sanasi
          </label>
          <input
            required
            type="date"
            value={form.examDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, examDate: e.target.value }))
            }
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">
            Unvon / o‘rin (ixtiyoriy)
          </label>
          <input
            value={form.awardLabel}
            onChange={(e) =>
              setForm((f) => ({ ...f, awardLabel: e.target.value }))
            }
            placeholder="Laureat, 1-o‘rin..."
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">
            Foiz / ball (ixtiyoriy)
          </label>
          <input
            type="number"
            step="0.01"
            value={form.scorePercent}
            onChange={(e) =>
              setForm((f) => ({ ...f, scorePercent: e.target.value }))
            }
            placeholder="Masalan: 87.5"
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-400">
            Izoh
          </label>
          <textarea
            value={form.notes}
            onChange={(e) =>
              setForm((f) => ({ ...f, notes: e.target.value }))
            }
            rows={2}
            className="w-full resize-none rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
        </div>
      </div>
    </>
  )

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Stipendiyalar
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Oflayn imtihon natijalarini qayd eting — o‘quvchilar kabinetida
              ko‘rinadi.
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" />
            Natija qo‘shish
          </button>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-800/40 p-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[200px] flex-1">
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
          <div className="w-full min-w-[180px] sm:w-48">
            <label className="mb-1 block text-xs text-slate-500">
              Dastur
            </label>
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            >
              <option value="">Barchasi</option>
              {STIPEND_PROGRAMS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500">Yuklanmoqda...</div>
        ) : awards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-600 py-16 text-center text-slate-500">
            <Award className="mx-auto mb-3 h-10 w-10 opacity-50" />
            Yozuv topilmadi
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-800/30">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-xs uppercase text-slate-500">
                  <th className="px-4 py-3 font-medium">Sana</th>
                  <th className="px-4 py-3 font-medium">O‘quvchi</th>
                  <th className="px-4 py-3 font-medium">Dastur</th>
                  <th className="px-4 py-3 font-medium">Imtihon</th>
                  <th className="px-4 py-3 font-medium">Natija</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/80">
                {awards.map((a) => (
                  <tr
                    key={a.id}
                    className="text-slate-300 transition hover:bg-slate-700/20"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateShort(a.examDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">
                        {a.student.user.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        @{a.student.user.username} · {a.student.studentId}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md border border-slate-600 bg-slate-900/80 px-2 py-0.5 text-xs">
                        {programLabel(a.program)}
                      </span>
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-slate-300">
                      <span className="line-clamp-2">{a.examTitle}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {[a.awardLabel, a.scorePercent != null ? `${a.scorePercent}%` : '']
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(a)}
                        className="mr-2 inline-flex rounded-lg border border-slate-600 p-2 text-slate-300 hover:bg-slate-700"
                        title="Tahrirlash"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        className="inline-flex rounded-lg border border-red-900/50 p-2 text-red-400 hover:bg-red-950/40"
                        title="O‘chirish"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-600 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Yangi stipendiya natijasi
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={submitAdd} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    O‘quvchi
                  </label>
                  <select
                    required
                    value={form.studentId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, studentId: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                  >
                    <option value="">Tanlang...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.user.name} ({s.studentId})
                      </option>
                    ))}
                  </select>
                </div>
                {formFields}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </form>
            </div>
          </div>
        )}

        {showEdit && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-600 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Tahrirlash — {selected.student.user.name}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowEdit(false)
                    setSelected(null)
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={submitEdit} className="space-y-4">
                <p className="text-xs text-slate-500">
                  O‘quvchini o‘zgartirib bo‘lmaydi. Kerak bo‘lsa, yozuvni
                  o‘chirib yangisini qo‘shing.
                </p>
                {formFields}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {saving ? 'Saqlanmoqda...' : 'Yangilash'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
