'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Trophy,
  Users,
  Calendar,
  Clock,
  BookOpen,
  FileText,
  ClipboardList,
  Loader2,
  BarChart3,
  ChevronRight,
  Sparkles,
  ChevronLeft,
} from 'lucide-react'
import { formatDateShort } from '@/lib/utils'
import { addDays, format, getDay, isSameDay } from 'date-fns'
import { uz } from 'date-fns/locale'

interface Group {
  id: string
  name: string
}

interface MetaResponse {
  group: { id: string; name: string }
  enrolledCount: number
  mode: 'meta'
}

interface ApiClassSchedule {
  id: string
  groupId: string
  date: string
  times: string | string[]
  notes?: string | null
}

interface ActivityRow {
  id: string
  category: 'kunlik_test' | 'uyga_vazifa' | 'yozma_ish'
  label: string
  title: string | null
  totalQuestions: number
  resultsEntered: number
  enrolledCount: number
  classScheduleId: string | null
  extra?: string
}

interface StudentRow {
  studentId: string
  userName: string
  username: string | null
  isAbsent: boolean
  attendancePercent: number | null
  dayInfinityTotal: number
  cells: {
    activityId: string
    category: ActivityRow['category']
    label: string
    title: string | null
    hasResult: boolean
    display: string
  }[]
}

interface DetailResponse {
  group: { id: string; name: string }
  enrolledCount: number
  mode: 'detail'
  date: string
  weekday: string
  scheduleBlocks: { id: string; times: string[]; timesLabel: string; notes: string | null }[]
  activities: ActivityRow[]
  studentRows: StudentRow[]
}

const WEEK_HEADER = [
  { short: 'Yak', i: 0 },
  { short: 'Du', i: 1 },
  { short: 'Se', i: 2 },
  { short: 'Cho', i: 3 },
  { short: 'Pay', i: 4 },
  { short: 'Ju', i: 5 },
  { short: 'Sha', i: 6 },
] as const

