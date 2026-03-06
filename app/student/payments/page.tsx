'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { formatDateShort } from '@/lib/utils'
import { useCallback, useEffect, useState } from 'react'
import {
  Check,
  Clock,
  AlertCircle,
  Receipt,
} from 'lucide-react'

interface Payment {
  id: string
  amount: number
  type: string
  status: string
  dueDate?: string | null
  paidAt?: string | null
  notes?: string | null
  createdAt: string
}

export default function StudentPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetDebt, setSheetDebt] = useState<number | null>(null)

  const fetchPayments = useCallback(async () => {
    try {
      const response = await fetch('/api/student/payments')
      if (response.ok) {
        const data = await response.json()
        setPayments(data)
      } else {
        setPayments([])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSheetDebt = useCallback(async () => {
    try {
      const res = await fetch('/api/student/debt-from-sheet', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setSheetDebt(typeof data.debt === 'number' ? data.debt : 0)
      }
    } catch {
      setSheetDebt(null)
    }
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  useEffect(() => {
    fetchSheetDebt()
    const t = setInterval(fetchSheetDebt, 60 * 1000)
    return () => clearInterval(t)
  }, [fetchSheetDebt])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'OVERDUE':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'CANCELLED':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID':
        return "To'langan"
      case 'PENDING':
        return 'Kutilmoqda'
      case 'OVERDUE':
        return "Muddati o'tgan"
      case 'CANCELLED':
        return 'Bekor qilingan'
      default:
        return status
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'TUITION':
        return "O'qish haqi"
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

  const totalDebtFromPayments = payments
    .filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE')
    .reduce((sum, p) => sum + p.amount, 0)
  const totalDebt = sheetDebt !== null ? sheetDebt : totalDebtFromPayments

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
            Mening to'lovlarim
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            To'lovlar tarixi va qarzdorlik
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:max-w-xs gap-4 sm:gap-6">
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-400">Qarzdorlik</span>
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-400">
              {`${totalDebt.toLocaleString()} so'm`}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {sheetDebt !== null ? "Hisobdan (har daqiqa yangilanadi)" : "To'lanmagan to'lovlar"}
            </p>
          </div>
        </div>

        {/* Payments list */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto" />
            <p className="mt-4 text-gray-400">Yuklanmoqda...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-gray-700">
            <Receipt className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Hozircha to'lovlar yo'q</p>
            <p className="text-sm text-gray-500 mt-1">
              To'lovlar admin tomonidan qo'shilganda shu yerda ko'rinadi
            </p>
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-400" />
                Oxirgi 10 ta to'lov
              </h2>
            </div>
            <div className="divide-y divide-gray-700">
              {payments.slice(0, 10).map((payment) => {
                const paidAtDate = payment.paidAt ? new Date(payment.paidAt) : null
                const timeStr = paidAtDate
                  ? paidAtDate.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
                  : null
                const dateTimeStr =
                  payment.paidAt && payment.status === 'PAID'
                    ? `${formatDateShort(payment.paidAt)} ${timeStr ?? ''}`.trim()
                    : payment.dueDate
                      ? `Muddat: ${formatDateShort(payment.dueDate)}`
                      : formatDateShort(payment.createdAt)
                return (
                  <div
                    key={payment.id}
                    className="p-4 sm:p-5 hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-white font-medium">
                            {getTypeLabel(payment.type)}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${getStatusColor(
                              payment.status
                            )}`}
                          >
                            {getStatusIcon(payment.status)}
                            {getStatusLabel(payment.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 font-medium">
                          Vaqt: {dateTimeStr}
                        </p>
                        {payment.notes && (
                          <p className="text-sm text-gray-500 mt-2 truncate max-w-md">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                      <div className="sm:text-right">
                        <p className="text-lg sm:text-xl font-bold text-white">
                          {payment.amount.toLocaleString()} so'm
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
