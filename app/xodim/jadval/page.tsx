'use client'

import { useEffect, useMemo, useState } from 'react'
import { addDays, addWeeks, format, getDay, subWeeks } from 'date-fns'
import { uz } from 'date-fns/locale'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { scheduleDateKey } from '@/lib/schedule-date'

type Row = {
  id: string
  date: string
  times: string | string[]
  notes?: string | null
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

export default function XodimJadvalPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(new Date())

  const weekStart = useMemo(() => {
    const day = getDay(currentWeek)
    return addDays(currentWeek, -day)
  }, [currentWeek])
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart])

  const fetchRows = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('startDate', format(weekStart, 'yyyy-MM-dd'))
      params.set('endDate', format(weekEnd, 'yyyy-MM-dd'))
      const res = await fetch(`/api/xodim/schedules?${params.toString()}`)
      if (!res.ok) return
      setRows((await res.json()) as Row[])
    } catch (error) {
      console.error('Error fetching own schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchRows()
  }, [weekStart, weekEnd])

  const weekGrid = useMemo(() => {
    const dayKeyToIndex: Record<string, number> = {}
    for (let i = 0; i < 7; i++) {
      dayKeyToIndex[format(addDays(weekStart, i), 'yyyy-MM-dd')] = i
    }
    const map: Record<number, Record<string, Row[]>> = {}
    const timesSet = new Set<string>()
    for (const row of rows) {
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
  }, [rows, weekStart])

  return (
    <DashboardLayout role="XODIM">
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                <Calendar className="h-6 w-6 text-violet-300" />
                Ish jadvalim
              </h1>
              <p className="mt-1 text-sm text-slate-400">Faqat sizga biriktirilgan ish vaqtlar</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))} className="rounded-lg bg-slate-700 p-2 text-white hover:bg-slate-600">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))} className="rounded-lg bg-slate-700 p-2 text-white hover:bg-slate-600">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-300">
            {format(weekStart, 'dd MMM', { locale: uz })} - {format(weekEnd, 'dd MMM yyyy', { locale: uz })}
          </p>
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
                      Bu haftada jadval mavjud emas
                    </td>
                  </tr>
                ) : (
                  weekGrid.sortedTimes.map((time) => (
                    <tr key={time}>
                      <td className="border border-slate-600 bg-slate-700/50 p-2 text-sm text-white">{time}</td>
                      {WEEK_DAYS.map((day) => {
                        const items = weekGrid.map[day.dayIndex]?.[time] || []
                        return (
                          <td key={day.dayIndex} className="border border-slate-600 p-2 align-top">
                            {items.length === 0 ? (
                              <span className="text-xs text-slate-600">-</span>
                            ) : (
                              <div className="space-y-1">
                                {items.map((item) => (
                                  <div key={item.id} className="rounded border border-violet-500/40 bg-violet-500/10 p-2">
                                    <p className="text-xs text-violet-200">Ish vaqti belgilangan</p>
                                    {item.notes ? <p className="mt-1 text-[11px] text-slate-300">{item.notes}</p> : null}
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
      </div>
    </DashboardLayout>
  )
}
