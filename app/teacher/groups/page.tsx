'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Users, BookOpen, User, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Group {
  id: string
  name: string
  description: string | null
  maxStudents: number
  isActive: boolean
  enrollments: {
    id: string
    student: {
      id: string
      user: {
        name: string
        username: string
      }
      studentId: string
      level: number
      masteryLevel: number
    }
  }[]
}

export default function TeacherGroupsPage() {
  const { data: session } = useSession()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/teacher/groups')
      .then(res => res.json())
      .then(data => {
        if (data) setGroups(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="TEACHER">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Guruhlar</h1>
            <p className="text-gray-400">Sizning guruhlaringiz va o'quvchilaringiz</p>
          </div>
        </div>

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 text-center border border-gray-700">
            <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Hozircha guruhlar mavjud emas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => {
              const activeStudents = group.enrollments.filter(e => e.student).length
              const avgMastery = group.enrollments.length > 0
                ? Math.round(
                    group.enrollments
                      .map(e => e.student.masteryLevel)
                      .reduce((a, b) => a + b, 0) / group.enrollments.length
                  )
                : 0

              return (
                <div
                  key={group.id}
                  className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{group.name}</h3>
                      {group.description && (
                        <p className="text-gray-400 text-sm">{group.description}</p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        group.isActive
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}
                    >
                      {group.isActive ? 'Faol' : 'Nofaol'}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Users className="h-4 w-4" />
                        <span>O'quvchilar</span>
                      </div>
                      <span className="text-white font-semibold">
                        {activeStudents} / {group.maxStudents}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <TrendingUp className="h-4 w-4" />
                        <span>O'rtacha o'zlashtirish</span>
                      </div>
                      <span className="text-white font-semibold">{avgMastery}%</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${(activeStudents / group.maxStudents) * 100}%` }}
                    />
                  </div>

                  <Link
                    href={`/teacher/groups/${group.id}`}
                    className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Batafsil ko'rish
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
