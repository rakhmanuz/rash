'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useEffect, useMemo, useState } from 'react'
import { Trophy, Users } from 'lucide-react'

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
  pool?: 'ONLINE' | 'OFFLINE'
  groupRankings: GroupRanking[]
  overallRankings: RankingStudent[]
  currentStudent: { id: string; overallRank: number | null; groupRanks: Array<{ groupId: string; groupName: string; rank: number }>; masteryLevel: number }
}

export default function StudentReytingPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<StudentRankingResponse | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/student/ranking', { credentials: 'include' })
        if (!res.ok) {
          if (res.status === 403) setError("Sizga reyting bo'limi yopiq")
          else setError("Reytingni yuklab bo'lmadi")
          setData(null)
          return
        }
        const json = (await res.json()) as StudentRankingResponse
        setData(json)
      } catch {
        setError("Tarmoq xatosi: reytingni yuklab bo'lmadi")
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  const topOverall = useMemo(() => (data?.overallRankings ?? []).slice(0, 5), [data])

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-700 bg-gradient-to-r from-sky-500/15 via-emerald-500/10 to-cyan-500/10 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/15 p-2.5">
              <Trophy className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Reyting</h1>
              <p className="text-sm text-slate-300">
                {data?.pool === 'ONLINE'
                  ? "Online o'quvchilar orasida — o'zlashtirish (mastery) bo'yicha TOP"
                  : data?.pool === 'OFFLINE'
                    ? "Offline o'quvchilar orasida — o'zlashtirish (mastery) bo'yicha TOP"
                    : "O'zlashtirish (mastery) bo'yicha TOP"}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-300">
            Yuklanmoqda...
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3 text-white">
                <Users className="h-4 w-4 text-emerald-300" />
                <span className="font-semibold">Umumiy TOP 5</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-slate-950/40 text-left text-slate-400">
                      <th className="px-4 py-3 font-medium">O'rin</th>
                      <th className="px-4 py-3 font-medium">O'quvchi</th>
                      <th className="px-4 py-3 font-medium">Login</th>
                      <th className="px-4 py-3 font-medium">Mastery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topOverall.map((row) => (
                      <tr key={row.id} className="border-t border-slate-800/60 text-slate-100">
                        <td className="px-4 py-3 font-semibold text-emerald-300">{row.rank}</td>
                        <td className="px-4 py-3">{row.name}</td>
                        <td className="px-4 py-3 text-slate-400">@{row.username}</td>
                        <td className="px-4 py-3 font-semibold">{Math.round(row.masteryLevel)}%</td>
                      </tr>
                    ))}
                    {topOverall.length === 0 && (
                      <tr className="border-t border-slate-800/60 text-slate-300">
                        <td className="px-4 py-6 text-center" colSpan={4}>
                          Reyting topilmadi.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {(data?.groupRankings ?? []).map((g) => (
              <div key={g.groupId} className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <div className="border-b border-slate-800 px-4 py-3">
                  <div className="text-white font-semibold">{g.groupName}</div>
                  <div className="text-xs text-slate-400">O'qituvchi: {g.teacherName}</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-950/40 text-left text-slate-400">
                        <th className="px-4 py-3 font-medium">O'rin</th>
                        <th className="px-4 py-3 font-medium">O'quvchi</th>
                        <th className="px-4 py-3 font-medium">Login</th>
                        <th className="px-4 py-3 font-medium">Mastery</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.students.map((row) => (
                        <tr key={row.id} className="border-t border-slate-800/60 text-slate-100">
                          <td className="px-4 py-3 font-semibold text-emerald-300">{row.rank}</td>
                          <td className="px-4 py-3">{row.name}</td>
                          <td className="px-4 py-3 text-slate-400">@{row.username}</td>
                          <td className="px-4 py-3 font-semibold">{Math.round(row.masteryLevel)}%</td>
                        </tr>
                      ))}
                      {g.students.length === 0 && (
                        <tr className="border-t border-slate-800/60 text-slate-300">
                          <td className="px-4 py-6 text-center" colSpan={4}>
                            Ma'lumot yo'q.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

