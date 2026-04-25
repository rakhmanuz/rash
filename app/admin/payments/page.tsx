'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { formatDateShort } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
  tuitionMeta?: {
    subjectId?: string
    subjectName?: string
    monthKey?: string
    category?: 'MONTHLY_TUITION'
  } | null
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
  enrollments?: Array<{
    subjectId: string | null
    subjectName: string | null
  }>
}

interface PaymentHistoryItem {
  id: string
  action: string
  amountBefore: number | null
  amountAfter: number | null
  changedAmount: number | null
  details: string | null
  actorName: string | null
  createdAt: string
}

export default function PaymentsPage() {
  const { data: session } = useSession()
  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('PENDING')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPartialPayModal, setShowPartialPayModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [partialPayPayment, setPartialPayPayment] = useState<Payment | null>(null)
  const [partialPaidAmount, setPartialPaidAmount] = useState('')
  const [partialPayLoading, setPartialPayLoading] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedMonthlyStudentId, setSelectedMonthlyStudentId] = useState<string>('')
  const [selectedMonthKey, setSelectedMonthKey] = useState(new Date().toISOString().slice(0, 7))
  const [selectedDueDate, setSelectedDueDate] = useState('')
  const [subjectMonthlyFees, setSubjectMonthlyFees] = useState<Record<string, string>>({})
  const [savingMonthlyPlan, setSavingMonthlyPlan] = useState(false)
  const [selectedMonthlyStudentPayments, setSelectedMonthlyStudentPayments] = useState<Payment[]>([])
  const [selectedMonthlyPlans, setSelectedMonthlyPlans] = useState<
    Array<{ subjectId: string; plannedAmount: number; dueDate?: string | null }>
  >([])
  const [historyStudentId, setHistoryStudentId] = useState('')
  const [historyRows, setHistoryRows] = useState<PaymentHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyStudentSearch, setHistoryStudentSearch] = useState('')
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    type: 'TUITION',
    subjectId: '',
    monthKey: new Date().toISOString().slice(0, 7),
    monthlyFee: '',
    paidAmount: '',
    dueDate: '',
    notes: '',
  })
  const fetchPayments = useCallback(async () => {
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
  }, [statusFilter])

  const fetchStudents = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/students?includeEnrollment=true')
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }, [])

  const fetchSelectedMonthlyStudentPayments = useCallback(async () => {
    if (!selectedMonthlyStudentId) {
      setSelectedMonthlyStudentPayments([])
      return
    }
    try {
      const response = await fetch(`/api/admin/payments?studentId=${selectedMonthlyStudentId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedMonthlyStudentPayments(Array.isArray(data) ? data : [])
      } else {
        setSelectedMonthlyStudentPayments([])
      }
    } catch (error) {
      console.error('Error fetching selected student payments:', error)
      setSelectedMonthlyStudentPayments([])
    }
  }, [selectedMonthlyStudentId])

  const fetchSelectedMonthlyPlans = useCallback(async () => {
    if (!selectedMonthlyStudentId || !selectedMonthKey) {
      setSelectedMonthlyPlans([])
      return
    }
    try {
      const response = await fetch(
        `/api/admin/payments/plans?studentId=${selectedMonthlyStudentId}&monthKey=${selectedMonthKey}`
      )
      if (response.ok) {
        const data = await response.json()
        setSelectedMonthlyPlans(Array.isArray(data) ? data : [])
      } else {
        setSelectedMonthlyPlans([])
      }
    } catch (error) {
      console.error('Error fetching payment plans:', error)
      setSelectedMonthlyPlans([])
    }
  }, [selectedMonthlyStudentId, selectedMonthKey])

  useEffect(() => {
    fetchPayments()
    fetchStudents()
  }, [fetchPayments, fetchStudents])

  useEffect(() => {
    fetchSelectedMonthlyStudentPayments()
  }, [fetchSelectedMonthlyStudentPayments])

  useEffect(() => {
    fetchSelectedMonthlyPlans()
  }, [fetchSelectedMonthlyPlans])

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          monthlyFee: formData.monthlyFee ? parseFloat(formData.monthlyFee) : undefined,
          paidAmount: formData.paidAmount ? parseFloat(formData.paidAmount) : 0,
        }),
      })

      if (response.ok) {
        setShowAddModal(false)
        setFormData({
          studentId: '',
          amount: '',
          type: 'TUITION',
          subjectId: '',
          monthKey: new Date().toISOString().slice(0, 7),
          monthlyFee: '',
          paidAmount: '',
          dueDate: '',
          notes: '',
        })
        fetchPayments()
        fetchSelectedMonthlyStudentPayments()
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
          status: selectedPayment.status,
          dueDate: formData.dueDate,
          notes: formData.notes,
        }),
      })

      if (response.ok) {
        setShowEditModal(false)
        setSelectedPayment(null)
        setFormData({
          studentId: '',
          amount: '',
          type: 'TUITION',
          subjectId: '',
          monthKey: new Date().toISOString().slice(0, 7),
          monthlyFee: '',
          paidAmount: '',
          dueDate: '',
          notes: '',
        })
        fetchPayments()
        fetchSelectedMonthlyStudentPayments()
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
        fetchSelectedMonthlyStudentPayments()
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
        fetchSelectedMonthlyStudentPayments()
      }
    } catch (error) {
      console.error('Error deleting payment:', error)
    }
  }

  const handlePartialPay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partialPayPayment) return

    const paidAmount = Number(partialPaidAmount)
    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      alert("To'langan summani to'g'ri kiriting")
      return
    }

    setPartialPayLoading(true)
    try {
      const response = await fetch(`/api/admin/payments/${partialPayPayment.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paidAmount }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        alert(data.error || 'Qisman to\'lashda xatolik')
        return
      }

      setShowPartialPayModal(false)
      setPartialPayPayment(null)
      setPartialPaidAmount('')
      fetchPayments()
      fetchSelectedMonthlyStudentPayments()
    } catch (error) {
      console.error('Error partial pay:', error)
      alert('Qisman to\'lashda xatolik')
    } finally {
      setPartialPayLoading(false)
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

  const parseAmountInput = (raw: string): number => {
    const normalized = raw.replace(/\s/g, '').replace(/'/g, '').replace(/,/g, '.')
    const value = Number(normalized)
    return Number.isFinite(value) ? value : 0
  }

  const getHistoryActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE_PENDING':
        return "Qarz qo'shildi"
      case 'CREATE_PAID':
        return "To'lov qo'shildi"
      case 'UPDATED':
        return "To'lov tahrirlandi"
      case 'MARK_AS_PAID':
        return "To'liq to'landi"
      case 'PARTIAL_PAID':
        return "Qisman to'landi"
      case 'DEBT_REDUCED':
        return 'Qarz kamaytirildi'
      case 'DELETED':
        return "To'lov o'chirildi"
      default:
        return action
    }
  }

  const historyMatchedStudent =
    students.find((s) => s.id === historyStudentId) ||
    students.find((student) => {
      const q = historyStudentSearch.trim().toLowerCase()
      if (!q) return false
      return (
        student.user.name.toLowerCase().includes(q) ||
        student.studentId.toLowerCase().includes(q) ||
        student.user.username.toLowerCase().includes(q)
      )
    }) ||
    null


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

  const todayRevenue = payments
    .filter((p) => {
      if (p.status !== 'PAID') return false
      const dateStr = p.paidAt || p.createdAt
      if (!dateStr) return false
      const paymentDate = new Date(dateStr)
      const now = new Date()
      return (
        paymentDate.getFullYear() === now.getFullYear() &&
        paymentDate.getMonth() === now.getMonth() &&
        paymentDate.getDate() === now.getDate()
      )
    })
    .reduce((sum, p) => sum + p.amount, 0)

  const totalStudentsWithDebt = new Set(
    payments.filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE').map((p) => p.student.id)
  ).size

  const tuitionDebtBySubject = Object.entries(
    payments.reduce<Record<string, number>>((acc, p) => {
      if (p.type !== 'TUITION') return acc
      if (p.status !== 'PENDING' && p.status !== 'OVERDUE') return acc
      const subjectName = p.tuitionMeta?.subjectName || 'Fan ko\'rsatilmagan'
      acc[subjectName] = (acc[subjectName] || 0) + p.amount
      return acc
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const selectedStudent = students.find((s) => s.id === formData.studentId)
  const selectedStudentSubjects = useMemo(
    () =>
      Array.from(
        new Map(
          (selectedStudent?.enrollments || [])
            .filter((e) => e.subjectId)
            .map((e) => [e.subjectId as string, e.subjectName || 'Fan'])
        ).entries()
      ),
    [selectedStudent]
  )

  const computedMonthlyFee = Number(formData.monthlyFee || 0)
  const computedRemaining = Math.max(0, computedMonthlyFee - Number(formData.paidAmount || 0))
  const monthlyFilteredStudents = students.filter((student) => {
    const q = studentSearch.trim().toLowerCase()
    if (!q) return true
    return (
      student.user.name.toLowerCase().includes(q) ||
      student.studentId.toLowerCase().includes(q) ||
      student.user.username.toLowerCase().includes(q)
    )
  })

  const selectedMonthlyStudent = students.find((s) => s.id === selectedMonthlyStudentId) || null
  const selectedMonthlySubjects = useMemo(
    () =>
      Array.from(
        new Map(
          (selectedMonthlyStudent?.enrollments || [])
            .filter((e) => e.subjectId)
            .map((e) => [e.subjectId as string, e.subjectName || 'Fan'])
        ).entries()
      ),
    [selectedMonthlyStudent]
  )

  const currentMonthPaymentsForSelected = useMemo(
    () =>
      selectedMonthlyStudentPayments.filter(
        (p) =>
          p.type === 'TUITION' &&
          p.student.id === selectedMonthlyStudentId &&
          p.tuitionMeta?.monthKey === selectedMonthKey &&
          p.status !== 'CANCELLED'
      ),
    [selectedMonthlyStudentPayments, selectedMonthlyStudentId, selectedMonthKey]
  )

  const currentMonthTotalsBySubject = useMemo(
    () =>
      currentMonthPaymentsForSelected.reduce<
        Record<string, { total: number; paid: number; pending: number; pendingId: string | null }>
      >((acc, p) => {
        const subjectKey =
          p.tuitionMeta?.subjectId ||
          `name:${(p.tuitionMeta?.subjectName || '').trim().toLowerCase()}`
        if (!subjectKey || subjectKey === 'name:') return acc
        if (!acc[subjectKey]) {
          acc[subjectKey] = { total: 0, paid: 0, pending: 0, pendingId: null }
        }
        acc[subjectKey].total += p.amount
        if (p.status === 'PAID') acc[subjectKey].paid += p.amount
        if (p.status === 'PENDING' || p.status === 'OVERDUE') {
          acc[subjectKey].pending += p.amount
          if (!acc[subjectKey].pendingId) acc[subjectKey].pendingId = p.id
        }
        return acc
      }, {}),
    [currentMonthPaymentsForSelected]
  )

  const getCurrentTotalsForSubject = useCallback(
    (subjectId: string, subjectName: string) => {
      const byId = currentMonthTotalsBySubject[subjectId]
      if (byId) return byId
      const nameKey = `name:${subjectName.trim().toLowerCase()}`
      return (
        currentMonthTotalsBySubject[nameKey] || {
          total: 0,
          paid: 0,
          pending: 0,
          pendingId: null,
        }
      )
    },
    [currentMonthTotalsBySubject]
  )

  const saveMonthlyPlan = async () => {
    if (!selectedMonthlyStudent) {
      alert("Avval o'quvchini tanlang")
      return
    }

    const entries = selectedMonthlySubjects
      .map(([subjectId, subjectName]) => ({
        subjectId,
        subjectName,
        fee: parseAmountInput(subjectMonthlyFees[subjectId] || ''),
      }))
      .filter((x) => Number.isFinite(x.fee) && x.fee > 0)

    if (entries.length === 0) {
      alert('Kamida bitta fan uchun summa kiriting')
      return
    }

    if (!/^\d{4}-\d{2}$/.test(selectedMonthKey)) {
      alert("Oy noto'g'ri formatda")
      return
    }

    setSavingMonthlyPlan(true)
    try {
      for (const entry of entries) {
        const current = getCurrentTotalsForSubject(entry.subjectId, entry.subjectName)

        if (entry.fee < current.paid) {
          alert(`${entry.subjectName}: bu fan bo'yicha to'langan summa (${current.paid.toLocaleString()} so'm) dan kam qilib bo'lmaydi`)
          continue
        }

        const pendingShouldBe = Math.max(0, entry.fee - current.paid)

        if (current.pendingId && pendingShouldBe > 0) {
          const updateRes = await fetch(`/api/admin/payments/${current.pendingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: pendingShouldBe,
              dueDate: selectedDueDate || undefined,
              status: 'PENDING',
              notes: `${selectedMonthKey} oylik`,
            }),
          })
          if (!updateRes.ok) {
            const err = await updateRes.json().catch(() => ({}))
            throw new Error(err.error || `${entry.subjectName} ni yangilashda xatolik`)
          }
          continue
        }

        if (current.pendingId && pendingShouldBe === 0) {
          const deleteRes = await fetch(`/api/admin/payments/${current.pendingId}`, {
            method: 'DELETE',
          })
          if (!deleteRes.ok) {
            const err = await deleteRes.json().catch(() => ({}))
            throw new Error(err.error || `${entry.subjectName} qarz yozuvini o'chirishda xatolik`)
          }
          continue
        }

        if (!current.pendingId && pendingShouldBe > 0) {
          const createRes = await fetch('/api/admin/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId: selectedMonthlyStudent.id,
              type: 'TUITION',
              amount: pendingShouldBe,
              subjectId: entry.subjectId,
              monthKey: selectedMonthKey,
              monthlyFee: pendingShouldBe,
              paidAmount: 0,
              dueDate: selectedDueDate || undefined,
              notes: `${selectedMonthKey} oylik`,
            }),
          })
          if (!createRes.ok) {
            const err = await createRes.json().catch(() => ({}))
            throw new Error(err.error || `${entry.subjectName} ni yaratishda xatolik`)
          }
        }
      }

      alert("Oyliklar muvaffaqiyatli kiritildi")
      setSubjectMonthlyFees({})
      await fetch('/api/admin/payments/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedMonthlyStudent.id,
          monthKey: selectedMonthKey,
          dueDate: selectedDueDate || null,
          entries: entries.map((e) => ({
            subjectId: e.subjectId,
            subjectName: e.subjectName,
            plannedAmount: e.fee,
          })),
        }),
      })
      fetchPayments()
      fetchSelectedMonthlyStudentPayments()
      fetchSelectedMonthlyPlans()
    } catch (error) {
      console.error(error)
      alert('Saqlashda xatolik')
    } finally {
      setSavingMonthlyPlan(false)
    }
  }

  useEffect(() => {
    if (!selectedMonthlyStudentId || !selectedMonthKey) return
    if (selectedMonthlySubjects.length === 0) return

    const next: Record<string, string> = {}
    selectedMonthlySubjects.forEach(([subjectId, subjectName]) => {
      const fromPlan = selectedMonthlyPlans.find((p) => p.subjectId === subjectId)
      if (fromPlan && Number.isFinite(fromPlan.plannedAmount)) {
        next[subjectId] = String(fromPlan.plannedAmount)
        return
      }
      const current = getCurrentTotalsForSubject(subjectId, subjectName)
      if (current && current.total > 0) {
        next[subjectId] = String(current.total)
      }
    })
    setSubjectMonthlyFees((prev) => {
      const prevKeys = Object.keys(prev).sort()
      const nextKeys = Object.keys(next).sort()
      if (prevKeys.length === nextKeys.length && prevKeys.every((k, i) => k === nextKeys[i] && prev[k] === next[k])) {
        return prev
      }
      return next
    })
  }, [selectedMonthlyStudentId, selectedMonthKey, selectedMonthlySubjects, selectedMonthlyPlans, getCurrentTotalsForSubject])

  useEffect(() => {
    if (!historyStudentId) {
      setHistoryRows([])
      return
    }
    let cancelled = false
    const run = async () => {
      setHistoryLoading(true)
      try {
        const res = await fetch(`/api/admin/payments/history?studentId=${historyStudentId}`)
        const data = await res.json().catch(() => [])
        if (!cancelled) {
          setHistoryRows(Array.isArray(data) ? data : [])
        }
      } catch {
        if (!cancelled) setHistoryRows([])
      } finally {
        if (!cancelled) setHistoryLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [historyStudentId])

  useEffect(() => {
    const q = historyStudentSearch.trim()
    if (!q) {
      setHistoryStudentId('')
      return
    }
    if (historyMatchedStudent?.id && historyMatchedStudent.id !== historyStudentId) {
      setHistoryStudentId(historyMatchedStudent.id)
    }
  }, [historyStudentSearch, historyMatchedStudent, historyStudentId])

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
              onClick={() => {
                setFormData({
                  studentId: '',
                  amount: '',
                  type: 'TUITION',
                  subjectId: '',
                  monthKey: new Date().toISOString().slice(0, 7),
                  monthlyFee: '',
                  paidAmount: '',
                  dueDate: '',
                  notes: '',
                })
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-400">Qarzdorlik</span>
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-400">
              {`${totalDebt.toLocaleString()} so'm`}
            </p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-400">Oylik To'lov</span>
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-400">
              {`${totalRevenue.toLocaleString()} so'm`}
            </p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-400">Bugun To'lov</span>
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">
              {`${todayRevenue.toLocaleString()} so'm`}
            </p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-400">Qarzdor o'quvchilar</span>
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-400">{totalStudentsWithDebt} ta</p>
          </div>
        </div>

        {tuitionDebtBySubject.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <h3 className="text-sm sm:text-base text-white font-semibold mb-3">Fanlar bo'yicha qarzdorlik (Top 3)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {tuitionDebtBySubject.map(([subject, amount]) => (
                <div key={subject} className="rounded-lg border border-gray-700 bg-slate-900/50 px-4 py-3">
                  <p className="text-xs text-gray-400">{subject}</p>
                  <p className="text-base font-semibold text-red-400">{amount.toLocaleString()} so'm</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-white">Oyliklarni tez kiritish (o'quvchi -&gt; fan)</h2>
            <p className="text-sm text-gray-400 mt-1">
              O'quvchini tanlang, oyni belgilang, har bir faniga summa yozib saqlang.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="O'quvchi qidirish..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="max-h-80 overflow-auto rounded-lg border border-gray-700 bg-slate-900/50 divide-y divide-gray-700">
                {monthlyFilteredStudents.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => {
                      setSelectedMonthlyStudentId(student.id)
                      setHistoryStudentId(student.id)
                      setSubjectMonthlyFees({})
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-700/60 transition-colors ${
                      selectedMonthlyStudentId === student.id ? 'bg-slate-700/60' : ''
                    }`}
                  >
                    <p className="text-sm text-white font-medium">{student.user.name}</p>
                    <p className="text-xs text-gray-400">
                      {student.studentId} | @{student.user.username}
                    </p>
                  </button>
                ))}
                {monthlyFilteredStudents.length === 0 && (
                  <p className="px-3 py-4 text-sm text-gray-400">Hech narsa topilmadi</p>
                )}
              </div>
            </div>
            <div className="lg:col-span-2 rounded-lg border border-gray-700 bg-slate-900/40 p-4">
              {!selectedMonthlyStudent ? (
                <p className="text-sm text-gray-400">Chap tomondan o'quvchini tanlang</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                    <div className="flex-1">
                      <p className="text-white font-semibold">{selectedMonthlyStudent.user.name}</p>
                      <p className="text-xs text-gray-400">{selectedMonthlyStudent.studentId}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Oy</label>
                      <input
                        type="month"
                        value={selectedMonthKey}
                        onChange={(e) => setSelectedMonthKey(e.target.value)}
                        className="px-3 py-2 bg-slate-800 border border-gray-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Muddat</label>
                      <input
                        type="date"
                        value={selectedDueDate}
                        onChange={(e) => setSelectedDueDate(e.target.value)}
                        className="px-3 py-2 bg-slate-800 border border-gray-700 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  {selectedMonthlySubjects.length === 0 ? (
                    <p className="text-sm text-yellow-300">Bu o'quvchida aktiv fan topilmadi</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedMonthlySubjects.map(([subjectId, subjectName]) => (
                        <div
                          key={subjectId}
                          className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center rounded-lg border border-gray-700 px-3 py-2"
                        >
                          <p className="text-sm text-gray-200">{subjectName}</p>
                          <input
                            type="text"
                            value={subjectMonthlyFees[subjectId] || ''}
                            onChange={(e) =>
                              setSubjectMonthlyFees((prev) => ({
                                ...prev,
                                [subjectId]: e.target.value,
                              }))
                            }
                            placeholder="Summa (so'm), masalan 500 000"
                            className="sm:col-span-2 px-3 py-2 bg-slate-800 border border-gray-700 rounded-lg text-white"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={savingMonthlyPlan || selectedMonthlySubjects.length === 0}
                      onClick={saveMonthlyPlan}
                      className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-900/50 text-white rounded-lg transition-colors"
                    >
                      {savingMonthlyPlan ? 'Saqlanmoqda...' : 'Fanlar bo\'yicha oyliklarni saqlash'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-white">To'lovlar tarixi</h2>
            <input
              type="text"
              value={historyStudentSearch}
              onChange={(e) => setHistoryStudentSearch(e.target.value)}
              placeholder="O'quvchi qidirish..."
              className="px-3 py-2 bg-slate-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 w-full sm:w-80"
            />
          </div>

          {!historyStudentId ? (
            <p className="text-sm text-gray-400">Tarixni ko'rish uchun o'quvchini tanlang.</p>
          ) : historyLoading ? (
            <p className="text-sm text-gray-400">Yuklanmoqda...</p>
          ) : historyRows.length === 0 ? (
            <p className="text-sm text-gray-400">Hozircha tarix yozuvlari yo'q.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-auto pr-1">
              {historyRows.map((row) => (
                <div key={row.id} className="rounded-lg border border-gray-700 bg-slate-900/50 px-4 py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="text-sm font-medium text-white">{getHistoryActionLabel(row.action)}</p>
                    <p className="text-xs text-gray-400">{formatDateShort(row.createdAt)}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {row.amountBefore !== null ? `Oldin: ${row.amountBefore.toLocaleString()} so'm` : 'Oldin: -'} |{' '}
                    {row.amountAfter !== null ? `Keyin: ${row.amountAfter.toLocaleString()} so'm` : 'Keyin: -'}
                  </p>
                  {row.changedAmount !== null && (
                    <p className="text-xs text-gray-400">O'zgarish: {row.changedAmount.toLocaleString()} so'm</p>
                  )}
                  {row.details && <p className="text-xs text-gray-500 mt-1">{row.details}</p>}
                  {row.actorName && <p className="text-xs text-gray-500">Admin: {row.actorName}</p>}
                </div>
              ))}
            </div>
          )}
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
            <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white sticky left-0 z-10 bg-slate-700">O'quvchi</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white hidden md:table-cell">Summa</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white hidden lg:table-cell">Turi</th>
                        <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white hidden lg:table-cell">Fan / Oy</th>
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
                          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300 hidden lg:table-cell">
                            {payment.tuitionMeta?.subjectName ? (
                              <div>
                                <p>{payment.tuitionMeta.subjectName}</p>
                                <p className="text-gray-500">{payment.tuitionMeta.monthKey || '-'}</p>
                              </div>
                            ) : (
                              '-'
                            )}
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
                                  onClick={() => {
                                    setPartialPayPayment(payment)
                                    setPartialPaidAmount('')
                                    setShowPartialPayModal(true)
                                  }}
                                  className="p-1.5 sm:p-2 text-yellow-300 hover:bg-yellow-500/20 rounded-lg transition-colors"
                                  title="Qisman to'lash"
                                >
                                  <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </button>
                              )}
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
                                    subjectId: payment.tuitionMeta?.subjectId || '',
                                    monthKey: payment.tuitionMeta?.monthKey || new Date().toISOString().slice(0, 7),
                                    monthlyFee: payment.amount.toString(),
                                    paidAmount: payment.status === 'PAID' ? payment.amount.toString() : '0',
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
                {formData.type === 'TUITION' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Fan</label>
                      <select
                        required
                        value={formData.subjectId}
                        onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Fan tanlang</option>
                        {selectedStudentSubjects.map(([subjectId, subjectName]) => (
                          <option key={subjectId} value={subjectId}>
                            {subjectName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Oy</label>
                      <input
                        type="month"
                        required
                        value={formData.monthKey}
                        onChange={(e) => setFormData({ ...formData, monthKey: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Oylik summa</label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={formData.monthlyFee}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              monthlyFee: e.target.value,
                              amount: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">To'lagani</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.paidAmount}
                          onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-700 bg-slate-900/50 px-4 py-3">
                      <p className="text-xs text-gray-400">Qolgan qarz</p>
                      <p className="text-base font-semibold text-red-400">{computedRemaining.toLocaleString()} so'm</p>
                    </div>
                  </>
                )}
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

        {showPartialPayModal && partialPayPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-md">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Qisman to'lash</h2>
                <button
                  onClick={() => {
                    setShowPartialPayModal(false)
                    setPartialPayPayment(null)
                    setPartialPaidAmount('')
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
              <form onSubmit={handlePartialPay} className="p-4 sm:p-6 space-y-4">
                <div className="rounded-lg border border-gray-700 bg-slate-900/40 p-3">
                  <p className="text-sm text-gray-300">{partialPayPayment.student.user.name}</p>
                  <p className="text-xs text-gray-500">
                    Qolgan qarz: {partialPayPayment.amount.toLocaleString()} so'm
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">To'langan summa</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={partialPayPayment.amount}
                    step="0.01"
                    value={partialPaidAmount}
                    onChange={(e) => setPartialPaidAmount(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Masalan: 300000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Qoladi: {Math.max(0, partialPayPayment.amount - Number(partialPaidAmount || 0)).toLocaleString()} so'm
                  </p>
                </div>
                <div className="flex items-center space-x-3 pt-1">
                  <button
                    type="submit"
                    disabled={partialPayLoading}
                    className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-700/60 text-white rounded-lg transition-colors"
                  >
                    {partialPayLoading ? 'Saqlanmoqda...' : 'Qisman to\'lashni saqlash'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPartialPayModal(false)
                      setPartialPayPayment(null)
                      setPartialPaidAmount('')
                    }}
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
