'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { 
  Search,
  Plus,
  Minus,
  TrendingUp,
  Users,
  GraduationCap,
  UserCog,
  Crown,
  X,
  Loader2,
  History,
  FileText,
  ShoppingCart,
  ClipboardList,
} from 'lucide-react'

interface User {
  id: string
  name: string
  username: string
  role: string
  phone?: string
  infinityPoints: number
  isActive: boolean
  studentProfile?: {
    studentId: string
  }
  teacherProfile?: {
    id: string
  }
}

interface InfinityHistoryItem {
  id: string
  userId: string
  amount: number
  balanceAfter: number
  source: string
  description: string | null
  createdAt: string
  user: {
    id: string
    name: string
    username: string
    studentProfile?: { studentId: string } | null
  }
}

const SOURCE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  TEST_RESULT: { label: 'Kunlik test', icon: <ClipboardList className="h-4 w-4" />, color: 'text-blue-400 bg-blue-500/20' },
  WRITTEN_WORK_RESULT: { label: 'Yozma ish', icon: <FileText className="h-4 w-4" />, color: 'text-amber-400 bg-amber-500/20' },
  ADMIN_ADD: { label: 'Admin qo\'shdi', icon: <Plus className="h-4 w-4" />, color: 'text-green-400 bg-green-500/20' },
  ADMIN_SUBTRACT: { label: 'Admin ayirdi', icon: <Minus className="h-4 w-4" />, color: 'text-red-400 bg-red-500/20' },
  MARKET_ORDER: { label: 'Market', icon: <ShoppingCart className="h-4 w-4" />, color: 'text-purple-400 bg-purple-500/20' },
}

