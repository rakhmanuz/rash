'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Users, Calendar, CheckCircle2, XCircle, Loader2, Clock, Plus, Minus, X } from 'lucide-react'

interface ClassSchedule {
  id: string
  groupId: string
  date: string
  times: string | string[]
  notes?: string
  group: {
    id: string
    name: string
    description: string | null
  }
}

interface Student {
  id: string
  studentId: string
  user: {
    name: string
    username: string
  }
}

interface AttendanceRecord {
  studentId: string
  isPresent: boolean
  arrivalTime?: string
}

// Helper function to get local date string (YYYY-MM-DD)
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function TeacherAttendancePage() {
  const { data: session } = useSession()
  const [todaySchedules, setTodaySchedules] = useState<ClassSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSchedule, setSelectedSchedule] = useState<ClassSchedule | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<{ [key: string]: boolean }>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [presentCount, setPresentCount] = useState(0)

  // Fetch today's schedules
  useEffect(() => {
    const fetchTodaySchedules = async () => {
      try {
        setLoading(true)
        const today = getLocalDateString(new Date())
        const res = await fetch(`/api/teacher/schedules?startDate=${today}&endDate=${today}`)
        if (res.ok) {
          const schedules = await res.json()
          // Parse times from JSON string if needed
          const parsedSchedules = schedules.map((schedule: any) => ({
            ...schedule,
            times: typeof schedule.times === 'string' ? JSON.parse(schedule.times) : schedule.times,
          }))
          setTodaySchedules(parsedSchedules)
        } else {
          setTodaySchedules([])
        }
      } catch (err) {
        console.error('Error fetching today schedules:', err)
        setTodaySchedules([])
      } finally {
        setLoading(false)
      }
    }

    fetchTodaySchedules()
  }, [])

  // Fetch students when schedule is selected
  useEffect(() => {
    if (!selectedSchedule) {
      setStudents([])
      setAttendance({})
      setPresentCount(0)
      return
    }

    const fetchStudents = async () => {
      try {
        setLoading(true)
        const studentsRes = await fetch(`/api/teacher/groups/${selectedSchedule.groupId}`)
        if (!studentsRes.ok) throw new Error('O\'quvchilarni yuklashda xatolik')
        const groupData = await studentsRes.json()
        const studentsInGroup: Student[] = groupData.enrollments.map((e: any) => ({
          id: e.student.id,
          studentId: e.student.studentId,
          user: e.student.user,
        }))
        setStudents(studentsInGroup)

        // Fetch existing attendance for this specific class schedule
        const today = getLocalDateString(new Date())
        const attendanceRes = await fetch(`/api/teacher/attendance?groupId=${selectedSchedule.groupId}&date=${today}&classScheduleId=${selectedSchedule.id}`)
        if (attendanceRes.ok) {
          const attendanceData = await attendanceRes.json()
          const initialAttendance: { [key: string]: boolean } = {}
          let present = 0
          studentsInGroup.forEach(student => {
            const record = attendanceData.find((att: any) => att.studentId === student.id)
            initialAttendance[student.id] = record ? record.isPresent : false
            if (initialAttendance[student.id]) present++
          })
          setAttendance(initialAttendance)
          setPresentCount(present)
        } else {
          const initialAttendance: { [key: string]: boolean } = {}
          studentsInGroup.forEach(student => {
            initialAttendance[student.id] = false
          })
          setAttendance(initialAttendance)
          setPresentCount(0)
        }
      } catch (err: any) {
        setError(err.message)
        console.error(err)
        setStudents([])
        setAttendance({})
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [selectedSchedule])

  const handleOpenModal = (schedule: ClassSchedule) => {
    setSelectedSchedule(schedule)
    setShowModal(true)
    setError(null)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedSchedule(null)
    setStudents([])
    setAttendance({})
    setPresentCount(0)
  }

  const handleIncrement = () => {
    if (presentCount < students.length) {
      setPresentCount(prev => prev + 1)
    }
  }

  const handleDecrement = () => {
    if (presentCount > 0) {
      setPresentCount(prev => prev - 1)
    }
  }

  const handleToggleStudent = (studentId: string) => {
    setAttendance(prev => {
      const newAttendance = { ...prev }
      const isCurrentlyPresent = newAttendance[studentId] || false
      newAttendance[studentId] = !isCurrentlyPresent
      
      // Update present count
      const newPresentCount = Object.values(newAttendance).filter(Boolean).length
      setPresentCount(newPresentCount)
      
      return newAttendance
    })
  }

  const handleSaveAttendance = async () => {
    if (!selectedSchedule) {
      setError('Dars tanlanishi shart!')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const today = getLocalDateString(new Date())
      
      // Use attendance state to determine which students are present
      const attendanceRecords: AttendanceRecord[] = students.map((student) => {
        const isPresent = attendance[student.id] || false
        return {
          studentId: student.id,
          isPresent: isPresent,
          ...(isPresent ? { arrivalTime: new Date().toISOString() } : {}),
        }
      })

      const res = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedSchedule.groupId,
          date: today,
          classScheduleId: selectedSchedule.id,
          attendance: attendanceRecords,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Davomatni saqlashda xatolik')
      }

      alert('Davomat muvaffaqiyatli saqlandi!')
      handleCloseModal()
    } catch (err: any) {
      setError(err.message)
      alert(`Xatolik: ${err.message}`)
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (time: string) => {
    return time
  }

  const getScheduleTimes = (schedule: ClassSchedule) => {
    if (Array.isArray(schedule.times)) {
      return schedule.times.join(', ')
    }
    return schedule.times || ''
  }

  return (
    <DashboardLayout role="TEACHER">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Davomat</h1>
            <p className="text-gray-400">Bugungi darslar uchun davomat olish</p>
          </div>
        </div>

        {/* Today's Schedules */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : todaySchedules.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 text-center border border-gray-700">
            <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Bugun darslar yo'q</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaySchedules.map((schedule) => (
              <button
                key={schedule.id}
                onClick={() => handleOpenModal(schedule)}
                className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg hover:border-green-500/50 transition-all text-left group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors mb-2">
                      {schedule.group.name}
                    </h3>
                    {schedule.group.description && (
                      <p className="text-sm text-gray-400 mb-3">{schedule.group.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Clock className="h-4 w-4 text-green-400" />
                      <span className="font-semibold">{getScheduleTimes(schedule)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Attendance Modal */}
        {showModal && selectedSchedule && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-slate-800 border-b border-gray-700 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedSchedule.group.name}</h2>
                  <p className="text-gray-400 flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4" />
                    <span>{getScheduleTimes(selectedSchedule)}</span>
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center space-x-2">
                    <XCircle className="h-5 w-5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Attendance Counter */}
                <div className="bg-slate-700 rounded-lg p-6 border border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Davomat</h3>
                      <p className="text-sm text-gray-400">Jami o'quvchilar: {students.length}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleDecrement}
                        disabled={presentCount === 0 || saving}
                        className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="h-6 w-6" />
                      </button>
                      <div className="text-center min-w-[80px]">
                        <div className="text-3xl font-bold text-green-400">{presentCount}</div>
                        <div className="text-sm text-gray-400">Bor</div>
                      </div>
                      <button
                        onClick={handleIncrement}
                        disabled={presentCount >= students.length || saving}
                        className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30">
                      <XCircle className="h-4 w-4" />
                      <span>Yo'q: {students.length - presentCount}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                      <Users className="h-4 w-4" />
                      <span>Jami: {students.length}</span>
                    </div>
                  </div>
                </div>

                {/* Students List */}
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400">O'quvchilar topilmadi</p>
                  </div>
                ) : (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">O'quvchilar ro'yxati:</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {students.map((student) => {
                          const isPresent = attendance[student.id] || false
                          return (
                            <div
                              key={student.id}
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                                isPresent
                                  ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'
                                  : 'bg-slate-700/50 border-gray-600 hover:bg-slate-700'
                              }`}
                              onClick={() => handleToggleStudent(student.id)}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {isPresent ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-400" />
                                )}
                                <div>
                                  <p className="text-white font-medium">{student.user.name}</p>
                                  <p className="text-xs text-gray-400">ID: {student.studentId}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (isPresent) {
                                      handleToggleStudent(student.id)
                                    }
                                  }}
                                  disabled={!isPresent || saving}
                                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Yo'q qilish"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!isPresent) {
                                      handleToggleStudent(student.id)
                                    }
                                  }}
                                  disabled={isPresent || saving}
                                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Bor qilish"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                )}

                {/* Save Button */}
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={handleSaveAttendance}
                    disabled={saving || students.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving && <Loader2 className="h-5 w-5 animate-spin" />}
                    {saving ? 'Saqlanmoqda...' : 'Davomatni Saqlash'}
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
