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
  Users,
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
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-primary)] mb-2">Guruhlar Boshqaruvi</h1>
            <p className="text-sm sm:text-base text-[var(--text-secondary)]">Barcha guruhlarni boshqaring va o&apos;quvchilarni biriktiring</p>
          </div>
          <button
            onClick={() => {
              setFormData({ name: '', description: '', teacherId: '', maxStudents: '20' })
              setAddModalStudentIds([])
              setShowAddModal(true)
            }}
            className="flex items-center gap-2 px-4 sm:px-6 h-11 sm:h-[42px] bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-[10px] transition-all duration-200 hover:-translate-y-0.5 shadow-lg text-sm sm:text-base"
          >
            <Plus className="h-[18px] w-[18px]" />
            <span>Yangi Guruh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Qidirish (guruh nomi, o'qituvchi)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm transition-all"
            />
          </div>
          <div>
            <select
              value={selectedTeacherFilter}
              onChange={(e) => setSelectedTeacherFilter(e.target.value)}
              className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm transition-all"
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
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-[var(--border-default)] border-t-indigo-500 mx-auto"></div>
            <p className="mt-4 text-[var(--text-secondary)]">Yuklanmoqda...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-16 bg-[var(--bg-secondary)] rounded-[14px] border border-[var(--border-subtle)] assistant-card-shadow">
            <div className="w-12 h-12 rounded-[10px] bg-[var(--accent-muted)] flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-6 w-6 text-indigo-400" />
            </div>
            <p className="text-[var(--text-secondary)] font-medium">Guruhlar topilmadi</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Yangi guruh qo&apos;shish uchun yuqoridagi tugmani bosing</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredGroups.map((group) => (
              <div key={group.id} className="bg-[var(--bg-secondary)] rounded-[14px] border border-[var(--border-subtle)] p-4 sm:p-6 assistant-card-shadow hover:border-indigo-500/30 hover:-translate-y-0.5 transition-all duration-200 group">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-1 truncate flex items-center gap-2">
                      <span className="w-8 h-8 rounded-[10px] bg-[var(--accent-muted)] flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-4 w-4 text-indigo-400" />
                      </span>
                      {group.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] truncate ml-10">{group.teacher.user.name}</p>
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
                      className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-indigo-400 rounded-[10px] transition-colors"
                      title="Tahrirlash"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGroup(group)
                        setSelectedStudentIds([])
                        setShowEnrollModal(true)
                      }}
                      className="p-2 text-[var(--text-secondary)] hover:bg-emerald-500/20 hover:text-emerald-400 rounded-[10px] transition-colors"
                      title="O&apos;quvchi qo'shish"
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-2 text-[var(--text-secondary)] hover:bg-red-500/20 hover:text-red-400 rounded-[10px] transition-colors"
                      title="O'chirish"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {group.description && (
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-3 sm:mb-4 line-clamp-2">{group.description}</p>
                )}

                <div className="flex items-center justify-between text-xs sm:text-sm mb-3 sm:mb-4">
                  <span className="text-[var(--text-secondary)] flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-[var(--text-primary)] font-semibold">{group.enrollments.length}/{group.maxStudents}</span> o&apos;quvchi
                  </span>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${group.isActive ? 'bg-emerald-500/12 text-emerald-400' : 'bg-[var(--error-muted)] text-[var(--error)]'}`}>
                    {group.isActive ? 'Faol' : 'Nofaol'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (group.enrollments.length / group.maxStudents) * 100 >= 86 ? 'bg-red-500' :
                        (group.enrollments.length / group.maxStudents) * 100 >= 51 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (group.enrollments.length / group.maxStudents) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {Math.round((group.enrollments.length / group.maxStudents) * 100)}% to&apos;ldi
                  </p>
                </div>

                {/* Students List */}
                <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
                  {group.enrollments.length === 0 ? (
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] text-center py-4">O&apos;quvchilar yo&apos;q</p>
                  ) : (
                    group.enrollments.map((enrollment) => {
                      const { firstName, lastName } = splitName(enrollment.student.user.name)
                      return (
                        <div key={enrollment.id} className="flex items-center justify-between p-2 sm:p-3 bg-[var(--bg-tertiary)] rounded-[10px] hover:bg-[var(--bg-elevated)] transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs sm:text-sm text-[var(--text-primary)] font-medium truncate">
                                {firstName} {lastName && <span className="font-semibold">{lastName}</span>}
                              </p>
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-1 truncate">{enrollment.student.studentId}</p>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
                            <button
                              onClick={() => {
                                setSelectedStudent(enrollment.student as any)
                                setShowChangeGroupModal(true)
                              }}
                              className="p-2 text-[var(--text-secondary)] hover:bg-indigo-500/20 hover:text-indigo-400 rounded-[10px] transition-colors"
                              title="Guruhni o'zgartirish"
                            >
                              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              onClick={() => handleUnenrollStudent(enrollment.student.id)}
                              className="p-2 text-[var(--text-secondary)] hover:bg-red-500/20 hover:text-red-400 rounded-[10px] transition-colors"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
            <div className="bg-[var(--bg-secondary)] rounded-[20px] border border-[var(--border-subtle)] assistant-elevated-shadow w-full max-w-md max-h-[90vh] my-4 animate-fade-in-up">
              <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Yangi Guruh Qo&apos;shish</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-[10px] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddGroup} className="p-6 space-y-4 overflow-y-auto">
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
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Tavsif</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Maksimal O&apos;quvchilar</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">
                    O&apos;quvchilar ({addModalStudentIds.length} tanlangan)
                  </label>
                  <div className="max-h-48 sm:max-h-60 overflow-y-auto border border-[var(--border-default)] rounded-[10px] bg-[var(--bg-tertiary)]">
                    {students.length === 0 ? (
                      <p className="text-sm text-[var(--text-muted)] text-center py-4">O&apos;quvchilar topilmadi</p>
                    ) : (
                      <div className="p-2 space-y-1">
                        {students.map((student) => {
                          const { firstName, lastName } = splitName(student.user.name)
                          const isSelected = addModalStudentIds.includes(student.id)
                          return (
                            <label
                              key={student.id}
                              className={`flex items-center gap-2 p-2 rounded-[10px] cursor-pointer transition-colors ${
                                isSelected ? 'bg-indigo-500/12 border border-indigo-500/30' : 'hover:bg-[var(--bg-elevated)]'
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
                                className="w-4 h-4 text-indigo-500 bg-[var(--bg-tertiary)] border-[var(--border-default)] rounded focus:ring-indigo-500/50 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-[var(--text-primary)] truncate">
                                  {firstName} {lastName && <span className="font-semibold">{lastName}</span>}
                                </p>
                                <p className="text-xs text-[var(--text-muted)] truncate">{student.studentId}</p>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-[var(--border-subtle)]">
                  <button
                    type="submit"
                    className="flex-1 h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-[10px] transition-all"
                  >
                    Qo&apos;shish
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setAddModalStudentIds([])
                    }}
                    className="flex-1 h-11 px-4 border border-[var(--border-default)] text-[var(--text-secondary)] font-medium rounded-[10px] hover:bg-[var(--bg-elevated)] transition-colors"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-secondary)] rounded-[20px] border border-[var(--border-subtle)] assistant-elevated-shadow w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Guruhni Tahrirlash</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-[10px] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleEditGroup} className="p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Guruh Nomi</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">O&apos;qituvchi</label>
                  <select
                    required
                    value={formData.teacherId}
                    onChange={(e) => {
                      setFormData({ ...formData, teacherId: e.target.value })
                      setSelectedTeacherFilter(e.target.value)
                    }}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
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
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Tavsif</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Maksimal O&apos;quvchilar</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div className="flex gap-3 pt-4 border-t border-[var(--border-subtle)]">
                  <button
                    type="submit"
                    className="flex-1 h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-[10px] transition-all"
                  >
                    Saqlash
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 h-11 px-4 border border-[var(--border-default)] text-[var(--text-secondary)] font-medium rounded-[10px] hover:bg-[var(--bg-elevated)] transition-colors"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-[var(--bg-secondary)] rounded-[20px] border border-[var(--border-subtle)] assistant-elevated-shadow w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border-subtle)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] truncate pr-2">
                  <span className="hidden sm:inline">O&apos;quvchi Qo&apos;shish — </span>
                  {selectedGroup.name}
                </h2>
                <button
                  onClick={() => {
                    setShowEnrollModal(false)
                    setSelectedStudentIds([])
                  }}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-[10px] flex-shrink-0 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="mb-4 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="O&apos;quvchi qidirish (ism, familiya, ID)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {selectedStudentIds.length > 0 && `${selectedStudentIds.length} ta tanlangan`}
                  </span>
                  {selectedStudentIds.length > 0 && (
                    <button
                      onClick={() => setSelectedStudentIds([])}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Tanlovni bekor qilish
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {getAvailableStudents().length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)] text-center py-4">Barcha o&apos;quvchilar guruhga biriktirilgan</p>
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
                            className={`flex items-center gap-3 p-3 rounded-[10px] transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-500/12 border-2 border-indigo-500/50'
                                : 'bg-[var(--bg-tertiary)] border-2 border-transparent hover:bg-[var(--bg-elevated)]'
                            }`}
                            onClick={() => handleToggleStudent(student.id)}
                          >
                            <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected
                                ? 'bg-indigo-500 border-indigo-500'
                                : 'border-[var(--border-default)]'
                            }`}>
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-[var(--text-primary)] font-medium">
                                  {firstName} {lastName && <span className="font-semibold">{lastName}</span>}
                                </p>
                                {student.currentGroupId && (
                                  <span className="text-xs px-2 py-0.5 bg-indigo-500/12 text-indigo-400 rounded-md border border-indigo-500/30">
                                    {groups.find(g => g.id === student.currentGroupId)?.name || 'Boshqa guruh'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[var(--text-muted)] mt-1">
                                {student.studentId} • {student.user.username}
                              </p>
                            </div>
                          </div>
                        )
                      })
                  )}
                </div>
              </div>
              <div className="p-6 border-t border-[var(--border-subtle)] flex items-center justify-between gap-4">
                <span className="text-sm text-[var(--text-secondary)]">
                  {selectedStudentIds.length} ta o&apos;quvchi tanlandi
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowEnrollModal(false)
                      setSelectedStudentIds([])
                    }}
                    className="h-11 px-4 border border-[var(--border-default)] text-[var(--text-secondary)] font-medium rounded-[10px] hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleEnrollStudents}
                    disabled={selectedStudentIds.length === 0}
                    className="h-11 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-[10px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-secondary)] rounded-[20px] border border-[var(--border-subtle)] assistant-elevated-shadow w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Guruhni O&apos;zgartirish</h2>
                <button
                  onClick={() => {
                    setShowChangeGroupModal(false)
                    setSelectedStudent(null)
                  }}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-[10px] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-[var(--text-secondary)] mb-2">O&apos;quvchi</p>
                  <p className="text-[var(--text-primary)] font-semibold">
                    {splitName(selectedStudent.user.name).firstName} {splitName(selectedStudent.user.name).lastName && <span className="font-bold">{splitName(selectedStudent.user.name).lastName}</span>}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{selectedStudent.studentId}</p>
                </div>
                {selectedStudent.currentGroupId && (
                  <div className="mb-4">
                    <p className="text-sm text-[var(--text-secondary)] mb-2">Joriy guruh</p>
                    <p className="text-[var(--text-primary)]">
                      {groups.find(g => g.id === selectedStudent.currentGroupId)?.name || 'Noma\'lum'}
                    </p>
                  </div>
                )}
                <div className="mb-6">
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Yangi guruh tanlang</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleChangeGroup(e.target.value)
                      }
                    }}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
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
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-[10px] p-3 mb-4">
                  <p className="text-xs text-indigo-300">
                    ⚠️ Eslatma: Guruh o&apos;zgarganda o&apos;quvchining barcha ballari, davomatlari va boshqa ma&apos;lumotlari saqlanib qoladi.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowChangeGroupModal(false)
                    setSelectedStudent(null)
                  }}
                  className="w-full h-11 px-4 border border-[var(--border-default)] text-[var(--text-secondary)] font-medium rounded-[10px] hover:bg-[var(--bg-elevated)] transition-colors"
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
