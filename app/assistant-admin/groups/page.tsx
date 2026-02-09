'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  BookOpen,
  X,
  UserPlus,
  UserMinus,
  Check,
  ArrowRight
} from 'lucide-react'

interface Group {
  id: string
  name: string
  description?: string
  teacher: {
    id: string
    user: {
      name: string
      username: string
    }
  }
  maxStudents: number
  isActive: boolean
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

interface Teacher {
  id: string
  teacherId: string
  user: {
    name: string
    username: string
  }
}

interface Student {
  id: string
  studentId: string
  user: {
    name: string
    username: string
  }
  currentGroupId?: string
}

export default function GroupsPage() {
  const { data: session } = useSession()
  const [groups, setGroups] = useState<Group[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('') // O'qituvchi filter
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [showChangeGroupModal, setShowChangeGroupModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teacherId: '',
    maxStudents: '20',
  })
  const [addModalStudentIds, setAddModalStudentIds] = useState<string[]>([])

  useEffect(() => {
    fetchGroups()
    fetchTeachers()
    fetchStudents()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/admin/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/admin/teachers')
      if (response.ok) {
        const data = await response.json()
        setTeachers(data)
      }
    } catch (error) {
      console.error('Error fetching teachers:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students?includeEnrollment=true')
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxStudents: parseInt(formData.maxStudents) || 20,
        }),
      })

      if (response.ok) {
        const newGroup = await response.json()
        
        // Agar o'quvchilar tanlangan bo'lsa, ularni guruhga qo'shish
        if (addModalStudentIds.length > 0) {
          for (const studentId of addModalStudentIds) {
            try {
              await fetch(`/api/admin/groups/${newGroup.id}/enroll?studentId=${studentId}`, {
                method: 'POST',
              })
            } catch (error) {
              console.error(`Error enrolling student ${studentId}:`, error)
            }
          }
        }
        
        setShowAddModal(false)
        setFormData({ name: '', description: '', teacherId: '', maxStudents: '20' })
        setAddModalStudentIds([])
        // O'qituvchi tanlangan bo'lsa, filter o'zgaradi
        if (formData.teacherId) {
          setSelectedTeacherFilter(formData.teacherId)
        }
        fetchGroups()
        fetchStudents()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error adding group:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroup) return

    try {
      const response = await fetch(`/api/admin/groups/${selectedGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxStudents: parseInt(formData.maxStudents) || 20,
          isActive: selectedGroup.isActive,
        }),
      })

      if (response.ok) {
        setShowEditModal(false)
        setSelectedGroup(null)
        // O'qituvchi tanlangan bo'lsa, filter o'zgaradi
        if (formData.teacherId) {
          setSelectedTeacherFilter(formData.teacherId)
        }
        setFormData({ name: '', description: '', teacherId: '', maxStudents: '20' })
        fetchGroups()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error editing group:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Guruhni o\'chirishni tasdiqlaysizmi?')) return

    try {
      const response = await fetch(`/api/admin/groups/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchGroups()
      }
    } catch (error) {
      console.error('Error deleting group:', error)
    }
  }

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleEnrollStudents = async () => {
    if (!selectedGroup || selectedStudentIds.length === 0) return

    try {
      let successCount = 0
      let errorCount = 0

      for (const studentId of selectedStudentIds) {
        try {
          const response = await fetch(`/api/admin/groups/${selectedGroup.id}/enroll`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId }),
          })

          if (response.ok) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
        }
      }

      if (successCount > 0) {
        alert(`${successCount} ta o'quvchi guruhga biriktirildi${errorCount > 0 ? `, ${errorCount} ta xatolik` : ''}`)
        setSelectedStudentIds([])
        setShowEnrollModal(false)
        fetchGroups()
        fetchStudents()
      } else {
        alert('Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error enrolling students:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleChangeGroup = async (newGroupId: string) => {
    if (!selectedStudent) return

    try {
      // First, unenroll from ALL groups (set all enrollments to inactive)
      if (selectedStudent.currentGroupId) {
        const unenrollResponse = await fetch(`/api/admin/groups/${selectedStudent.currentGroupId}/enroll?studentId=${selectedStudent.id}`, {
          method: 'DELETE',
        })
        
        if (!unenrollResponse.ok) {
          const error = await unenrollResponse.json()
          alert(error.error || 'Eski guruhdan chiqarishda xatolik')
          return
        }
        
        // Wait a bit to ensure the database update is complete
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Then enroll to new group
      const response = await fetch(`/api/admin/groups/${newGroupId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudent.id }),
      })

      if (response.ok) {
        alert('O\'quvchi guruhga muvaffaqiyatli ko\'chirildi')
        setShowChangeGroupModal(false)
        setSelectedStudent(null)
        // Refresh data
        await fetchGroups()
        await fetchStudents()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error changing group:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleUnenrollStudent = async (studentId: string) => {
    if (!selectedGroup) return
    if (!confirm('O\'quvchini guruhdan chiqarishni tasdiqlaysizmi?')) return

    try {
      const response = await fetch(`/api/admin/groups/${selectedGroup.id}/enroll?studentId=${studentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchGroups()
        fetchStudents()
        alert('O\'quvchi guruhdan chiqarildi')
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error unenrolling student:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const filteredGroups = groups.filter(group => {
    // O'qituvchi filter
    if (selectedTeacherFilter && group.teacher.id !== selectedTeacherFilter) {
      return false
    }
    // Search filter
    return (
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.teacher.user.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Get students not enrolled in selected group
  const getAvailableStudents = () => {
    if (!selectedGroup) return students
    const enrolledIds = selectedGroup.enrollments.map(e => e.student.id)
    return students.filter(s => !enrolledIds.includes(s.id))
  }

  // Split name into first and last name
  const splitName = (fullName: string) => {
    const parts = fullName.trim().split(' ')
    if (parts.length === 1) return { firstName: parts[0], lastName: '' }
    const lastName = parts[parts.length - 1]
    const firstName = parts.slice(0, -1).join(' ')
    return { firstName, lastName }
  }

  return (
    <DashboardLayout role="ASSISTANT_ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Guruhlar Boshqaruvi</h1>
            <p className="text-sm sm:text-base text-gray-400">Barcha guruhlarni boshqaring va o&apos;quvchilarni biriktiring</p>
          </div>
          <button
            onClick={() => {
              setFormData({ name: '', description: '', teacherId: '', maxStudents: '20' })
              setAddModalStudentIds([])
              setShowAddModal(true)
            }}
            className="flex items-center space-x-2 px-3 sm:px-6 py-2 sm:py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm sm:text-base"
          >
            <Plus className="h-5 w-5" />
            <span>Yangi Guruh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Qidirish (guruh nomi, o'qituvchi)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {/* Teacher Filter */}
          <div>
            <select
              value={selectedTeacherFilter}
              onChange={(e) => setSelectedTeacherFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Barcha o'qituvchilar</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user.name} ({teacher.teacherId})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Yuklanmoqda...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-xl border border-gray-700">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">Guruhlar topilmadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {filteredGroups.map((group) => (
              <div key={group.id} className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 sm:p-6 shadow-lg">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 truncate">{group.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-400 truncate">{group.teacher.user.name}</p>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => {
                        setSelectedGroup(group)
                        setFormData({
                          name: group.name,
                          description: group.description || '',
                          teacherId: group.teacher.id,
                          maxStudents: group.maxStudents.toString(),
                        })
                        setShowEditModal(true)
                      }}
                      className="p-1.5 sm:p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Tahrirlash"
                    >
                      <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGroup(group)
                        setSelectedStudentIds([])
                        setShowEnrollModal(true)
                      }}
                      className="p-1.5 sm:p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                      title="O&apos;quvchi qo'shish"
                    >
                      <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-1.5 sm:p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="O'chirish"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>

                {group.description && (
                  <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4 line-clamp-2">{group.description}</p>
                )}

                <div className="flex items-center justify-between text-xs sm:text-sm mb-3 sm:mb-4">
                  <span className="text-gray-400">
                    O&apos;quvchilar: <span className="text-white font-semibold">{group.enrollments.length}/{group.maxStudents}</span>
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${group.isActive ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                    {group.isActive ? 'Faol' : 'Nofaol'}
                  </span>
                </div>

                {/* Students List */}
                <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
                  {group.enrollments.length === 0 ? (
                    <p className="text-xs sm:text-sm text-gray-500 text-center py-4">O&apos;quvchilar yo&apos;q</p>
                  ) : (
                    group.enrollments.map((enrollment) => {
                      const { firstName, lastName } = splitName(enrollment.student.user.name)
                      return (
                        <div key={enrollment.id} className="flex items-center justify-between p-2 sm:p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs sm:text-sm text-white font-medium truncate">
                                {firstName} {lastName && <span className="font-semibold">{lastName}</span>}
                              </p>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 truncate">{enrollment.student.studentId}</p>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
                            <button
                              onClick={() => {
                                setSelectedStudent(enrollment.student as any)
                                setShowChangeGroupModal(true)
                              }}
                              className="p-1 sm:p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                              title="Guruhni o'zgartirish"
                            >
                              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              onClick={() => handleUnenrollStudent(enrollment.student.id)}
                              className="p-1 sm:p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                              title="O&apos;quvchini chiqarish"
                            >
                              <UserMinus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
            <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-md max-h-[90vh] my-4">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Yangi Guruh Qo&apos;shish</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
              <form onSubmit={handleAddGroup} className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Guruh Nomi</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">O&apos;qituvchi</label>
                  <select
                    required
                    value={formData.teacherId}
                    onChange={(e) => {
                      setFormData({ ...formData, teacherId: e.target.value })
                      // O'qituvchi tanlanganda, faqat shu o'qituvchining guruhlari ko'rsatiladi
                      setSelectedTeacherFilter(e.target.value)
                    }}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">O&apos;qituvchi tanlang</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.user.name} ({teacher.teacherId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tavsif</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Maksimal O&apos;quvchilar</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                {/* O'quvchilar tanlash */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    O&apos;quvchilar ({addModalStudentIds.length} tanlangan)
                  </label>
                  <div className="max-h-48 sm:max-h-60 overflow-y-auto border border-gray-600 rounded-lg bg-slate-700/50">
                    {students.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">O&apos;quvchilar topilmadi</p>
                    ) : (
                      <div className="p-2 space-y-1">
                        {students.map((student) => {
                          const { firstName, lastName } = splitName(student.user.name)
                          const isSelected = addModalStudentIds.includes(student.id)
                          return (
                            <label
                              key={student.id}
                              className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-slate-600 transition-colors ${
                                isSelected ? 'bg-green-500/20 border border-green-500/30' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAddModalStudentIds([...addModalStudentIds, student.id])
                                  } else {
                                    setAddModalStudentIds(addModalStudentIds.filter(id => id !== student.id))
                                  }
                                }}
                                className="w-4 h-4 text-green-500 bg-slate-700 border-gray-600 rounded focus:ring-green-500 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">
                                  {firstName} {lastName && <span className="font-semibold">{lastName}</span>}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{student.studentId}</p>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    Qo&apos;shish
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setAddModalStudentIds([])
                    }}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Bekor qilish
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">Guruhni Tahrirlash</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleEditGroup} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Guruh Nomi</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">O&apos;qituvchi</label>
                  <select
                    required
                    value={formData.teacherId}
                    onChange={(e) => {
                      setFormData({ ...formData, teacherId: e.target.value })
                      // O'qituvchi tanlanganda, faqat shu o'qituvchining guruhlari ko'rsatiladi
                      setSelectedTeacherFilter(e.target.value)
                    }}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">O&apos;qituvchi tanlang</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.user.name} ({teacher.teacherId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tavsif</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Maksimal O&apos;quvchilar</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex items-center space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    Saqlash
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Bekor qilish
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Enroll Modal with Checkboxes */}
        {showEnrollModal && selectedGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
                <h2 className="text-lg sm:text-xl font-semibold text-white truncate pr-2">
                  <span className="hidden sm:inline">O&apos;quvchi Qo'shish - </span>
                  {selectedGroup.name}
                </h2>
                <button
                  onClick={() => {
                    setShowEnrollModal(false)
                    setSelectedStudentIds([])
                  }}
                  className="text-gray-400 hover:text-white flex-shrink-0"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="O&apos;quvchi qidirish (ism, familiya, ID)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    {selectedStudentIds.length > 0 && `${selectedStudentIds.length} ta tanlangan`}
                  </span>
                  {selectedStudentIds.length > 0 && (
                    <button
                      onClick={() => setSelectedStudentIds([])}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Tanlovni bekor qilish
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {getAvailableStudents().length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Barcha o'quvchilar guruhga biriktirilgan</p>
                  ) : (
                    getAvailableStudents()
                      .filter(student => {
                        const { firstName, lastName } = splitName(student.user.name)
                        const searchLower = searchTerm.toLowerCase()
                        return (
                          firstName.toLowerCase().includes(searchLower) ||
                          lastName.toLowerCase().includes(searchLower) ||
                          student.studentId.toLowerCase().includes(searchLower) ||
                          student.user.username.toLowerCase().includes(searchLower)
                        )
                      })
                      .map((student) => {
                        const { firstName, lastName } = splitName(student.user.name)
                        const isSelected = selectedStudentIds.includes(student.id)
                        return (
                          <div
                            key={student.id}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-green-500/20 border-2 border-green-500'
                                : 'bg-slate-700/50 border-2 border-transparent hover:bg-slate-700'
                            }`}
                            onClick={() => handleToggleStudent(student.id)}
                          >
                            <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-500'
                            }`}>
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-white font-medium">
                                  {firstName} {lastName && <span className="font-semibold">{lastName}</span>}
                                </p>
                                {student.currentGroupId && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                                    {groups.find(g => g.id === student.currentGroupId)?.name || 'Boshqa guruh'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-1">
                                {student.studentId} • {student.user.username}
                              </p>
                            </div>
                          </div>
                        )
                      })
                  )}
                </div>
              </div>
              <div className="p-6 border-t border-gray-700 flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  {selectedStudentIds.length} ta o'quvchi tanlandi
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowEnrollModal(false)
                      setSelectedStudentIds([])
                    }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleEnrollStudents}
                    disabled={selectedStudentIds.length === 0}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Qo&apos;shish ({selectedStudentIds.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Change Group Modal */}
        {showChangeGroupModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">Guruhni O'zgartirish</h2>
                <button
                  onClick={() => {
                    setShowChangeGroupModal(false)
                    setSelectedStudent(null)
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">O&apos;quvchi</p>
                  <p className="text-white font-semibold">
                    {splitName(selectedStudent.user.name).firstName} {splitName(selectedStudent.user.name).lastName && <span className="font-bold">{splitName(selectedStudent.user.name).lastName}</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{selectedStudent.studentId}</p>
                </div>
                {selectedStudent.currentGroupId && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">Joriy guruh</p>
                    <p className="text-white">
                      {groups.find(g => g.id === selectedStudent.currentGroupId)?.name || 'Noma\'lum'}
                    </p>
                  </div>
                )}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Yangi guruh tanlang</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleChangeGroup(e.target.value)
                      }
                    }}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Guruh tanlang</option>
                    {groups
                      .filter(g => g.id !== selectedStudent.currentGroupId)
                      .map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name} ({group.enrollments.length}/{group.maxStudents})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-400">
                    ⚠️ Eslatma: Guruh o'zgarganda o'quvchining barcha ballari, davomatlari va boshqa ma'lumotlari saqlanib qoladi.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowChangeGroupModal(false)
                    setSelectedStudent(null)
                  }}
                  className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
