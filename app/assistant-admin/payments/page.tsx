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
        return 'bg-emerald-500/12 text-emerald-400'
      case 'PENDING':
        return 'bg-amber-500/12 text-amber-400'
      case 'OVERDUE':
        return 'bg-red-500/12 text-red-400'
      default:
        return 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
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
    <DashboardLayout role="ASSISTANT_ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-primary)] mb-2">To&apos;lovlar Boshqaruvi</h1>
            <p className="text-sm sm:text-base text-[var(--text-secondary)]">Barcha to&apos;lovlarni boshqaring va narxlarni belgilang</p>
          </div>
          <button
            onClick={() => {
              setFormData({ studentId: '', amount: '', type: 'TUITION', dueDate: '', notes: '' })
              setShowAddModal(true)
            }}
            className="flex items-center gap-2 h-11 sm:h-[42px] px-4 sm:px-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-[10px] transition-all hover:-translate-y-0.5 shadow-lg text-sm sm:text-base"
          >
            <Plus className="h-[18px] w-[18px]" />
            <span className="whitespace-nowrap">Yangi To&apos;lov</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-[var(--bg-secondary)] rounded-[14px] p-4 sm:p-6 border border-[var(--border-subtle)] assistant-card-shadow hover:border-indigo-500/30 hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-[var(--text-muted)] uppercase tracking-wider">Qarzdorlik</span>
              <div className="w-10 h-10 rounded-[10px] bg-red-500/12 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-400">
              {`${totalDebt.toLocaleString()} so'm`}
            </p>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-[14px] p-4 sm:p-6 border border-[var(--border-subtle)] assistant-card-shadow hover:border-indigo-500/30 hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-[var(--text-muted)] uppercase tracking-wider">Jami tushumlar</span>
              <div className="w-10 h-10 rounded-[10px] bg-emerald-500/12 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400">
              {`${totalRevenue.toLocaleString()} so'm`}
            </p>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-[14px] p-4 sm:p-6 border border-[var(--border-subtle)] assistant-card-shadow hover:border-indigo-500/30 hover:-translate-y-0.5 transition-all sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-[var(--text-muted)] uppercase tracking-wider">Bugun to&apos;lov</span>
              <div className="w-10 h-10 rounded-[10px] bg-cyan-500/12 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-cyan-400">
              {'0 so\'m'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Qidirish (o'quvchi, login, ID)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
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
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-[var(--border-default)] border-t-indigo-500 mx-auto"></div>
            <p className="mt-4 text-[var(--text-secondary)]">Yuklanmoqda...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-16 bg-[var(--bg-secondary)] rounded-[14px] border border-[var(--border-subtle)] assistant-card-shadow">
            <div className="w-12 h-12 rounded-[10px] bg-[var(--accent-muted)] flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-6 w-6 text-indigo-400" />
            </div>
            <p className="text-[var(--text-secondary)] font-medium">To&apos;lovlar topilmadi</p>
          </div>
        ) : (
          <div className="bg-[var(--bg-secondary)] rounded-[14px] border border-[var(--border-subtle)] assistant-card-shadow overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-[var(--bg-tertiary)]">
                      <tr>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider sticky left-0 z-10 bg-[var(--bg-tertiary)]">O&apos;quvchi</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell bg-[var(--bg-tertiary)]">Summa</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden lg:table-cell bg-[var(--bg-tertiary)]">Turi</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-tertiary)]">Holat</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden xl:table-cell bg-[var(--bg-tertiary)]">Muddat</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden xl:table-cell bg-[var(--bg-tertiary)]">To&apos;langan</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-tertiary)]">Harakatlar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id} className="group hover:bg-[var(--bg-elevated)] transition-colors">
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 sticky left-0 z-10 bg-[var(--bg-secondary)] group-hover:bg-[var(--bg-elevated)] transition-colors">
                            <div>
                              <p className="text-xs sm:text-sm text-[var(--text-primary)] font-medium">{payment.student.user.name}</p>
                              <p className="text-xs text-[var(--text-muted)]">{payment.student.studentId}</p>
                              <p className="text-xs text-[var(--text-muted)] md:hidden mt-1">{payment.amount.toLocaleString()} so&apos;m</p>
                              <p className="text-xs text-gray-500 lg:hidden mt-1">{getTypeLabel(payment.type)}</p>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-[var(--text-primary)] font-semibold hidden md:table-cell">
                            {payment.amount.toLocaleString()} so&apos;m
                          </td>
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-[var(--text-secondary)] hidden lg:table-cell">
                            {getTypeLabel(payment.type)}
                          </td>
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusColor(payment.status)}`}>
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
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-[var(--text-secondary)] hidden xl:table-cell">
                            {payment.dueDate ? formatDateShort(payment.dueDate) : '-'}
                          </td>
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-[var(--text-secondary)] hidden xl:table-cell">
                            {payment.paidAt ? formatDateShort(payment.paidAt) : '-'}
                          </td>
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              {payment.status !== 'PAID' && (
                                <button
                                  onClick={() => handleMarkAsPaid(payment.id)}
                                  className="p-2 text-[var(--text-secondary)] hover:bg-emerald-500/20 hover:text-emerald-400 rounded-[10px] transition-colors"
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
                                className="p-2 text-[var(--text-secondary)] hover:bg-indigo-500/20 hover:text-indigo-400 rounded-[10px] transition-colors"
                                title="Tahrirlash"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePayment(payment.id)}
                                className="p-2 text-[var(--text-secondary)] hover:bg-red-500/20 hover:text-red-400 rounded-[10px] transition-colors"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-[var(--bg-secondary)] rounded-[20px] border border-[var(--border-subtle)] assistant-elevated-shadow w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up">
              <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Yangi To&apos;lov Qo&apos;shish</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-[10px] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddPayment} className="p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">O&apos;quvchi</label>
                  <select
                    required
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
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
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Summa (so&apos;m)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">To&apos;lov Turi</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  >
                    <option value="TUITION">O'qish haqi</option>
                    <option value="MATERIALS">Materiallar</option>
                    <option value="EXAM">Imtihon</option>
                    <option value="OTHER">Boshqa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Muddat</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Izoh</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
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
        {showEditModal && selectedPayment && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-[var(--bg-secondary)] rounded-[20px] border border-[var(--border-subtle)] assistant-elevated-shadow w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up">
              <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">To&apos;lovni Tahrirlash</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-[10px] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleEditPayment} className="p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">O&apos;quvchi</label>
                  <input
                    type="text"
                    value={selectedPayment.student.user.name}
                    disabled
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)]/50 border border-[var(--border-default)] rounded-[10px] text-[var(--text-muted)] cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Summa (so&apos;m)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">To&apos;lov Turi</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  >
                    <option value="TUITION">O'qish haqi</option>
                    <option value="MATERIALS">Materiallar</option>
                    <option value="EXAM">Imtihon</option>
                    <option value="OTHER">Boshqa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Holat</label>
                  <select
                    value={selectedPayment.status}
                    onChange={(e) => {
                      const newPayment = { ...selectedPayment, status: e.target.value }
                      setSelectedPayment(newPayment)
                    }}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  >
                    <option value="PENDING">Kutilmoqda</option>
                    <option value="PAID">To'langan</option>
                    <option value="OVERDUE">Muddati o'tgan</option>
                    <option value="CANCELLED">Bekor qilingan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Muddat</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Izoh</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
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
