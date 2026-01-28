'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  UserPlus,
  Users,
  X,
  DollarSign
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
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">O'qituvchilar Boshqaruvi</h1>
            <p className="text-gray-400">Barcha o'qituvchilarni boshqaring</p>
          </div>
          <button
            onClick={() => {
              setFormData({ name: '', username: '', phone: '', password: '', teacherId: '', baseSalary: '', bonusRate: '' })
              setShowAddModal(true)
            }}
            className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <UserPlus className="h-5 w-5" />
            <span>Yangi O'qituvchi</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Qidirish (ism, login, ID)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Teachers Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Yuklanmoqda...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-xl border border-gray-700">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">O'qituvchilar topilmadi</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Ism</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Login</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Asosiy Maosh</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Bonus %</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Guruhlar</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Harakatlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-300">{teacher.teacherId}</td>
                      <td className="px-6 py-4 text-sm text-white font-medium">{teacher.user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{teacher.user.username}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{teacher.baseSalary.toLocaleString()} so'm</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{teacher.bonusRate}%</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{teacher.groups.length}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center space-x-2">
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
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTeacher(teacher.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">Yangi O'qituvchi Qo'shish</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleAddTeacher} className="p-6 space-y-4">
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">O'qituvchi ID</label>
                  <input
                    type="text"
                    required
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Asosiy Maosh (so'm)</label>
                  <input
                    type="number"
                    required
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bonus Foizi (%)</label>
                  <input
                    type="number"
                    required
                    value={formData.bonusRate}
                    onChange={(e) => setFormData({ ...formData, bonusRate: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
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

        {/* Edit Modal */}
        {showEditModal && selectedTeacher && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">O'qituvchini Tahrirlash</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleEditTeacher} className="p-6 space-y-4">
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">O'qituvchi ID</label>
                  <input
                    type="text"
                    required
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Asosiy Maosh (so'm)</label>
                  <input
                    type="number"
                    required
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bonus Foizi (%)</label>
                  <input
                    type="number"
                    required
                    value={formData.bonusRate}
                    onChange={(e) => setFormData({ ...formData, bonusRate: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Yangi Parol (ixtiyoriy)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Parolni o'zgartirmaslik uchun bo'sh qoldiring"
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
      </div>
    </DashboardLayout>
  )
}
