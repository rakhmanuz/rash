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
  Check,
  Upload,
  Download,
  FileSpreadsheet,
  Power,
  PowerOff,
  AlertTriangle
} from 'lucide-react'

interface Student {
  id: string
  studentId: string
  user: {
    id: string
    name: string
    username: string
    phone?: string
    isActive?: boolean
    createdAt?: string
  }
  level: number
  totalScore: number
  attendanceRate: number
  masteryLevel: number
  currentGroupId?: string
  currentGroupName?: string
  createdAt?: string
}

export default function StudentsPage() {
  const { data: session } = useSession()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    password: '',
    studentId: '',
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students?includeEnrollment=true')
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

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowAddModal(false)
        setFormData({ name: '', username: '', phone: '', password: '', studentId: '' })
        fetchStudents()
      }
    } catch (error) {
      console.error('Error adding student:', error)
    }
  }

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) return

    try {
      const response = await fetch(`/api/admin/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowEditModal(false)
        setSelectedStudent(null)
        setFormData({ name: '', username: '', phone: '', password: '', studentId: '' })
        fetchStudents()
      }
    } catch (error) {
      console.error('Error editing student:', error)
    }
  }

  const handleToggleStudentStatus = async (id: string, currentStatus: boolean) => {
    const action = currentStatus ? 'to\'xtatish' : 'faollashtirish'
    if (!confirm(`O'quvchini ${action}ni tasdiqlaysizmi?`)) return

    try {
      const response = await fetch(`/api/admin/students/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        fetchStudents()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error toggling student status:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('O\'quvchini butunlay o\'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo\'lmaydi!')) return

    try {
      const response = await fetch(`/api/admin/students/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message || 'O\'quvchi muvaffaqiyatli o\'chirildi')
        fetchStudents()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/students/excel-template')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'o\'quvchilar_shablon.xlsx'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Shablon yuklab olishda xatolik')
      }
    } catch (error) {
      console.error('Error downloading template:', error)
      alert('Shablon yuklab olishda xatolik')
    }
  }

  const handleImportStudents = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) {
      alert('Excel fayl tanlang!')
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', importFile)

      const response = await fetch('/api/admin/students/import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setImportResult({
          success: result.success,
          failed: result.failed,
          errors: result.errors || [],
        })
        if (result.success > 0) {
          fetchStudents()
        }
      } else {
        alert(result.error || 'Import qilishda xatolik')
      }
    } catch (error) {
      console.error('Error importing students:', error)
      alert('Import qilishda xatolik')
    } finally {
      setImporting(false)
    }
  }

  const filteredStudents = students.filter(student =>
    student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 break-words">O'quvchilar Boshqaruvi</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-400 break-words">Barcha o'quvchilarni boshqaring</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-xs sm:text-sm md:text-base flex-shrink-0"
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              <span className="whitespace-nowrap">Shablon</span>
            </button>
            <button
              onClick={() => {
                setShowImportModal(true)
                setImportFile(null)
                setImportResult(null)
              }}
              className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-xs sm:text-sm md:text-base flex-shrink-0"
            >
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              <span className="whitespace-nowrap hidden sm:inline">Excel dan Import</span>
              <span className="whitespace-nowrap sm:hidden">Import</span>
            </button>
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

        {/* Students Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Yuklanmoqda...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-xl border border-gray-700">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">O'quvchilar topilmadi</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white sticky left-0 z-10 bg-slate-700">ID</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white sticky left-16 sm:left-20 z-10 bg-slate-700">Ism</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white hidden md:table-cell">Login</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white hidden lg:table-cell">Telefon</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white hidden xl:table-cell">Kiritilgan sana</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white">Holat</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white hidden md:table-cell">Guruh</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white hidden lg:table-cell">Level</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white hidden xl:table-cell">O'zlashtirish</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white">Harakatlar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredStudents.map((student) => {
                        const createdAt = student.createdAt || student.user.createdAt
                        const formattedDate = createdAt 
                          ? new Date(createdAt).toLocaleDateString('uz-UZ', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                            })
                          : '-'
                        
                        return (
                        <tr key={student.id} className="hover:bg-slate-700/50 transition-colors">
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300 sticky left-0 z-10 bg-slate-800">{student.studentId}</td>
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-white font-medium sticky left-16 sm:left-20 z-10 bg-slate-800">
                            <div className="flex flex-col">
                              <span>{student.user.name}</span>
                              <span className="text-xs text-gray-400 md:hidden">{student.user.username}</span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300 hidden md:table-cell">{student.user.username}</td>
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300 hidden lg:table-cell">{student.user.phone || '-'}</td>
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300 hidden xl:table-cell">{formattedDate}</td>
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                            {student.user.isActive !== false ? (
                              <span className="px-1.5 sm:px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-semibold border border-green-500/30 flex items-center space-x-1 w-fit">
                                <Check className="h-3 w-3" />
                                <span className="hidden sm:inline">Faol</span>
                              </span>
                            ) : (
                              <span className="px-1.5 sm:px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-semibold border border-red-500/30 flex items-center space-x-1 w-fit">
                                <X className="h-3 w-3" />
                                <span className="hidden sm:inline">To'xtatilgan</span>
                              </span>
                            )}
                          </td>
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm hidden md:table-cell">
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
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300 hidden lg:table-cell">Level {student.level}</td>
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300 hidden xl:table-cell">
                            {isNaN(student.masteryLevel) ? '-' : `${Math.round(student.masteryLevel)}%`}
                          </td>
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedStudent(student)
                                  setFormData({
                                    name: student.user.name,
                                    username: student.user.username,
                                    phone: student.user.phone || '',
                                    password: '',
                                    studentId: student.studentId,
                                  })
                                  setShowEditModal(true)
                                }}
                                className="p-1.5 sm:p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                                title="Tahrirlash"
                              >
                                <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                              <button
                                onClick={() => handleToggleStudentStatus(student.id, student.user.isActive !== false)}
                                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                                  student.user.isActive !== false
                                    ? 'text-yellow-400 hover:bg-yellow-500/20'
                                    : 'text-green-400 hover:bg-green-500/20'
                                }`}
                                title={student.user.isActive !== false ? "To'xtatish" : 'Faollashtirish'}
                              >
                                {student.user.isActive !== false ? (
                                  <PowerOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                ) : (
                                  <Power className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student.id)}
                                className="p-1.5 sm:p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                title="Butunlay o'chirish"
                              >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
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

        {/* Edit Modal */}
        {showEditModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">O'quvchini Tahrirlash</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleEditStudent} className="p-6 space-y-4">
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">O'quvchi ID</label>
                  <input
                    type="text"
                    value={formData.studentId}
                    disabled
                    className="w-full px-4 py-2 bg-slate-700/50 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">O'quvchi ID o'zgartirib bo'lmaydi</p>
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

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FileSpreadsheet className="h-6 w-6 text-green-400" />
                  Excel dan O'quvchilarni Import Qilish
                </h2>
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setImportFile(null)
                    setImportResult(null)
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Instructions */}
                <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">Qo'llanma:</h3>
                  <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                    <li>Avval &quot;Shablon Yuklab Olish&quot; tugmasini bosing</li>
                    <li>Shablon faylni oching va ma&apos;lumotlarni to&apos;ldiring</li>
                    <li>Maydonlar: Ism, Login, Telefon (ixtiyoriy), Parol, O&apos;quvchi ID</li>
                    <li>Faylni saqlang va bu yerga yuklang</li>
                    <li>Bir vaqtning o&apos;zida 100+ o&apos;quvchi qo&apos;shish mumkin</li>
                  </ol>
                </div>

                {/* File Upload */}
                <form onSubmit={handleImportStudents} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Excel Fayl (.xlsx)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        required
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setImportFile(file)
                            setImportResult(null)
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-500 file:text-white hover:file:bg-green-600"
                      />
                    </div>
                    {importFile && (
                      <p className="text-sm text-gray-400 mt-2">
                        Tanlangan fayl: {importFile.name}
                      </p>
                    )}
                  </div>

                  {/* Import Result */}
                  {importResult && (
                    <div className={`rounded-lg p-4 border ${
                      importResult.failed === 0
                        ? 'bg-green-500/20 border-green-500/50'
                        : 'bg-yellow-500/20 border-yellow-500/50'
                    }`}>
                      <h3 className="text-white font-semibold mb-2">Import Natijasi:</h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-green-400">
                          ✅ Muvaffaqiyatli: {importResult.success} ta
                        </p>
                        {importResult.failed > 0 && (
                          <p className="text-red-400">
                            ❌ Xatolik: {importResult.failed} ta
                          </p>
                        )}
                        {importResult.errors.length > 0 && (
                          <div className="mt-3 max-h-40 overflow-y-auto">
                            <p className="text-gray-300 font-semibold mb-1">Xatoliklar:</p>
                            <ul className="text-xs text-red-400 space-y-1 list-disc list-inside">
                              {importResult.errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={!importFile || importing}
                      className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {importing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Import qilinmoqda...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5" />
                          <span>Import Qilish</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowImportModal(false)
                        setImportFile(null)
                        setImportResult(null)
                      }}
                      className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      Yopish
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
