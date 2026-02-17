'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Edit, 
  Trash2, 
  Search,
  UserPlus,
  Users,
  X,
  BookOpen,
  DollarSign,
  ArrowRight
} from 'lucide-react'

interface Teacher {
  id: string
  teacherId: string
  user: {
    id: string
    name: string
    username: string
    phone?: string
  }
  baseSalary: number
  bonusRate: number
  totalEarnings: number
  groups: Array<{ id: string; name: string }>
}

export default function TeachersPage() {
  const { data: session } = useSession()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    password: '',
    teacherId: '',
    baseSalary: '',
    bonusRate: '',
  })

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/admin/teachers')
      if (response.ok) {
        const data = await response.json()
        setTeachers(data)
      }
    } catch (error) {
      console.error('Error fetching teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          baseSalary: parseFloat(formData.baseSalary) || 0,
          bonusRate: parseFloat(formData.bonusRate) || 0,
        }),
      })

      if (response.ok) {
        setShowAddModal(false)
        setFormData({ name: '', username: '', phone: '', password: '', teacherId: '', baseSalary: '', bonusRate: '' })
        fetchTeachers()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error adding teacher:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeacher) return

    try {
      const response = await fetch(`/api/admin/teachers/${selectedTeacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          baseSalary: parseFloat(formData.baseSalary) || 0,
          bonusRate: parseFloat(formData.bonusRate) || 0,
        }),
      })

      if (response.ok) {
        setShowEditModal(false)
        setSelectedTeacher(null)
        setFormData({ name: '', username: '', phone: '', password: '', teacherId: '', baseSalary: '', bonusRate: '' })
        fetchTeachers()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error editing teacher:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm('O\'qituvchini o\'chirishni tasdiqlaysizmi?')) return

    try {
      const response = await fetch(`/api/admin/teachers/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchTeachers()
      }
    } catch (error) {
      console.error('Error deleting teacher:', error)
    }
  }

  const filteredTeachers = teachers.filter(teacher =>
    teacher.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.teacherId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout role="ASSISTANT_ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-primary)] mb-1">O&apos;qituvchilar Boshqaruvi</h1>
            <p className="text-sm text-[var(--text-secondary)]">Barcha o&apos;qituvchilarni boshqaring</p>
          </div>
          <button
            onClick={() => {
              setFormData({ name: '', username: '', phone: '', password: '', teacherId: '', baseSalary: '', bonusRate: '' })
              setShowAddModal(true)
            }}
            className="flex items-center justify-center gap-2 h-11 sm:h-[42px] px-4 sm:px-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-[10px] transition-all hover:-translate-y-0.5 shadow-lg text-sm"
          >
            <UserPlus className="h-[18px] w-[18px]" />
            <span className="whitespace-nowrap hidden sm:inline">Yangi O&apos;qituvchi</span>
            <span className="whitespace-nowrap sm:hidden">Qo&apos;shish</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Qidirish (ism, login, ID)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
          />
        </div>

        {/* Teachers Grid/Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-[var(--border-default)] border-t-indigo-500 mx-auto"></div>
            <p className="mt-4 text-[var(--text-secondary)]">Yuklanmoqda...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-16 bg-[var(--bg-secondary)] rounded-[14px] border border-[var(--border-subtle)] assistant-card-shadow">
            <div className="w-12 h-12 rounded-[10px] bg-[var(--accent-muted)] flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-indigo-400" />
            </div>
            <p className="text-[var(--text-secondary)] font-medium">O&apos;qituvchilar topilmadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredTeachers.map((teacher) => (
              <div key={teacher.id} className="bg-[var(--bg-secondary)] rounded-[14px] border border-[var(--border-subtle)] p-6 assistant-card-shadow hover:border-indigo-500/30 hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--accent-muted)] flex items-center justify-center flex-shrink-0">
                      <Users className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-[var(--text-primary)] font-semibold">{teacher.user.name}</h3>
                      <p className="text-xs text-[var(--text-muted)]">ID: {teacher.teacherId}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setSelectedTeacher(teacher)
                        setFormData({
                          name: teacher.user.name,
                          username: teacher.user.username,
                          phone: teacher.user.phone || '',
                          password: '',
                          teacherId: teacher.teacherId,
                          baseSalary: teacher.baseSalary.toString(),
                          bonusRate: teacher.bonusRate.toString(),
                        })
                        setShowEditModal(true)
                      }}
                      className="p-2 text-[var(--text-secondary)] hover:bg-indigo-500/20 hover:text-indigo-400 rounded-[10px] transition-colors"
                      title="Tahrirlash"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTeacher(teacher.id)}
                      className="p-2 text-[var(--text-secondary)] hover:bg-red-500/20 hover:text-red-400 rounded-[10px] transition-colors"
                      title="O'chirish"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <BookOpen className="h-4 w-4 text-[var(--text-muted)]" />
                    Guruhlar: <span className="text-[var(--text-primary)] font-medium">{teacher.groups.length} ta</span>
                  </p>
                  <p className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <DollarSign className="h-4 w-4 text-[var(--text-muted)]" />
                    Asosiy maosh: <span className="text-[var(--text-primary)] font-medium">{teacher.baseSalary.toLocaleString()} so&apos;m</span>
                  </p>
                  {teacher.user.phone && (
                    <p className="flex items-center gap-2 text-[var(--text-muted)] text-xs">
                      <span>📞</span> {teacher.user.phone}
                    </p>
                  )}
                </div>
                <Link
                  href={`/assistant-admin/groups?teacher=${teacher.id}`}
                  className="mt-4 flex items-center justify-center gap-2 h-10 w-full border border-[var(--border-default)] text-[var(--text-secondary)] font-medium rounded-[10px] hover:bg-[var(--bg-elevated)] hover:border-indigo-500/30 hover:text-indigo-400 transition-colors text-sm"
                >
                  Batafsil <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-secondary)] rounded-[20px] border border-[var(--border-subtle)] assistant-elevated-shadow w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up">
              <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Yangi O&apos;qituvchi Qo&apos;shish</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-[10px] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddTeacher} className="p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Ism</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Login</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Telefon</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">O&apos;qituvchi ID</label>
                  <input
                    type="text"
                    required
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Asosiy Maosh (so&apos;m)</label>
                  <input
                    type="number"
                    required
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Bonus Foizi (%)</label>
                  <input
                    type="number"
                    required
                    value={formData.bonusRate}
                    onChange={(e) => setFormData({ ...formData, bonusRate: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Parol</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
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
                    onClick={() => setShowAddModal(false)}
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
        {showEditModal && selectedTeacher && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-secondary)] rounded-[20px] border border-[var(--border-subtle)] assistant-elevated-shadow w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up">
              <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">O&apos;qituvchini Tahrirlash</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-[10px] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleEditTeacher} className="p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Ism</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Login</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Telefon</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">O&apos;qituvchi ID</label>
                  <input
                    type="text"
                    required
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Asosiy Maosh (so&apos;m)</label>
                  <input
                    type="number"
                    required
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Bonus Foizi (%)</label>
                  <input
                    type="number"
                    required
                    value={formData.bonusRate}
                    onChange={(e) => setFormData({ ...formData, bonusRate: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Yangi Parol (ixtiyoriy)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                    placeholder="Parolni o'zgartirmaslik uchun bo'sh qoldiring"
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
      </div>
    </DashboardLayout>
  )
}
