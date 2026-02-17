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

  const inputClass = 'w-full px-4 py-3 min-h-[44px] sm:min-h-[44px] text-[14px] bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)] focus:ring-2 focus:ring-indigo-500/20 transition-all'
  const labelClass = 'block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5'

  return (
    <DashboardLayout role="ASSISTANT_ADMIN">
      <div className="space-y-8 animate-fade-in-up">
        {!permissionsLoading && !canViewStudents && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-[var(--radius-lg)] p-6 text-center">
            <p className="text-red-300 font-medium">Sizda bu bo'limni ko'rish ruxsati yo'q.</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">O'quvchilar</h1>
          {canCreateStudents && (
            <button
              type="button"
              onClick={() => document.getElementById('add-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center gap-2 h-[42px] px-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-[var(--radius-md)] transition-all hover:-translate-y-0.5 shadow-lg"
            >
              <UserPlus className="h-5 w-5" />
              Yangi o'quvchi
            </button>
          )}
        </div>

        {canCreateStudents && (
          <div id="add-form" className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-6 sm:p-8 assistant-card-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Yangi o'quvchi qo'shish</h2>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-6">Ism-familya va aloqa raqamlarini kiriting. Student ID avtomatik beriladi.</p>

            <form onSubmit={handleAddStudent} className="space-y-5">
              <div>
                <label className={labelClass}>Ism familya *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={inputClass}
                  placeholder="Masalan: Aliyev Bekzod"
                />
              </div>

              <div>
                <label className={labelClass}>Telefon raqamlar (kamida 2 tasi majburiy)</label>
                {formData.contacts.map((contact, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
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
                      className={inputClass}
                    />
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-[var(--radius-md)] bg-[var(--bg-elevated)] border border-r-0 border-[var(--border-default)] text-[var(--text-muted)] text-sm">+998</span>
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
                        placeholder="90 123 45 67"
                        className={`${inputClass} rounded-l-none`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 h-[42px] px-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-[var(--radius-md)] transition-all active:scale-[0.98]"
              >
                <UserPlus className="h-4 w-4" />
                Qo'shish
              </button>
            </form>
          </div>
        )}

        {/* Students List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-[var(--border-default)] border-t-indigo-500 mx-auto"></div>
            <p className="mt-4 text-[var(--text-muted)]">Yuklanmoqda...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 bg-[var(--bg-secondary)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
            <Users className="h-14 w-14 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
            <p className="text-[var(--text-secondary)] font-medium">O'quvchilar topilmadi</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Birinchi o'quvchini qo'shishdan boshlang</p>
            {canCreateStudents && (
              <button
                type="button"
                onClick={() => document.getElementById('add-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="mt-4 inline-flex items-center gap-2 h-[42px] px-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-[var(--radius-md)]"
              >
                <UserPlus className="h-4 w-4" />
                Yangi o'quvchi
              </button>
            )}
          </div>
        ) : (
          <div className="bg-[var(--bg-secondary)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] overflow-hidden assistant-card-shadow">
            <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">So'nggi qo'shilganlar</h2>
            </div>
            {/* Mobil: kartochka */}
            <div className="sm:hidden divide-y divide-[var(--border-subtle)]">
              {students.map((student) => (
                <div key={student.id} className="p-5 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[var(--text-muted)]">{student.studentId}</p>
                      <p className="text-base font-medium text-[var(--text-primary)] break-words">{student.user.name}</p>
                    </div>
                    {student.currentGroupName ? (
                      <span className="px-2.5 py-1 rounded-[var(--radius-sm)] bg-indigo-500/12 text-indigo-400 text-xs font-semibold flex-shrink-0">
                        {student.currentGroupName}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] text-[var(--text-muted)] text-xs font-semibold flex-shrink-0">
                        Guruh yo'q
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    {(student.contacts || []).filter((c) => c.phone).length > 0 ? (
                      (student.contacts || []).filter((c) => c.phone).map((c, i) => (
                        <div key={i} className="flex items-center gap-1.5 mb-1">
                          <Phone className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                          <span className="break-all">{c.label}: {c.phone}</span>
                        </div>
                      ))
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {canEditStudents && (
                      <button
                        onClick={() => openEditModal(student)}
                        className="min-h-[44px] px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-default)] hover:border-indigo-500/30 text-[var(--text-primary)] rounded-[var(--radius-md)] text-sm font-medium"
                      >
                        Tahrirlash
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedStudent(student)
                        setSelectedGroupId(student.currentGroupId || '')
                        setShowAssignModal(true)
                      }}
                      className="min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-[var(--radius-md)] text-sm font-medium"
                    >
                      Guruhga Biriktirish
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop: jadval */}
            <div className="hidden sm:block overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="min-w-full">
                <thead className="bg-[var(--bg-tertiary)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Ism</th>
                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Aloqa</th>
                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Guruh</th>
                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap min-w-[200px]">Harakatlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                      <td className="px-4 py-3.5 text-[14px] text-[var(--text-secondary)]">{student.studentId}</td>
                      <td className="px-4 py-3.5 text-[14px] font-medium text-[var(--text-primary)]">{student.user.name}</td>
                      <td className="px-4 py-3.5 text-[14px] text-[var(--text-secondary)]">
                        {(student.contacts || []).filter((c) => c.phone).length > 0 ? (
                          (student.contacts || []).filter((c) => c.phone).map((c, i) => (
                            <div key={i} className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--bg-tertiary)] px-2 py-1 mr-1 text-[13px]">
                              <Phone className="h-3 w-3 text-indigo-400" />
                              {c.label}: {c.phone}
                            </div>
                          ))
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {student.currentGroupName ? (
                          <span className="px-2.5 py-1 rounded-[var(--radius-sm)] bg-indigo-500/12 text-indigo-400 text-xs font-semibold">
                            {student.currentGroupName}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] text-[var(--text-muted)] text-xs font-semibold">
                            Guruh yo'q
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          {canEditStudents && (
                            <button
                              onClick={() => openEditModal(student)}
                              className="h-[36px] px-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] hover:border-indigo-500/30 text-[var(--text-primary)] rounded-[var(--radius-md)] text-[13px] font-medium inline-flex items-center gap-1.5"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Tahrirlash
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedStudent(student)
                              setSelectedGroupId(student.currentGroupId || '')
                              setShowAssignModal(true)
                            }}
                            className="h-[36px] px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[var(--radius-md)] text-[13px] font-medium inline-flex items-center gap-1.5"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            Guruhga Biriktirish
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-secondary)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] w-full max-w-lg assistant-elevated-shadow animate-fade-in-up">
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-subtle)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">O'quvchini tahrirlash</h2>
                <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/5">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleEditStudent} className="p-6 space-y-5">
                <div>
                  <label className={labelClass}>Ism familya</label>
                  <input type="text" required value={editFormData.fullName} onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Telefon raqamlar (kamida 2 tasi majburiy)</label>
                  {editFormData.contacts.map((contact, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <input type="text" value={contact.label} onChange={(e) => setEditFormData((prev) => { const n = [...prev.contacts]; n[idx] = { ...n[idx], label: e.target.value }; return { ...prev, contacts: n } })} placeholder={`Kimligi (${idx === 0 ? 'otasi' : idx === 1 ? 'onasi' : 'bobosi'})`} className={inputClass} />
                      <input type="tel" value={contact.phone} onChange={(e) => setEditFormData((prev) => { const n = [...prev.contacts]; n[idx] = { ...n[idx], phone: e.target.value }; return { ...prev, contacts: n } })} placeholder="+998 90 123 45 67" className={inputClass} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-4 border-t border-[var(--border-subtle)]">
                  <button type="submit" className="flex-1 h-[42px] bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-[var(--radius-md)]">
                    Saqlash
                  </button>
                  <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 h-[42px] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-white rounded-[var(--radius-md)] font-medium">
                    Bekor qilish
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign to Group Modal */}
        {showAssignModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-secondary)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] w-full max-w-md assistant-elevated-shadow animate-fade-in-up">
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-subtle)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Guruhga Biriktirish</h2>
                <button onClick={() => { setShowAssignModal(false); setSelectedStudent(null); setSelectedGroupId('') }} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/5">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className={labelClass}>O'quvchi</label>
                  <div className={`${inputClass} bg-[var(--bg-elevated)]`}>{selectedStudent.user.name} ({selectedStudent.studentId})</div>
                </div>
                <div>
                  <label className={labelClass}>Guruh</label>
                  <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} className={inputClass}>
                    <option value="">Guruhni tanlang</option>
                    {groups.map((group) => {
                      const c = group.enrollments.length
                      const full = c >= group.maxStudents
                      return <option key={group.id} value={group.id} disabled={full}>{group.name} {full ? '(To\'ldi)' : `(${c}/${group.maxStudents})`}</option>
                    })}
                  </select>
                </div>
                <div className="flex gap-3 pt-4 border-t border-[var(--border-subtle)]">
                  <button onClick={handleAssignToGroup} disabled={!selectedGroupId || assigning} className="flex-1 h-[42px] bg-emerald-600 hover:bg-emerald-500 disabled:bg-[var(--bg-elevated)] disabled:cursor-not-allowed text-white font-semibold rounded-[var(--radius-md)]">
                    {assigning ? 'Biriktirilmoqda...' : 'Biriktirish'}
                  </button>
                  <button type="button" onClick={() => { setShowAssignModal(false); setSelectedStudent(null); setSelectedGroupId('') }} className="flex-1 h-[42px] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-white rounded-[var(--radius-md)] font-medium">
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
