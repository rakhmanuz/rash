'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { formatDateShort } from '@/lib/utils'
import { useEffect, useState, useCallback } from 'react'
import { BookOpen, User, Search, Users, ChevronRight, Calendar, CheckCircle2, X, Plus, Clock, Loader2, PenTool } from 'lucide-react'

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
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface Group {
  id: string
  name: string
  description: string | null
  enrollments: Array<{
    id: string
    student: {
      id: string
      studentId: string
      user: {
        name: string
        username: string
      }
    }
  }>
}

interface GroupWithSchedule extends Group {
  scheduleId?: string
}

interface Student {
  id: string
  studentId: string
  user: {
    name: string
    username: string
  }
}

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
  results: Array<{
    id: string
    studentId: string
    student: {
      user: {
        name: string
      }
    }
    correctAnswers: number
    notes: string | null
  }>
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
  results: Array<{
    id: string
    studentId: string
    student: {
      user: {
        name: string
      }
    }
    correctAnswers: number
    remainingTime: number
    score: number
    masteryLevel: number
    notes: string | null
  }>
}

export default function TeacherGradingPage() {
  const { data: session } = useSession()
  const [availableGroups, setAvailableGroups] = useState<GroupWithSchedule[]>([]) // O'sha sana uchun test bo'lgan guruhlar
  const [selectedGroup, setSelectedGroup] = useState<GroupWithSchedule | null>(null)
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [tests, setTests] = useState<Test[]>([])
  const [allTestsForDate, setAllTestsForDate] = useState<Test[]>([]) // Store all tests for the selected date (before filtering by group)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTests, setLoadingTests] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'tests' | 'written-works'>('tests')
  const [writtenWorks, setWrittenWorks] = useState<WrittenWork[]>([])
  const [allWrittenWorksForDate, setAllWrittenWorksForDate] = useState<WrittenWork[]>([])
  const [selectedWrittenWork, setSelectedWrittenWork] = useState<WrittenWork | null>(null)
  const [loadingWrittenWorks, setLoadingWrittenWorks] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [showWrittenWorkResultModal, setShowWrittenWorkResultModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [resultForm, setResultForm] = useState({
    correctAnswers: '',
    notes: '',
  })
  const [writtenWorkResultForm, setWrittenWorkResultForm] = useState({
    correctAnswers: '',
    remainingTime: '',
    notes: '',
  })

  // Fetch groups that have tests or written works on selected date
  const fetchGroupsForDate = useCallback(async () => {
    if (!selectedDate || selectedDate === '') {
      setAvailableGroups([])
      setSelectedGroup(null)
      setTests([])
      setAllTestsForDate([])
      setWrittenWorks([])
      setAllWrittenWorksForDate([])
      setStudents([])
      return
    }

    setLoadingGroups(true)
    setLoadingTests(true)
    setLoadingWrittenWorks(true)
    try {
      // Fetch all tests for the selected date
      let url = `/api/teacher/tests?date=${selectedDate}`
      if (selectedType !== 'all') {
        url += `&type=${selectedType}`
      }

      const testsRes = await fetch(url)
      if (!testsRes.ok) throw new Error('Testlarni yuklashda xatolik')
      const allTests = await testsRes.json()
      
      // Fetch all written works for the selected date
      const writtenWorksRes = await fetch(`/api/teacher/written-works?date=${selectedDate}`)
      if (!writtenWorksRes.ok) throw new Error('Yozma ishlarni yuklashda xatolik')
      const allWrittenWorks = await writtenWorksRes.json()
      
      if (!Array.isArray(allTests) || !Array.isArray(allWrittenWorks)) {
        setAvailableGroups([])
        setSelectedGroup(null)
        setTests([])
        setAllTestsForDate([])
        setWrittenWorks([])
        setAllWrittenWorksForDate([])
        setLoadingGroups(false)
        setLoadingTests(false)
        setLoadingWrittenWorks(false)
        return
      }

      // Get all teacher's groups to get group names
      const groupsRes = await fetch('/api/teacher/groups')
      if (!groupsRes.ok) throw new Error('Guruhlarni yuklashda xatolik')
      const allGroups = await groupsRes.json()
      
      // Find unique group IDs from tests and written works
      const groupIdsFromTests = Array.from(new Set(allTests.map((test: Test) => test.groupId)))
      const groupIdsFromWrittenWorks = Array.from(new Set(allWrittenWorks.map((work: WrittenWork) => work.groupId)))
      const allGroupIds = Array.from(new Set([...groupIdsFromTests, ...groupIdsFromWrittenWorks]))
      
      // Create groups list from tests and written works
      const groupsWithTests: GroupWithSchedule[] = allGroupIds
        .map((groupId: string) => {
          const group = allGroups.find((g: Group) => g.id === groupId)
          if (group) {
            return {
              ...group,
              scheduleId: undefined
            }
          }
          return null
        })
        .filter((g): g is GroupWithSchedule => g !== null)
      
      setAvailableGroups(groupsWithTests)
      setAllTestsForDate(allTests)
      setAllWrittenWorksForDate(allWrittenWorks)
      
      // Auto-select first group if available
      if (groupsWithTests.length > 0) {
        if (!selectedGroup || !groupsWithTests.some(g => g.id === selectedGroup.id)) {
          setSelectedGroup(groupsWithTests[0])
        }
      } else {
        setSelectedGroup(null)
      }

    } catch (err: any) {
      console.error('Error fetching groups for date:', err)
      setAvailableGroups([])
      setSelectedGroup(null)
      setTests([])
      setAllTestsForDate([])
      setWrittenWorks([])
      setAllWrittenWorksForDate([])
    } finally {
      setLoadingGroups(false)
      setLoadingTests(false)
      setLoadingWrittenWorks(false)
    }
  }, [selectedDate, selectedType])

  // Filter tests when group changes
  useEffect(() => {
    if (!selectedDate || allTestsForDate.length === 0) {
      setTests([])
      setSelectedTest(null)
      return
    }

    // Filter tests by selected group
    const filteredTests = selectedGroup 
      ? allTestsForDate.filter((test: Test) => test.groupId === selectedGroup.id)
      : allTestsForDate
    setTests(filteredTests)
  }, [selectedGroup, allTestsForDate, selectedDate])

  // Filter written works when group changes
  useEffect(() => {
    if (!selectedDate || allWrittenWorksForDate.length === 0) {
      setWrittenWorks([])
      setSelectedWrittenWork(null)
      return
    }

    // Filter written works by selected group
    const filteredWorks = selectedGroup 
      ? allWrittenWorksForDate.filter((work: WrittenWork) => work.groupId === selectedGroup.id)
      : allWrittenWorksForDate
    setWrittenWorks(filteredWorks)
  }, [selectedGroup, allWrittenWorksForDate, selectedDate])

  // Fetch students when group is selected
  useEffect(() => {
    if (!selectedGroup) {
      setStudents([])
      return
    }

    setLoadingStudents(true)
    fetch(`/api/teacher/groups/${selectedGroup.id}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.enrollments) {
          const studentsData = data.enrollments.map((enrollment: any) => ({
            id: enrollment.student.id,
            studentId: enrollment.student.studentId,
            user: {
              name: enrollment.student.user.name,
              username: enrollment.student.user.username,
            },
          }))
          setStudents(studentsData)
        } else {
          setStudents([])
        }
        setLoadingStudents(false)
      })
      .catch(err => {
        console.error('Error fetching students:', err)
        setStudents([])
        setLoadingStudents(false)
      })
  }, [selectedGroup])

  useEffect(() => {
    fetchGroupsForDate()
  }, [fetchGroupsForDate])

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTest || !selectedStudent) return

    const correctAnswers = parseInt(resultForm.correctAnswers)
    if (isNaN(correctAnswers) || correctAnswers < 0 || correctAnswers > selectedTest.totalQuestions) {
      alert(`To'g'ri javoblar soni 0 dan ${selectedTest.totalQuestions} gacha bo'lishi kerak!`)
      return
    }

    try {
      const response = await fetch('/api/teacher/test-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: selectedTest.id,
          studentId: selectedStudent.id,
          correctAnswers,
          notes: resultForm.notes || null,
        }),
      })

      if (response.ok) {
        alert('Natija muvaffaqiyatli saqlandi!')
        setShowResultModal(false)
        setSelectedStudent(null)
        setResultForm({ correctAnswers: '', notes: '' })
        // Refresh tests to get updated results
        const url = `/api/teacher/tests?date=${selectedDate}${selectedType !== 'all' ? `&type=${selectedType}` : ''}`
        fetch(url)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setAllTestsForDate(data)
              // Filter by selected group
              const groupTests = selectedGroup 
                ? data.filter((test: Test) => test.groupId === selectedGroup.id)
                : data
              setTests(groupTests)
              // Update selected test
              const updatedTest = groupTests.find((t: Test) => t.id === selectedTest.id)
              if (updatedTest) {
                setSelectedTest(updatedTest)
              }
            }
          })
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error saving result:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleSaveWrittenWorkResult = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWrittenWork || !selectedStudent) return

    const correctAnswers = parseInt(writtenWorkResultForm.correctAnswers)
    const remainingTime = parseInt(writtenWorkResultForm.remainingTime)
    
    if (isNaN(correctAnswers) || correctAnswers < 0 || correctAnswers > selectedWrittenWork.totalQuestions) {
      alert(`To'g'ri javoblar soni 0 dan ${selectedWrittenWork.totalQuestions} gacha bo'lishi kerak!`)
      return
    }

    if (isNaN(remainingTime) || remainingTime < 0 || remainingTime > selectedWrittenWork.timeGiven) {
      alert(`Qolgan vaqt 0 dan ${selectedWrittenWork.timeGiven} gacha bo'lishi kerak!`)
      return
    }

    try {
      const response = await fetch('/api/teacher/written-work-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          writtenWorkId: selectedWrittenWork.id,
          studentId: selectedStudent.id,
          correctAnswers,
          remainingTime,
          notes: writtenWorkResultForm.notes || null,
        }),
      })

      if (response.ok) {
        alert('Natija muvaffaqiyatli saqlandi!')
        setShowWrittenWorkResultModal(false)
        setSelectedStudent(null)
        setWrittenWorkResultForm({ correctAnswers: '', remainingTime: '', notes: '' })
        // Refresh written works to get updated results
        fetch(`/api/teacher/written-works?date=${selectedDate}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setAllWrittenWorksForDate(data)
              // Filter by selected group
              const groupWorks = selectedGroup 
                ? data.filter((work: WrittenWork) => work.groupId === selectedGroup.id)
                : data
              setWrittenWorks(groupWorks)
              // Update selected written work
              const updatedWork = groupWorks.find((w: WrittenWork) => w.id === selectedWrittenWork.id)
              if (updatedWork) {
                setSelectedWrittenWork(updatedWork)
              }
            }
          })
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error saving written work result:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const openResultModal = (student: Student) => {
    setSelectedStudent(student)
    // Check if result already exists
    const existingResult = selectedTest?.results.find(r => r.studentId === student.id)
    if (existingResult) {
      setResultForm({
        correctAnswers: existingResult.correctAnswers.toString(),
        notes: existingResult.notes || '',
      })
    } else {
      setResultForm({ correctAnswers: '', notes: '' })
    }
    setShowResultModal(true)
  }

  const openWrittenWorkResultModal = (student: Student) => {
    setSelectedStudent(student)
    // Check if result already exists
    const existingResult = selectedWrittenWork?.results.find(r => r.studentId === student.id)
    if (existingResult) {
      setWrittenWorkResultForm({
        correctAnswers: existingResult.correctAnswers.toString(),
        remainingTime: existingResult.remainingTime.toString(),
        notes: existingResult.notes || '',
      })
    } else {
      setWrittenWorkResultForm({ correctAnswers: '', remainingTime: '0', notes: '' })
    }
    setShowWrittenWorkResultModal(true)
  }

  const getTypeLabel = (type: string) => {
    return type === 'kunlik_test' ? 'Kunlik test' : 'Uyga vazifa'
  }

  const filteredStudents = students.filter((student) =>
    student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            <h1 className="text-3xl font-bold text-white mb-2">Baholash</h1>
            <p className="text-gray-400">Kunlik test, uyga vazifa va yozma ish natijalarini kiritish</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-gray-700">
          <button
            onClick={() => {
              setActiveTab('tests')
              setSelectedTest(null)
              setSelectedWrittenWork(null)
            }}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'tests'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BookOpen className="inline h-5 w-5 mr-2" />
            Test/Vazifa
          </button>
          <button
            onClick={() => {
              setActiveTab('written-works')
              setSelectedTest(null)
              setSelectedWrittenWork(null)
            }}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'written-works'
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <PenTool className="inline h-5 w-5 mr-2" />
            Yozma Ish
          </button>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-xl p-4 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
                Sana tanlang
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={loading || loadingGroups}
              />
              <p className="text-xs text-gray-400 mt-1">Istalgan sanani tanlang</p>
            </div>
            <div>
              <label htmlFor="group" className="block text-sm font-medium text-gray-300 mb-2">
                Guruh {selectedDate && `(${new Date(selectedDate + 'T00:00:00').toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })} uchun)`}
              </label>
              {!selectedDate ? (
                <div className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-gray-400">
                  Avval sana tanlang
                </div>
              ) : loadingGroups ? (
                <div className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Yuklanmoqda...</span>
                </div>
              ) : (
                <select
                  id="group"
                  value={selectedGroup?.id || ''}
                  onChange={(e) => {
                    const group = availableGroups.find(g => g.id === e.target.value)
                    setSelectedGroup(group || null)
                  }}
                  className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={loading || availableGroups.length === 0}
                >
                  {availableGroups.length === 0 ? (
                    <option value="">O&apos;sha kunda test/vazifa bo&apos;lgan guruhlar yo&apos;q</option>
                  ) : (
                    <>
                      <option value="">Barcha guruhlar</option>
                      {availableGroups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </>
                  )}
                </select>
              )}
              {availableGroups.length === 0 && selectedDate && !loadingGroups && (
                <p className="text-xs text-yellow-400 mt-1">Tanlangan sana uchun test/vazifa bo&apos;lgan guruhlar topilmadi</p>
              )}
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">Tur</label>
              <select
                id="type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={loading || !selectedGroup}
              >
                <option value="all">Barchasi</option>
                <option value="kunlik_test">Kunlik test</option>
                <option value="uyga_vazifa">Uyga vazifa</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Select Test/Written Work and Enter Results */}
        {selectedDate && activeTab === 'tests' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-400" />
                {selectedGroup ? `${selectedGroup.name} - ` : ''}Test/Vazifa tanlash
              </h2>
            </div>

            {/* Tests List */}
            {loadingTests ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              </div>
            ) : tests.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-12 text-center border border-gray-700">
                <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Bu sanada test/vazifa topilmadi</p>
                <p className="text-gray-500 text-sm mt-2">Admin panel orqali test/vazifa yaratilishi kerak</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {tests.map((test) => (
                  <div
                    key={test.id}
                    className={`bg-slate-800 rounded-lg border p-6 cursor-pointer transition-colors ${
                      selectedTest?.id === test.id
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-700 hover:border-green-500/50'
                    }`}
                    onClick={() => setSelectedTest(test)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            test.type === 'kunlik_test'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {getTypeLabel(test.type)}
                          </span>
                          {test.title && (
                            <span className="text-white font-semibold">{test.title}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-gray-400 text-sm">
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDateShort(test.date)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <BookOpen className="h-4 w-4" />
                            <span>Umumiy savollar: {test.totalQuestions}</span>
                          </span>
                          <span className="text-gray-500">
                            Kiritilgan: {test.results.length} / {students.length}
                          </span>
                        </div>
                        {test.description && (
                          <p className="text-gray-300 text-sm mt-2">{test.description}</p>
                        )}
                      </div>
                      {selectedTest?.id === test.id && (
                        <CheckCircle2 className="h-6 w-6 text-green-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Students List for Selected Test */}
            {selectedTest && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    O'quvchilar - {getTypeLabel(selectedTest.type)}
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="O'quvchi qidirish..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {loadingStudents ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="bg-slate-800 rounded-xl p-12 text-center border border-gray-700">
                    <User className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">O'quvchilar topilmadi</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.map((student) => {
                      const result = selectedTest.results.find(r => r.studentId === student.id)
                      const percentage = result
                        ? Math.round((result.correctAnswers / selectedTest.totalQuestions) * 100)
                        : null

                      return (
                        <div
                          key={student.id}
                          className={`bg-slate-800 rounded-lg border p-4 cursor-pointer transition-colors ${
                            result
                              ? 'border-green-500/50 bg-green-500/5'
                              : 'border-gray-700 hover:border-blue-500/50'
                          }`}
                          onClick={() => openResultModal(student)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-white">{student.user.name}</h4>
                            {result ? (
                              <CheckCircle2 className="h-5 w-5 text-green-400" />
                            ) : (
                              <Plus className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-2">ID: {student.studentId}</p>
                          {result ? (
                            <div>
                              <div className="text-lg font-bold text-green-400">
                                {result.correctAnswers} / {selectedTest.totalQuestions}
                              </div>
                              <div className="text-sm text-gray-400">
                                {percentage}% to'g'ri
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">Natija kiritilmagan</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Written Works Section */}
        {selectedDate && activeTab === 'written-works' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <PenTool className="h-5 w-5 text-orange-400" />
                {selectedGroup ? `${selectedGroup.name} - ` : ''}Yozma Ishlar
              </h2>
            </div>

            {/* Written Works List */}
            {loadingWrittenWorks ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              </div>
            ) : writtenWorks.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-12 text-center border border-gray-700">
                <PenTool className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Bu sanada yozma ish topilmadi</p>
                <p className="text-gray-500 text-sm mt-2">Admin panel orqali yozma ish yaratilishi kerak</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {writtenWorks.map((work) => (
                  <div
                    key={work.id}
                    className={`bg-slate-800 rounded-lg border p-6 cursor-pointer transition-colors ${
                      selectedWrittenWork?.id === work.id
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-gray-700 hover:border-orange-500/50'
                    }`}
                    onClick={() => setSelectedWrittenWork(work)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-orange-500/20 text-orange-400">
                            Yozma Ish
                          </span>
                          {work.title && (
                            <span className="text-white font-semibold">{work.title}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-gray-400 text-sm">
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDateShort(work.date)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <BookOpen className="h-4 w-4" />
                            <span>Savollar: {work.totalQuestions}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>Vaqt: {work.timeGiven} daqiqa</span>
                          </span>
                          <span className="text-gray-500">
                            Kiritilgan: {work.results.length} / {students.length}
                          </span>
                        </div>
                        {work.description && (
                          <p className="text-gray-300 text-sm mt-2">{work.description}</p>
                        )}
                      </div>
                      {selectedWrittenWork?.id === work.id && (
                        <CheckCircle2 className="h-6 w-6 text-orange-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Students List for Selected Written Work */}
            {selectedWrittenWork && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    O'quvchilar - Yozma Ish
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="O'quvchi qidirish..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {loadingStudents ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="bg-slate-800 rounded-xl p-12 text-center border border-gray-700">
                    <User className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">O'quvchilar topilmadi</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.map((student) => {
                      const result = selectedWrittenWork.results.find(r => r.studentId === student.id)

                      return (
                        <div
                          key={student.id}
                          className={`bg-slate-800 rounded-lg border p-4 cursor-pointer transition-colors ${
                            result
                              ? 'border-orange-500/50 bg-orange-500/5'
                              : 'border-gray-700 hover:border-orange-500/50'
                          }`}
                          onClick={() => openWrittenWorkResultModal(student)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-white">{student.user.name}</h4>
                            {result ? (
                              <CheckCircle2 className="h-5 w-5 text-orange-400" />
                            ) : (
                              <Plus className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-2">ID: {student.studentId}</p>
                          {result ? (
                            <div>
                              <div className="text-lg font-bold text-orange-400">
                                {result.correctAnswers} / {selectedWrittenWork.totalQuestions}
                              </div>
                              <div className="text-sm text-gray-400">
                                {result.masteryLevel.toFixed(1)}% o'zlashtirish
                              </div>
                              {result.remainingTime > 0 && (
                                <div className="text-xs text-green-400 mt-1">
                                  Qolgan vaqt: {result.remainingTime} daqiqa
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">Natija kiritilmagan</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Result Modal */}
        {showResultModal && selectedTest && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-lg border border-gray-700 w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">
                    {selectedStudent.user.name} - Natija
                  </h2>
                  <button
                    onClick={() => {
                      setShowResultModal(false)
                      setSelectedStudent(null)
                      setResultForm({ correctAnswers: '', notes: '' })
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="mb-4 p-3 bg-slate-700 rounded-lg">
                  <p className="text-sm text-gray-400">Test/Vazifa</p>
                  <p className="text-white font-semibold">
                    {selectedTest.title || getTypeLabel(selectedTest.type)}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Umumiy savollar: {selectedTest.totalQuestions}
                  </p>
                </div>
                <form onSubmit={handleSaveResult} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      To'g'ri ishlagan savollar soni *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max={selectedTest.totalQuestions}
                      value={resultForm.correctAnswers}
                      onChange={(e) =>
                        setResultForm({ ...resultForm, correctAnswers: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder={`0 dan ${selectedTest.totalQuestions} gacha`}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Maksimal: {selectedTest.totalQuestions} ta
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Qo'shimcha izoh (ixtiyoriy)
                    </label>
                    <textarea
                      value={resultForm.notes}
                      onChange={(e) =>
                        setResultForm({ ...resultForm, notes: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Qo'shimcha ma'lumot..."
                    />
                  </div>
                  {resultForm.correctAnswers && (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-sm text-gray-400">Foiz:</p>
                      <p className="text-xl font-bold text-green-400">
                        {Math.round((parseInt(resultForm.correctAnswers) / selectedTest.totalQuestions) * 100)}%
                      </p>
                    </div>
                  )}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      Saqlash
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResultModal(false)
                        setSelectedStudent(null)
                        setResultForm({ correctAnswers: '', notes: '' })
                      }}
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

        {/* Written Work Result Modal */}
        {showWrittenWorkResultModal && selectedWrittenWork && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-lg border border-gray-700 w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">
                    {selectedStudent.user.name} - Yozma Ish Natijasi
                  </h2>
                  <button
                    onClick={() => {
                      setShowWrittenWorkResultModal(false)
                      setSelectedStudent(null)
                      setWrittenWorkResultForm({ correctAnswers: '', remainingTime: '0', notes: '' })
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="mb-4 p-3 bg-slate-700 rounded-lg">
                  <p className="text-sm text-gray-400">Yozma Ish</p>
                  <p className="text-white font-semibold">
                    {selectedWrittenWork.title || 'Yozma Ish'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Savollar: {selectedWrittenWork.totalQuestions} | Vaqt: {selectedWrittenWork.timeGiven} daqiqa
                  </p>
                </div>
                <form onSubmit={handleSaveWrittenWorkResult} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      To'g'ri ishlagan savollar soni *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max={selectedWrittenWork.totalQuestions}
                      value={writtenWorkResultForm.correctAnswers}
                      onChange={(e) =>
                        setWrittenWorkResultForm({ ...writtenWorkResultForm, correctAnswers: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder={`0 dan ${selectedWrittenWork.totalQuestions} gacha`}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Maksimal: {selectedWrittenWork.totalQuestions} ta
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Qolgan vaqt (daqiqa) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max={selectedWrittenWork.timeGiven}
                      value={writtenWorkResultForm.remainingTime}
                      onChange={(e) =>
                        setWrittenWorkResultForm({ ...writtenWorkResultForm, remainingTime: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder={`0 dan ${selectedWrittenWork.timeGiven} gacha`}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      0 bo'lsa vaqtdan oldin topshirmagan, {selectedWrittenWork.timeGiven} dan kam bo'lsa vaqtdan oldin topshirgan
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Qo'shimcha izoh (ixtiyoriy)
                    </label>
                    <textarea
                      value={writtenWorkResultForm.notes}
                      onChange={(e) =>
                        setWrittenWorkResultForm({ ...writtenWorkResultForm, notes: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Qo'shimcha ma'lumot..."
                    />
                  </div>
                  {writtenWorkResultForm.correctAnswers && (
                    <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                      <p className="text-sm text-gray-400">Hisoblangan natija:</p>
                      <p className="text-xl font-bold text-orange-400">
                        {(() => {
                          const correct = parseInt(writtenWorkResultForm.correctAnswers)
                          const total = selectedWrittenWork.totalQuestions
                          const remaining = parseInt(writtenWorkResultForm.remainingTime) || 0
                          const timeGiven = selectedWrittenWork.timeGiven
                          const correctRatio = correct / total
                          let score = 0
                          if (remaining > 0) {
                            score = correctRatio * (1 + remaining / timeGiven) * correctRatio
                          } else {
                            score = correctRatio
                          }
                          score = Math.max(0, Math.min(1, score))
                          return (score * 100).toFixed(1)
                        })()}%
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {parseInt(writtenWorkResultForm.remainingTime) > 0 
                          ? 'Vaqtdan oldin topshirilgan' 
                          : 'Vaqtdan oldin topshirmagan'}
                      </p>
                    </div>
                  )}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                    >
                      Saqlash
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowWrittenWorkResultModal(false)
                        setSelectedStudent(null)
                        setWrittenWorkResultForm({ correctAnswers: '', remainingTime: '0', notes: '' })
                      }}
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
