'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { GraduationCap, UserCog, BookOpen, DollarSign, TrendingUp } from 'lucide-react'

type Stats = {
  totalStudents: number
  totalTeachers: number
  totalGroups: number
  totalRevenue: number
  totalDebt: number
  averageMastery: number
  attendanceRate: number
}

export function LeaderOverviewContent() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalGroups: 0,
    totalRevenue: 0,
    totalDebt: 0,
    averageMastery: 0,
    attendanceRate: 0,
  })

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data) setStats(data)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold text-center">
          {session?.user?.name || 'Boshliq'} — qisqa ko‘rinish
        </h1>
        <p className="text-center text-indigo-100 text-sm mt-2">
          Asosiy ko‘rsatkichlar (admin statistikasi)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
            <span className="text-xl sm:text-2xl font-bold text-white">{stats.totalStudents}</span>
          </div>
          <p className="text-sm text-gray-400">O&apos;quvchilar</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <UserCog className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
            <span className="text-xl sm:text-2xl font-bold text-white">{stats.totalTeachers}</span>
          </div>
          <p className="text-sm text-gray-400">O&apos;qituvchilar</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
            <span className="text-xl sm:text-2xl font-bold text-white">{stats.totalGroups}</span>
          </div>
          <p className="text-sm text-gray-400">Guruhlar</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" />
            <span className="text-lg sm:text-xl font-bold text-white">{stats.totalRevenue.toLocaleString()}</span>
          </div>
          <p className="text-sm text-gray-400">Jami daromad</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            Moliyaviy
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Qarzdorlik</span>
              <span className="text-red-400 font-medium">{stats.totalDebt.toLocaleString()} so&apos;m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sof</span>
              <span className="text-green-400 font-medium">
                {(stats.totalRevenue - stats.totalDebt).toLocaleString()} so&apos;m
              </span>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            KPI
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">O&apos;zlashtirish</span>
                <span className="text-white">{stats.averageMastery}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, stats.averageMastery)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Davomat</span>
                <span className="text-white">{stats.attendanceRate}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, stats.attendanceRate)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
