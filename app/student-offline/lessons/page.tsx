'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import {
  WEEK_DAYS,
  buildWeekScheduleGrid,
  weekBoundsFromAnchor,
  type StudentScheduleRow,
} from '@/lib/class-schedule-week'
import { addDays, format, getDay } from 'date-fns'
import { uz } from 'date-fns/locale'
import { BookOpen, Calendar, Clock } from 'lucide-react'

const CELL_COLORS = [
  { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-300' },
  { bg: 'bg-sky-500/20', border: 'border-sky-500/50', text: 'text-sky-300' },
  { bg: 'bg-violet-500/20', border: 'border-violet-500/50', text: 'text-violet-300' },
  { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-300' },
] as const

function OfflineLessonsContent() {
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState<StudentScheduleRow[]>([])

  const weekMeta = useMemo(() => weekBoundsFromAnchor(new Date()), [])
  const weekStart = useMemo(() => {
    const now = new Date()
    return addDays(now, -getDay(now))
  }, [])

  const groupColorIndex = useMemo(() => {
    const map = new Map<string, number>()
    const order: string[] = []
    schedules.forEach((s) => {
      if (!order.includes(s.groupId)) order.push(s.groupId)
    })
    order.forEach((id, i) => map.set(id, i % CELL_COLORS.length))
    return map
  }, [schedules])

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate: weekMeta.startDateStr,
        endDate: weekMeta.endDateStr,
      })
      const res = await fetch(`/api/student/offline-lessons?${params}`, { credentials: 'include' })
      if (!res.ok) {
        setSchedules([])
        return
      }
      const data = (await res.json()) as { schedules?: StudentScheduleRow[] }
      setSchedules(Array.isArray(data.schedules) ? data.schedules : [])
    } catch {
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }, [weekMeta.endDateStr, weekMeta.startDateStr])

  useEffect(() => {
    void fetchSchedules()
  }, [fetchSchedules])

  const { weekData, sortedTimes } = useMemo(
    () => buildWeekScheduleGrid(schedules, weekStart),
    [schedules, weekStart]
  )

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 sm:p-6">
        <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-white">
          <BookOpen className="h-6 w-6 text-emerald-400 shrink-0" />
          Offline darslar jadvali
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-2xl">
          Barcha fanlaringizdagi darslar joriy hafta bo&apos;yicha bitta jadvalda — qaysi kuni va qaysi
          soatda.
        </p>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 sm:p-6">
        <div className="text-center mb-6">
          <h2 className="text-base sm:text-xl font-bold text-white">
            {format(weekStart, 'dd MMMM yyyy', { locale: uz })} —{' '}
            {format(addDays(weekStart, 6), 'dd MMMM yyyy', { locale: uz })}
          </h2>
          <p className="text-slate-500 mt-1 text-xs">Joriy hafta</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : sortedTimes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-600 py-12 text-center text-slate-400">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Bu haftada dars rejasi topilmadi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full border-collapse min-w-[720px]">
              <thead>
                <tr>
                  <th className="bg-slate-700 p-3 text-left text-sm font-semibold text-white border border-slate-600 sticky left-0 z-10 min-w-[100px]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Vaqt
                    </span>
                  </th>
                  {WEEK_DAYS.map((day) => {
                    const dayDate = addDays(weekStart, day.dayIndex)
                    return (
                      <th
                        key={day.dayIndex}
                        className="bg-slate-700 p-3 text-center text-sm font-semibold text-white border border-slate-600 min-w-[130px]"
                      >
                        <div>{day.uz}</div>
                        <div className="text-xs text-slate-400 mt-1">{format(dayDate, 'dd/MM', { locale: uz })}</div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedTimes.map((time, index) => (
                  <tr key={time}>
                    <td className="bg-slate-700/50 p-3 text-center text-sm text-white border border-slate-600 sticky left-0 z-10">
                      <div className="font-semibold">{index + 1}</div>
                      <div className="text-xs text-slate-400 mt-1">{time}</div>
                    </td>
                    {WEEK_DAYS.map((day) => {
                      const dayKey = day.dayIndex
                      const daySchedules = weekData[dayKey] || {}
                      const items = daySchedules[time] || []
                      const cellHeight = items.length > 0 ? Math.max(72, items.length * 56) : 72

                      return (
                        <td
                          key={day.dayIndex}
                          className="bg-slate-900/40 p-2 border border-slate-600 align-top"
                          style={{ minHeight: `${cellHeight}px` }}
                        >
                          {items.length > 0 ? (
                            <div className="space-y-1">
                              {items.map((schedule) => {
                                const ci = groupColorIndex.get(schedule.groupId) ?? 0
                                const color = CELL_COLORS[ci % CELL_COLORS.length]
                                return (
                                  <div
                                    key={schedule.id}
                                    className={`${color.bg} ${color.border} border rounded-lg p-2 text-xs`}
                                  >
                                    <div className={`font-semibold ${color.text} truncate`}>
                                      {schedule.subjectName}
                                    </div>
                                    <div className="text-slate-300 text-[10px] mt-0.5 truncate">
                                      {schedule.groupName}
                                    </div>
                                    <div className="text-slate-500 text-[10px] mt-0.5 truncate">
                                      {schedule.teacherName}
                                    </div>
                                    {schedule.times.length > 0 ? (
                                      <div className="text-slate-400 text-[9px] mt-1">
                                        {schedule.times.join(', ')}
                                      </div>
                                    ) : null}
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="text-slate-600 text-center text-xs py-2">—</div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function StudentOfflineLessonsPage() {
  return (
    <DashboardLayout role="STUDENT">
      <OfflineLessonsContent />
    </DashboardLayout>
  )
}
