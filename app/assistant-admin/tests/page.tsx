'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatDateShort } from '@/lib/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Edit, Trash2, Search, Calendar, BookOpen, X, PenTool, Clock } from 'lucide-react'
import { scheduleDateKey } from '@/lib/schedule-date'

interface Test {
  id: string
  groupId: string
  group: {
    id: string
    name: string
  }
  date: string
  totalQuestions: number
  type: string
  title: string | null
  description: string | null
  createdAt?: string
  results: Array<{
    id: string
    student: {
      user: {
        name: string
      }
    }
    correctAnswers: number
  }>
}

interface Group {
  id: string
  name: string
}

function scheduleTimeOptions(schedules: { id: string; times: string | string[] }[]): string[] {
  const options: string[] = []
  for (const schedule of schedules) {
    const times = Array.isArray(schedule.times) ? schedule.times : JSON.parse(schedule.times || '[]')
    for (const time of times) {
      options.push(`${schedule.id}|${time}`)
    }
  }
  return options
}

interface WrittenWork {
  id: string
  groupId: string
  group: {
    id: string
    name: string
  }
  date: string
  totalQuestions: number
  timeGiven: number
  title: string | null
  description: string | null
  createdAt?: string
  results: Array<{
    id: string
    student: {
      user: {
        name: string
      }
    }
    correctAnswers: number
    score: number
    masteryLevel: number
  }>
}

