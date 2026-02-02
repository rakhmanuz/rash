'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { Users, Calendar, CheckCircle2, XCircle, Loader2, Search } from 'lucide-react'

interface Group {
  id: string
  name: string
  description: string | null
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
  arrivalTime?: string // O'quvchi kelgan vaqt (ISO string)
}


interface GroupWithSchedule extends Group {
  scheduleId?: string
}

// Helper function to get local date string (YYYY-MM-DD)
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper function to format date from API response
const formatDateFromAPI = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  // API returns dates in UTC, convert to local date string
  // Use UTC methods to get the date components to avoid timezone issues
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function TeacherAttendancePage() {
  const { data: session } = useSession()
  const [availableGroups, setAvailableGroups] = useState<GroupWithSchedule[]>([]) // O'sha sana uchun dars bo'lgan guruhlar
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date()
    return getLocalDateString(today)
  })
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<{ [key: string]: boolean }>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [availableDates, setAvailableDates] = useState<string[]>([]) // Barcha dars rejasidagi sanalar
  const [loadingGroups, setLoadingGroups] = useState(false)

  // Fetch all available dates from all teacher's groups
  const fetchAvailableDates = useCallback(async () => {
    try {
      // Get all teacher's groups first
      const groupsRes = await fetch('/api/teacher/groups')
      if (!groupsRes.ok) return
      const groups = await groupsRes.json()
      
      if (groups.length === 0) {
        setAvailableDates([])
        return
      }

      // Get class schedules for all groups (next 30 days)
      const today = new Date()
      const endDate = new Date(today)
      endDate.setDate(endDate.getDate() + 30)
      
      const startDateStr = getLocalDateString(today)
      const endDateStr = getLocalDateString(endDate)
      
      // Fetch schedules for all groups
      const allSchedules: any[] = []
      for (const group of groups) {
        const res = await fetch(`/api/admin/schedules?groupId=${group.id}&startDate=${startDateStr}&endDate=${endDateStr}`)
        if (res.ok) {
          const schedules = await res.json()
          allSchedules.push(...schedules)
        }
      }
      
      // Extract unique dates from all schedules
      // Handle timezone properly - API returns dates, convert to local date string
      const dates: string[] = allSchedules.map((schedule: any) => {
        return formatDateFromAPI(schedule.date)
      })
      
      console.log('All schedules:', allSchedules.length)
      console.log('Extracted dates:', dates)
      // Remove duplicates and sort
      const uniqueDates: string[] = Array.from(new Set(dates)).sort() as string[]
      setAvailableDates(uniqueDates)
      
      // If selected date is not in available dates, set to first available date or today
      if (uniqueDates.length > 0 && !uniqueDates.includes(selectedDate)) {
        const todayStr = getLocalDateString(today)
        if (uniqueDates.includes(todayStr)) {
          setSelectedDate(todayStr)
        } else {
          setSelectedDate(uniqueDates[0])
        }
      }
    } catch (err) {
      console.error('Error fetching available dates:', err)
    }
  }, [selectedDate])

  // Fetch groups that have class on selected date
  const fetchGroupsForDate = useCallback(async () => {
    if (!selectedDate) {
      setAvailableGroups([])
      setSelectedGroup(null)
      return
    }

    setLoadingGroups(true)
    setError(null)
    try {
      // Get all teacher's groups
      const groupsRes = await fetch('/api/teacher/groups')
      if (!groupsRes.ok) throw new Error('Guruhlarni yuklashda xatolik')
      const allGroups = await groupsRes.json()
      
      if (allGroups.length === 0) {
        setAvailableGroups([])
        setSelectedGroup(null)
        setLoadingGroups(false)
        return
      }
      
      // Get class schedules for selected date
      // Use selectedDate directly (YYYY-MM-DD format)
      const startDateStr = selectedDate
      const endDateStr = selectedDate
      
      // Fetch schedules for all groups on this date in parallel
      const schedulePromises = allGroups.map(async (group: Group) => {
        try {
          const url = `/api/admin/schedules?groupId=${group.id}&startDate=${startDateStr}&endDate=${endDateStr}`
          console.log(`Fetching schedules for group ${group.name} (${group.id}): ${url}`)
          const res = await fetch(url)
          if (res.ok) {
            const schedules = await res.json()
            console.log(`Group ${group.name}: Found ${schedules.length} schedules`)
            if (schedules.length > 0) {
              console.log(`Group ${group.name} schedules:`, schedules.map((s: any) => ({
                id: s.id,
                date: s.date,
                formattedDate: formatDateFromAPI(s.date)
              })))
            }
            return { group, schedules }
          } else {
            const errorText = await res.text()
            console.error(`Error response for group ${group.name}:`, errorText)
            return { group, schedules: [] }
          }
        } catch (err) {
          console.error(`Error fetching schedule for group ${group.id}:`, err)
          return { group, schedules: [] }
        }
      })
      
      const scheduleResults = await Promise.all(schedulePromises)
      
      // Filter groups that have class on this date
      const groupsWithSchedule: GroupWithSchedule[] = scheduleResults
        .filter(result => result.schedules && result.schedules.length > 0)
        .map(result => ({
          ...result.group,
          scheduleId: result.schedules[0].id
        }))
      
      console.log(`Selected date: ${selectedDate}`)
      console.log(`All groups: ${allGroups.length}`)
      console.log(`Groups with schedule: ${groupsWithSchedule.length}`)
      console.log('Groups with schedule:', groupsWithSchedule.map(g => g.name))
      
      setAvailableGroups(groupsWithSchedule)
      
      // Auto-select first group if available
      if (groupsWithSchedule.length > 0 && !selectedGroup) {
        setSelectedGroup(groupsWithSchedule[0].id)
      } else if (groupsWithSchedule.length > 0 && selectedGroup) {
        // Check if selected group is still available
        const isStillAvailable = groupsWithSchedule.some(g => g.id === selectedGroup)
        if (!isStillAvailable) {
          setSelectedGroup(groupsWithSchedule[0].id)
        }
      } else {
        setSelectedGroup(null)
        if (allGroups.length > 0) {
          setError(`Tanlangan sana (${new Date(selectedDate).toLocaleDateString('uz-UZ')}) uchun dars bo'lgan guruhlar topilmadi.`)
        }
      }
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching groups for date:', err)
      setAvailableGroups([])
      setSelectedGroup(null)
    } finally {
      setLoadingGroups(false)
    }
  }, [selectedDate, selectedGroup])

  const fetchStudentsAndAttendance = useCallback(async () => {
    if (!selectedGroup || !selectedDate) {
      setStudents([])
      setAttendance({})
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Fetch students in the selected group
      const studentsRes = await fetch(`/api/teacher/groups/${selectedGroup}`)
      if (!studentsRes.ok) throw new Error('O\'quvchilarni yuklashda xatolik')
      const groupData = await studentsRes.json()
      const studentsInGroup: Student[] = groupData.enrollments.map((e: any) => ({
        id: e.student.id,
        studentId: e.student.studentId,
        user: e.student.user,
      }))
      setStudents(studentsInGroup)

      // Fetch existing attendance for the selected group and date
      const attendanceRes = await fetch(`/api/teacher/attendance?groupId=${selectedGroup}&date=${selectedDate}`)
      if (!attendanceRes.ok) {
        const errorData = await attendanceRes.json()
        throw new Error(errorData.error || 'Davomat ma\'lumotlarini yuklashda xatolik')
      }
      const attendanceData = await attendanceRes.json()

      const initialAttendance: { [key: string]: boolean } = {}
      studentsInGroup.forEach(student => {
        const record = attendanceData.find((att: any) => att.studentId === student.id)
        initialAttendance[student.id] = record ? record.isPresent : false
      })
      setAttendance(initialAttendance)


    } catch (err: any) {
      setError(err.message)
      console.error(err)
      setStudents([])
      setAttendance({})
    } finally {
      setLoading(false)
    }
  }, [selectedGroup, selectedDate])

  useEffect(() => {
    fetchAvailableDates()
  }, [fetchAvailableDates])

  useEffect(() => {
    fetchGroupsForDate()
  }, [fetchGroupsForDate])

  useEffect(() => {
    fetchStudentsAndAttendance()
  }, [fetchStudentsAndAttendance])

  const handleToggleAttendance = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId],
    }))
  }

  const handleSaveAttendance = async () => {
    if (!selectedGroup || !selectedDate) {
      setError('Guruh va sana tanlanishi shart!')
      return
    }

    setSaving(true)
    setError(null)
    try {
      // O'quvchi kelganida (isPresent = true) hozirgi vaqtni yuborish
      const attendanceRecords: AttendanceRecord[] = students.map(
        (student) => {
          const isPresent = attendance[student.id] || false
          return {
            studentId: student.id,
            isPresent: isPresent,
            // Agar o'quvchi kelgan bo'lsa, hozirgi vaqtni yuborish (backend avtomatik yozadi)
            ...(isPresent ? { arrivalTime: new Date().toISOString() } : {}),
          }
        }
      )

      const res = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroup,
          date: selectedDate,
          attendance: attendanceRecords,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Davomatni saqlashda xatolik')
      }

      alert('Davomat muvaffaqiyatli saqlandi!')
    } catch (err: any) {
      setError(err.message)
      alert(`Xatolik: ${err.message}`)
      console.error(err)
    } finally {
      setSaving(false)
    }
  }


  const filteredStudents = students.filter(student =>
    student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const presentCount = Object.values(attendance).filter(Boolean).length
  const absentCount = Object.values(attendance).filter(val => !val).length
  const totalCount = students.length


  return (
    <DashboardLayout role="TEACHER">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Davomat</h1>
            <p className="text-gray-400">Davomat olish</p>
          </div>
        </div>

        {/* Filters and Summary */}
        <div className="bg-slate-800 rounded-xl p-4 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">Sana (faqat dars rejasidagi sanalar)</label>
              {availableDates.length > 0 ? (
                <select
                  id="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={loading || saving || loadingGroups}
                >
                  {availableDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('uz-UZ', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={loading || saving || loadingGroups}
                  placeholder="Dars rejasi topilmadi"
                />
              )}
              {availableDates.length === 0 && (
                <p className="text-xs text-yellow-400 mt-1">Dars rejasi topilmadi</p>
              )}
            </div>
            <div>
              <label htmlFor="group" className="block text-sm font-medium text-gray-300 mb-2">
                Guruh {selectedDate && `(${new Date(selectedDate).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })} uchun)`}
              </label>
              {loadingGroups ? (
                <div className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <select
                  id="group"
                  value={selectedGroup || ''}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={loading || saving || !selectedDate || availableGroups.length === 0}
                >
                  {availableGroups.length === 0 ? (
                    <option value="">O&apos;sha kunda dars bo&apos;lgan guruhlar yo&apos;q</option>
                  ) : (
                    availableGroups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))
                  )}
                </select>
              )}
              {selectedDate && availableGroups.length === 0 && !loadingGroups && (
                <p className="text-xs text-yellow-400 mt-1">Tanlangan sana uchun dars bo&apos;lgan guruhlar topilmadi</p>
              )}
            </div>
            <div className="relative">
              <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-2">Qidirish</label>
              <Search className="absolute left-3 top-[50px] transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="search"
                placeholder="O&apos;quvchi ismi yoki ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={loading || saving}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center space-x-2 mb-4">
              <XCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg font-semibold border border-green-500/30">
              <CheckCircle2 className="h-5 w-5" />
              <span>Bor: {presentCount}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-semibold border border-red-500/30">
              <XCircle className="h-5 w-5" />
              <span>Yo&apos;q: {absentCount}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg font-semibold border border-blue-500/30">
              <Users className="h-5 w-5" />
              <span>Jami: {totalCount}</span>
            </div>
          </div>
        </div>

        {/* Student List for Attendance and Grading */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 text-center border border-gray-700">
            <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Bu guruhda o&apos;quvchilar topilmadi.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStudents.map(student => {
              return (
                <div
                  key={student.id}
                  className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg"
                >
                  {/* Student Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Attendance Checkbox */}
                      <button
                        onClick={() => handleToggleAttendance(student.id)}
                        className={`flex items-center justify-center w-12 h-12 rounded-lg font-semibold transition-all ${
                          attendance[student.id]
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                        disabled={saving}
                      >
                        {attendance[student.id] ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <XCircle className="h-6 w-6" />
                        )}
                      </button>

                      {/* Student Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">{student.user.name}</h3>
                        <p className="text-sm text-gray-400">ID: {student.studentId}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Save Attendance Button */}
        <button
          onClick={handleSaveAttendance}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={saving || !selectedGroup || !selectedDate || students.length === 0}
        >
          {saving && <Loader2 className="h-5 w-5 animate-spin" />}
          {saving ? 'Saqlanmoqda...' : 'Davomatni Saqlash'}
        </button>
      </div>
    </DashboardLayout>
  )
}
