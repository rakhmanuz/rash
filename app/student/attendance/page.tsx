'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import {
  StudentPageSkeleton,
  StudentQuickNavGrid,
  StudentSubpageHeader,
} from '@/components/student/StudentSubpageChrome'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatDateShort } from '@/lib/utils'
import { enrollmentLabel, paletteForIndex } from '@/lib/student-dashboard-helpers'
import { Calendar, X, CheckCircle2 } from 'lucide-react'

interface GroupMeta {
  groupId: string
  groupName: string
  subjectName: string | null
  sortIndex: number
}

interface AttendanceRecord {
  id: string
  date: string
  isPresent: boolean
  lateMinutes?: number | null
  attendancePercentage?: number
  lessonTime?: string | null
  notes?: string
  group: {
    id: string
    name: string
    subjectName?: string | null
  }
}

interface MissingClass {
  groupId: string
  date: string
  dayOfWeek: string
  groupName: string
  subjectName?: string | null
}

export default function StudentAttendancePage() {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([])
  const [missingClasses, setMissingClasses] = useState<MissingClass[]>([])
  const [groupsMeta, setGroupsMeta] = useState<GroupMeta[]>([])
  const [booting, setBooting] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enrollmentDate, setEnrollmentDate] = useState<string>('')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const fetchAttendanceData = useCallback(async (opts?: { soft?: boolean }) => {
    if (opts?.soft) setRefreshing(true)
    else setBooting(true)
    setError(null)
    try {
      const response = await fetch('/api/student/attendance', { credentials: 'include' })
      if (!response.ok) {
        setError('Davomat maʼlumotlari olinmadi')
        return
      }
      const data = await response.json()
      setAttendances(data.attendances || [])
      setMissingClasses(data.missingClasses || [])
      setGroupsMeta(data.groupsMeta || [])
      setEnrollmentDate(data.enrollmentDate || '')
      setUpdatedAt(new Date())
    } catch {
      setError('Tarmoq xatosi')
    } finally {
      setBooting(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAttendanceData()
  }, [fetchAttendanceData])

  const orderedGroups = useMemo(() => {
    if (groupsMeta.length > 0) {
      return [...groupsMeta].sort((a, b) => a.sortIndex - b.sortIndex)
    }
    const ids = new Set<string>()
    attendances.forEach((a) => ids.add(a.group.id))
    missingClasses.forEach((m) => ids.add(m.groupId))
    return Array.from(ids).map((groupId, sortIndex) => {
      const att = attendances.find((a) => a.group.id === groupId)
      const miss = missingClasses.find((m) => m.groupId === groupId)
      const name = att?.group.name ?? miss?.groupName ?? 'Guruh'
      const subjectName = att?.group.subjectName ?? miss?.subjectName ?? null
      return { groupId, groupName: name, subjectName, sortIndex }
    })
  }, [groupsMeta, attendances, missingClasses])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return formatDateShort(date)
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return '-'
    const date = new Date(timeString)
    return date.toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit',
    })
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
      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
        <StudentSubpageHeader
          title="Davomat"
          subtitle="Har bir fan bo'yicha kelmagan va qatnashgan darslar — boshqa guruhlarga aralashmaydi."
          onRefresh={() => fetchAttendanceData({ soft: true })}
          refreshing={refreshing}
          updatedAt={updatedAt}
        />

        <StudentQuickNavGrid secondary="metrics" />

        {error ? (
          <div className="rounded-2xl border border-red-500/35 bg-red-950/25 px-4 py-3 text-red-100 text-sm flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => fetchAttendanceData({ soft: true })}
              className="text-xs font-semibold uppercase tracking-wide text-red-200 underline underline-offset-2 hover:text-white"
            >
              Qayta urinish
            </button>
          </div>
        ) : null}

        {orderedGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-[#101318] p-10 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-600 opacity-80" />
            <p className="text-slate-300 font-medium">Faol guruhlar yoki davomat maʼlumotlari topilmadi</p>
            {enrollmentDate ? (
              <p className="text-xs text-slate-500 mt-3 tabular-nums">Yozilish sanasi: {formatDate(enrollmentDate)}</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-6">
            {orderedGroups.map((meta, gi) => {
              const accent = paletteForIndex(gi)
              const title = enrollmentLabel({
                groupId: meta.groupId,
                groupName: meta.groupName,
                subjectName: meta.subjectName,
              })
              const groupAtt = attendances.filter((a) => a.group.id === meta.groupId)
              const groupMiss = missingClasses.filter((m) => m.groupId === meta.groupId)
              const sortedAtt = [...groupAtt].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              const sortedMiss = [...groupMiss].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
              )

              return (
                <section
                  key={meta.groupId}
                  className="rounded-2xl border border-white/[0.07] bg-[#101318] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.04]"
                  style={{ borderTopWidth: 3, borderTopColor: accent.color }}
                >
                  <div className="px-4 sm:px-5 py-4 border-b border-white/10 bg-gradient-to-r from-[#12161d] to-transparent flex flex-wrap items-center gap-3 justify-between">
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold tracking-tight break-words" style={{ color: accent.color }}>
                        {title}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">Faqat shu guruh yozuvlari</p>
                    </div>
                    <span className="text-xs text-slate-500 tabular-nums shrink-0 rounded-lg border border-white/10 bg-[#161b22] px-2.5 py-1">
                      {sortedAtt.length} yozuv
                      {sortedMiss.length > 0 ? ` · ${sortedMiss.length} kelmagan` : ''}
                    </span>
                  </div>

                  <div className="p-3 sm:p-5 space-y-5">
                    {sortedMiss.length > 0 ? (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <X className="h-4 w-4 text-red-400 shrink-0" />
                          <h3 className="text-sm font-semibold text-red-100">
                            Kelmagan darslar ({sortedMiss.length})
                          </h3>
                        </div>
                        <ul className="space-y-2 max-h-64 sm:max-h-80 overflow-y-auto pr-1">
                          {sortedMiss.map((missing, index) => (
                            <li
                              key={`${missing.groupId}-${missing.date}-${index}`}
                              className="rounded-xl bg-red-950/20 border border-red-500/25 px-3 py-3 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 transition-colors hover:border-red-400/40"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-red-400 font-bold text-sm tabular-nums w-6 shrink-0">{index + 1}.</span>
                                <div className="min-w-0">
                                  <p className="text-white font-semibold text-sm">{formatDate(missing.date)}</p>
                                  <p className="text-xs text-slate-500 truncate">{missing.groupName}</p>
                                </div>
                              </div>
                              <span className="text-xs text-slate-400 capitalize shrink-0 px-2 py-0.5 rounded-md bg-black/20">
                                {missing.dayOfWeek}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-emerald-400 shrink-0" />
                        <h3 className="text-sm font-semibold text-emerald-100">Barcha darslar (bu fan)</h3>
                      </div>
                      {sortedAtt.length === 0 ? (
                        <p className="text-slate-500 text-sm py-8 text-center border border-dashed border-white/12 rounded-xl bg-[#0d1117]/50">
                          Bu guruh uchun davomat yozuvi hali yo&apos;q.
                        </p>
                      ) : (
                        <ul className="space-y-2 max-h-72 sm:max-h-96 overflow-y-auto pr-1">
                          {sortedAtt.map((attendance) => (
                            <li
                              key={attendance.id}
                              className={`rounded-xl px-3 py-3 sm:py-3 border transition-all duration-200 ${
                                attendance.isPresent
                                  ? 'bg-emerald-950/15 border-emerald-500/20 hover:border-emerald-400/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]'
                                  : 'bg-red-950/15 border-red-500/20 hover:border-red-400/35'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="flex items-start gap-3 min-w-0">
                                  {attendance.isPresent ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                                  ) : (
                                    <X className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-white font-semibold text-sm">{formatDate(attendance.date)}</p>
                                    {attendance.lessonTime ? (
                                      <p className="text-xs text-slate-500 mt-0.5">
                                        Dars vaqti: {formatTime(attendance.lessonTime)}
                                      </p>
                                    ) : null}
                                    {attendance.isPresent &&
                                    attendance.lateMinutes != null &&
                                    attendance.lateMinutes > 0 ? (
                                      <p className="text-xs text-amber-400/90 mt-1">
                                        Kechikkan: {attendance.lateMinutes} daqiqa →{' '}
                                        {attendance.attendancePercentage ?? 0}% davomat
                                      </p>
                                    ) : null}
                                    {attendance.notes ? (
                                      <p className="text-xs text-slate-500 mt-1">{attendance.notes}</p>
                                    ) : null}
                                  </div>
                                </div>
                                <span
                                  className={`self-start sm:self-center px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${
                                    attendance.isPresent
                                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/25'
                                      : 'bg-red-500/20 text-red-200 border border-red-500/25'
                                  }`}
                                >
                                  {attendance.isPresent
                                    ? attendance.attendancePercentage != null && attendance.attendancePercentage < 100
                                      ? `Keldi ${attendance.attendancePercentage}%`
                                      : 'Keldi'
                                    : 'Kelmadi'}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
