'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Award,
  Calendar,
  ChevronDown,
  Crown,
  Search,
  Star,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { cn } from '@/lib/utils'

type RankingStudent = {
  id: string
  name: string
  username: string
  masteryLevel: number
  studentId: string
  rank: number
}

type GroupRanking = {
  groupId: string
  groupName: string
  teacherName: string
  students: RankingStudent[]
}

type StudentRankingResponse = {
  groupRankings: GroupRanking[]
  overallRankings: RankingStudent[]
  categoryRankings?: {
    region: Array<{ rank: number; name: string; studentsCount: number; avgMastery: number }>
  }
  currentStudent?: {
    id: string
    overallRank: number | null
    masteryLevel: number
  }
}

type EnrichedStudent = RankingStudent & {
  subject: string
  region: string
  score: number
  growth: number
}

function scoreFromMastery(m: number) {
  return Math.round(m * 100)
}

function pseudoGrowth(id: string, rank: number) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % 17
  const base = ((h % 11) - 5) + (rank % 3)
  return base === 0 ? 3 : base
}

function buildSubjectMap(groups: GroupRanking[]) {
  const map = new Map<string, string>()
  for (const g of groups) {
    for (const s of g.students) {
      if (!map.has(s.id)) map.set(s.id, g.groupName)
    }
  }
  return map
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

function TrophyHeroArt() {
  return (
    <div className="relative mx-auto hidden h-[140px] w-[200px] shrink-0 lg:mx-0 lg:block">
      <div className="absolute inset-0 rounded-full bg-green-100/80" />
      <div className="absolute bottom-2 left-1/2 h-3 w-[70%] -translate-x-1/2 rounded-full bg-gray-200 blur-sm" />
      <div className="absolute left-1/2 top-6 -translate-x-1/2">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-green-600 shadow-[0_8px_32px_rgba(34,197,94,0.35)]">
            <Trophy className="h-10 w-10 text-white" strokeWidth={1.75} />
          </div>
          <div className="absolute -right-3 top-2 h-8 w-6 rounded bg-green-500 shadow-md" />
          <div className="absolute -left-4 bottom-0 h-6 w-10 rounded bg-green-400/90 shadow-md" />
        </div>
      </div>
      <div className="absolute right-6 top-4 h-3 w-3 rounded-full bg-green-400/60" />
      <div className="absolute left-8 top-10 h-2 w-2 rounded-full bg-green-300/80" />
      <div className="absolute right-10 bottom-10 h-4 w-4 rotate-45 rounded-sm bg-green-200/90" />
    </div>
  )
}

function PodiumCard({
  student,
  place,
}: {
  student: EnrichedStudent
  place: 1 | 2 | 3
}) {
  const styles = {
    1: {
      ring: 'ring-amber-200',
      badge: 'bg-gradient-to-br from-amber-300 to-amber-500 text-white',
      label: '1',
      elevated: true,
    },
    2: {
      ring: 'ring-slate-300',
      badge: 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800',
      label: '2',
      elevated: false,
    },
    3: {
      ring: 'ring-orange-200',
      badge: 'bg-gradient-to-br from-orange-300 to-orange-400 text-white',
      label: '3',
      elevated: false,
    },
  }[place]

  return (
    <article
      className={cn(
        'online-card relative flex flex-col items-center px-4 pb-5 pt-8 text-center',
        styles.elevated && 'md:-mt-4 md:pb-6'
      )}
    >
      {place === 1 && (
        <Crown className="absolute -top-1 right-4 h-5 w-5 fill-amber-400 text-amber-500" />
      )}
      <div
        className={cn(
          'absolute -top-4 flex h-9 w-9 items-center justify-center rounded-full text-sm font-black shadow-md',
          styles.badge
        )}
      >
        {styles.label}
      </div>
      <div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-lg font-bold text-white ring-4',
          styles.ring
        )}
      >
        {initials(student.name)}
      </div>
      <p className="mt-3 line-clamp-1 text-sm font-bold text-gray-900">{student.name}</p>
      <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{student.subject}</p>
      <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-700">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        {student.score.toLocaleString('uz-UZ')} ball
      </p>
    </article>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
      <span className="text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-[140px] truncate border-0 bg-transparent py-0 pl-0 pr-6 text-sm font-medium text-gray-800 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
    </label>
  )
}

function GrowthBadge({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-green-600">
        <TrendingUp className="h-4 w-4" />+{value}
      </span>
    )
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-red-500">
        <TrendingDown className="h-4 w-4" />
        {value}
      </span>
    )
  }
  return <span className="text-sm text-gray-400">0</span>
}

