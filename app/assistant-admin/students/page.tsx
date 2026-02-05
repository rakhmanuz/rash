'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { 
  Plus, 
  UserPlus,
  X,
  Check,
  Users,
  BookOpen
} from 'lucide-react'

interface Student {
  id: string
  studentId: string
  user: {
    id: string
    name: string
    username: string
    phone?: string
  }
  currentGroupId?: string
  currentGroupName?: string
}

interface Group {
  id: string
  name: string
  description?: string
  maxStudents: number
  enrollments: Array<{ id: string }>
}

export default function AssistantAdminStudentsPage() {
  const { data: session } = useSession()
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    password: '',
    studentId: '',
  })
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    fetchStudents()
    fetchGroups()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/assistant-admin/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/assistant-admin/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    }
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/assistant-admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert('O\'quvchi muvaffaqiyatli qo\'shildi!')
        setShowAddModal(false)
        setFormData({ name: '', username: '', phone: '', password: '', studentId: '' })
        fetchStudents()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error adding student:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleAssignToGroup = async () => {
    if (!selectedStudent || !selectedGroupId) {
      alert('O\'quvchi va guruh tanlanishi kerak')
      return
    }

    setAssigning(true)
    try {
      const response = await fetch(`/api/assistant-admin/groups/${selectedGroupId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudent.id }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message || 'O\'quvchi guruhga muvaffaqiyatli biriktirildi!')
        setShowAssignModal(false)
        setSelectedStudent(null)
        setSelectedGroupId('')
        fetchStudents()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error assigning student:', error)
      alert('Xatolik yuz berdi')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <DashboardLayout role="ASSISTANT_ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 break-words">
              O'quvchilar Boshqaruvi
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-400 break-words">
              O'quvchi qo'shish va guruhga biriktirish
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setFormData({ name: '', username: '', phone: '', password: '', studentId: '' })
                setShowAddModal(true)
              }}
              className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-xs sm:text-sm md:text-base flex-shrink-0"
            >
              <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              <span className="whitespace-nowrap hidden sm:inline">Yangi O'quvchi</span>
              <span className="whitespace-nowrap sm:hidden">Qo'shish</span>
            </button>
          </div>
        </div>

        {/* Students List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Yuklanmoqda...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-xl border border-gray-700">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">O'quvchilar topilmadi</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-white">ID</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-white">Ism</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-white">Login</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-white hidden lg:table-cell">Telefon</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-white">Guruh</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-white">Harakatlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3 text-xs sm:text-sm text-gray-300">{student.studentId}</td>
                      <td className="px-4 py-3 text-xs sm:text-sm text-white font-medium">{student.user.name}</td>
                      <td className="px-4 py-3 text-xs sm:text-sm text-gray-300">{student.user.username}</td>
                      <td className="px-4 py-3 text-xs sm:text-sm text-gray-300 hidden lg:table-cell">{student.user.phone || '-'}</td>
                      <td className="px-4 py-3 text-xs sm:text-sm">
                        {student.currentGroupName ? (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold border border-blue-500/30">
                            {student.currentGroupName}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs font-semibold border border-gray-500/30">
                            Guruh yo'q
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs sm:text-sm">
                        <button
                          onClick={() => {
                            setSelectedStudent(student)
                            setSelectedGroupId(student.currentGroupId || '')
                            setShowAssignModal(true)
                          }}
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-xs sm:text-sm flex items-center space-x-1"
                        >
                          <BookOpen className="h-3 w-3" />
                          <span className="hidden sm:inline">Guruhga Biriktirish</span>
                          <span className="sm:hidden">Biriktirish</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Student Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">Yangi O'quvchi Qo'shish</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ism</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Login</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    O'quvchi ID <span className="text-gray-500 text-xs">(ixtiyoriy - avtomatik generatsiya qilinadi)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    placeholder="Bo'sh qoldirilsa, avtomatik ID beriladi"
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Parol</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex items-center space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    Qo'shish
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Bekor qilish
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign to Group Modal */}
        {showAssignModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">Guruhga Biriktirish</h2>
                <button
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedStudent(null)
                    setSelectedGroupId('')
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">O'quvchi</label>
                  <div className="px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white">
                    {selectedStudent.user.name} ({selectedStudent.studentId})
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Guruh</label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Guruhni tanlang</option>
                    {groups.map((group) => {
                      const currentCount = group.enrollments.length
                      const isFull = currentCount >= group.maxStudents
                      return (
                        <option
                          key={group.id}
                          value={group.id}
                          disabled={isFull}
                        >
                          {group.name} {isFull ? '(To\'ldi)' : `(${currentCount}/${group.maxStudents})`}
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div className="flex items-center space-x-3 pt-4">
                  <button
                    onClick={handleAssignToGroup}
                    disabled={!selectedGroupId || assigning}
                    className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {assigning ? 'Biriktirilmoqda...' : 'Biriktirish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignModal(false)
                      setSelectedStudent(null)
                      setSelectedGroupId('')
                    }}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
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
