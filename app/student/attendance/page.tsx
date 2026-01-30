'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Calendar, X, CheckCircle2 } from 'lucide-react'

interface AttendanceRecord {
  id: string
  date: string
  isPresent: boolean
  arrivalTime?: string
  notes?: string
  group: {
    id: string
    name: string
  }
}

interface MissingClass {
  date: string
  dayOfWeek: string
  groupName: string
}

export default function StudentAttendancePage() {
  const { data: session } = useSession()
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([])
  const [missingClasses, setMissingClasses] = useState<MissingClass[]>([])
  const [loading, setLoading] = useState(true)
  const [enrollmentDate, setEnrollmentDate] = useState<string>('')

  useEffect(() => {
    fetchAttendanceData()
  }, [])

  const fetchAttendanceData = async () => {
    try {
      const response = await fetch('/api/student/attendance')
      if (response.ok) {
        const data = await response.json()
        setAttendances(data.attendances || [])
        setMissingClasses(data.missingClasses || [])
        setEnrollmentDate(data.enrollmentDate || '')
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return formatDateShort(date)
      day: 'numeric',
      weekday: 'long'
    })
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return '-'
    const date = new Date(timeString)
    return date.toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <DashboardLayout role="STUDENT">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Yuklanmoqda...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Davomat</h1>
          <p className="text-gray-400">Barcha darslar va kelmagan darslar ro'yxati</p>
        </div>

        {/* Kelmagan darslar */}
        {missingClasses.length > 0 && (
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <X className="h-6 w-6 text-red-400" />
              <h2 className="text-2xl font-bold text-white">
                Kelmagan darslar ({missingClasses.length})
              </h2>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {missingClasses.map((missing, index) => (
                <div
                  key={index}
                  className="bg-slate-800/50 rounded-lg p-4 border border-red-500/20 hover:border-red-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-red-400 font-bold text-lg">
                        {index + 1}.
                      </span>
                      <div>
                        <p className="text-white font-semibold">
                          {formatDate(missing.date)}
                        </p>
                        <p className="text-sm text-gray-400">
                          {missing.groupName}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {missing.dayOfWeek}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Barcha davomat */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="h-6 w-6 text-green-400" />
            <h2 className="text-2xl font-bold text-white">
              Barcha darslar
            </h2>
          </div>
          {attendances.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Davomat ma'lumotlari topilmadi</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {attendances.map((attendance) => (
                <div
                  key={attendance.id}
                  className={`bg-slate-800/50 rounded-lg p-4 border transition-colors ${
                    attendance.isPresent
                      ? 'border-green-500/20 hover:border-green-500/40'
                      : 'border-red-500/20 hover:border-red-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {attendance.isPresent ? (
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                      ) : (
                        <X className="h-5 w-5 text-red-400" />
                      )}
                      <div>
                        <p className="text-white font-semibold">
                          {formatDate(attendance.date)}
                        </p>
                        <p className="text-sm text-gray-400">
                          {attendance.group.name}
                        </p>
                        {attendance.arrivalTime && (
                          <p className="text-xs text-gray-500 mt-1">
                            Kelgan vaqt: {formatTime(attendance.arrivalTime)}
                          </p>
                        )}
                        {attendance.notes && (
                          <p className="text-xs text-gray-500 mt-1">
                            {attendance.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        attendance.isPresent
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {attendance.isPresent ? 'Keldi' : 'Kelmadi'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
