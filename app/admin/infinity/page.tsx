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

export default function InfinityPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [operation, setOperation] = useState<'add' | 'subtract'>('add')
  const [amount, setAmount] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleOpenModal = (user: User, op: 'add' | 'subtract') => {
    setSelectedUser(user)
    setOperation(op)
    setAmount('')
    setError(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedUser(null)
    setAmount('')
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
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Infinity ballar muvaffaqiyatli ${operation === 'add' ? 'qo\'shildi' : 'ayirildi'}!`)
        handleCloseModal()
        fetchUsers() // Yangilash
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
            <p className="text-gray-400">Foydalanuvchilarning infinity ballarini boshqarish</p>
          </div>
        </div>

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

        {/* Error Message */}
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
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
      </div>
    </DashboardLayout>
  )
}
