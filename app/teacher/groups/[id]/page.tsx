'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  Users, 
  BookOpen, 
  User, 
  Calendar, 
  TrendingUp,
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react'
import Link from 'next/link'

interface Student {
  id: string
  user: {
    id: string
    name: string
    username: string
    phone?: string
  }
  studentId: string
  level: number
  masteryLevel: number
  attendances: Array<{
    id: string
    date: string
    isPresent: boolean
  }>
  assignments: Array<{
    id: string
    title: string
    isCompleted: boolean
    score: number | null
    maxScore: number
  }>
  grades: Array<{
    id: string
    score: number
    maxScore: number
    createdAt: string
  }>
}

interface Group {
  id: string
  name: string
  description: string | null
  maxStudents: number
  isActive: boolean
  enrollments: Array<{
    id: string
    student: Student
  }>
}

export default function TeacherGroupDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params?.id) {
      fetch(`/api/teacher/groups/${params.id}`)
        .then(res => {
          if (res.status === 404) {
            router.push('/teacher/groups')
            return null
          }
          return res.json()
        })
        .then(data => {
          if (data) setGroup(data)
          setLoading(false)
        })
        .catch(err => {
          console.error(err)
          setLoading(false)
        })
    }
  }, [params?.id, router])

  if (loading) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!group) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="bg-slate-800 rounded-xl p-12 text-center border border-gray-700">
          <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Guruh topilmadi</p>
          <Link
            href="/teacher/groups"
            className="mt-4 inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Guruhlar ro'yxatiga qaytish
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const activeStudents = group.enrollments.filter(e => e.student).length
  const avgMastery = group.enrollments.length > 0
    ? Math.round(
        group.enrollments
          .map(e => e.student.masteryLevel)
          .reduce((a, b) => a + b, 0) / group.enrollments.length
      )
    : 0

  const avgAttendance = group.enrollments.length > 0
    ? Math.round(
        group.enrollments
          .map(e => {
            const total = e.student.attendances.length
            const present = e.student.attendances.filter(a => a.isPresent).length
            return total > 0 ? (present / total) * 100 : 0
          })
          .reduce((a, b) => a + b, 0) / group.enrollments.length
      )
    : 0

  return (
    <DashboardLayout role="TEACHER">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/teacher/groups"
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{group.name}</h1>
              {group.description && (
                <p className="text-gray-400">{group.description}</p>
              )}
            </div>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              group.isActive
                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
            }`}
          >
            {group.isActive ? 'Faol' : 'Nofaol'}
          </span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-6 w-6 text-blue-400" />
              <span className="text-2xl font-bold text-white">
                {activeStudents} / {group.maxStudents}
              </span>
            </div>
            <p className="text-gray-300 text-sm">O'quvchilar</p>
            <div className="mt-3 w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${(activeStudents / group.maxStudents) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/30">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-6 w-6 text-green-400" />
              <span className="text-2xl font-bold text-white">{avgMastery}%</span>
            </div>
            <p className="text-gray-300 text-sm">O'rtacha o'zlashtirish</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/30">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-6 w-6 text-yellow-400" />
              <span className="text-2xl font-bold text-white">{avgAttendance}%</span>
            </div>
            <p className="text-gray-300 text-sm">O'rtacha davomat</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="h-6 w-6 text-purple-400" />
              <span className="text-2xl font-bold text-white">
                {group.enrollments.reduce((sum, e) => sum + e.student.assignments.length, 0)}
              </span>
            </div>
            <p className="text-gray-300 text-sm">Jami topshiriqlar</p>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Users className="h-6 w-6 text-green-400" />
            O'quvchilar ro'yxati
          </h2>

          {group.enrollments.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Guruhda o'quvchilar yo'q</p>
            </div>
          ) : (
            <div className="space-y-4">
              {group.enrollments.map((enrollment) => {
                const student = enrollment.student
                const totalAttendances = student.attendances.length
                const presentAttendances = student.attendances.filter(a => a.isPresent).length
                const attendanceRate = totalAttendances > 0
                  ? Math.round((presentAttendances / totalAttendances) * 100)
                  : 0
                const completedAssignments = student.assignments.filter(a => a.isCompleted).length
                const totalAssignments = student.assignments.length
                const avgGrade = student.grades.length > 0
                  ? Math.round(
                      student.grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) /
                      student.grades.length
                    )
                  : 0

                return (
                  <div
                    key={enrollment.id}
                    className="bg-slate-700/50 rounded-lg p-6 border border-gray-600/50 hover:border-green-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-green-500/20 p-2 rounded-lg">
                            <User className="h-5 w-5 text-green-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">{student.user.name}</h3>
                            <p className="text-sm text-gray-400">ID: {student.studentId}</p>
                            {student.user.phone && (
                              <p className="text-sm text-gray-500">Tel: {student.user.phone}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Award className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm font-semibold text-white">
                            Level {student.level}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {student.masteryLevel}% o'zlashtirish
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>Davomat</span>
                          </div>
                          <span className="text-white font-semibold">{attendanceRate}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${attendanceRate}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {presentAttendances} / {totalAttendances} dars
                        </div>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <BookOpen className="h-4 w-4" />
                            <span>Topshiriqlar</span>
                          </div>
                          <span className="text-white font-semibold">
                            {completedAssignments} / {totalAssignments}
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ 
                              width: `${totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0}%` 
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {student.assignments.filter(a => !a.isCompleted).length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-yellow-400">
                              <Clock className="h-3 w-3" />
                              <span>{student.assignments.filter(a => !a.isCompleted).length} kutilmoqda</span>
                            </div>
                          )}
                          {completedAssignments > 0 && (
                            <div className="flex items-center gap-1 text-xs text-green-400">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{completedAssignments} bajarildi</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Award className="h-4 w-4" />
                            <span>O'rtacha baho</span>
                          </div>
                          <span className="text-white font-semibold">{avgGrade}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${avgGrade}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {student.grades.length} baho
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