function localYmd(d: Date): string {
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function scheduleToLocalYmd(s: ApiClassSchedule): string {
  const scheduleDate = new Date(s.date)
  return localYmd(scheduleDate)
}

function parseTimes(s: ApiClassSchedule): string[] {
  try {
    const raw = s.times
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(arr) ? arr.map(String) : []
  } catch {
    return []
  }
}

const catStyle: Record<
  ActivityRow['category'],
  { bar: string; badge: string; icon: typeof BookOpen }
> = {
  kunlik_test: {
    bar: 'from-sky-500/30 to-blue-600/20',
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
    icon: ClipboardList,
  },
  uyga_vazifa: {
    bar: 'from-violet-500/30 to-purple-600/20',
    badge: 'bg-violet-500/15 text-violet-300 border-violet-500/35',
    icon: BookOpen,
  },
  yozma_ish: {
    bar: 'from-amber-500/30 to-orange-600/20',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    icon: FileText,
  },
}

export function NatijalarBoardPage({ layoutRole }: { layoutRole: 'ADMIN' | 'RAHBAR' }) {
  const { status } = useSession()
  const [groups, setGroups] = useState<Group[]>([])
  const [groupId, setGroupId] = useState('')
  const [date, setDate] = useState('')
  const [meta, setMeta] = useState<MetaResponse | null>(null)
  const [currentWeek, setCurrentWeek] = useState(() => new Date())
  const [weekSchedules, setWeekSchedules] = useState<ApiClassSchedule[]>([])
  const [detail, setDetail] = useState<DetailResponse | null>(null)
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [loadingWeek, setLoadingWeek] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const weekBounds = useMemo(() => {
    const currentDay = getDay(currentWeek)
    const weekStart = addDays(currentWeek, -currentDay)
    const weekEnd = addDays(weekStart, 6)
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i)
      return { date: d, ymd: localYmd(d), dow: i }
    })
    return { weekStart, weekEnd, days }
  }, [currentWeek])

  const lessonsThisWeek = useMemo(() => {
    const set = new Set<string>()
    for (const s of weekSchedules) {
      const ymd = scheduleToLocalYmd(s)
      if (weekBounds.days.some((x) => x.ymd === ymd)) set.add(ymd)
    }
    return set.size
  }, [weekSchedules, weekBounds.days])

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/groups', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      setGroups(Array.isArray(data) ? data.map((g: Group) => ({ id: g.id, name: g.name })) : [])
    } catch {
      setGroups([])
    }
  }, [])

  const fetchMeta = useCallback(async (gid: string) => {
    if (!gid) return
    setLoadingMeta(true)
    setError(null)
    setMeta(null)
    setDetail(null)
    setDate('')
    try {
      const res = await fetch(
        `/api/admin/results-summary?groupId=${encodeURIComponent(gid)}&light=1`,
        { credentials: 'include' }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Ma’lumot olinmadi')
        return
      }
      setMeta(data as MetaResponse)
    } catch {
      setError('Tarmoq xatosi')
    } finally {
      setLoadingMeta(false)
    }
  }, [])

  const fetchWeekSchedules = useCallback(
    async (gid: string) => {
      if (!gid) return
      setLoadingWeek(true)
      setError(null)
      try {
        const currentDay = getDay(currentWeek)
        const weekStart = addDays(currentWeek, -currentDay)
        const weekEnd = addDays(weekStart, 6)
        const startDateStr = localYmd(weekStart)
        const endDateStr = localYmd(weekEnd)
        const params = new URLSearchParams({
          groupId: gid,
          startDate: startDateStr,
          endDate: endDateStr,
        })
        const res = await fetch(`/api/admin/schedules?${params}`, { credentials: 'include' })
        if (!res.ok) {
          setWeekSchedules([])
          return
        }
        const data = await res.json()
        setWeekSchedules(Array.isArray(data) ? data : [])
      } catch {
        setWeekSchedules([])
      } finally {
        setLoadingWeek(false)
      }
    },
    [currentWeek]
  )

  const fetchDetail = useCallback(async (gid: string, d: string) => {
    if (!gid || !d) return
    setLoadingDetail(true)
    setError(null)
    try {
      const params = new URLSearchParams({ groupId: gid, date: d })
      const res = await fetch(`/api/admin/results-summary?${params}`, { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Ma’lumot olinmadi')
        setDetail(null)
        return
      }
      setDetail(data as DetailResponse)
    } catch {
      setError('Tarmoq xatosi')
      setDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') fetchGroups()
  }, [status, fetchGroups])

  useEffect(() => {
    if (groupId) fetchMeta(groupId)
  }, [groupId, fetchMeta])

  useEffect(() => {
    if (groupId) fetchWeekSchedules(groupId)
  }, [groupId, currentWeek, fetchWeekSchedules])

  useEffect(() => {
    if (groupId && date) fetchDetail(groupId, date)
  }, [groupId, date, fetchDetail])

  const summaryStats = useMemo(() => {
    if (!detail) return null
    const totalActs = detail.activities.length
    const avgRate =
      detail.enrolledCount > 0 && totalActs > 0
        ? Math.round(
            (detail.activities.reduce((s, a) => s + a.resultsEntered, 0) /
              (totalActs * detail.enrolledCount)) *
              100
          )
        : 0
    return { totalActs, avgRate }
  }, [detail])

  const today = new Date()
  const weekTitle = `${format(weekBounds.weekStart, 'd MMMM', { locale: uz })} – ${format(weekBounds.weekEnd, 'd MMMM yyyy', { locale: uz })}`

  const schedulesByYmd = useMemo(() => {
    const m = new Map<string, ApiClassSchedule[]>()
    for (const s of weekSchedules) {
      const ymd = scheduleToLocalYmd(s)
      const list = m.get(ymd) ?? []
      list.push(s)
      m.set(ymd, list)
    }
    return m
  }, [weekSchedules])

  return (
    <DashboardLayout role={layoutRole}>
      <div className="space-y-4 sm:space-y-6 max-w-[1600px] mx-auto min-w-0 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
        <div className="relative overflow-hidden rounded-2xl border border-green-500/25 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-4 sm:p-6 lg:p-8 shadow-xl">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-green-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-64 rounded-full bg-teal-500/10 blur-2xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300">
                <Sparkles className="h-3.5 w-3.5" />
                Haftalik jadval va baholar
              </div>
              <h1 className="flex flex-col gap-3 sm:flex-row sm:items-center text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
                <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-green-500/20 text-green-400 ring-1 ring-green-500/30">
                  <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
                <span>Natijalar</span>
              </h1>
              <p className="mt-2 max-w-2xl text-xs sm:text-sm text-slate-400 leading-relaxed">
                Guruhni tanlang — <strong className="text-slate-300 font-medium">shu haftaning dars rejasi</strong>{' '}
                chiqadi. Kundan birini bosing: shu sanadagi slotlar, test / vazifa / yozma ishlar va nechta o‘quvchiga
                natija kiritilgani ko‘rinadi. Haftani chap-o‘ng tugmalar bilan almashtiring.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-slate-800/40 p-4 sm:p-5 backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full max-w-md min-w-0">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Guruh
              </label>
              <select
                value={groupId}
                onChange={(e) => {
                  setGroupId(e.target.value)
                  setDate('')
                  setDetail(null)
                  setCurrentWeek(new Date())
                }}
                className="w-full min-h-[48px] rounded-xl border border-slate-600 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-green-500/60 focus:ring-2 focus:ring-green-500/20"
              >
                <option value="">Guruhni tanlang</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            {meta && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-600/80 bg-slate-900/50 px-4 py-3">
                <Users className="h-5 w-5 shrink-0 text-green-400" />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Faol o‘quvchilar</p>
                  <p className="text-lg font-bold text-white">{meta.enrolledCount}</p>
                </div>
                <span className="hidden h-8 w-px bg-slate-600 sm:block" />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Shu haftada dars kunlari</p>
                  <p className="text-lg font-bold text-white">{lessonsThisWeek}</p>
                </div>
              </div>
            )}
          </div>
          {error && (
            <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
        </div>

        {groupId && (
          <div className="rounded-2xl border border-slate-700/80 bg-slate-800/40 p-4 sm:p-6 backdrop-blur-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-white min-w-0">
                <Calendar className="h-5 w-5 shrink-0 text-green-400" />
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-semibold">Haftalik dars rejasi</h2>
                  <p className="text-[11px] sm:text-xs text-slate-500">Tanlangan guruh · Yakshanbadan boshlab</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
                  className="inline-flex h-11 w-11 min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-slate-600 bg-slate-900/80 text-slate-300 transition hover:border-green-500/40 hover:text-white"
                  aria-label="Oldingi hafta"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="min-w-0 flex-1 basis-[min(100%,220px)] text-center text-xs font-medium text-slate-300 sm:min-w-[200px] sm:flex-none sm:text-sm md:min-w-[260px]">
                  {weekTitle}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
                  className="inline-flex h-11 w-11 min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-slate-600 bg-slate-900/80 text-slate-300 transition hover:border-green-500/40 hover:text-white"
                  aria-label="Keyingi hafta"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const n = new Date()
                    setCurrentWeek(n)
                    setDate(localYmd(n))
                  }}
                  className="min-h-[44px] rounded-xl border border-green-500/35 bg-green-500/10 px-4 py-2 text-xs font-semibold text-green-300 transition hover:bg-green-500/20"
                >
                  Bugun
                </button>
              </div>
            </div>

            {(loadingMeta || loadingWeek) && (
              <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-green-400" />
                <span className="text-sm">Jadval yuklanmoqda…</span>
              </div>
            )}

            {!loadingMeta && !loadingWeek && (
              <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 pt-1 -mx-1 px-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-7 touch-pan-x">
                {weekBounds.days.map(({ date: dayDate, ymd, dow }) => {
                  const list = schedulesByYmd.get(ymd) ?? []
                  const allTimes = new Set<string>()
                  list.forEach((s) => parseTimes(s).forEach((t) => allTimes.add(t)))
                  const sortedTimes = Array.from(allTimes).sort((a, b) => {
                    const [ah, am] = a.split(':').map(Number)
                    const [bh, bm] = b.split(':').map(Number)
                    return ah * 60 + am - (bh * 60 + bm)
                  })
                  const hasLesson = list.length > 0
                  const isSelected = date === ymd
                  const isToday = isSameDay(dayDate, today)

                  return (
                    <button
                      key={ymd}
                      type="button"
                      onClick={() => setDate(ymd)}
                      className={`flex w-[min(42vw,148px)] shrink-0 snap-center flex-col rounded-xl border p-3 text-left transition max-sm:min-h-[118px] sm:w-auto sm:min-w-0 ${
                        isSelected
                          ? 'border-green-400/80 bg-green-500/15 ring-2 ring-green-500/40 shadow-lg shadow-green-900/20'
                          : hasLesson
                            ? 'border-green-500/25 bg-slate-900/60 hover:border-green-500/45 hover:bg-slate-900'
                            : 'border-slate-700/80 border-dashed bg-slate-900/30 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {WEEK_HEADER[dow]?.short ?? ''}
                      </span>
                      <span className="mt-0.5 text-xl font-bold text-white">{format(dayDate, 'd')}</span>
                      <span className="text-[11px] text-slate-500">{format(dayDate, 'MMM', { locale: uz })}</span>
                      {isToday && (
                        <span className="mt-1 w-fit rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-300">
                          bugun
                        </span>
                      )}
                      <div className="mt-2 flex flex-1 flex-col gap-1">
                        {hasLesson ? (
                          sortedTimes.slice(0, 4).map((t) => (
                            <span
                              key={t}
                              className="inline-flex w-fit items-center rounded-md bg-green-500/15 px-1.5 py-0.5 font-mono text-[10px] text-green-300"
                            >
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-600">Dars yo‘q</span>
                        )}
                        {sortedTimes.length > 4 && (
                          <span className="text-[9px] text-slate-500">+{sortedTimes.length - 4} vaqt</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {date && (
              <p className="mt-4 text-center text-sm text-slate-400">
                Tanlangan sana:{' '}
                <strong className="text-green-400">{formatDateShort(date)}</strong> — natijalar pastda
              </p>
            )}
          </div>
        )}

        {groupId && !loadingWeek && !loadingMeta && weekSchedules.length === 0 && (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-8 text-center">
            <ChevronRight className="mx-auto mb-3 h-8 w-8 text-amber-400/80" />
            <p className="text-slate-300">
              <span className="font-medium text-amber-200/90">Shu haftada</span> bu guruh uchun dars rejasi
              yozilmagan. Boshqa haftani ko‘ring
              {layoutRole === 'RAHBAR'
                ? ' yoki markaz admini bilan bog‘laning.'
                : (
                    <>
                      {' '}
                      yoki <span className="text-amber-200/90">Dars Rejasi</span> bo‘limidan qo‘shing.
                    </>
                  )}
            </p>
          </div>
        )}

        {date && groupId && (
          <div className="space-y-6">
            {loadingDetail && (
              <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/30 py-12 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-green-400" />
                <span>Natijalar yuklanmoqda…</span>
              </div>
            )}

            {!loadingDetail && detail && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5">
                    <div className="mb-3 flex items-center gap-2 text-slate-400">
                      <Calendar className="h-4 w-4 text-green-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Tanlangan kun</span>
                    </div>
                    <p className="text-xl font-bold text-white">{formatDateShort(detail.date)}</p>
                    <p className="text-sm text-slate-400">{detail.weekday}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5">
                    <div className="mb-3 flex items-center gap-2 text-slate-400">
                      <BarChart3 className="h-4 w-4 text-green-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Topshiriqlar</span>
                    </div>
                    <p className="text-xl font-bold text-white">{summaryStats?.totalActs ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5">
                    <div className="mb-3 flex items-center gap-2 text-slate-400">
                      <Users className="h-4 w-4 text-green-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Qamrov (o‘rtacha)</span>
                    </div>
                    <p className="text-xl font-bold text-white">{summaryStats?.avgRate ?? 0}%</p>
                  </div>
                </div>

                {detail.scheduleBlocks.length > 0 && (
                  <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-5">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                      <Clock className="h-5 w-5 text-green-400" />
                      Shu kundagi dars slotlari
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {detail.scheduleBlocks.map((b, i) => (
                        <div
                          key={b.id}
                          className="min-w-[200px] flex-1 rounded-xl border border-green-500/25 bg-gradient-to-br from-slate-900/90 to-slate-800/50 p-4"
                        >
                          <p className="text-[11px] font-bold uppercase tracking-wider text-green-400/90">
                            Slot {i + 1}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-white">{b.timesLabel}</p>
                          {b.notes && <p className="mt-2 text-xs text-slate-500">{b.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-5">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                    <ClipboardList className="h-5 w-5 text-green-400" />
                    Olingan ishlar va natija kiritilganlar
                  </h2>
                  {detail.activities.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-600 py-10 text-center text-slate-500">
                      Bu sanada test yoki yozma ish topilmadi (yoki hali yaratilmagan).
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700/80 touch-pan-x -mx-1 px-1 sm:mx-0 sm:px-0">
                      <table className="w-full min-w-[640px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-700 bg-slate-900/60 text-xs uppercase tracking-wider text-slate-500">
                            <th className="px-4 py-3 font-semibold">Tur</th>
                            <th className="px-4 py-3 font-semibold">Nom</th>
                            <th className="px-4 py-3 font-semibold">Savollar</th>
                            <th className="px-4 py-3 font-semibold">Natija kiritilgan</th>
                            <th className="px-4 py-3 font-semibold">Guruh</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/60">
                          {detail.activities.map((a) => {
                            const st = catStyle[a.category]
                            const Icon = st.icon
                            const pct =
                              a.enrolledCount > 0
                                ? Math.round((a.resultsEntered / a.enrolledCount) * 100)
                                : 0
                            return (
                              <tr key={a.id} className="bg-slate-800/20 hover:bg-slate-800/40">
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${st.badge}`}
                                  >
                                    <Icon className="h-3.5 w-3.5" />
                                    {a.label}
                                  </span>
                                </td>
                                <td className="max-w-[220px] px-4 py-3 text-slate-200">
                                  <span className="line-clamp-2 font-medium">{a.title || '—'}</span>
                                  {a.extra && (
                                    <span className="mt-0.5 block text-xs text-slate-500">{a.extra}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-slate-300">{a.totalQuestions}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                                    <span className="font-mono text-white">
                                      <span className="text-green-400">{a.resultsEntered}</span>
                                      <span className="text-slate-500"> / </span>
                                      {a.enrolledCount}
                                    </span>
                                    <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-slate-700 sm:w-24">
                                      <div
                                        className={`h-full rounded-full bg-gradient-to-r ${st.bar}`}
                                        style={{ width: `${Math.min(100, pct)}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-slate-500">{pct}%</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500">
                                  {a.classScheduleId ? 'Rejaga bog‘langan' : 'Umumiy sana'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-5">
                  <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
                    <Users className="h-5 w-5 text-green-400" />
                    O‘quvchilar bo‘yicha natijalar
                  </h2>
                  <p className="mb-4 text-sm text-slate-500">
                    Faqat yuqoridagi sanadagi test / uyga vazifa / yozma ishlar. «—» — natija kiritilmagan.
                    Qizil qator — davomatda <strong className="text-red-300/90">Kelmadi</strong> belgilangan
                    o‘quvchilar. Davomat foizi kechikishga qarab (180 daqiqali dars).
                  </p>
                  {detail.studentRows.length === 0 ? (
                    <p className="text-center text-slate-500">Bu guruhda faol o‘quvchi yo‘q.</p>
                  ) : detail.activities.length === 0 ? (
                    <p className="text-center text-slate-500">Ustunlar uchun avval test/yozma ish yarating.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700/80 touch-pan-x -mx-1 px-1 sm:mx-0 sm:px-0">
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-700 bg-slate-900/60">
                            <th className="sticky left-0 z-10 min-w-[160px] bg-slate-900/95 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                              O‘quvchi
                            </th>
                            {detail.activities.map((a) => {
                              const st = catStyle[a.category]
                              const Icon = st.icon
                              return (
                                <th
                                  key={a.id}
                                  className="min-w-[140px] px-3 py-3 text-xs font-semibold text-slate-300"
                                >
                                  <div className="flex flex-col gap-1">
                                    <span
                                      className={`inline-flex w-fit items-center gap-1 rounded-md border px-2 py-0.5 ${st.badge}`}
                                    >
                                      <Icon className="h-3 w-3" />
                                      {a.label}
                                    </span>
                                    <span className="line-clamp-2 font-normal text-slate-500">
                                      {a.title || '—'}
                                    </span>
                                  </div>
                                </th>
                              )
                            })}
                            <th className="min-w-[88px] px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Davomat %
                            </th>
                            <th className="min-w-[72px] px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-amber-300/90">
                              ∞ kun
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/60">
                          {detail.studentRows.map((row) => (
                            <tr
                              key={row.studentId}
                              className={
                                row.isAbsent
                                  ? 'bg-red-950/35 hover:bg-red-950/45'
                                  : 'hover:bg-slate-800/30'
                              }
                            >
                              <td
                                className={`sticky left-0 z-10 border-r border-slate-700/50 px-4 py-2.5 ${
                                  row.isAbsent
                                    ? 'bg-red-950/50'
                                    : 'bg-slate-900/90'
                                }`}
                              >
                                <p className="font-medium text-white">{row.userName}</p>
                                {row.username && (
                                  <p className="text-xs text-slate-500">@{row.username}</p>
                                )}
                                {row.isAbsent && (
                                  <span className="mt-1 inline-block rounded bg-red-500/25 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-300">
                                    Kelmadi
                                  </span>
                                )}
                              </td>
                              {row.cells.map((c) => (
                                <td
                                  key={c.activityId}
                                  className={`px-3 py-2.5 font-mono text-xs ${
                                    c.hasResult ? 'text-green-300/95' : 'text-slate-600'
                                  }`}
                                >
                                  {c.display}
                                </td>
                              ))}
                              <td className="px-3 py-2.5 text-sm font-medium text-slate-200">
                                {row.attendancePercent != null ? (
                                  <span
                                    className={
                                      row.attendancePercent >= 80
                                        ? 'text-green-400'
                                        : row.attendancePercent >= 50
                                          ? 'text-amber-300'
                                          : 'text-red-300'
                                    }
                                  >
                                    {row.attendancePercent}%
                                  </span>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>
                              <td
                                className={`px-3 py-2.5 text-center font-mono text-sm font-bold ${
                                  row.dayInfinityTotal > 0 ? 'text-amber-300/95' : 'text-slate-600'
                                }`}
                              >
                                {row.dayInfinityTotal}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