export default function TestsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [permissions, setPermissions] = useState<any>(null)
  const [permissionsLoading, setPermissionsLoading] = useState(true)
  const [tests, setTests] = useState<Test[]>([])
  const [writtenWorks, setWrittenWorks] = useState<WrittenWork[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showWrittenWorkModal, setShowWrittenWorkModal] = useState(false)
  const [groupSchedules, setGroupSchedules] = useState<any[]>([])
  const [loadingSchedules, setLoadingSchedules] = useState(false)
  const [selectedScheduleId, setSelectedScheduleId] = useState('')
  const [selectedTime, setSelectedTime] = useState('') // Tanlangan vaqt (masalan: "05:30")
  const [formData, setFormData] = useState({
    groupId: '',
    date: new Date().toISOString().split('T')[0],
    totalQuestions: '',
    type: 'kunlik_test',
    title: '',
    description: '',
    classScheduleId: '',
  })
  const [writtenWorkFormData, setWrittenWorkFormData] = useState({
    groupId: '',
    date: new Date().toISOString().split('T')[0],
    totalQuestions: '',
    timeGiven: '',
    title: '',
    description: '',
    classScheduleId: '',
  })
  const [writtenWorkSchedules, setWrittenWorkSchedules] = useState<any[]>([])
  const [loadingWrittenWorkSchedules, setLoadingWrittenWorkSchedules] = useState(false)
  const [selectedWrittenWorkScheduleId, setSelectedWrittenWorkScheduleId] = useState('')

  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/groups')
      const data = await response.json()
      if (Array.isArray(data)) {
        setGroups(data)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    }
  }, [])

  const fetchGroupSchedules = useCallback(async (groupId: string, selectedDate?: string, forWrittenWork: boolean = false) => {
    if (!groupId) {
      if (forWrittenWork) {
        setWrittenWorkSchedules([])
        setSelectedWrittenWorkScheduleId('')
      } else {
        setGroupSchedules([])
        setSelectedScheduleId('')
      }
      return
    }

    if (forWrittenWork) {
      setLoadingWrittenWorkSchedules(true)
    } else {
      setLoadingSchedules(true)
    }
    try {
      let url = `/api/admin/schedules?groupId=${groupId}`
      if (selectedDate) {
        url += `&date=${selectedDate}`
      }

      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        let filteredData = data

        if (selectedDate) {
          filteredData = data.filter(
            (schedule: { date: string }) => scheduleDateKey(schedule.date) === selectedDate
          )

          const sortedSchedules = filteredData.sort((a: any, b: any) => {
            const timesA = Array.isArray(a.times) ? a.times : JSON.parse(a.times || '[]')
            const timesB = Array.isArray(b.times) ? b.times : JSON.parse(b.times || '[]')
            const firstTimeA = timesA[0] || '00:00'
            const firstTimeB = timesB[0] || '00:00'
            return firstTimeA.localeCompare(firstTimeB)
          })

          if (forWrittenWork) {
            setWrittenWorkSchedules(sortedSchedules)
          } else {
            setGroupSchedules(sortedSchedules)
          }
        } else {
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          const upcomingSchedules = data
            .filter((schedule: any) => {
              const scheduleDate = new Date(schedule.date)
              scheduleDate.setHours(0, 0, 0, 0)
              return scheduleDate >= today
            })
            .sort((a: any, b: any) => {
              const dateA = new Date(a.date).getTime()
              const dateB = new Date(b.date).getTime()
              if (dateA !== dateB) return dateA - dateB

              const timesA = Array.isArray(a.times) ? a.times : JSON.parse(a.times || '[]')
              const timesB = Array.isArray(b.times) ? b.times : JSON.parse(b.times || '[]')
              const firstTimeA = timesA[0] || '00:00'
              const firstTimeB = timesB[0] || '00:00'
              return firstTimeA.localeCompare(firstTimeB)
            })

          if (forWrittenWork) {
            setWrittenWorkSchedules(upcomingSchedules)
          } else {
            setGroupSchedules(upcomingSchedules)
          }
        }
      } else {
        if (forWrittenWork) {
          setWrittenWorkSchedules([])
        } else {
          setGroupSchedules([])
        }
      }
    } catch (error) {
      console.error('Error fetching group schedules:', error)
      if (forWrittenWork) {
        setWrittenWorkSchedules([])
      } else {
        setGroupSchedules([])
      }
    } finally {
      if (forWrittenWork) {
        setLoadingWrittenWorkSchedules(false)
      } else {
        setLoadingSchedules(false)
      }
    }
  }, [])

  const fetchTests = useCallback(async () => {
    try {
      let url = '/api/admin/tests'
      if (selectedDate) {
        url += `?date=${selectedDate}`
        console.log('Fetching tests for date:', selectedDate)
      } else {
        console.log('Fetching all tests (no date filter)')
      }
      const response = await fetch(url)
      const data = await response.json()
      console.log('Fetched tests:', data.length, 'tests')
      if (Array.isArray(data)) {
        setTests(data)
        data.forEach((test: any) => {
          console.log('Test date:', new Date(test.date).toISOString().split('T')[0], 'matches filter:', selectedDate || 'all')
        })
      }
    } catch (error) {
      console.error('Error fetching tests:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  const fetchWrittenWorks = useCallback(async () => {
    try {
      let url = '/api/admin/written-works'
      if (selectedDate) {
        url += `?date=${selectedDate}`
      }
      const response = await fetch(url)
      if (!response.ok) {
        console.error('Failed to fetch written works:', response.status)
        return
      }
      const data = await response.json()
      console.log('Fetched written works response:', data)
      if (Array.isArray(data)) {
        setWrittenWorks(data)
        console.log('Written works set to state:', data.length, 'items')
      } else {
        console.error('Expected array but got:', typeof data, data)
        setWrittenWorks([])
      }
    } catch (error) {
      console.error('Error fetching written works:', error)
    }
  }, [selectedDate])

  useEffect(() => {
    fetch('/api/assistant-admin/permissions')
      .then((r) => (r.ok ? r.json() : {}))
      .then(setPermissions)
      .catch(() => setPermissions({}))
      .finally(() => setPermissionsLoading(false))
  }, [])
  useEffect(() => {
    if (permissionsLoading) return
    if (!permissions?.tests?.view) {
      router.replace('/assistant-admin/dashboard')
    }
  }, [permissionsLoading, permissions, router])

  useEffect(() => {
    if (permissionsLoading || !permissions?.tests?.view) return
    fetchGroups()
    fetchTests()
    fetchWrittenWorks()
  }, [permissionsLoading, permissions?.tests?.view, fetchGroups, fetchTests, fetchWrittenWorks])

  useEffect(() => {
    if (!showAddModal) return
    if (formData.groupId && formData.date) {
      void fetchGroupSchedules(formData.groupId, formData.date, false)
    } else {
      setGroupSchedules([])
      setSelectedScheduleId('')
    }
  }, [showAddModal, formData.groupId, formData.date, fetchGroupSchedules])

  useEffect(() => {
    if (!showWrittenWorkModal) return
    if (writtenWorkFormData.groupId && writtenWorkFormData.date) {
      void fetchGroupSchedules(writtenWorkFormData.groupId, writtenWorkFormData.date, true)
    } else {
      setWrittenWorkSchedules([])
      setSelectedWrittenWorkScheduleId('')
    }
  }, [showWrittenWorkModal, writtenWorkFormData.groupId, writtenWorkFormData.date, fetchGroupSchedules])

  useEffect(() => {
    if (!showAddModal || loadingSchedules) return
    const options = scheduleTimeOptions(groupSchedules)
    if (options.length === 1) {
      const [scheduleId] = options[0].split('|')
      setSelectedScheduleId(options[0])
      setFormData((prev) => ({ ...prev, classScheduleId: scheduleId }))
    }
  }, [groupSchedules, showAddModal, loadingSchedules])

  useEffect(() => {
    if (!showWrittenWorkModal || loadingWrittenWorkSchedules) return
    const options = scheduleTimeOptions(writtenWorkSchedules)
    if (options.length === 1) {
      const [scheduleId] = options[0].split('|')
      setSelectedWrittenWorkScheduleId(options[0])
      setWrittenWorkFormData((prev) => ({ ...prev, classScheduleId: scheduleId }))
    }
  }, [writtenWorkSchedules, showWrittenWorkModal, loadingWrittenWorkSchedules])

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Parse selected schedule ID and time
      if (!selectedScheduleId || !selectedScheduleId.includes('|')) {
        alert('Dars rejasini va vaqtni tanlang!')
        return
      }
      
      const [scheduleId, selectedTime] = selectedScheduleId.split('|')
      const selectedSchedule = groupSchedules.find(s => s.id === scheduleId)
      
      if (!selectedSchedule) {
        alert('Dars rejasi topilmadi!')
        return
      }

      console.log('Selected schedule:', selectedSchedule)
      console.log('Selected time:', selectedTime)
      console.log('Schedule date (raw):', selectedSchedule.date, 'Type:', typeof selectedSchedule.date)

      const scheduleDate = scheduleDateKey(selectedSchedule.date)
      console.log('Parsed schedule date:', scheduleDate)

      // Prepare the data
      const testData = {
        groupId: formData.groupId,
        date: scheduleDate, // YYYY-MM-DD format
        totalQuestions: formData.totalQuestions,
        type: formData.type,
        title: formData.title || null,
        description: formData.description || null,
        classScheduleId: scheduleId || null,
      }
      
      console.log('Sending test data:', testData)
      
      const response = await fetch('/api/admin/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      })

      if (response.ok) {
        alert('Test muvaffaqiyatli yaratildi!')
        setShowAddModal(false)
        setFormData({
          groupId: '',
          date: new Date().toISOString().split('T')[0],
          totalQuestions: '',
          type: 'kunlik_test',
          title: '',
          description: '',
          classScheduleId: '',
        })
        setGroupSchedules([])
        setSelectedScheduleId('')
        setSelectedTime('')
        fetchTests()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error adding test:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleDeleteTest = async (id: string) => {
    if (!confirm('Testni o\'chirishni tasdiqlaysizmi?')) return

    try {
      const response = await fetch(`/api/admin/tests/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Test muvaffaqiyatli o\'chirildi!')
        fetchTests()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error deleting test:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleAddWrittenWork = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Parse selected schedule ID and time
      if (!selectedWrittenWorkScheduleId || !selectedWrittenWorkScheduleId.includes('|')) {
        alert('Dars rejasini va vaqtni tanlang!')
        return
      }
      
      const [scheduleId, selectedTime] = selectedWrittenWorkScheduleId.split('|')
      const selectedSchedule = writtenWorkSchedules.find(s => s.id === scheduleId)
      
      if (!selectedSchedule) {
        alert('Dars rejasi topilmadi!')
        return
      }

      console.log('Selected schedule for written work:', selectedSchedule)
      console.log('Selected time:', selectedTime)
      console.log('Schedule date (raw):', selectedSchedule.date, 'Type:', typeof selectedSchedule.date)

      const scheduleDate = scheduleDateKey(selectedSchedule.date)
      console.log('Parsed schedule date:', scheduleDate)

      // Prepare the data
      const workData = {
        groupId: writtenWorkFormData.groupId,
        date: scheduleDate, // YYYY-MM-DD format
        totalQuestions: parseInt(writtenWorkFormData.totalQuestions),
        timeGiven: parseInt(writtenWorkFormData.timeGiven),
        title: writtenWorkFormData.title || null,
        description: writtenWorkFormData.description || null,
        classScheduleId: scheduleId || null,
      }
      
      console.log('Sending written work data:', workData)
      
      const response = await fetch('/api/admin/written-works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workData),
      })

      if (response.ok) {
        const newWork = await response.json()
        console.log('Written work created successfully:', newWork)
        alert('Yozma ish muvaffaqiyatli yaratildi!')
        setShowWrittenWorkModal(false)
        setWrittenWorkFormData({
          groupId: '',
          date: new Date().toISOString().split('T')[0],
          totalQuestions: '',
          timeGiven: '',
          title: '',
          description: '',
          classScheduleId: '',
        })
        setWrittenWorkSchedules([])
        setSelectedWrittenWorkScheduleId('')
        // Force refresh the list
        await fetchWrittenWorks()
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        alert(errorData.error || `Xatolik yuz berdi (${response.status})`)
      }
    } catch (error: any) {
      console.error('Error adding written work:', error)
      alert(`Xatolik yuz berdi: ${error?.message || 'Noma\'lum xatolik'}`)
    }
  }

  const handleDeleteWrittenWork = async (id: string) => {
    if (!confirm('Yozma ishni o\'chirishni tasdiqlaysizmi?')) return

    try {
      const response = await fetch(`/api/admin/written-works/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Yozma ish muvaffaqiyatli o\'chirildi!')
        fetchWrittenWorks()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error deleting written work:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const getMasteryColor = (masteryLevel: number) => {
    if (masteryLevel >= 70) return 'text-green-400 bg-green-500/20'
    if (masteryLevel >= 30) return 'text-yellow-400 bg-yellow-500/20'
    return 'text-red-400 bg-red-500/20'
  }

  const filteredTests = tests.filter((test) => {
    const matchesSearch =
      test.group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (test.title && test.title.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  const filteredWrittenWorks = writtenWorks.filter((work) => {
    const matchesSearch =
      work.group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (work.title && work.title.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  const getTypeLabel = (type: string) => {
    return type === 'kunlik_test' ? 'Kunlik test' : 'Uyga vazifa'
  }

  const testsAndWorksFeed = useMemo(() => {
    type FeedItem =
      | { kind: 'written'; work: WrittenWork; createdMs: number }
      | { kind: 'test'; test: Test; createdMs: number }

    const createdMs = (createdAt: string | undefined, fallbackDate: string) => {
      if (createdAt) {
        const t = new Date(createdAt).getTime()
        if (!Number.isNaN(t)) return t
      }
      const t = new Date(fallbackDate).getTime()
      return Number.isNaN(t) ? 0 : t
    }

    const items: FeedItem[] = [
      ...filteredWrittenWorks.map((work) => ({
        kind: 'written' as const,
        work,
        createdMs: createdMs(work.createdAt, work.date),
      })),
      ...filteredTests.map((test) => ({
        kind: 'test' as const,
        test,
        createdMs: createdMs(test.createdAt, test.date),
      })),
    ]

    return items.sort((a, b) => {
      if (b.createdMs !== a.createdMs) return b.createdMs - a.createdMs
      const idA = a.kind === 'written' ? a.work.id : a.test.id
      const idB = b.kind === 'written' ? b.work.id : b.test.id
      return idB.localeCompare(idA)
    })
  }, [filteredTests, filteredWrittenWorks])

  if (permissionsLoading || !permissions?.tests?.view) {
    return (
      <DashboardLayout role="ASSISTANT_ADMIN">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--border-default)] border-t-indigo-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="ASSISTANT_ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Testlar, Vazifalar va Yozma Ishlar</h1>
            <p className="text-sm sm:text-base text-gray-400">Test, vazifa va yozma ishlarni boshqaring</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => {
                setWrittenWorkFormData({
                  groupId: '',
                  date: new Date().toISOString().split('T')[0],
                  totalQuestions: '',
                  timeGiven: '',
                  title: '',
                  description: '',
                  classScheduleId: '',
                })
                setShowWrittenWorkModal(true)
              }}
              className="flex items-center space-x-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              <PenTool className="h-5 w-5" />
              <span>Yangi Yozma Ish</span>
            </button>
            <button
              onClick={() => {
                setFormData({
                  groupId: '',
                  date: new Date().toISOString().split('T')[0],
                  totalQuestions: '',
                  type: 'kunlik_test',
                  title: '',
                  description: '',
                  classScheduleId: '',
                })
                setGroupSchedules([])
                setSelectedScheduleId('')
                setShowAddModal(true)
              }}
              className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Yangi Test/Vazifa</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Qidirish (guruh, nom)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 pr-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Tests List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Yuklanmoqda...</p>
          </div>
        ) : filteredTests.length === 0 && filteredWrittenWorks.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-lg border border-gray-700">
            <BookOpen className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Testlar va yozma ishlar topilmadi</p>
          </div>
        ) : (
          <div className="space-y-4">
            {testsAndWorksFeed.map((item) =>
              item.kind === 'written' ? (
                <div
                  key={`w-${item.work.id}`}
                  className="bg-slate-800 rounded-lg border border-gray-700 p-6 hover:border-orange-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-orange-500/20 text-orange-400">
                          Yozma Ish
                        </span>
                        <span className="text-white font-semibold">{item.work.group.name}</span>
                      </div>
                      {item.work.title && (
                        <h3 className="text-xl font-bold text-white mb-1">{item.work.title}</h3>
                      )}
                      <div className="flex items-center space-x-4 text-gray-400 text-sm mt-2">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateShort(item.work.date)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <BookOpen className="h-4 w-4" />
                          <span>Savollar: {item.work.totalQuestions}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Vaqt: {item.work.timeGiven} daqiqa</span>
                        </span>
                        <span className="text-gray-500">
                          Natijalar: {item.work.results.length}
                        </span>
                      </div>
                      {item.work.description && (
                        <p className="text-gray-300 text-sm mt-2">{item.work.description}</p>
                      )}
                      {item.work.results.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-semibold text-gray-400 mb-2">Natijalar:</p>
                          {item.work.results.map((result) => {
                            const masteryLevel = result.masteryLevel
                            return (
                              <div
                                key={result.id}
                                className="flex items-center justify-between p-2 bg-slate-700/50 rounded"
                              >
                                <span className="text-white text-sm">{result.student.user.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-400 text-sm">
                                    {result.correctAnswers} / {item.work.totalQuestions}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getMasteryColor(masteryLevel)}`}>
                                    {masteryLevel.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteWrittenWork(item.work.id)}
                      className="ml-4 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={`t-${item.test.id}`}
                  className="bg-slate-800 rounded-lg border border-gray-700 p-6 hover:border-green-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          item.test.type === 'kunlik_test'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {getTypeLabel(item.test.type)}
                        </span>
                        <span className="text-white font-semibold">{item.test.group.name}</span>
                      </div>
                      {item.test.title && (
                        <h3 className="text-xl font-bold text-white mb-1">{item.test.title}</h3>
                      )}
                      <div className="flex items-center space-x-4 text-gray-400 text-sm mt-2">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateShort(item.test.date)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <BookOpen className="h-4 w-4" />
                          <span>Umumiy savollar: {item.test.totalQuestions}</span>
                        </span>
                        <span className="text-gray-500">
                          Natijalar: {item.test.results.length}
                        </span>
                      </div>
                      {item.test.description && (
                        <p className="text-gray-300 text-sm mt-2">{item.test.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteTest(item.test.id)}
                      className="ml-4 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-lg border border-gray-700 w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Yangi Test/Vazifa</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleAddTest} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Guruh *
                    </label>
                    <select
                      required
                      value={formData.groupId}
                      onChange={(e) => {
                        const newGroupId = e.target.value
                        const today = new Date().toISOString().split('T')[0]
                        setFormData({
                          ...formData,
                          groupId: newGroupId,
                          classScheduleId: '',
                          date: formData.date || today,
                        })
                        setSelectedScheduleId('')
                        setSelectedTime('')
                      }}
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Guruhni tanlang</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formData.groupId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Sana *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => {
                          const newDate = e.target.value
                          setFormData({ ...formData, date: newDate, classScheduleId: '' })
                          setSelectedScheduleId('')
                          setSelectedTime('')
                        }}
                        className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}
                  {formData.groupId && formData.date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Dars Rejasi * (Tanlangan sanadagi darslar)
                      </label>
                      {loadingSchedules ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                          <span className="ml-2 text-gray-400">Yuklanmoqda...</span>
                        </div>
                      ) : groupSchedules.length === 0 ? (
                        <div className="p-4 bg-slate-700/50 rounded-lg border border-yellow-500/30">
                          <p className="text-yellow-400 text-sm">
                            Tanlangan sanada bu guruh uchun dars rejasi topilmadi. Avval "Dars Rejasi" sahifasida dars rejasini qo'shing.
                          </p>
                        </div>
                      ) : (
                        <select
                          required
                          value={selectedScheduleId}
                          onChange={(e) => {
                            const value = e.target.value
                            setSelectedScheduleId(value)
                            if (value.includes('|')) {
                              const [scheduleId] = value.split('|')
                              setFormData({ ...formData, classScheduleId: scheduleId })
                            }
                          }}
                          className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Dars rejasini tanlang</option>
                          {groupSchedules.map((schedule) => {
                            const times = Array.isArray(schedule.times) ? schedule.times : JSON.parse(schedule.times || '[]')
                            // Har bir vaqtni alohida ko'rsatish
                            return times.map((time: string, index: number) => (
                              <option key={`${schedule.id}-${time}-${index}`} value={`${schedule.id}|${time}`}>
                                {formatDateShort(schedule.date)} - {time}
                              </option>
                            ))
                          })}
                        </select>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Turi *
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="kunlik_test">Kunlik test</option>
                      <option value="uyga_vazifa">Uyga vazifa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Umumiy savollar soni *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.totalQuestions}
                      onChange={(e) => setFormData({ ...formData, totalQuestions: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masalan: 20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nomi (ixtiyoriy)
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masalan: Matematika testi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tavsif (ixtiyoriy)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Qo'shimcha ma'lumot..."
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      Yaratish
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Written Work Modal */}
        {showWrittenWorkModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-lg border border-gray-700 w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Yangi Yozma Ish</h2>
                  <button
                    onClick={() => setShowWrittenWorkModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleAddWrittenWork} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Guruh *
                    </label>
                    <select
                      required
                      value={writtenWorkFormData.groupId}
                      onChange={(e) => {
                        const newGroupId = e.target.value
                        const today = new Date().toISOString().split('T')[0]
                        setWrittenWorkFormData({
                          ...writtenWorkFormData,
                          groupId: newGroupId,
                          classScheduleId: '',
                          date: writtenWorkFormData.date || today,
                        })
                        setSelectedWrittenWorkScheduleId('')
                      }}
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Guruhni tanlang</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {writtenWorkFormData.groupId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Sana *
                      </label>
                      <input
                        type="date"
                        required
                        value={writtenWorkFormData.date}
                        onChange={(e) => {
                          const newDate = e.target.value
                          setWrittenWorkFormData({ ...writtenWorkFormData, date: newDate, classScheduleId: '' })
                          setSelectedWrittenWorkScheduleId('')
                        }}
                        className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  )}
                  {writtenWorkFormData.groupId && writtenWorkFormData.date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Dars Rejasi * (Tanlangan sanadagi darslar)
                      </label>
                      {loadingWrittenWorkSchedules ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                          <span className="ml-2 text-gray-400">Yuklanmoqda...</span>
                        </div>
                      ) : writtenWorkSchedules.length === 0 ? (
                        <div className="p-4 bg-slate-700/50 rounded-lg border border-yellow-500/30">
                          <p className="text-yellow-400 text-sm">
                            Tanlangan sanada bu guruh uchun dars rejasi topilmadi. Avval "Dars Rejasi" sahifasida dars rejasini qo'shing.
                          </p>
                        </div>
                      ) : (
                        <select
                          required
                          value={selectedWrittenWorkScheduleId}
                          onChange={(e) => {
                            const value = e.target.value
                            setSelectedWrittenWorkScheduleId(value)
                            if (value.includes('|')) {
                              const [scheduleId] = value.split('|')
                              setWrittenWorkFormData({ ...writtenWorkFormData, classScheduleId: scheduleId })
                            }
                          }}
                          className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Dars rejasini tanlang</option>
                          {writtenWorkSchedules.map((schedule) => {
                            const times = Array.isArray(schedule.times) ? schedule.times : JSON.parse(schedule.times || '[]')
                            // Har bir vaqtni alohida ko'rsatish
                            return times.map((time: string, index: number) => (
                              <option key={`${schedule.id}-${time}-${index}`} value={`${schedule.id}|${time}`}>
                                {formatDateShort(schedule.date)} - {time}
                              </option>
                            ))
                          })}
                        </select>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Umumiy savollar soni *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={writtenWorkFormData.totalQuestions}
                      onChange={(e) => setWrittenWorkFormData({ ...writtenWorkFormData, totalQuestions: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Masalan: 20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Beriladigan vaqt (daqiqada) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={writtenWorkFormData.timeGiven}
                      onChange={(e) => setWrittenWorkFormData({ ...writtenWorkFormData, timeGiven: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Masalan: 120"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nomi (ixtiyoriy)
                    </label>
                    <input
                      type="text"
                      value={writtenWorkFormData.title}
                      onChange={(e) => setWrittenWorkFormData({ ...writtenWorkFormData, title: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Masalan: Matematika yozma ishi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tavsif (ixtiyoriy)
                    </label>
                    <textarea
                      value={writtenWorkFormData.description}
                      onChange={(e) => setWrittenWorkFormData({ ...writtenWorkFormData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Qo'shimcha ma'lumot..."
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                    >
                      Yaratish
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWrittenWorkModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
