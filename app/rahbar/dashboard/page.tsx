'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useCallback, useEffect, useState } from 'react'
import {
  Users,
  Percent,
  BarChart3,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  ClipboardList,
} from 'lucide-react'

type GroupSummary = {
  id: string
  name: string
  description: string | null
  maxStudents: number
  teacherName: string | null
  studentCount: number
  utilizationPercent: number
  avgMastery: number
  attendanceLast30dPercent: number
  attendanceRecordsLast30d: number
  gradesLast30dCount: number
  gradesLast30dAvgPercent: number
}

type GroupDetail = {
  group: {
    id: string
    name: string
    description: string | null
    maxStudents: number
    teacherName: string | null
  }
  summary: {
    studentCount: number
    avgMastery: number
    attendanceLast30dPercent: number
    attendanceRecordsLast30d: number
    gradesLast30d: { count: number; averagePercent: number }
  }
  students: {
    id: string
    studentId: string
    name: string | null
    username: string | null
    masteryLevel: number | null
    attendanceRate: number | null
  }[]
  recentGrades: {
    id: string
    type: string
    score: number
    maxScore: number
    percent: number
    studentName: string | null
    createdAt: string
  }[]
}

export default function RahbarDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [windowDays, setWindowDays] = useState(30)
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState<string | null>(null)
  const [details, setDetails] = useState<Record<string, GroupDetail>>({})
  const [error, setError] = useState('')

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rahbar/reports')
      if (!res.ok) {
        setError('Ma\'lumot yuklanmadi')
        return
      }
      const data = await res.json()
      setGroups(data.groups || [])
      if (typeof data.windowDays === 'number') setWindowDays(data.windowDays)
    } catch {
      setError('Tarmoq xatosi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    if (details[id]) return
    setDetailLoading(id)
    try {
      const res = await fetch(`/api/rahbar/reports?groupId=${encodeURIComponent(id)}`)
      if (res.ok) {
        const data: GroupDetail = await res.json()
        setDetails((prev) => ({ ...prev, [id]: data }))
      }
    } finally {
      setDetailLoading(null)
    }
  }

  return (
    <DashboardLayout role="RAHBAR">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Rahbar paneli</h1>
          <p className="text-sm text-gray-400">
            Har bir guruh bo‘yicha qisqacha hisobotlar (oxirgi {windowDays} kun: davomat va baholar)
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <p className="text-gray-400 text-center py-12">Faol guruhlar topilmadi</p>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => {
              const open = expandedId === g.id
              const detail = details[g.id]
              const loadingDetail = detailLoading === g.id
              return (
                <div
                  key={g.id}
                  className="rounded-xl border border-gray-700 bg-slate-800/40 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(g.id)}
                    className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="mt-0.5 text-green-400">
                      {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-white truncate">{g.name}</h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        O‘qituvchi: {g.teacherName ?? '—'}
                      </p>
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <Users className="h-4 w-4 text-blue-400 shrink-0" />
                          <span>{g.studentCount} o‘quvchi</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <BarChart3 className="h-4 w-4 text-violet-400 shrink-0" />
                          <span>O‘zlashtirish ~{g.avgMastery}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <Percent className="h-4 w-4 text-amber-400 shrink-0" />
                          <span>Davomat {g.attendanceLast30dPercent}% ({g.attendanceRecordsLast30d})</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <ClipboardList className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span>
                            Baholar: {g.gradesLast30dCount} ta, o‘rtacha {g.gradesLast30dAvgPercent}%
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-2">
                        To‘ldirish: {g.utilizationPercent}% ({g.studentCount}/{g.maxStudents})
                      </p>
                    </div>
                  </button>

                  {open && (
                    <div className="border-t border-gray-700 px-4 pb-4 pt-2 bg-slate-900/40">
                      {loadingDetail ? (
                        <p className="text-sm text-gray-500 py-4">Batafsil yuklanmoqda...</p>
                      ) : detail ? (
                        <div className="space-y-4">
                          {detail.group.description && (
                            <p className="text-sm text-gray-400">{detail.group.description}</p>
                          )}
                          <div className="grid sm:grid-cols-2 gap-3 text-sm">
                            <div className="rounded-lg bg-slate-800/80 p-3 border border-gray-700">
                              <p className="text-gray-500 text-xs mb-1">O‘quvchilar</p>
                              <p className="text-white font-medium">{detail.summary.studentCount} kishi</p>
                            </div>
                            <div className="rounded-lg bg-slate-800/80 p-3 border border-gray-700">
                              <p className="text-gray-500 text-xs mb-1">O‘rtacha o‘zlashtirish</p>
                              <p className="text-white font-medium">~{detail.summary.avgMastery}%</p>
                            </div>
                            <div className="rounded-lg bg-slate-800/80 p-3 border border-gray-700">
                              <p className="text-gray-500 text-xs mb-1">Davomat ({windowDays} kun)</p>
                              <p className="text-white font-medium">
                                {detail.summary.attendanceLast30dPercent}% —{' '}
                                {detail.summary.attendanceRecordsLast30d} yozuv
                              </p>
                            </div>
                            <div className="rounded-lg bg-slate-800/80 p-3 border border-gray-700">
                              <p className="text-gray-500 text-xs mb-1">Baholar ({windowDays} kun)</p>
                              <p className="text-white font-medium">
                                {detail.summary.gradesLast30d.count} ta, o‘rtacha{' '}
                                {detail.summary.gradesLast30d.averagePercent}%
                              </p>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-green-400" />
                              O‘quvchilar ro‘yxati
                            </h3>
                            <div className="overflow-x-auto rounded-lg border border-gray-700">
                              <table className="w-full text-sm text-left">
                                <thead className="bg-slate-800 text-gray-400 text-xs uppercase">
                                  <tr>
                                    <th className="px-3 py-2">Ism</th>
                                    <th className="px-3 py-2">ID</th>
                                    <th className="px-3 py-2">O‘zlashtirish</th>
                                    <th className="px-3 py-2">Davomat (umumiy)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                  {detail.students.map((s) => (
                                    <tr key={s.id} className="bg-slate-900/50">
                                      <td className="px-3 py-2 text-white">{s.name ?? '—'}</td>
                                      <td className="px-3 py-2 text-gray-400">{s.studentId}</td>
                                      <td className="px-3 py-2 text-gray-300">
                                        {s.masteryLevel != null ? `${Math.round(s.masteryLevel)}%` : '—'}
                                      </td>
                                      <td className="px-3 py-2 text-gray-300">
                                        {s.attendanceRate != null ? `${Math.round(s.attendanceRate)}%` : '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {detail.recentGrades.length > 0 && (
                            <div>
                              <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                                <ClipboardList className="h-4 w-4 text-emerald-400" />
                                So‘nggi baholar
                              </h3>
                              <div className="overflow-x-auto rounded-lg border border-gray-700 max-h-56 overflow-y-auto">
                                <table className="w-full text-sm text-left">
                                  <thead className="bg-slate-800 text-gray-400 text-xs uppercase sticky top-0">
                                    <tr>
                                      <th className="px-3 py-2">O‘quvchi</th>
                                      <th className="px-3 py-2">Tur</th>
                                      <th className="px-3 py-2">Ball</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-700">
                                    {detail.recentGrades.map((r) => (
                                      <tr key={r.id} className="bg-slate-900/50">
                                        <td className="px-3 py-2 text-white">{r.studentName ?? '—'}</td>
                                        <td className="px-3 py-2 text-gray-400">{r.type}</td>
                                        <td className="px-3 py-2 text-gray-300">
                                          {r.score}/{r.maxScore} ({r.percent}%)
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Ma&apos;lumot yuklanmadi</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
