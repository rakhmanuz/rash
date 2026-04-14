'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Users, Calendar, CheckCircle2, XCircle, Loader2, Clock, X } from 'lucide-react'
import { formatGroupLabel } from '@/lib/student-groups-label'

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
    subject?: { id: string; name: string } | null
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
  lateMinutes?: number
  arrivalTime?: string
}

const LESSON_DURATION_MINUTES = 180

// Helper function to get local date string (YYYY-MM-DD)
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function TeacherAttendancePage() {
  const { data: session } = useSession()
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString(new Date()))
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSchedule, setSelectedSchedule] = useState<ClassSchedule | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<{ [key: string]: { isPresent: boolean; lateMinutes: number } }>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Fetch schedules for selected date
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/teacher/schedules?startDate=${selectedDate}&endDate=${selectedDate}`)
        if (res.ok) {
          const data = await res.json()
          const parsedSchedules = data.map((schedule: any) => ({
            ...schedule,
            times: typeof schedule.times === 'string' ? JSON.parse(schedule.times) : schedule.times,
          }))
          setSchedules(parsedSchedules)
        } else {
          setSchedules([])
        }
      } catch (err) {
        console.error('Error fetching schedules:', err)
        setSchedules([])
      } finally {
        setLoading(false)
      }
    }

    fetchSchedules()
  }, [selectedDate])

  // Fetch students when schedule is selected
  useEffect(() => {
    if (!selectedSchedule) {
      setStudents([])
      setAttendance({})
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
        const attendanceRes = await fetch(`/api/teacher/attendance?groupId=${selectedSchedule.groupId}&date=${selectedDate}&classScheduleId=${selectedSchedule.id}`)
        if (attendanceRes.ok) {
          const attendanceData = await attendanceRes.json()
          const initialAttendance: { [key: string]: { isPresent: boolean; lateMinutes: number } } = {}
          studentsInGroup.forEach(student => {
            const record = attendanceData.find((att: any) => att.studentId === student.id)
            const isPresent = record ? record.isPresent : false
            const lateMinutes = record?.lateMinutes ?? 0
            initialAttendance[student.id] = { isPresent, lateMinutes }
          })
          setAttendance(initialAttendance)
        } else {
          const initialAttendance: { [key: string]: { isPresent: boolean; lateMinutes: number } } = {}
          studentsInGroup.forEach(student => {
            initialAttendance[student.id] = { isPresent: false, lateMinutes: 0 }
          })
          setAttendance(initialAttendance)
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
  }, [selectedSchedule, selectedDate])

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
  }

  const handleToggleStudent = (studentId: string) => {
    setAttendance(prev => {
      const newAttendance = { ...prev }
      const current = newAttendance[studentId] ?? { isPresent: false, lateMinutes: 0 }
      const isPresent = !current.isPresent
      newAttendance[studentId] = { isPresent, lateMinutes: isPresent ? current.lateMinutes : 0 }
      return newAttendance
    })
  }

  const handleLateMinutesChange = (studentId: string, value: number) => {
    const clamped = Math.max(0, Math.min(LESSON_DURATION_MINUTES, value))
    setAttendance(prev => {
      const current = prev[studentId] ?? { isPresent: false, lateMinutes: 0 }
      return { ...prev, [studentId]: { ...current, lateMinutes: clamped } }
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
      const attendanceRecords: AttendanceRecord[] = students.map((student) => {
        const entry = attendance[student.id] ?? { isPresent: false, lateMinutes: 0 }
        return {
          studentId: student.id,
          isPresent: entry.isPresent,
          lateMinutes: entry.isPresent ? entry.lateMinutes : 0,
          ...(entry.isPresent ? { arrivalTime: new Date().toISOString() } : {}),
        }
      })

      const res = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedSchedule.groupId,
          date: selectedDate,
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Davomat</h1>
            <p className="text-gray-400">Tanlangan sanadagi darslar uchun davomat olish</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="attendance-date" className="text-sm font-medium text-gray-400 whitespace-nowrap">
              Sana:
            </label>
            <input
              id="attendance-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2.5 rounded-lg bg-slate-700/80 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Schedules for selected date */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 text-center border border-gray-700">
            <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {selectedDate === getLocalDateString(new Date()) ? "Bugun darslar yo'q" : "Ushbu sanada darslar yo'q"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.map((schedule) => (
              <button
                key={schedule.id}
                onClick={() => handleOpenModal(schedule)}
                className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg hover:border-green-500/50 transition-all text-left group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors mb-2">
                      {formatGroupLabel(schedule.group)}
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
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2 flex-wrap">
                    {formatGroupLabel(selectedSchedule.group)}
                    {!loading && students.length > 0 && (
                      <span className="text-green-400 font-semibold text-lg">
                        {Object.values(attendance).filter(v => v.isPresent).length}/{students.length}
                      </span>
                    )}
                  </h2>
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
                      {(() => {
                        const absentStudents = students.filter(s => !(attendance[s.id]?.isPresent))
                        return absentStudents.length > 0 ? (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-red-400 mb-1">Yo'q:</p>
                            <div className="flex flex-wrap gap-x-6 gap-y-1">
                              {Array.from({ length: Math.ceil(absentStudents.length / 10) }, (_, i) =>
                                absentStudents.slice(i * 10, i * 10 + 10)
                              ).map((chunk, colIndex) => (
                                <ol
                                  key={colIndex}
                                  start={colIndex * 10 + 1}
                                  className="list-decimal list-inside text-xs text-red-400/90 space-y-0.5"
                                >
                                  {chunk.map(s => (
                                    <li key={s.id}>{s.user.name}</li>
                                  ))}
                                </ol>
                              ))}
                            </div>
                          </div>
                        ) : null
                      })()}
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">O'quvchilar ro'yxati:</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {students.map((student) => {
                          const entry = attendance[student.id] ?? { isPresent: false, lateMinutes: 0 }
                          const isPresent = entry.isPresent
                          const pct = isPresent
                            ? Math.round(((LESSON_DURATION_MINUTES - entry.lateMinutes) / LESSON_DURATION_MINUTES) * 100)
                            : 0
                          return (
                            <div
                              key={student.id}
                              className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                isPresent
                                  ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'
                                  : 'bg-slate-700/50 border-gray-600 hover:bg-slate-700'
                              }`}
                              onClick={() => handleToggleStudent(student.id)}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0 order-1">
                                <label className="flex items-center justify-center shrink-0 cursor-pointer w-8 h-8 rounded border-2 border-gray-500 bg-slate-700/50 hover:border-green-400 transition-colors has-[:checked]:border-green-500 has-[:checked]:bg-green-500/20">
                                  <input
                                    type="checkbox"
                                    checked={isPresent}
                                    onChange={() => handleToggleStudent(student.id)}
                                    onClick={e => e.stopPropagation()}
                                    disabled={saving}
                                    className="sr-only"
                                  />
                                  <span className={`flex items-center justify-center w-5 h-5 rounded border-2 pointer-events-none ${isPresent ? 'border-green-500 bg-green-500/30' : 'border-gray-500 bg-transparent'}`}>
                                    {isPresent && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                                  </span>
                                </label>
                                <div className="min-w-0 flex-1">
                                  <p className="text-white font-medium break-words">{student.user.name}</p>
                                  <p className="text-xs text-gray-400">ID: {student.studentId}</p>
                                </div>
                              </div>
                              <div
                                className="flex items-center gap-2 shrink-0 order-2 sm:order-3"
                                onClick={e => e.stopPropagation()}
                              >
                                {isPresent && (
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-xs text-gray-400 whitespace-nowrap">Kechikkan:</span>
                                    <input
                                      type="number"
                                      min={0}
                                      max={LESSON_DURATION_MINUTES}
                                      value={entry.lateMinutes}
                                      onChange={e => handleLateMinutesChange(student.id, parseInt(e.target.value, 10) || 0)}
                                      className="w-14 px-2 py-1 rounded bg-slate-700 border border-gray-600 text-white text-sm text-center"
                                    />
                                    <span className="text-xs text-gray-400">daq.</span>
                                    <span className="text-xs text-green-400 font-medium">{pct}%</span>
                                  </div>
                                )}
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
