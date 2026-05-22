'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { OnlinePageHeader } from '@/components/student-online/online-ui'
import { BookOpen, CalendarClock, ExternalLink, Video } from 'lucide-react'

type LessonRow = {
  id: string
  groupId: string
  groupName: string
  subjectName: string
  date: string
  times: string[]
  notes: string
  canJoin: boolean
}

function formatDate(input: string) {
  const d = new Date(input)
  return d.toLocaleDateString('uz-UZ', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function LessonsContent() {
  const [loading, setLoading] = useState(true)
  const [lessons, setLessons] = useState<LessonRow[]>([])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/student/online-lessons', { credentials: 'include' })
        if (!res.ok) {
          setLessons([])
          return
        }
        const data = (await res.json()) as LessonRow[]
        setLessons(Array.isArray(data) ? data : [])
      } catch {
        setLessons([])
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<string, LessonRow[]>()
    lessons.forEach((lesson) => {
      const key = formatDate(lesson.date)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(lesson)
    })
    return [...map.entries()]
  }, [lessons])

  return (
    <div className="online-shell online-page-bg mx-auto max-w-4xl space-y-4 py-2">
      <OnlinePageHeader
        title={
          <span className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-green-500" />
            Online darslar jadvali
          </span>
        }
        subtitle="Har bir qatorda dars vaqti va darsga kirish tugmasi ko'rsatiladi."
      />

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((v) => (
            <div key={v} className="online-skeleton h-20" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="online-card p-8 text-center text-gray-500">Hozircha dars jadvali topilmadi.</div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([dateLabel, rows]) => (
            <div key={dateLabel} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{dateLabel}</p>
              {rows.map((row) => (
                <div key={row.id} className="online-card online-card-lift p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-gray-900">
                        {row.subjectName} · {row.groupName}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                        <CalendarClock className="h-4 w-4 text-sky-500" />
                        {row.times.length > 0 ? row.times.join(' · ') : 'Vaqt belgilanmagan'}
                      </p>
                      {row.notes ? (
                        <p className="mt-2 line-clamp-2 text-xs text-gray-400">{row.notes}</p>
                      ) : null}
                    </div>
                    {row.canJoin ? (
                      <a
                        href={`/student-online/lessons/join?scheduleId=${encodeURIComponent(row.id)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-red-500"
                      >
                        <Video className="h-4 w-4" />
                        Darsga kirish
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-400"
                      >
                        <Video className="h-4 w-4" />
                        Darsga kirish
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function StudentOnlineLessonsPage() {
  return (
    <DashboardLayout role="STUDENT">
      <LessonsContent />
    </DashboardLayout>
  )
}
