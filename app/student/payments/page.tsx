'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { formatDateShort } from '@/lib/utils'
import { useCallback, useEffect, useState } from 'react'
import {
  Check,
  Clock,
  AlertCircle,
  CalendarRange,
} from 'lucide-react'

interface Payment {
  id: string
  amount: number
  type: string
  status: string
  tuitionMeta?: {
    subjectId?: string
    subjectName?: string
    monthKey?: string
    category?: 'MONTHLY_TUITION'
  } | null
  dueDate?: string | null
  paidAt?: string | null
  notes?: string | null
  createdAt: string
}

export default function StudentPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

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
  const totalDebt = totalDebtFromPayments

  const subjectDebts = Object.entries(
    payments.reduce<Record<string, number>>((acc, payment) => {
      if (payment.status !== 'PENDING' && payment.status !== 'OVERDUE') return acc
      const subject = payment.tuitionMeta?.subjectName || "Fan ko'rsatilmagan"
      acc[subject] = (acc[subject] || 0) + payment.amount
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1])

  const getMonthRangeLabel = (monthKey: string) => {
    if (!/^\d{4}-\d{2}$/.test(monthKey)) return monthKey
    const [yearRaw, monthRaw] = monthKey.split('-')
    const year = Number(yearRaw)
    const month = Number(monthRaw)
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return monthKey
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 1)
    const fmt = (d: Date) => d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
    return `${fmt(start)} - ${fmt(end)}`
  }

  const getMonthTitleLabel = (monthKey: string) => {
    if (!/^\d{4}-\d{2}$/.test(monthKey)) return `${monthKey} oylik`
    const [yearRaw, monthRaw] = monthKey.split('-')
    const year = Number(yearRaw)
    const month = Number(monthRaw)
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return `${monthKey} oylik`
    const monthNames = [
      'YANVAR',
      'FEVRAL',
      'MART',
      'APREL',
      'MAY',
      'IYUN',
      'IYUL',
      'AVGUST',
      'SENTABR',
      'OKTABR',
      'NOYABR',
      'DEKABR',
    ]
    return `${monthNames[month - 1]} oyi uchun`
  }

  const getMonthRangeDescription = (monthKey: string) => {
    if (!/^\d{4}-\d{2}$/.test(monthKey)) return "Davr: shu oyning 1-kunidan keyingi oyning 1-kunigacha"
    const [yearRaw, monthRaw] = monthKey.split('-')
    const year = Number(yearRaw)
    const month = Number(monthRaw)
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return "Davr: shu oyning 1-kunidan keyingi oyning 1-kunigacha"
    }
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 1)
    const mFmt = (d: Date) =>
      d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })
    return `Davr: ${mFmt(start)}dan ${mFmt(end)}gacha`
  }

  const monthlySubjectTotals = Object.entries(
    payments.reduce<Record<string, number>>((acc, payment) => {
      if (payment.status === 'PAID' || payment.status === 'CANCELLED') return acc
      const monthKey =
        payment.tuitionMeta?.monthKey ||
        `${new Date(payment.createdAt).getFullYear()}-${String(new Date(payment.createdAt).getMonth() + 1).padStart(2, '0')}`
      const subjectName = payment.tuitionMeta?.subjectName || "Fan ko'rsatilmagan"
      const key = `${monthKey}|||${subjectName}`
      acc[key] = (acc[key] || 0) + payment.amount
      return acc
    }, {})
  )
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12)

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
              To'lanmagan to'lovlar asosida hisoblandi
            </p>
          </div>
        </div>

        {subjectDebts.length > 0 && (
          <div className="bg-slate-800/50 rounded-xl border border-gray-700 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Fanlar bo'yicha qarzdorlik</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subjectDebts.map(([subject, debt]) => (
                <div key={subject} className="rounded-lg border border-gray-700 bg-slate-900/40 px-4 py-3">
                  <p className="text-sm text-gray-300">{subject}</p>
                  <p className="text-base font-semibold text-red-400">{debt.toLocaleString()} so'm</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly totals */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto" />
            <p className="mt-4 text-gray-400">Yuklanmoqda...</p>
          </div>
        ) : monthlySubjectTotals.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-gray-700">
            <CalendarRange className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Oylar bo'yicha to'lovlar topilmadi</p>
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-blue-400" />
                Oylar bo'yicha to'lov summalari
              </h2>
            </div>
            <div className="divide-y divide-gray-700">
              {monthlySubjectTotals.map(([compositeKey, amount]) => {
                const [monthKey, subjectName] = compositeKey.split('|||')
                return (
                <div key={compositeKey} className="p-4 sm:p-5 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white font-medium">{subjectName}</p>
                      <p className="text-sm text-blue-300">{getMonthTitleLabel(monthKey)}</p>
                      <p className="text-sm text-gray-400">{getMonthRangeLabel(monthKey)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {getMonthRangeDescription(monthKey)}
                      </p>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-white">{amount.toLocaleString()} so'm</p>
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
