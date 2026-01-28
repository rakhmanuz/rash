'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
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
  AlertCircle
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">To'lovlar Boshqaruvi</h1>
            <p className="text-gray-400">Barcha to'lovlarni boshqaring va narxlarni belgilang</p>
          </div>
          <button
            onClick={() => {
              setFormData({ studentId: '', amount: '', type: 'TUITION', dueDate: '', notes: '' })
              setShowAddModal(true)
            }}
            className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Yangi To'lov</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Jami Kirim</span>
              <DollarSign className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-400">{totalRevenue.toLocaleString()} so'm</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Qarzdorlik</span>
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400">{totalDebt.toLocaleString()} so'm</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Jami To'lovlar</span>
              <DollarSign className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">{payments.length}</p>
          </div>
        </div>

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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">O'quvchi</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Summa</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Turi</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Holat</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Muddat</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">To'langan</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Harakatlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-white font-medium">{payment.student.user.name}</p>
                          <p className="text-xs text-gray-400">{payment.student.studentId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white font-semibold">
                        {payment.amount.toLocaleString()} so'm
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {getTypeLabel(payment.type)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          <span>
                            {payment.status === 'PAID' ? 'To\'langan' :
                             payment.status === 'PENDING' ? 'Kutilmoqda' :
                             payment.status === 'OVERDUE' ? 'Muddati o\'tgan' :
                             payment.status === 'CANCELLED' ? 'Bekor qilingan' : payment.status}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('uz-UZ') : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('uz-UZ') : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center space-x-2">
                          {payment.status !== 'PAID' && (
                            <button
                              onClick={() => handleMarkAsPaid(payment.id)}
                              className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                              title="To'langan deb belgilash"
                            >
                              <Check className="h-4 w-4" />
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
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
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
            <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">Yangi To'lov Qo'shish</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleAddPayment} className="p-6 space-y-4">
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">To'lovni Tahrirlash</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleEditPayment} className="p-6 space-y-4">
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
