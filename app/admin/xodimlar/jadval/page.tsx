'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { addDays, addWeeks, format, getDay, subWeeks } from 'date-fns'
import { uz } from 'date-fns/locale'
import { ArrowLeft, ChevronLeft, ChevronRight, Edit2, Plus, Save, Trash2, X } from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CLASS_SCHEDULE_VALID_TIMES } from '@/lib/class-schedule-times'
import { scheduleDateKey } from '@/lib/schedule-date'

type Employee = {
  id: string
  name: string
  username: string
  isActive: boolean
}

type EmployeeSchedule = {
  id: string
  userId: string
  date: string
  times: string | string[]
  notes?: string | null
  user: { id: string; name: string; username: string }
}

const WEEK_DAYS = [
  { uz: 'Yakshanba', dayIndex: 0 },
  { uz: 'Dushanba', dayIndex: 1 },
  { uz: 'Seshanba', dayIndex: 2 },
  { uz: 'Chorshanba', dayIndex: 3 },
  { uz: 'Payshanba', dayIndex: 4 },
  { uz: 'Juma', dayIndex: 5 },
  { uz: 'Shanba', dayIndex: 6 },
]

function parseTimes(raw: string | string[]): string[] {
  if (Array.isArray(raw)) return raw
  try {
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export default function AdminXodimJadvalPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [filterEmployeeId, setFilterEmployeeId] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  const [showEditModal, setShowEditModal] = useState(false)
  const [editing, setEditing] = useState<EmployeeSchedule | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editTimes, setEditTimes] = useState<string[]>([])
  const [editNotes, setEditNotes] = useState('')

  const weekStart = useMemo(() => {
    const day = getDay(currentWeek)
    return addDays(currentWeek, -day)
  }, [currentWeek])
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart])

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/admin/xodimlar')
      if (!res.ok) return
      const data = (await res.json()) as Employee[]
      setEmployees(data.filter((x) => x.isActive))
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('startDate', format(weekStart, 'yyyy-MM-dd'))
      params.set('endDate', format(weekEnd, 'yyyy-MM-dd'))
      if (filterEmployeeId) params.set('userId', filterEmployeeId)
      const res = await fetch(`/api/admin/xodim-schedules?${params.toString()}`)
      if (!res.ok) return
      setSchedules((await res.json()) as EmployeeSchedule[])
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchEmployees()
  }, [])

  useEffect(() => {
    void fetchSchedules()
  }, [weekStart, weekEnd, filterEmployeeId])

  const weekGrid = useMemo(() => {
    const dayKeyToIndex: Record<string, number> = {}
    for (let i = 0; i < 7; i++) {
      dayKeyToIndex[format(addDays(weekStart, i), 'yyyy-MM-dd')] = i
    }

    const map: Record<number, Record<string, EmployeeSchedule[]>> = {}
    const timesSet = new Set<string>()
    for (const row of schedules) {
      const dayIndex = dayKeyToIndex[scheduleDateKey(row.date)]
      if (dayIndex === undefined) continue
      for (const t of parseTimes(row.times)) {
        timesSet.add(t)
        map[dayIndex] = map[dayIndex] || {}
        map[dayIndex][t] = map[dayIndex][t] || []
        map[dayIndex][t].push(row)
      }
    }

    const sortedTimes = Array.from(timesSet).sort((a, b) => {
      const [ah, am] = a.split(':').map(Number)
      const [bh, bm] = b.split(':').map(Number)
      return ah * 60 + am - (bh * 60 + bm)
    })
    return { map, sortedTimes }
  }, [schedules, weekStart])

  const weekDatesForModal = useMemo(
    () => WEEK_DAYS.map((day) => format(addDays(weekStart, day.dayIndex), 'yyyy-MM-dd')),
    [weekStart]
  )

  const toggleSelectedDate = (dateStr: string) => {
    setSelectedDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr].sort()
    )
  }
  const toggleSelectedTime = (time: string) => {
    setSelectedTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time].sort()
    )
  }
  const toggleEditTime = (time: string) => {
    setEditTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time].sort()
    )
  }

  const resetAdd = () => {
    setSelectedEmployeeId('')
    setSelectedDates([])
    setSelectedTimes([])
    setNotes('')
  }

  const handleCreate = async () => {
    if (!selectedEmployeeId || selectedDates.length === 0 || selectedTimes.length === 0) {
      alert('Xodim, sana va vaqtni tanlang')
      return
    }
    const res = await fetch('/api/admin/xodim-schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: selectedEmployeeId,
        dates: selectedDates,
        times: selectedTimes,
        notes: notes || null,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err?.error || 'Saqlashda xatolik')
      return
    }
    setShowAddModal(false)
    resetAdd()
    await fetchSchedules()
  }

  const openEdit = (row: EmployeeSchedule) => {
    setEditing(row)
    setEditDate(scheduleDateKey(row.date))
    setEditTimes(parseTimes(row.times))
    setEditNotes(row.notes || '')
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!editing || !editDate || editTimes.length === 0) return
    const res = await fetch(`/api/admin/xodim-schedules/${editing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: editDate, times: editTimes, notes: editNotes || null }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err?.error || 'Yangilashda xatolik')
      return
    }
    setShowEditModal(false)
    setEditing(null)
    await fetchSchedules()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Ushbu jadvalni o\'chirasizmi?')) return
    const res = await fetch(`/api/admin/xodim-schedules/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err?.error || 'O\'chirishda xatolik')
      return
    }
    await fetchSchedules()
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <Link
              href="/admin/xodimlar"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-900/40 px-3 py-2 text-sm text-slate-200 hover:border-violet-500/60 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Orqaga
            </Link>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
            >
              <Plus className="h-4 w-4" />
              Jadval qo'shish
            </button>
          </div>
          <h1 className="text-2xl font-bold text-white">Xodimlar ish jadvali</h1>
          <p className="mt-1 text-sm text-slate-400">Dars reja uslubida haftalik ish vaqtlari</p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-slate-300">Xodim filtri</label>
              <select
                value={filterEmployeeId}
                onChange={(e) => setFilterEmployeeId(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 text-white outline-none focus:border-violet-500"
              >
                <option value="">Barcha xodimlar</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} (@{e.username})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))} className="rounded-lg bg-slate-700 p-2 text-white hover:bg-slate-600">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))} className="rounded-lg bg-slate-700 p-2 text-white hover:bg-slate-600">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-end justify-end text-sm text-slate-300">
              {format(weekStart, 'dd MMM', { locale: uz })} - {format(weekEnd, 'dd MMM yyyy', { locale: uz })}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-800 p-3">
          {loading ? (
            <p className="py-8 text-center text-slate-400">Yuklanmoqda...</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="min-w-[90px] border border-slate-600 bg-slate-700 p-2 text-left text-xs text-white">Vaqt</th>
                  {WEEK_DAYS.map((d) => (
                    <th key={d.dayIndex} className="min-w-[170px] border border-slate-600 bg-slate-700 p-2 text-center text-xs text-white">
                      <div>{d.uz}</div>
                      <div className="text-[10px] text-slate-300">{format(addDays(weekStart, d.dayIndex), 'dd/MM')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekGrid.sortedTimes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border border-slate-600 p-8 text-center text-sm text-slate-400">
                      Bu haftada jadval topilmadi
                    </td>
                  </tr>
                ) : (
                  weekGrid.sortedTimes.map((time) => (
                    <tr key={time}>
                      <td className="border border-slate-600 bg-slate-700/50 p-2 text-sm text-white">{time}</td>
                      {WEEK_DAYS.map((day) => {
                        const rows = weekGrid.map[day.dayIndex]?.[time] || []
                        return (
                          <td key={day.dayIndex} className="border border-slate-600 p-2 align-top">
                            {rows.length === 0 ? (
                              <span className="text-xs text-slate-600">-</span>
                            ) : (
                              <div className="space-y-1">
                                {rows.map((row) => (
                                  <div key={row.id} className="rounded border border-violet-500/40 bg-violet-500/10 p-2">
                                    <p className="text-xs font-semibold text-violet-200">{row.user.name}</p>
                                    <p className="text-[11px] text-slate-300">@{row.user.username}</p>
                                    {row.notes ? <p className="mt-1 text-[11px] text-slate-400">{row.notes}</p> : null}
                                    <div className="mt-1 flex gap-1">
                                      <button onClick={() => openEdit(row)} className="rounded bg-blue-500/20 p-1 text-blue-300 hover:bg-blue-500/30" title="Tahrirlash">
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      <button onClick={() => handleDelete(row.id)} className="rounded bg-red-500/20 p-1 text-red-300 hover:bg-red-500/30" title="O'chirish">
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-800 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Yangi ish jadvali</h2>
                <button onClick={() => { setShowAddModal(false); resetAdd() }} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Xodim *</label>
                  <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} className="h-10 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 text-white outline-none focus:border-violet-500">
                    <option value="">Xodimni tanlang</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.name} (@{e.username})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Hafta kunlari *</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                    {weekDatesForModal.map((dateStr) => {
                      const active = selectedDates.includes(dateStr)
                      return (
                        <button key={dateStr} type="button" onClick={() => toggleSelectedDate(dateStr)} className={`rounded-lg px-2 py-2 text-xs ${active ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                          {format(new Date(dateStr), 'EEE dd/MM', { locale: uz })}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Ish vaqtlari *</label>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {CLASS_SCHEDULE_VALID_TIMES.map((time) => {
                      const active = selectedTimes.includes(time)
                      return (
                        <button key={time} type="button" onClick={() => toggleSelectedTime(time)} className={`rounded-lg px-2 py-2 text-sm ${active ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                          {time}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Izoh</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white outline-none focus:border-violet-500" placeholder="Ixtiyoriy izoh..." />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => { setShowAddModal(false); resetAdd() }} className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600">Bekor qilish</button>
                <button onClick={handleCreate} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500">
                  <Save className="h-4 w-4" />
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-xl rounded-xl border border-slate-700 bg-slate-800 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Jadvalni tahrirlash</h2>
                <button onClick={() => { setShowEditModal(false); setEditing(null) }} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Xodim</label>
                  <input value={`${editing.user.name} (@${editing.user.username})`} readOnly className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 text-slate-300" />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Sana *</label>
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-10 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 text-white outline-none focus:border-violet-500" />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Ish vaqtlari *</label>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {CLASS_SCHEDULE_VALID_TIMES.map((time) => {
                      const active = editTimes.includes(time)
                      return (
                        <button key={time} type="button" onClick={() => toggleEditTime(time)} className={`rounded-lg px-2 py-2 text-sm ${active ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                          {time}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Izoh</label>
                  <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white outline-none focus:border-violet-500" />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => { setShowEditModal(false); setEditing(null) }} className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600">Bekor qilish</button>
                <button onClick={handleUpdate} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500">
                  <Save className="h-4 w-4" />
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
