'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { formatDateShort } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  DollarSign,
  X,
  Check,
  Clock,
  AlertCircle,
  Upload,
  FileSpreadsheet
} from 'lucide-react'

interface Payment {
  id: string
  student: {
    id: string
    studentId: string
    user: {
      name: string
      username: string
    }
  }
  amount: number
  type: string
  status: string
  dueDate?: string
  paidAt?: string
  notes?: string
  createdAt: string
}

interface Student {
  id: string
  studentId: string
  user: {
    name: string
    username: string
  }
}

export default function PaymentsPage() {
  const { data: session } = useSession()
  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    type: 'TUITION',
    dueDate: '',
    notes: '',
  })
  const [loadingFromSheets, setLoadingFromSheets] = useState(false)
  const [sheetsData, setSheetsData] = useState<any>(null)
  const [showSheetsData, setShowSheetsData] = useState(false)
  const [sheetsStats, setSheetsStats] = useState<{
    totalIncome: number
    totalDebt: number
    totalPayments: number
  } | null>(null)

  useEffect(() => {
    fetchPayments()
    fetchStudents()
  }, [statusFilter])

  const fetchPayments = async () => {
    try {
      const url = statusFilter 
        ? `/api/admin/payments?status=${statusFilter}`
        : '/api/admin/payments'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setPayments(data)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      })

      if (response.ok) {
        setShowAddModal(false)
        setFormData({ studentId: '', amount: '', type: 'TUITION', dueDate: '', notes: '' })
        fetchPayments()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error adding payment:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleEditPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPayment) return

    try {
      const response = await fetch(`/api/admin/payments/${selectedPayment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          type: formData.type,
          dueDate: formData.dueDate,
          notes: formData.notes,
        }),
      })

      if (response.ok) {
        setShowEditModal(false)
        setSelectedPayment(null)
        setFormData({ studentId: '', amount: '', type: 'TUITION', dueDate: '', notes: '' })
        fetchPayments()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error editing payment:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          paidAt: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        fetchPayments()
      }
    } catch (error) {
      console.error('Error marking payment as paid:', error)
    }
  }

  const handleDeletePayment = async (id: string) => {
    if (!confirm('To\'lovni o\'chirishni tasdiqlaysizmi?')) return

    try {
      const response = await fetch(`/api/admin/payments/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchPayments()
      }
    } catch (error) {
      console.error('Error deleting payment:', error)
    }
  }

  const handleLoadFromSheets = async () => {
    setLoadingFromSheets(true)
    try {
      // Avval statistikalarni yuklash
      const statsResponse = await fetch('/api/admin/payments/from-sheets?type=stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        console.log('📊 Google Sheets Stats:', statsData)
        setSheetsStats(statsData)
      } else {
        const error = await statsResponse.json()
        console.error('❌ Stats xatolik:', error)
        // Xatolik bo'lsa ham davom etamiz
      }

      // Keyin to'lovlarni yuklash
      const response = await fetch('/api/admin/payments/from-sheets')
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Google Sheets Data:', data)
        setSheetsData(data)
        setShowSheetsData(true)
      } else {
        const error = await response.json()
        alert(`❌ Xatolik: ${error.error || 'Google Sheets dan o'qishda muammo'}`)
      }
    } catch (error) {
      console.error('Error loading from Google Sheets:', error)
      alert('❌ Google Sheets dan o\'qishda xatolik')
    } finally {
      setLoadingFromSheets(false)
    }
  }

  const handleLoadStatsFromSheets = async () => {
    setLoadingFromSheets(true)
    try {
      const response = await fetch('/api/admin/payments/from-sheets?type=stats')
      
      if (response.ok) {
        const data = await response.json()
        // Statistikalarni ko'rsatish
        alert(`📊 Google Sheets Statistikalar:\n\n${JSON.stringify(data, null, 2)}`)
      } else {
        const error = await response.json()
        alert(`❌ Xatolik: ${error.error || 'Google Sheets dan statistika o\'qishda muammo'}`)
      }
    } catch (error) {
      console.error('Error loading stats from Google Sheets:', error)
      alert('❌ Google Sheets dan statistika o\'qishda xatolik')
    } finally {
      setLoadingFromSheets(false)
    }
  }

  const handleSyncFromSheets = async () => {
    if (!confirm('Google Sheets dan to\'lov holatlarini database\'ga sync qilishni tasdiqlaysizmi?\n\nBu operatsiya:\n- Manfiy sonlar (qarzdorlik) ni OVERDUE to\'lovlarga aylantiradi\n- Musbat sonlar (ortiqcha to\'lov) ni PAID to\'lovlarga qo\'shadi')) {
      return
    }

    setLoadingFromSheets(true)
    try {
      const response = await fetch('/api/admin/payments/sync-from-sheets', {
        method: 'POST',
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(`✅ Sync muvaffaqiyatli!\n\n- ${data.synced} ta o'quvchi sync qilindi\n- ${data.errors} ta xatolik`)
        
        // To'lovlarni qayta yuklash
        fetchPayments()
      } else {
        const error = await response.json()
        alert(`❌ Xatolik: ${error.error || 'Sync qilishda muammo'}`)
      }
    } catch (error) {
      console.error('Error syncing from Google Sheets:', error)
      alert('❌ Sync qilishda xatolik')
    } finally {
      setLoadingFromSheets(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-500/20 text-green-400'
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'OVERDUE':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Check className="h-4 w-4" />
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'OVERDUE':
        return <AlertCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'TUITION':
        return 'O\'qish haqi'
      case 'MATERIALS':
        return 'Materiallar'
      case 'EXAM':
        return 'Imtihon'
      case 'OTHER':
        return 'Boshqa'
      default:
        return type
    }
  }

  const filteredPayments = payments.filter(payment =>
    payment.student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.student.user.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalRevenue = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalDebt = payments
    .filter(p => p.status === 'PENDING' || p.status === 'OVERDUE')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">To'lovlar Boshqaruvi</h1>
            <p className="text-sm sm:text-base text-gray-400">Barcha to'lovlarni boshqaring va narxlarni belgilang</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={handleLoadFromSheets}
              disabled={loadingFromSheets}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg transition-colors text-sm sm:text-base"
              title="Google Sheets dan o'qish"
            >
              {loadingFromSheets ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="whitespace-nowrap">Yuklanmoqda...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="whitespace-nowrap hidden sm:inline">Google Sheets</span>
                </>
              )}
            </button>
            <button
              onClick={handleSyncFromSheets}
              disabled={loadingFromSheets}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white rounded-lg transition-colors text-sm sm:text-base"
              title="Google Sheets dan database'ga sync qilish"
            >
              {loadingFromSheets ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="whitespace-nowrap">Sync qilinmoqda...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="whitespace-nowrap hidden sm:inline">Sync qilish</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setFormData({ studentId: '', amount: '', type: 'TUITION', dueDate: '', notes: '' })
                setShowAddModal(true)
              }}
              className="flex items-center space-x-2 px-3 sm:px-6 py-2 sm:py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm sm:text-base"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="whitespace-nowrap">Yangi To'lov</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-400">Jami Kirim</span>
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">
              {sheetsStats?.totalIncome !== undefined
                ? `${sheetsStats.totalIncome.toLocaleString()} so'm` 
                : `${totalRevenue.toLocaleString()} so'm`}
            </p>
            {sheetsStats?.totalIncome !== undefined && (
              <p className="text-xs text-gray-500 mt-1">📊 Google Sheets</p>
            )}
          </div>
          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-400">Qarzdorlik</span>
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-400">
              {sheetsStats?.totalDebt !== undefined
                ? `${sheetsStats.totalDebt.toLocaleString()} so'm` 
                : `${totalDebt.toLocaleString()} so'm`}
            </p>
            {sheetsStats?.totalDebt !== undefined && (
              <p className="text-xs text-gray-500 mt-1">📊 Google Sheets</p>
            )}
          </div>
          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-400">Jami To'lovlar</span>
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
              {sheetsStats?.totalPayments !== undefined
                ? sheetsStats.totalPayments 
                : payments.length}
            </p>
            {sheetsStats?.totalPayments !== undefined && (
              <p className="text-xs text-gray-500 mt-1">📊 Google Sheets</p>
            )}
          </div>
        </div>

        {/* Google Sheets Data */}
        {showSheetsData && sheetsData?.payments && (
          <div className="bg-slate-800 rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">📊 Google Sheets Ma'lumotlari</h2>
              <button
                onClick={() => setShowSheetsData(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-700">
                  <tr>
                    {sheetsData.headers?.map((header: string, index: number) => (
                      <th key={index} className="px-4 py-2 text-left text-sm font-semibold text-white">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {sheetsData.payments?.slice(0, 20).map((payment: any, index: number) => (
                    <tr key={index} className="hover:bg-slate-700/50">
                      {sheetsData.headers?.map((header: string, colIndex: number) => (
                        <td key={colIndex} className="px-4 py-2 text-sm text-gray-300">
                          {payment[header.toLowerCase().replace(/\s+/g, '_')] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {sheetsData.payments?.length > 20 && (
                <p className="text-sm text-gray-400 mt-4">
                  ... va yana {sheetsData.payments.length - 20} ta qator
                </p>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Qidirish (o'quvchi, login, ID)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Barcha holatlar</option>
            <option value="PENDING">Kutilmoqda</option>
            <option value="PAID">To'langan</option>
            <option value="OVERDUE">Muddati o'tgan</option>
            <option value="CANCELLED">Bekor qilingan</option>
          </select>
        </div>

        {/* Payments Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Yuklanmoqda...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-xl border border-gray-700">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">To'lovlar topilmadi</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white sticky left-0 z-10 bg-slate-700">O'quvchi</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white hidden md:table-cell">Summa</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white hidden lg:table-cell">Turi</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white">Holat</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white hidden xl:table-cell">Muddat</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white hidden xl:table-cell">To'langan</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white">Harakatlar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-slate-700/50 transition-colors">
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 sticky left-0 z-10 bg-slate-800">
                            <div>
                              <p className="text-xs sm:text-sm text-white font-medium">{payment.student.user.name}</p>
                              <p className="text-xs text-gray-400">{payment.student.studentId}</p>
                              <p className="text-xs text-gray-500 md:hidden mt-1">{payment.amount.toLocaleString()} so'm</p>
                              <p className="text-xs text-gray-500 lg:hidden mt-1">{getTypeLabel(payment.type)}</p>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-white font-semibold hidden md:table-cell">
                            {payment.amount.toLocaleString()} so'm
                          </td>
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300 hidden lg:table-cell">
                            {getTypeLabel(payment.type)}
                          </td>
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
                            <span className={`inline-flex items-center space-x-1 px-1.5 sm:px-2 py-1 rounded text-xs ${getStatusColor(payment.status)}`}>
                              {getStatusIcon(payment.status)}
                              <span className="hidden sm:inline">
                                {payment.status === 'PAID' ? 'To\'langan' :
                                 payment.status === 'PENDING' ? 'Kutilmoqda' :
                                 payment.status === 'OVERDUE' ? 'Muddati o\'tgan' :
                                 payment.status === 'CANCELLED' ? 'Bekor qilingan' : payment.status}
                              </span>
                              <span className="sm:hidden">
                                {payment.status === 'PAID' ? '✓' :
                                 payment.status === 'PENDING' ? '⏱' :
                                 payment.status === 'OVERDUE' ? '⚠' :
                                 payment.status === 'CANCELLED' ? '✗' : payment.status}
                              </span>
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300 hidden xl:table-cell">
                            {payment.dueDate ? formatDateShort(payment.dueDate) : '-'}
                          </td>
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300 hidden xl:table-cell">
                            {payment.paidAt ? formatDateShort(payment.paidAt) : '-'}
                          </td>
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              {payment.status !== 'PAID' && (
                                <button
                                  onClick={() => handleMarkAsPaid(payment.id)}
                                  className="p-1.5 sm:p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                                  title="To'langan deb belgilash"
                                >
                                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedPayment(payment)
                                  setFormData({
                                    studentId: payment.student.id,
                                    amount: payment.amount.toString(),
                                    type: payment.type,
                                    dueDate: payment.dueDate ? new Date(payment.dueDate).toISOString().split('T')[0] : '',
                                    notes: payment.notes || '',
                                  })
                                  setShowEditModal(true)
                                }}
                                className="p-1.5 sm:p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                                title="Tahrirlash"
                              >
                                <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePayment(payment.id)}
                                className="p-1.5 sm:p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                title="O'chirish"
                              >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Yangi To'lov Qo'shish</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
              <form onSubmit={handleAddPayment} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">O'quvchi</label>
                  <select
                    required
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">O'quvchi tanlang</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.user.name} ({student.studentId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Summa (so'm)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">To'lov Turi</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="TUITION">O'qish haqi</option>
                    <option value="MATERIALS">Materiallar</option>
                    <option value="EXAM">Imtihon</option>
                    <option value="OTHER">Boshqa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Muddat</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Izoh</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
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
        {showEditModal && selectedPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
                <h2 className="text-lg sm:text-xl font-semibold text-white">To'lovni Tahrirlash</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
              <form onSubmit={handleEditPayment} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">O'quvchi</label>
                  <input
                    type="text"
                    value={selectedPayment.student.user.name}
                    disabled
                    className="w-full px-4 py-2 bg-slate-700/50 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Summa (so'm)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">To'lov Turi</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="TUITION">O'qish haqi</option>
                    <option value="MATERIALS">Materiallar</option>
                    <option value="EXAM">Imtihon</option>
                    <option value="OTHER">Boshqa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Holat</label>
                  <select
                    value={selectedPayment.status}
                    onChange={(e) => {
                      const newPayment = { ...selectedPayment, status: e.target.value }
                      setSelectedPayment(newPayment)
                    }}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="PENDING">Kutilmoqda</option>
                    <option value="PAID">To'langan</option>
                    <option value="OVERDUE">Muddati o'tgan</option>
                    <option value="CANCELLED">Bekor qilingan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Muddat</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Izoh</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
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
      </div>
    </DashboardLayout>
  )
}
