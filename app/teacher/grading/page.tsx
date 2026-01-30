'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { BookOpen, User, Search, Users, ChevronRight, Calendar, CheckCircle2, X, Plus, Clock } from 'lucide-react'

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

export default function TeacherGradingPage() {
  const { data: session } = useSession()
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [tests, setTests] = useState<Test[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTests, setLoadingTests] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showResultModal, setShowResultModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [groupSchedules, setGroupSchedules] = useState<any[]>([])
  const [loadingSchedules, setLoadingSchedules] = useState(false)
  const [selectedScheduleId, setSelectedScheduleId] = useState('')
  const [resultForm, setResultForm] = useState({
    correctAnswers: '',
    notes: '',
  })

  // Fetch groups
  useEffect(() => {
    fetch('/api/teacher/groups')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setGroups(data)
        } else {
          setGroups([])
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching groups:', err)
        setGroups([])
        setLoading(false)
      })
  }, [])

  // Fetch group schedules when group and date are selected
  const fetchGroupSchedules = async (groupId: string, date: string) => {
    if (!groupId || !date) {
      setGroupSchedules([])
      setSelectedScheduleId('')
      return
    }

    setLoadingSchedules(true)
    try {
      const response = await fetch(`/api/teacher/schedules?groupId=${groupId}&date=${date}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched schedules for teacher:', data)
        setGroupSchedules(data)
      } else {
        setGroupSchedules([])
      }
    } catch (error) {
      console.error('Error fetching group schedules:', error)
      setGroupSchedules([])
    } finally {
      setLoadingSchedules(false)
    }
  }

  // Fetch tests when group is selected
  useEffect(() => {
    if (!selectedGroup) {
      setTests([])
      setSelectedTest(null)
      setStudents([])
      setGroupSchedules([])
      setSelectedScheduleId('')
      return
    }

    // Fetch schedules when date changes
    if (selectedDate) {
      fetchGroupSchedules(selectedGroup.id, selectedDate)
    }

    setLoadingTests(true)
    let url = `/api/teacher/tests?date=${selectedDate}`
    if (selectedType !== 'all') {
      url += `&type=${selectedType}`
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Filter tests for selected group
          let groupTests = data.filter((test: Test) => test.groupId === selectedGroup.id)
          
          // If schedule is selected, filter by schedule
          if (selectedScheduleId) {
            groupTests = groupTests.filter((test: any) => test.classScheduleId === selectedScheduleId)
          }
          
          setTests(groupTests)
        } else {
          setTests([])
        }
        setLoadingTests(false)
      })
      .catch(err => {
        console.error('Error fetching tests:', err)
        setTests([])
        setLoadingTests(false)
      })
  }, [selectedGroup, selectedDate, selectedType, selectedScheduleId])

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
              const groupTests = data.filter((test: Test) => test.groupId === selectedGroup?.id)
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
            <p className="text-gray-400">Kunlik test va uyga vazifa natijalarini kiritish</p>
          </div>
        </div>

        {/* Step 1: Select Group */}
        {!selectedGroup && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-green-400" />
              Guruhni tanlang
            </h2>
            {groups.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-12 text-center border border-gray-700">
                <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Guruhlar topilmadi</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg hover:border-green-500/50 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors">
                        {group.name}
                      </h3>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-400 transition-colors" />
                    </div>
                    {group.description && (
                      <p className="text-sm text-gray-400 mb-3">{group.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Users className="h-4 w-4" />
                      <span>{group.enrollments.length} ta o'quvchi</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Test and Enter Results */}
        {selectedGroup && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedGroup(null)
                    setSelectedTest(null)
                    setTests([])
                    setStudents([])
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ← Guruhlarga qaytish
                </button>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                  {selectedGroup.name} - Test/Vazifa tanlash
                </h2>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Barchasi</option>
                <option value="kunlik_test">Kunlik test</option>
                <option value="uyga_vazifa">Uyga vazifa</option>
              </select>
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
                            <span>{new Date(test.date).toLocaleDateString('uz-UZ')}</span>
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
      </div>
    </DashboardLayout>
  )
}