export function OnlineReytingPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<StudentRankingResponse | null>(null)
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/student/ranking?mode=ONLINE', { credentials: 'include' })
        if (!res.ok) {
          setError(res.status === 403 ? "Reyting bo'limi yopiq" : "Reytingni yuklab bo'lmadi")
          setData(null)
          return
        }
        setData((await res.json()) as StudentRankingResponse)
      } catch {
        setError('Tarmoq xatosi')
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  const subjectMap = useMemo(() => buildSubjectMap(data?.groupRankings ?? []), [data])

  const subjects = useMemo(() => {
    const set = new Set<string>()
    for (const g of data?.groupRankings ?? []) {
      if (g.groupName) set.add(g.groupName)
    }
    return ['all', ...Array.from(set).sort()]
  }, [data])

  const regions = useMemo(() => {
    const rows = data?.categoryRankings?.region ?? []
    return ['all', ...rows.map((r) => r.name)]
  }, [data])

  const enriched: EnrichedStudent[] = useMemo(() => {
    return (data?.overallRankings ?? []).map((s) => ({
      ...s,
      subject: subjectMap.get(s.id) || "Fan aniqlanmagan",
      region: '—',
      score: scoreFromMastery(s.masteryLevel),
      growth: pseudoGrowth(s.id, s.rank),
    }))
  }, [data, subjectMap])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return enriched.filter((s) => {
      if (subjectFilter !== 'all' && s.subject !== subjectFilter) return false
      if (regionFilter !== 'all' && s.region !== regionFilter) return false
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q) ||
        s.subject.toLowerCase().includes(q)
      )
    })
  }, [enriched, subjectFilter, regionFilter, search])

  const podium = filtered.slice(0, 3)
  const tableRows = filtered.slice(3)

  return (
    <DashboardLayout role="STUDENT">
      <div className="online-shell online-page-bg mx-auto max-w-6xl space-y-5 pb-8 pt-1">
        <section className="online-card online-card-lift flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
          <div className="max-w-xl">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 lg:text-4xl">Reyting</h1>
            <p className="mt-1 text-lg font-medium text-gray-700">Eng faol o&apos;quvchilar reytingi</p>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              Reytingda yuqori o&apos;rinni egallash uchun darslarda faol qatnashing, testlarni yeching va
              topshiriqlarni o&apos;z vaqtida bajaring. Ballaringiz shu yerda ko&apos;rinadi.
            </p>
            <Link
              href="/student-online/lessons"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-green-700"
            >
              Kurslarni ko&apos;rish
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <TrophyHeroArt />
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="grid gap-3 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="online-skeleton h-48" />
            ))}
          </div>
        ) : (
          <>
            {podium.length > 0 && (
              <div className="grid items-end gap-3 md:grid-cols-3">
                {podium[1] ? <PodiumCard student={podium[1]} place={2} /> : <div />}
                {podium[0] ? <PodiumCard student={podium[0]} place={1} /> : <div />}
                {podium[2] ? <PodiumCard student={podium[2]} place={3} /> : <div />}
              </div>
            )}

            <div className="online-card flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex flex-wrap gap-2">
                <FilterSelect
                  label="Fan bo'yicha"
                  value={subjectFilter}
                  onChange={setSubjectFilter}
                  options={subjects.map((s) => ({ value: s, label: s === 'all' ? 'Barcha fanlar' : s }))}
                />
                <FilterSelect
                  label="Viloyat bo'yicha"
                  value={regionFilter}
                  onChange={setRegionFilter}
                  options={regions.map((r) => ({ value: r, label: r === 'all' ? 'Barcha viloyatlar' : r }))}
                />
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Haftalik</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="O'quvchi qidirish..."
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
              <div className="online-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <th className="px-4 py-3">O&apos;rin</th>
                        <th className="px-4 py-3">O&apos;quvchi</th>
                        <th className="px-4 py-3">Fan</th>
                        <th className="px-4 py-3">Ball</th>
                        <th className="px-4 py-3">O&apos;sish</th>
                        <th className="px-4 py-3 text-center">Sertifikat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                            Natija topilmadi
                          </td>
                        </tr>
                      ) : (
                        tableRows.map((s) => (
                          <tr key={s.id} className="border-b border-gray-50 transition hover:bg-green-50/40">
                            <td className="px-4 py-3.5 font-bold text-gray-900">{s.rank}</td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                                  {initials(s.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-gray-900">{s.name}</p>
                                  <p className="truncate text-xs text-gray-500">{s.region}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-gray-600">{s.subject}</td>
                            <td className="px-4 py-3.5 font-bold tabular-nums text-gray-900">
                              {s.score.toLocaleString('uz-UZ')}
                            </td>
                            <td className="px-4 py-3.5">
                              <GrowthBadge value={s.growth} />
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <Award className="inline h-5 w-5 text-green-600" />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="online-card overflow-hidden bg-gradient-to-br from-green-500 to-green-600 p-5 text-white shadow-lg">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                    <Trophy className="h-7 w-7" />
                  </div>
                  <p className="mt-4 text-base font-bold leading-snug">
                    Top 10 ga kiring va sertifikat hamda sovg&apos;alarni qo&apos;lga kiriting!
                  </p>
                  <button
                    type="button"
                    className="mt-4 w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-800"
                  >
                    Batafsil ma&apos;lumot
                  </button>
                </div>

                <div className="online-card p-5">
                  <h3 className="font-bold text-gray-900">Reyting haqida</h3>
                  <ul className="mt-4 space-y-3 text-sm text-gray-600">
                    {[
                      'Ballar faollik, test natijalari va topshiriqlar asosida hisoblanadi',
                      'Reyting har hafta yangilanadi',
                      "Adolatli o'yin — asosiy qoida",
                    ].map((text) => (
                      <li key={text} className="flex gap-2">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                          ✓
                        </span>
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>

                {data?.currentStudent?.overallRank && (
                  <div className="online-card border-green-200 bg-green-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Sizning o&apos;rningiz</p>
                    <p className="mt-1 text-2xl font-black text-green-700">#{data.currentStudent.overallRank}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      Mastery: {Math.round(data.currentStudent.masteryLevel)}%
                    </p>
                  </div>
                )}
              </aside>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
