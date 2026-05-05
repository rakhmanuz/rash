'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { BookOpen, CalendarClock, ExternalLink, Video } from 'lucide-react'

type LessonRow = {
  id: string
  groupId: string
  groupName: string
  subjectName: string
  date: string
  times: string[]
  notes: string
  /** Jonli havola faqat server orqali ochiladi; ro‘yxatda faqat tugma holati uchun */
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

export default function StudentOnlineLessonsPage() {
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
    <DashboardLayout role="STUDENT">
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-emerald-300" />
            Online darslar jadvali
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Har bir qatorda dars vaqti va darsga kirish tugmasi ko&apos;rsatiladi.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((v) => (
              <div key={v} className="h-20 rounded-xl border border-slate-700 bg-slate-900/50 animate-pulse" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-8 text-center text-slate-300">
            Hozircha dars jadvali topilmadi.
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(([dateLabel, rows]) => (
              <div key={dateLabel} className="space-y-2">
                <div className="text-xs uppercase tracking-wide text-slate-400">{dateLabel}</div>
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-white truncate">
                          {row.subjectName} · {row.groupName}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="h-4 w-4 text-sky-300" />
                            {row.times.length > 0 ? row.times.join(' · ') : 'Vaqt belgilanmagan'}
                          </span>
                        </div>
                        {row.notes ? (
                          <p className="mt-2 text-xs text-slate-400 line-clamp-2">{row.notes}</p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {row.canJoin ? (
                          <a
                            href={`/student-online/lessons/join?scheduleId=${encodeURIComponent(row.id)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-600/50 ring-2 ring-red-400/40 transition-all hover:bg-red-500 hover:shadow-xl hover:shadow-red-500/55 hover:ring-red-300/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
                          >
                            <Video className="h-4 w-4" />
                            Darsga kirish
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 cursor-not-allowed"
                          >
                            <Video className="h-4 w-4" />
                            Darsga kirish
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

