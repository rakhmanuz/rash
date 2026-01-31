'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Calendar, Clock, Users, Plus, Edit2, Trash2, X, Save, BookOpen, ChevronLeft, ChevronRight, Download, Upload } from 'lucide-react'
import { format, parseISO, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, getDay } from 'date-fns'
import { uz } from 'date-fns/locale'
import { formatDateShort } from '@/lib/utils'

interface Group {
  id: string
  name: string
  teacher: {
    user: {
      name: string
    }
  }
}

interface ClassSchedule {
  id: string
  groupId: string
  date: string
  times: string
  notes?: string
  group: Group
}

// Dars qo'shish uchun mavjud vaqtlar
const AVAILABLE_TIMES = ['05:30', '06:00', '07:00', '08:00', '09:00', '10:00', '12:00', '13:00', '14:00', '14:30', '15:00', '16:00', '17:00', '18:00', '19:00']

// Hafta kunlari (Yakshanbadan boshlanadi, kalendardek)
const WEEK_DAYS = [
  { uz: 'Yakshanba', short: 'Yak', dayIndex: 0 },
  { uz: 'Dushanba', short: 'Du', dayIndex: 1 },
  { uz: 'Seshanba', short: 'Se', dayIndex: 2 },
  { uz: 'Chorshanba', short: 'Cho', dayIndex: 3 },
  { uz: 'Payshanba', short: 'Pay', dayIndex: 4 },
  { uz: 'Juma', short: 'Ju', dayIndex: 5 },
  { uz: 'Shanba', short: 'Sha', dayIndex: 6 },
]

// Dars vaqtlari - real vaqtda qo'shilgan darslarga qarab yaratiladi

