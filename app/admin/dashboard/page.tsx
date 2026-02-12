'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { 
  Users, 
  GraduationCap, 
  UserCog,
  DollarSign,
  TrendingUp,
  BookOpen,
  AlertCircle,
  MessageSquare,
  Send,
  X,
  Shield,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save
} from 'lucide-react'

const defaultAssistantPermissions = () => ({
  students: { view: false, create: false, edit: false, delete: false },
  teachers: { view: false, create: false, edit: false, delete: false },
  groups: { view: false, create: false, edit: false, delete: false },
  schedules: { view: false, create: false, edit: false, delete: false },
  tests: { view: false, create: false, edit: false, delete: false },
  payments: { view: true, create: true, edit: false, delete: false },
  market: { view: false, create: false, edit: false, delete: false },
  reports: { view: false },
})

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalGroups: 0,
    totalRevenue: 0,
    totalDebt: 0,
    averageMastery: 0,
    attendanceRate: 0,
  })
  const [infinityPoints, setInfinityPoints] = useState(0)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageForm, setMessageForm] = useState({
    title: '',
    content: '',
    recipientRole: 'STUDENT',
    recipientId: '',
  })
  const [sending, setSending] = useState(false)
  const [assistantAdmins, setAssistantAdmins] = useState<any[]>([])
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<any>(null)
  const [adminForm, setAdminForm] = useState({
    username: '',
    name: '',
    password: '',
    phone: '',
    permissions: defaultAssistantPermissions(),
    isActive: true,
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data) setStats(data)
      })
      .catch(err => console.error(err))
    
    // Fetch assistant admins
    fetchAssistantAdmins()
  }, [])

  const fetchAssistantAdmins = async () => {
    try {
      const res = await fetch('/api/admin/assistant-admins')
      if (res.ok) {
        const data = await res.json()
        setAssistantAdmins(data)
      }
    } catch (err) {
      console.error('Error fetching assistant admins:', err)
    }
  }

  // Fetch infinity points
  useEffect(() => {
    const fetchInfinityPoints = async () => {
      try {
        const res = await fetch('/api/user/infinity')
        if (res.ok) {
          const data = await res.json()
          setInfinityPoints(data.infinityPoints || 0)
        }
      } catch (err) {
        console.error('Error fetching infinity points:', err)
      }
    }
    fetchInfinityPoints()
    
    const interval = setInterval(() => {
      fetchInfinityPoints()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    try {
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageForm),
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message || 'Xabar muvaffaqiyatli yuborildi!')
        setShowMessageModal(false)
        setMessageForm({ title: '', content: '', recipientRole: 'STUDENT', recipientId: '' })
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Xatolik yuz berdi')
    } finally {
      setSending(false)
    }
  }

  const handleOpenAdminModal = (admin?: any) => {
    if (admin) {
      setEditingAdmin(admin)
      const permissions = admin.assistantAdminProfile?.permissions 
        ? JSON.parse(admin.assistantAdminProfile.permissions)
        : defaultAssistantPermissions()
      setAdminForm({
        username: admin.username,
        name: admin.name,
        password: '',
        phone: admin.phone || '',
        permissions: {
          ...defaultAssistantPermissions(),
          ...permissions,
          payments: { ...defaultAssistantPermissions().payments, ...(permissions?.payments || {}) },
          students: { ...defaultAssistantPermissions().students, ...(permissions?.students || {}) },
        },
        isActive: admin.isActive,
      })
    } else {
      setEditingAdmin(null)
      setAdminForm({
        username: '',
        name: '',
        password: '',
        phone: '',
        permissions: defaultAssistantPermissions(),
        isActive: true,
      })
    }
    setShowAdminModal(true)
  }

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingAdmin 
        ? `/api/admin/assistant-admins/${editingAdmin.id}`
        : '/api/admin/assistant-admins'
      
      const method = editingAdmin ? 'PUT' : 'POST'
      const body = editingAdmin 
        ? { ...adminForm, password: adminForm.password || undefined }
        : adminForm

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message || 'Muvaffaqiyatli saqlandi!')
        setShowAdminModal(false)
        fetchAssistantAdmins()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error saving admin:', error)
      alert('Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Yordamchi adminni o\'chirishni tasdiqlaysizmi?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/assistant-admins/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Yordamchi admin o\'chirildi')
        fetchAssistantAdmins()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error deleting admin:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const setSimplePermission = (type: 'payments' | 'studentsCreate', enabled: boolean) => {
    setAdminForm(prev => {
      if (type === 'payments') {
        return {
          ...prev,
          permissions: {
            ...prev.permissions,
            payments: {
              ...prev.permissions.payments,
              view: enabled,
              create: enabled,
            },
          },
        }
      }

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          students: {
            ...prev.permissions.students,
            view: enabled,
            create: enabled,
          },
        },
      }
    })
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Welcome Section - faqat ism */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 sm:p-6 text-white">
          <h1 className="text-xl sm:text-2xl font-bold text-center">
            {session?.user?.name || 'Admin'}
          </h1>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
              <span className="text-xl sm:text-2xl font-bold text-white">{stats.totalStudents}</span>
            </div>
            <p className="text-sm sm:text-base text-gray-400">O&apos;quvchilar</p>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <UserCog className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
              <span className="text-xl sm:text-2xl font-bold text-white">{stats.totalTeachers}</span>
            </div>
            <p className="text-sm sm:text-base text-gray-400">O&apos;qituvchilar</p>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
              <span className="text-xl sm:text-2xl font-bold text-white">{stats.totalGroups}</span>
            </div>
            <p className="text-sm sm:text-base text-gray-400">Guruhlar</p>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" />
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{stats.totalRevenue.toLocaleString()}</span>
            </div>
            <p className="text-sm sm:text-base text-gray-400">Jami daromad</p>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-400" />
              Moliyaviy holat
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                <span className="text-gray-400">Jami kirim</span>
                <span className="text-green-400 font-semibold">{stats.totalRevenue.toLocaleString()} so&apos;m</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                <span className="text-gray-400">Qarzdorlik</span>
                <span className="text-red-400 font-semibold">{stats.totalDebt.toLocaleString()} so&apos;m</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                <span className="text-green-400 font-semibold">Sof daromad</span>
                <span className="text-green-400 font-bold text-lg">{(stats.totalRevenue - stats.totalDebt).toLocaleString()} so&apos;m</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-400" />
              KPI Ko&apos;rsatkichlari
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">O&apos;rtacha o&apos;zlashtirish</span>
                  <span className="text-white">{stats.averageMastery}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats.averageMastery}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Davomat darajasi</span>
                  <span className="text-white">{stats.attendanceRate}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats.attendanceRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {stats.totalDebt > 0 && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-400" />
              <div>
                <h3 className="text-red-400 font-semibold mb-1">Qarzdorlik mavjud</h3>
                <p className="text-gray-300">
                  Jami qarzdorlik: <span className="font-semibold">{stats.totalDebt.toLocaleString()} so&apos;m</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Send Message Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold mb-2 flex items-center">
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                Xabar Yuborish
              </h2>
              <p className="text-sm sm:text-base text-blue-100">
                O&apos;quvchilar va o&apos;qituvchilarga xabar yuborish
              </p>
            </div>
            <button
              onClick={() => setShowMessageModal(true)}
              className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Xabar Yuborish</span>
            </button>
          </div>
        </div>

        {/* Admin Section - Yordamchi Adminlar Boshqaruvi */}
        <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-purple-400" />
                Yordamchi Adminlar
              </h2>
              <p className="text-sm sm:text-base text-gray-400">
                Yordamchi adminlar qo&apos;shish va ruxsatlarini boshqarish. Yordamchi adminlar rash.com.uz da to&apos;lov kiritish uchun ham kira olishadi.
              </p>
            </div>
            <button
              onClick={() => handleOpenAdminModal()}
              className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Yangi Admin</span>
            </button>
          </div>

          {/* Assistant Admins List */}
          <div className="space-y-3">
            {assistantAdmins.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Hozircha yordamchi adminlar mavjud emas</p>
              </div>
            ) : (
              assistantAdmins.map((admin) => {
                const permissions = admin.assistantAdminProfile?.permissions
                  ? JSON.parse(admin.assistantAdminProfile.permissions)
                  : {}
                const activePermissions = Object.keys(permissions).filter(
                  (key) => permissions[key]?.view || permissions[key]?.create || permissions[key]?.edit || permissions[key]?.delete
                ).length

                return (
                  <div
                    key={admin.id}
                    className="bg-slate-700/50 rounded-lg p-4 border border-gray-600 hover:border-purple-500/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-semibold text-base sm:text-lg">
                            {admin.name}
                          </h3>
                          {admin.isActive ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                              Faol
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                              Nofaol
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mb-2">
                          Username: <span className="text-gray-300">{admin.username}</span>
                        </p>
                        {admin.phone && (
                          <p className="text-gray-400 text-sm mb-2">
                            Telefon: <span className="text-gray-300">{admin.phone}</span>
                          </p>
                        )}
                        <p className="text-gray-400 text-sm">
                          Ruxsatlar: <span className="text-purple-400 font-medium">{activePermissions} bo&apos;lim</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenAdminModal(admin)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                          title="O'chirish"
                        >
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                <span className="hidden sm:inline">Yangi Xabar Yuborish</span>
                <span className="sm:hidden">Xabar</span>
              </h2>
              <button
                onClick={() => setShowMessageModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
            <form onSubmit={handleSendMessage} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Qabul qiluvchi
                </label>
                <select
                  required
                  value={messageForm.recipientRole}
                  onChange={(e) => setMessageForm({ ...messageForm, recipientRole: e.target.value, recipientId: '' })}
                  className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="STUDENT">Barcha O&apos;quvchilar</option>
                  <option value="TEACHER">Barcha O&apos;qituvchilar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sarlavha
                </label>
                <input
                  type="text"
                  required
                  value={messageForm.title}
                  onChange={(e) => setMessageForm({ ...messageForm, title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Xabar sarlavhasi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Xabar matni
                </label>
                <textarea
                  required
                  value={messageForm.content}
                  onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Xabar matnini kiriting..."
                />
              </div>
              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Yuborilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Yuborish</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Bekor qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Modal - Yordamchi Admin Qo'shish/Tahrirlash */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-2xl my-4 sm:my-8 flex flex-col max-h-[85vh]">
            {/* Header - Sticky */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
              <h2 className="text-base sm:text-lg font-semibold text-white flex items-center">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-400" />
                <span className="hidden sm:inline">{editingAdmin ? 'Yordamchi Adminni Tahrirlash' : 'Yangi Yordamchi Admin'}</span>
                <span className="sm:hidden">{editingAdmin ? 'Tahrirlash' : 'Yangi Admin'}</span>
              </h2>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <form id="admin-form" onSubmit={handleSaveAdmin} className="p-3 sm:p-4 space-y-4 sm:space-y-5">
              {/* Asosiy Ma'lumotlar */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                  <UserCog className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-400" />
                  Asosiy Ma&apos;lumotlar
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">
                      Username <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={adminForm.username}
                      onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="admin_username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">
                      Ism <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={adminForm.name}
                      onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="To'liq ism"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">
                      Parol {!editingAdmin && <span className="text-red-400">*</span>}
                      {editingAdmin && <span className="text-gray-500 text-xs">(o&apos;zgartirish)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!editingAdmin}
                        value={adminForm.password}
                        onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 pr-9 text-sm"
                        placeholder={editingAdmin ? "O'zgartirish" : "Parol"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={adminForm.phone}
                      onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="+998901234567"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex items-center space-x-2 cursor-pointer hover:bg-slate-700/50 p-1.5 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={adminForm.isActive}
                        onChange={(e) => setAdminForm({ ...adminForm, isActive: e.target.checked })}
                        className="w-4 h-4 text-purple-600 bg-slate-700 border-gray-600 rounded focus:ring-purple-500 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm font-medium text-gray-300">Faol</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Ruxsatlar */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-400" />
                  Ruxsatlar
                </h3>
                <div className="bg-slate-700/50 rounded-lg p-3 sm:p-4 space-y-3">
                  <label className="flex items-center justify-between gap-3 rounded-lg border border-gray-600 p-3 hover:bg-slate-600/40 transition-colors cursor-pointer">
                    <div>
                      <p className="text-sm sm:text-base text-white font-medium">To&apos;lovga ruxsat (`rash.com.uz`)</p>
                      <p className="text-xs text-gray-400">Yoqilsa assistant admin `rash.com.uz`da to&apos;lov qidira va kirita oladi.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(adminForm.permissions.payments?.view) && Boolean(adminForm.permissions.payments?.create)}
                      onChange={(e) => setSimplePermission('payments', e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-slate-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-3 rounded-lg border border-gray-600 p-3 hover:bg-slate-600/40 transition-colors cursor-pointer">
                    <div>
                      <p className="text-sm sm:text-base text-white font-medium">O&apos;quvchi qo&apos;shishga ruxsat</p>
                      <p className="text-xs text-gray-400">Yoqilsa assistant admin o&apos;quvchi yaratish bo&apos;limidan foydalana oladi.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(adminForm.permissions.students?.view) && Boolean(adminForm.permissions.students?.create)}
                      onChange={(e) => setSimplePermission('studentsCreate', e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-slate-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                  </label>
                </div>
              </div>

              </form>
            </div>
            
            {/* Footer - Sticky */}
            <div className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 border-t border-gray-700 flex-shrink-0 bg-slate-800">
              <button
                type="submit"
                form="admin-form"
                disabled={loading}
                className="flex-1 px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="hidden sm:inline">Saqlanmoqda...</span>
                    <span className="sm:hidden">Saqlash...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Saqlash</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="flex-1 px-3 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm sm:text-base"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
