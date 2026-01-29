'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Calendar, Clock, Users, Plus, Edit2, Trash2, X, Save } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { uz } from 'date-fns/locale'

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

const AVAILABLE_TIMES = ['05:30', '09:00', '10:00', '12:00', '13:00', '14:30', '15:00', '18:00']

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
  const [filterDate, setFilterDate] = useState('')

  useEffect(() => {
    if (status === 'authenticated') {
      fetchGroups()
      fetchSchedules()
    }
  }, [status])

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
      if (filterDate) params.append('date', filterDate)
      if (params.toString()) url += '?' + params.toString()

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        // Parse times from JSON string
        const parsedData = data.map((schedule: ClassSchedule) => ({
          ...schedule,
          times: typeof schedule.times === 'string' ? JSON.parse(schedule.times) : schedule.times,
        }))
        setSchedules(parsedData)
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [filterGroup, filterDate])

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
        fetchSchedules()
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
      alert(`Xatolik yuz berdi: ${error instanceof Error ? error.message : 'Noma'lum xatolik'}`)
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

        {/* Filters */}
        <div className="bg-slate-800 rounded-xl p-4 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Sana bo'yicha filtrlash
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Schedules List */}
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
      </div>
    </DashboardLayout>
  )
}