export default function InfinityPage() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<'users' | 'history'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [operation, setOperation] = useState<'add' | 'subtract'>('add')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [history, setHistory] = useState<InfinityHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyFilterUser, setHistoryFilterUser] = useState('')
  const [historyFilterSource, setHistoryFilterSource] = useState('')
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<User | null>(null)
  const [userHistory, setUserHistory] = useState<InfinityHistoryItem[]>([])
  const [userHistoryLoading, setUserHistoryLoading] = useState(false)

  useEffect(() => {
    // Session yuklangandan keyin ma'lumotlarni yuklash
    if (status === 'authenticated' && session) {
      fetchUsers()
    } else if (status === 'unauthenticated') {
      setLoading(false)
      setError('Siz tizimga kirmagansiz')
    }
  }, [status, session])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/infinity', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Session cookie'larini yuborish uchun
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched users:', data) // Debug uchun
        if (Array.isArray(data)) {
          setUsers(data)
          if (data.length === 0) {
            setError('Hozircha foydalanuvchilar topilmadi')
          }
        } else {
          setError('Ma\'lumotlar formati noto\'g\'ri')
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API error:', response.status, errorData)
        if (response.status === 401) {
          setError('Siz tizimga kirmagansiz')
        } else if (response.status === 403) {
          setError('Sizda bu sahifaga kirish huquqi yo\'q')
        } else {
          setError(errorData.error || `Ma'lumotlarni yuklashda xatolik (${response.status})`)
        }
      }
    } catch (error: any) {
      console.error('Error fetching users:', error)
      setError(`Xatolik: ${error.message || 'Ma\'lumotlarni yuklashda xatolik'}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const params = new URLSearchParams()
      if (historyFilterUser) params.set('userId', historyFilterUser)
      if (historyFilterSource) params.set('source', historyFilterSource)
      params.set('limit', '200')
      const res = await fetch(`/api/admin/infinity/history?${params}`)
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'history' && status === 'authenticated') {
      fetchHistory()
    }
  }, [activeTab, status, historyFilterUser, historyFilterSource])

  const openUserHistory = async (user: User) => {
    setSelectedUserForHistory(user)
    setShowHistoryModal(true)
    setUserHistoryLoading(true)
    try {
      const res = await fetch(`/api/admin/infinity/history?userId=${user.id}&limit=100`)
      if (res.ok) {
        const data = await res.json()
        setUserHistory(data)
      } else {
        setUserHistory([])
      }
    } catch {
      setUserHistory([])
    } finally {
      setUserHistoryLoading(false)
    }
  }

  const handleOpenModal = (user: User, op: 'add' | 'subtract') => {
    setSelectedUser(user)
    setOperation(op)
    setAmount('')
    setReason('')
    setError(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedUser(null)
    setAmount('')
    setReason('')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !amount) return

    const amountNum = parseInt(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('To\'g\'ri son kiriting')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/infinity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: amountNum,
          operation: operation,
          reason: reason.trim() || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Infinity ballar muvaffaqiyatli ${operation === 'add' ? 'qo\'shildi' : 'ayirildi'}!`)
        handleCloseModal()
        fetchUsers()
        if (activeTab === 'history') fetchHistory()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error updating infinity points:', error)
      setError('Xatolik yuz berdi')
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (s: string) => {
    const d = new Date(s)
    return d.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return <GraduationCap className="h-4 w-4" />
      case 'TEACHER':
        return <UserCog className="h-4 w-4" />
      case 'ADMIN':
      case 'MANAGER':
        return <Crown className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return 'O\'quvchi'
      case 'TEACHER':
        return 'O\'qituvchi'
      case 'ADMIN':
        return 'Admin'
      case 'MANAGER':
        return 'Menejer'
      default:
        return role
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.studentProfile?.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPoints = users.reduce((sum, user) => sum + (user.infinityPoints || 0), 0)
  const topUsers = [...users].sort((a, b) => (b.infinityPoints || 0) - (a.infinityPoints || 0)).slice(0, 5)

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                ∞
              </span>
              Infinitylar
            </h1>
            <p className="text-gray-400">Foydalanuvchilarning infinity ballarini boshqarish va to‘liq tarix</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-700/50 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Users className="h-4 w-4" />
            Foydalanuvchilar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <History className="h-4 w-4" />
            Tarix
          </button>
        </div>

        {activeTab === 'users' && (
          <>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Jami Infinity</p>
                <p className="text-3xl font-bold text-white">{totalPoints.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Jami Foydalanuvchilar</p>
                <p className="text-3xl font-bold text-white">{users.length}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">O'rtacha Infinity</p>
                <p className="text-3xl font-bold text-white">
                  {users.length > 0 ? Math.round(totalPoints / users.length) : 0}
                </p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message (users tab) */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center space-x-2">
            <X className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Search */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Ism, username yoki ID bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Foydalanuvchi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Infinity Ballar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Amallar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Tarix
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                        Foydalanuvchilar topilmadi
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {getRoleIcon(user.role)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-400">
                                @{user.username}
                                {user.studentProfile && ` • ${user.studentProfile.studentId}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                              ∞
                            </span>
                            <span className="text-lg font-bold text-white">
                              {user.infinityPoints || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleOpenModal(user, 'add')}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                              disabled={!user.isActive}
                            >
                              <Plus className="h-4 w-4" />
                              <span>Qo'shish</span>
                            </button>
                            <button
                              onClick={() => handleOpenModal(user, 'subtract')}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                              disabled={!user.isActive}
                            >
                              <Minus className="h-4 w-4" />
                              <span>Ayirish</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openUserHistory(user)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                          >
                            <History className="h-4 w-4" />
                            <span>Tarix</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

          </>
        )}

        {/* History tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={historyFilterSource}
                onChange={(e) => setHistoryFilterSource(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-green-500"
              >
                <option value="">Barcha manbalar</option>
                {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <select
                value={historyFilterUser}
                onChange={(e) => setHistoryFilterUser(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-green-500 min-w-[180px]"
              >
                <option value="">Barcha foydalanuvchilar</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (@{u.username})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={fetchHistory}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Qidirish
              </button>
            </div>
            <div className="bg-slate-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
              {historyLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Sana</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Foydalanuvchi</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">O'zgarish</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Manba</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Tafsilot</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Qolgan balans</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                            Tarix bo'yicha yozuvlar topilmadi
                          </td>
                        </tr>
                      ) : (
                        history.map((h) => {
                          const src = SOURCE_LABELS[h.source] || { label: h.source, icon: null, color: 'text-gray-400 bg-gray-500/20' }
                          return (
                            <tr key={h.id} className="hover:bg-slate-700/30">
                              <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{formatDate(h.createdAt)}</td>
                              <td className="px-4 py-3 text-sm text-white">
                                {h.user.name}
                                <span className="text-gray-400 text-xs block">@{h.user.username}{h.user.studentProfile?.studentId ? ` • ${h.user.studentProfile.studentId}` : ''}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={h.amount >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                                  {h.amount >= 0 ? '+' : ''}{h.amount} ∞
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${src.color}`}>
                                  {src.icon}
                                  {src.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-300 max-w-[220px] truncate" title={h.description || ''}>
                                {h.description || '—'}
                              </td>
                              <td className="px-4 py-3 text-sm text-white font-medium">{h.balanceAfter} ∞</td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal - Qo'shish / Ayirish */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-gray-700 shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">
                    Infinity {operation === 'add' ? 'Qo\'shish' : 'Ayirish'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-4 p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Foydalanuvchi</p>
                  <p className="text-white font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-gray-400">@{selectedUser.username}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                      ∞
                    </span>
                    <span className="text-white font-bold">
                      Hozirgi: {selectedUser.infinityPoints || 0}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Miqdor
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Infinity miqdorini kiriting"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sabab (ixtiyoriy)
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      placeholder="Nima uchun qo'shildi / ayirildi?"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="submit"
                      disabled={processing}
                      className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        operation === 'add'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Jarayonda...</span>
                        </>
                      ) : (
                        <>
                          {operation === 'add' ? (
                            <>
                              <Plus className="h-4 w-4" />
                              <span>Qo'shish</span>
                            </>
                          ) : (
                            <>
                              <Minus className="h-4 w-4" />
                              <span>Ayirish</span>
                            </>
                          )}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal - Foydalanuvchi tarixi */}
        {showHistoryModal && selectedUserForHistory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-gray-700 shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
              <div className="p-6 border-b border-gray-700 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <History className="h-5 w-5 text-green-400" />
                      Infinity tarixi
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                      {selectedUserForHistory.name} • @{selectedUserForHistory.username}
                      {selectedUserForHistory.studentProfile && ` • ${selectedUserForHistory.studentProfile.studentId}`}
                    </p>
                    <p className="text-white font-semibold mt-1">
                      Joriy balans: <span className="text-green-400">{selectedUserForHistory.infinityPoints ?? 0} ∞</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowHistoryModal(false); setSelectedUserForHistory(null) }}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="overflow-auto flex-1 p-4">
                {userHistoryLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                  </div>
                ) : userHistory.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Ushbu foydalanuvchi uchun harakatlar topilmadi</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">Sana</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">O'zgarish</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">Manba</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">Tafsilot</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">Balans</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {userHistory.map((h) => {
                        const src = SOURCE_LABELS[h.source] || { label: h.source, icon: null, color: 'text-gray-400 bg-gray-500/20' }
                        return (
                          <tr key={h.id} className="hover:bg-slate-700/30">
                            <td className="px-3 py-2 text-gray-300 whitespace-nowrap">{formatDate(h.createdAt)}</td>
                            <td className="px-3 py-2">
                              <span className={h.amount >= 0 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                                {h.amount >= 0 ? '+' : ''}{h.amount} ∞
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${src.color}`}>
                                {src.icon}
                                {src.label}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-300 max-w-[200px] truncate" title={h.description || ''}>{h.description || '—'}</td>
                            <td className="px-3 py-2 text-white font-medium">{h.balanceAfter} ∞</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
