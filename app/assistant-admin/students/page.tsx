'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  UserPlus,
  X,
  Users,
  BookOpen,
  Phone,
  Sparkles,
  Pencil
} from 'lucide-react'

interface Student {
  id: string
  studentId: string
  contacts?: Array<{ label: string; phone: string }>
  createdAt?: string
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
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [permissions, setPermissions] = useState<any>(null)
  const [permissionsLoading, setPermissionsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [editingStudentId, setEditingStudentId] = useState<string>('')
  const [formData, setFormData] = useState({
    fullName: '',
    contacts: [
      { label: '', phone: '' },
      { label: '', phone: '' },
      { label: '', phone: '' },
    ],
  })
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    contacts: [
      { label: '', phone: '' },
      { label: '', phone: '' },
      { label: '', phone: '' },
    ],
  })
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await fetch('/api/assistant-admin/permissions')
        if (response.ok) {
          const data = await response.json()
          setPermissions(data)
        } else {
          setPermissions({})
        }
      } catch (error) {
        console.error('Error fetching assistant permissions:', error)
        setPermissions({})
      } finally {
        setPermissionsLoading(false)
      }
    }
    fetchPermissions()
  }, [])

  useEffect(() => {
    if (permissionsLoading) return
    if (permissions?.students?.view) {
      fetchStudents()
      fetchGroups()
    } else {
      setLoading(false)
      router.replace('/assistant-admin/dashboard')
    }
  }, [permissionsLoading, permissions, router])

  const canViewStudents = Boolean(permissions?.students?.view)
  const canCreateStudents = canViewStudents && Boolean(permissions?.students?.create)
  const canEditStudents = canViewStudents && Boolean(permissions?.students?.edit)

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
    if (!canCreateStudents) {
      alert("Sizda o'quvchi qo'shish ruxsati yo'q")
      return
    }
    const filledPhones = formData.contacts.filter((c) => c.phone.trim())
    if (filledPhones.length < 2) {
      alert('Kamida 2 ta telefon raqam kiriting')
      return
    }
    for (const contact of filledPhones) {
      if (!contact.label.trim()) {
        alert('Telefon raqam kiritilgan bo‘lsa, kimligi ham yozilishi kerak')
        return
      }
    }
    try {
      const response = await fetch('/api/assistant-admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        alert(
          `O'quvchi qo'shildi!\nLogin: ${data?.credentials?.username}\nParol: ${data?.credentials?.password}`
        )
        setFormData({
          fullName: '',
          contacts: [
            { label: '', phone: '' },
            { label: '', phone: '' },
            { label: '', phone: '' },
          ],
        })
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

  const openEditModal = (student: Student) => {
    if (!canEditStudents) {
      alert("Sizda o'quvchini tahrirlash ruxsati yo'q")
      return
    }
    const contacts = [...(student.contacts || [])]
    while (contacts.length < 3) {
      contacts.push({ label: '', phone: '' })
    }
    setEditingStudentId(student.id)
    setEditFormData({
      fullName: student.user.name || '',
      contacts: contacts.slice(0, 3).map((c) => ({
        label: c.label || '',
        phone: c.phone || '',
      })),
    })
    setShowEditModal(true)
  }

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canEditStudents) {
      alert("Sizda o'quvchini tahrirlash ruxsati yo'q")
      return
    }
    const filledPhones = editFormData.contacts.filter((c) => c.phone.trim())
    if (filledPhones.length < 2) {
      alert('Kamida 2 ta telefon raqam kiriting')
      return
    }
    for (const contact of filledPhones) {
      if (!contact.label.trim()) {
        alert('Telefon raqam kiritilgan bo‘lsa, kimligi ham yozilishi kerak')
        return
      }
    }

    try {
      const response = await fetch('/api/assistant-admin/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: editingStudentId,
          fullName: editFormData.fullName,
          contacts: editFormData.contacts,
        }),
      })

      if (response.ok) {
        alert("O'quvchi ma'lumotlari yangilandi")
        setShowEditModal(false)
        setEditingStudentId('')
        fetchStudents()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error updating student:', error)
      alert('Xatolik yuz berdi')
    }
  }

  return (
    <DashboardLayout role="ASSISTANT_ADMIN">
      <div className="space-y-6">
        {!permissionsLoading && !canViewStudents && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-300 font-medium">Sizda bu bo&apos;limni ko&apos;rish ruxsati yo&apos;q.</p>
          </div>
        )}

        {canCreateStudents && (
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl p-4 sm:p-6 text-white">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Yangi o&apos;quvchi qo&apos;shing
          </h1>
          <p className="text-sm text-blue-100 mt-1">
            Ism-familya va aloqa raqamlarini kiriting. Student ID avtomatik beriladi.
          </p>
          </div>
        )}

        {canCreateStudents && (
          <div className="bg-slate-800 rounded-xl border border-gray-700 p-4 sm:p-6">
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ism familya</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masalan: Aliyev Bekzod"
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-300">
                Telefon raqamlar (kamida 2 tasi majburiy)
              </p>
              {formData.contacts.map((contact, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={contact.label}
                    onChange={(e) =>
                      setFormData((prev) => {
                        const next = [...prev.contacts]
                        next[idx] = { ...next[idx], label: e.target.value }
                        return { ...prev, contacts: next }
                      })
                    }
                    placeholder={`Kimligi (masalan: ${idx === 0 ? 'otasi' : idx === 1 ? 'onasi' : 'bobosi'})`}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) =>
                      setFormData((prev) => {
                        const next = [...prev.contacts]
                        next[idx] = { ...next[idx], phone: e.target.value }
                        return { ...prev, contacts: next }
                      })
                    }
                    placeholder="+998901234567"
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Qo&apos;shish
              </button>
            </div>
          </form>
          </div>
        )}

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
            <div className="px-4 py-3 border-b border-gray-700">
              <h2 className="text-white font-semibold">Oxirgi 5 ta qo&apos;shilgan o&apos;quvchi</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-white">ID</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-white">Ism</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-white">Aloqa raqamlari</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-white">Guruh</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-white">Harakatlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3 text-xs sm:text-sm text-gray-300">{student.studentId}</td>
                      <td className="px-4 py-3 text-xs sm:text-sm text-white font-medium">{student.user.name}</td>
                      <td className="px-4 py-3 text-xs sm:text-sm text-gray-300">
                        <div className="space-y-1">
                          {(student.contacts || []).filter((c) => c.phone).map((c, i) => (
                            <div key={i} className="inline-flex items-center gap-1 rounded bg-slate-700/60 px-2 py-1 mr-1">
                              <Phone className="h-3 w-3 text-blue-400" />
                              <span className="text-gray-200">{c.label}: {c.phone}</span>
                            </div>
                          ))}
                          {(!student.contacts || student.contacts.filter((c) => c.phone).length === 0) && (
                            <span>-</span>
                          )}
                        </div>
                      </td>
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
                        <div className="flex items-center gap-2">
                          {canEditStudents && (
                            <button
                              onClick={() => openEditModal(student)}
                              className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-xs sm:text-sm flex items-center space-x-1"
                            >
                              <Pencil className="h-3 w-3" />
                              <span className="hidden sm:inline">Tahrirlash</span>
                              <span className="sm:hidden">Edit</span>
                            </button>
                          )}
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Student Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">O&apos;quvchini tahrirlash</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleEditStudent} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ism familya</label>
                  <input
                    type="text"
                    required
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-300">Telefon raqamlar (kamida 2 tasi majburiy)</p>
                  {editFormData.contacts.map((contact, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={contact.label}
                        onChange={(e) =>
                          setEditFormData((prev) => {
                            const next = [...prev.contacts]
                            next[idx] = { ...next[idx], label: e.target.value }
                            return { ...prev, contacts: next }
                          })
                        }
                        placeholder={`Kimligi (masalan: ${idx === 0 ? 'otasi' : idx === 1 ? 'onasi' : 'bobosi'})`}
                        className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <input
                        type="tel"
                        value={contact.phone}
                        onChange={(e) =>
                          setEditFormData((prev) => {
                            const next = [...prev.contacts]
                            next[idx] = { ...next[idx], phone: e.target.value }
                            return { ...prev, contacts: next }
                          })
                        }
                        placeholder="+998901234567"
                        className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
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