export default function AdminSchedulesPage() {
  const { data: session, status } = useSession()
  const [groups, setGroups] = useState<Group[]>([])
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | null>(null)
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'weekly'>('weekly') // Yangi: view mode
  const [currentWeek, setCurrentWeek] = useState(new Date()) // Hafta tanlash
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchGroups()
      fetchSchedules()
    }
  }, [status])

  useEffect(() => {
    fetchSchedules()
  }, [filterGroup, currentWeek])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/admin/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    }
  }

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      let url = '/api/admin/schedules'
      const params = new URLSearchParams()
      if (filterGroup) params.append('groupId', filterGroup)
      
      // Hafta davomidagi dars rejalarini olish (Yakshanbadan boshlanadi)
      // currentWeek dan Yakshanbani topish
      const currentDay = getDay(currentWeek) // 0 = Yakshanba, 1 = Dushanba, ...
      const weekStart = addDays(currentWeek, -currentDay) // Yakshanbaga qaytish
      const weekEnd = addDays(weekStart, 6) // Shanbagacha
      
      // Sana formatini to'g'ri yaratish (YYYY-MM-DD)
      const startDateStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
      const endDateStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`
      
      params.append('startDate', startDateStr)
      params.append('endDate', endDateStr)

      if (params.toString()) url += '?' + params.toString()

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        // Barcha dars rejalarni to'liq qo'shish (hech narsa yo'qolmasligi uchun)
        const parsedData = data.map((schedule: ClassSchedule) => ({
          ...schedule,
          times: typeof schedule.times === 'string' ? JSON.parse(schedule.times) : schedule.times,
        }))
        // Barcha dars rejalarni to'liq yangilash
        setSchedules(parsedData)
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  // Hafta davomidagi dars rejalarini guruhlash va real vaqtlarni to'plash
  const getSchedulesForWeek = () => {
    // Hafta boshlanishi - Yakshanba
    const currentDay = getDay(currentWeek) // 0 = Yakshanba, 1 = Dushanba, ...
    const weekStart = addDays(currentWeek, -currentDay) // Yakshanbaga qaytish
    const weekEnd = addDays(weekStart, 6) // Shanba (hafta oxiri)
    const weekData: { [key: number]: { [key: string]: ClassSchedule[] } } = {}
    const allTimes = new Set<string>() // Barcha real vaqtlarni to'plash

    // Hafta kunlarini sanaga map qilish (Yakshanbadan boshlanadi)
    const weekDaysMap: { [key: string]: number } = {}
    for (let i = 0; i < 7; i++) {
      const dayDate = addDays(weekStart, i)
      // Sana formatini yaratish (YYYY-MM-DD) - local vaqtida
      const year = dayDate.getFullYear()
      const month = dayDate.getMonth() + 1
      const day = dayDate.getDate()
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      weekDaysMap[dateKey] = i // 0 = Yakshanba, 1 = Dushanba, ..., 6 = Shanba
    }

    // Barcha dars rejalarni qo'shish (hech narsa yo'qolmasligi uchun)
    schedules.forEach((schedule) => {
      // schedule.date string yoki Date bo'lishi mumkin
      let scheduleDate: Date
      if (typeof schedule.date === 'string') {
        scheduleDate = new Date(schedule.date)
      } else {
        scheduleDate = new Date(schedule.date)
      }
      
      // Sana formatini yaratish (YYYY-MM-DD) - local vaqtida
      const year = scheduleDate.getFullYear()
      const month = scheduleDate.getMonth() + 1
      const day = scheduleDate.getDate()
      const scheduleDateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      
      // Agar bu sana hafta ichida bo'lsa
      if (weekDaysMap[scheduleDateKey] !== undefined) {
        const dayKey = weekDaysMap[scheduleDateKey] // 0 = Yakshanba, 1 = Dushanba, ..., 6 = Shanba
        
        if (!weekData[dayKey]) {
          weekData[dayKey] = {}
        }

        const times = Array.isArray(schedule.times) ? schedule.times : JSON.parse(schedule.times)
        times.forEach((time: string) => {
          allTimes.add(time) // Real vaqtni qo'shish
          if (!weekData[dayKey][time]) {
            weekData[dayKey][time] = []
          }
          // Barcha darslarni qo'shish (duplicate'larni oldini olish)
          const exists = weekData[dayKey][time].some(s => s.id === schedule.id)
          if (!exists) {
            weekData[dayKey][time].push(schedule)
          }
        })
      }
    })

    // Vaqtlarni tartiblash (vaqt bo'yicha)
    const sortedTimes = Array.from(allTimes).sort((a, b) => {
      const [aHour, aMin] = a.split(':').map(Number)
      const [bHour, bMin] = b.split(':').map(Number)
      return aHour * 60 + aMin - (bHour * 60 + bMin)
    })

    return { weekData, sortedTimes }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/schedules/excel-template')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'dars_rejasi_shablon.xlsx'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Shablon yuklab olishda xatolik')
      }
    } catch (error) {
      console.error('Error downloading template:', error)
      alert('Shablon yuklab olishda xatolik')
    }
  }

  const handleImportSchedules = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) {
      alert('Excel fayl tanlang!')
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', importFile)

      const response = await fetch('/api/admin/schedules/import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setImportResult({
          success: result.success,
          failed: result.failed,
          errors: result.errors || [],
        })
        if (result.success > 0) {
          await fetchSchedules()
        }
        if (result.failed > 0) {
          alert(`Import yakunlandi: ${result.success} ta muvaffaqiyatli, ${result.failed} ta xatolik`)
        } else {
          alert(`Muvaffaqiyatli: ${result.success} ta dars rejasi qo'shildi`)
        }
        setShowImportModal(false)
        setImportFile(null)
      } else {
        alert(result.error || 'Import qilishda xatolik')
      }
    } catch (error) {
      console.error('Error importing schedules:', error)
      alert('Import qilishda xatolik')
    } finally {
      setImporting(false)
    }
  }

  const handleAddSchedule = async () => {
    if (!selectedGroup || !selectedDate || selectedTimes.length === 0) {
      alert('Iltimos, barcha maydonlarni to\'ldiring')
      return
    }

    try {
      const response = await fetch('/api/admin/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: selectedGroup,
          date: selectedDate,
          times: selectedTimes,
          notes: notes || null,
        }),
      })

      if (response.ok) {
        setShowAddModal(false)
        setSelectedGroup('')
        setSelectedDate('')
        setSelectedTimes([])
        setNotes('')
        // Dars rejalarni to'liq yangilash
        await fetchSchedules()
      } else {
        const error = await response.json()
        const errorMessage = error.details 
          ? `${error.error}: ${error.details}` 
          : error.error || 'Xatolik yuz berdi'
        alert(errorMessage)
        console.error('API Error:', error)
      }
    } catch (error) {
      console.error('Error adding schedule:', error)
      alert(`Xatolik yuz berdi: ${error instanceof Error ? error.message : 'Noma\'lum xatolik'}`)
    }
  }

  const handleEditSchedule = async () => {
    if (!editingSchedule || selectedTimes.length === 0) {
      alert('Iltimos, dars vaqtlarini tanlang')
      return
    }

    try {
      const response = await fetch(`/api/admin/schedules/${editingSchedule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate || editingSchedule.date,
          times: selectedTimes,
          notes: notes || null,
        }),
      })

      if (response.ok) {
        setShowEditModal(false)
        setEditingSchedule(null)
        setSelectedDate('')
        setSelectedTimes([])
        setNotes('')
        fetchSchedules()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error updating schedule:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Bu dars rejasini o\'chirishni xohlaysizmi?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/schedules/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchSchedules()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error deleting schedule:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const openEditModal = (schedule: ClassSchedule) => {
    setEditingSchedule(schedule)
    setSelectedGroup(schedule.groupId)
    setSelectedDate(schedule.date.split('T')[0])
    setSelectedTimes(Array.isArray(schedule.times) ? schedule.times : JSON.parse(schedule.times))
    setNotes(schedule.notes || '')
    setShowEditModal(true)
  }

  const toggleTime = (time: string) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time))
    } else {
      setSelectedTimes([...selectedTimes, time].sort())
    }
  }

  const { weekData, sortedTimes } = getSchedulesForWeek()
  // Hafta boshlanishi - Yakshanba
  const currentDay = getDay(currentWeek) // 0 = Yakshanba, 1 = Dushanba, ...
  const weekStart = addDays(currentWeek, -currentDay) // Yakshanbaga qaytish

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Yuklanmoqda...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dars Rejasi</h1>
            <p className="text-gray-400">Guruhlar uchun dars rejalarini boshqarish</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              title="Excel shablonini yuklab olish"
            >
              <Download className="h-5 w-5" />
              <span>Shablon</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
              title="Excel fayl yuklash"
            >
              <Upload className="h-5 w-5" />
              <span>Yuklash</span>
            </button>
            <button
              onClick={() => {
                setShowAddModal(true)
                setSelectedGroup('')
                setSelectedDate('')
                setSelectedTimes([])
                setNotes('')
              }}
              className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Yangi Dars Rejasi</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-xl p-4 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Guruh bo'yicha filtrlash
              </label>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Barcha guruhlar</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ko'rinish
              </label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'list' | 'weekly')}
                className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="weekly">Haftalik Jadval</option>
                <option value="list">Ro'yxat</option>
              </select>
            </div>
          </div>
        </div>

        {/* Haftalik Jadval */}
        {viewMode === 'weekly' && (
          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            {/* Hafta navigatsiyasi */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <div className="text-center">
                <h2 className="text-xl font-bold text-white">
                  {format(weekStart, 'dd MMMM yyyy', { locale: uz })} - {format(addDays(weekStart, 6), 'dd MMMM yyyy', { locale: uz })}
                </h2>
                {filterGroup && (
                  <p className="text-gray-400 mt-1">
                    {groups.find(g => g.id === filterGroup)?.name || 'Barcha guruhlar'}
                  </p>
                )}
              </div>
              <button
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Jadval */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-slate-700 p-3 text-left text-sm font-semibold text-white border border-gray-600 sticky left-0 z-10 min-w-[120px]">
                      Dars / Kun
                    </th>
                    {WEEK_DAYS.map((day) => {
                      // Yakshanba birinchi kun (i=0), qolganlari ketma-ket
                      const dayDate = addDays(weekStart, day.dayIndex)
                      return (
                        <th
                          key={day.dayIndex}
                          className="bg-slate-700 p-3 text-center text-sm font-semibold text-white border border-gray-600 min-w-[150px]"
                        >
                          <div>{day.uz}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {format(dayDate, 'dd/MM', { locale: uz })}
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {sortedTimes.length > 0 ? (
                    sortedTimes.map((time, index) => (
                      <tr key={time}>
                        <td className="bg-slate-700/50 p-3 text-center text-sm text-white border border-gray-600 sticky left-0 z-10">
                          <div className="font-semibold">{index + 1}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {time}
                          </div>
                        </td>
                        {WEEK_DAYS.map((day) => {
                          // Yakshanba uchun dayIndex 0, lekin hafta oxirida
                          const dayKey = day.dayIndex === 0 ? 0 : day.dayIndex
                          const daySchedules = weekData[dayKey] || {}
                          const schedulesForThisTime = daySchedules[time] || []

                          // Katak balandligini darslar soniga qarab hisoblash
                          const cellHeight = schedulesForThisTime.length > 0 
                            ? Math.max(80, schedulesForThisTime.length * 60) 
                            : 80
                          
                          return (
                            <td
                              key={day.dayIndex}
                              className="bg-slate-800/50 p-2 border border-gray-600 align-top"
                              style={{ minHeight: `${cellHeight}px` }}
                            >
                              {schedulesForThisTime.length > 0 ? (
                                <div className="space-y-1 h-full">
                                  {schedulesForThisTime.map((schedule, scheduleIndex) => {
                                    // Har bir dars uchun boshqa rang (guruh va vaqtga qarab)
                                    const colors = [
                                      { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400', hover: 'hover:bg-green-500/30' },
                                      { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400', hover: 'hover:bg-blue-500/30' },
                                      { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400', hover: 'hover:bg-purple-500/30' },
                                      { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', hover: 'hover:bg-yellow-500/30' },
                                      { bg: 'bg-pink-500/20', border: 'border-pink-500/50', text: 'text-pink-400', hover: 'hover:bg-pink-500/30' },
                                      { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400', hover: 'hover:bg-cyan-500/30' },
                                      { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400', hover: 'hover:bg-orange-500/30' },
                                      { bg: 'bg-indigo-500/20', border: 'border-indigo-500/50', text: 'text-indigo-400', hover: 'hover:bg-indigo-500/30' },
                                    ]
                                    // Har bir dars uchun unique rang (index bo'yicha)
                                    const color = colors[scheduleIndex % colors.length]
                                    
                                    return (
                                      <div
                                        key={schedule.id}
                                        className={`${color.bg} ${color.border} border rounded p-2 text-xs ${color.hover} transition-colors cursor-pointer group relative`}
                                        onClick={() => openEditModal(schedule)}
                                      >
                                        <div className={`font-semibold ${color.text} truncate`}>
                                          {schedule.group.name}
                                        </div>
                                        <div className="text-gray-300 text-[10px] mt-1 truncate">
                                          {schedule.group.teacher.user.name}
                                        </div>
                                        {schedule.times && Array.isArray(schedule.times) && schedule.times.length > 0 && (
                                          <div className="text-gray-400 text-[9px] mt-1">
                                            {schedule.times.join(', ')}
                                          </div>
                                        )}
                                        <div className="hidden group-hover:flex absolute top-0 right-0 p-1 space-x-1 bg-slate-900/90 rounded z-20">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              openEditModal(schedule)
                                            }}
                                            className="p-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded"
                                            title="Tahrirlash"
                                          >
                                            <Edit2 className="h-3 w-3" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleDeleteSchedule(schedule.id)
                                            }}
                                            className="p-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded"
                                            title="O'chirish"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : (
                                <div className="text-gray-600 text-center text-xs py-2">-</div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={WEEK_DAYS.length + 1} className="text-center py-8 text-gray-400">
                        Bu hafta uchun dars rejalari topilmadi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ro'yxat ko'rinishi */}
        {viewMode === 'list' && (
          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Dars Rejalari Ro'yxati</h2>
            {schedules.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Dars rejalari topilmadi</p>
            ) : (
              <div className="space-y-4">
                {schedules.map((schedule) => {
                  const times = Array.isArray(schedule.times) ? schedule.times : JSON.parse(schedule.times)
                  return (
                    <div
                      key={schedule.id}
                      className="bg-slate-700/50 rounded-lg p-4 border border-gray-600 hover:border-green-500/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Users className="h-5 w-5 text-green-400" />
                            <span className="text-white font-semibold">{schedule.group.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 mb-2 text-gray-300">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(parseISO(schedule.date), 'PPP', { locale: uz })}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {times.map((time: string) => (
                              <span
                                key={time}
                                className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm"
                              >
                                {time}
                              </span>
                            ))}
                          </div>
                          {schedule.notes && (
                            <p className="text-gray-400 text-sm mt-2">{schedule.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(schedule)}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                            title="Tahrirlash"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-xl p-6 border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Yangi Dars Rejasi</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Guruh *
                  </label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Guruhni tanlang</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name} - {group.teacher.user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sana *
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dars Vaqtlari * (bir nechta tanlash mumkin)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {AVAILABLE_TIMES.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => toggleTime(time)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          selectedTimes.includes(time)
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                  {selectedTimes.length > 0 && (
                    <p className="text-sm text-gray-400 mt-2">
                      Tanlangan: {selectedTimes.join(', ')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Izohlar (ixtiyoriy)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Qo'shimcha izohlar..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleAddSchedule}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Save className="h-5 w-5" />
                  <span>Saqlash</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingSchedule && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-xl p-6 border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Dars Rejasini Tahrirlash</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingSchedule(null)
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Guruh
                  </label>
                  <input
                    type="text"
                    value={editingSchedule.group.name}
                    disabled
                    className="w-full px-4 py-2 bg-slate-700/50 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sana *
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dars Vaqtlari * (bir nechta tanlash mumkin)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {AVAILABLE_TIMES.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => toggleTime(time)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          selectedTimes.includes(time)
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                  {selectedTimes.length > 0 && (
                    <p className="text-sm text-gray-400 mt-2">
                      Tanlangan: {selectedTimes.join(', ')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Izohlar (ixtiyoriy)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Qo'shimcha izohlar..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingSchedule(null)
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleEditSchedule}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Save className="h-5 w-5" />
                  <span>Saqlash</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-xl p-6 border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Excel Fayl Yuklash</h2>
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setImportFile(null)
                    setImportResult(null)
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleImportSchedules} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Excel Fayl (.xlsx)
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Shablonni yuklab olish uchun "Shablon" tugmasini bosing
                  </p>
                </div>

                {importResult && (
                  <div className={`p-4 rounded-lg ${importResult.failed > 0 ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-green-500/20 border border-green-500/50'}`}>
                    <p className={`font-semibold ${importResult.failed > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {importResult.success} ta muvaffaqiyatli, {importResult.failed} ta xatolik
                    </p>
                    {importResult.errors.length > 0 && (
                      <div className="mt-2 max-h-40 overflow-y-auto">
                        {importResult.errors.map((error, idx) => (
                          <p key={idx} className="text-xs text-gray-300 mt-1">{error}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false)
                      setImportFile(null)
                      setImportResult(null)
                    }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={!importFile || importing}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {importing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Yuklanmoqda...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        <span>Yuklash</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
