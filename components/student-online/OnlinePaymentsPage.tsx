'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarRange,
  Check,
  Clock,
  CreditCard,
  Wallet,
} from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { OnlinePageHeader } from '@/components/student-online/online-ui'
import { cn } from '@/lib/utils'

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

function getStatusStyle(status: string) {
  switch (status) {
    case 'PAID':
      return 'bg-green-50 text-green-700 ring-green-200'
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 ring-amber-200'
    case 'OVERDUE':
      return 'bg-red-50 text-red-700 ring-red-200'
    default:
      return 'bg-gray-50 text-gray-600 ring-gray-200'
  }
}

function getStatusLabel(status: string) {
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

function getStatusIcon(status: string) {
  switch (status) {
    case 'PAID':
      return <Check className="h-3.5 w-3.5" />
    case 'PENDING':
      return <Clock className="h-3.5 w-3.5" />
    case 'OVERDUE':
      return <AlertCircle className="h-3.5 w-3.5" />
    default:
      return null
  }
}

function getMonthTitleLabel(monthKey: string) {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return `${monthKey} oylik`
  const [, monthRaw] = monthKey.split('-')
  const month = Number(monthRaw)
  const monthNames = [
    'Yanvar',
    'Fevral',
    'Mart',
    'Aprel',
    'May',
    'Iyun',
    'Iyul',
    'Avgust',
    'Sentabr',
    'Oktabr',
    'Noyabr',
    'Dekabr',
  ]
  if (month < 1 || month > 12) return `${monthKey} oylik`
  return `${monthNames[month - 1]} oyi`
}

function getMonthRangeLabel(monthKey: string) {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return monthKey
  const [yearRaw, monthRaw] = monthKey.split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return monthKey
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  const fmt = (d: Date) => d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

export function OnlinePaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [sheetDebt, setSheetDebt] = useState<number | null>(null)
  const [sheetNote, setSheetNote] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPayments = useCallback(async () => {
    try {
      const response = await fetch('/api/student/payments', { credentials: 'include' })
      if (response.ok) {
        setPayments(await response.json())
      } else {
        setPayments([])
      }
    } catch {
      setPayments([])
    }
  }, [])

  const fetchSheetDebt = useCallback(async () => {
    try {
      const res = await fetch('/api/student/debt-from-sheet', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      if (typeof data.debt === 'number') setSheetDebt(data.debt)
      else setSheetDebt(null)
      setSheetNote(data.message ?? null)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      await Promise.all([fetchPayments(), fetchSheetDebt()])
      setLoading(false)
    }
    void run()
    const id = setInterval(() => void fetchSheetDebt(), 60_000)
    return () => clearInterval(id)
  }, [fetchPayments, fetchSheetDebt])

  const debtFromPayments = useMemo(
    () =>
      payments
        .filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE')
        .reduce((sum, p) => sum + p.amount, 0),
    [payments]
  )

  const displayDebt = sheetDebt !== null ? sheetDebt : debtFromPayments

  const paidTotal = useMemo(
    () => payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0),
    [payments]
  )

  const pendingCount = useMemo(
    () => payments.filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE').length,
    [payments]
  )

  const subjectDebts = useMemo(
    () =>
      Object.entries(
        payments.reduce<Record<string, number>>((acc, payment) => {
          if (payment.status !== 'PENDING' && payment.status !== 'OVERDUE') return acc
          const subject = payment.tuitionMeta?.subjectName || "Fan ko'rsatilmagan"
          acc[subject] = (acc[subject] || 0) + payment.amount
          return acc
        }, {})
      ).sort((a, b) => b[1] - a[1]),
    [payments]
  )

  const monthlySubjectTotals = useMemo(
    () =>
      Object.entries(
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
        .slice(0, 12),
    [payments]
  )

  const recentPaid = useMemo(
    () => payments.filter((p) => p.status === 'PAID').slice(0, 5),
    [payments]
  )

  return (
    <DashboardLayout role="STUDENT">
      <div className="online-shell online-page-bg mx-auto max-w-6xl space-y-4 pb-8 pt-1">
        <OnlinePageHeader
          title="Mening to'lovlarim"
          subtitle="To'lovlar tarixi, qarzdorlik va oylik to'lovlar holati"
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="online-card online-card-lift border-l-4 border-l-red-400 p-5 sm:col-span-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-500">Qarzdorlik</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                <Wallet className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-red-600 sm:text-3xl">
              {loading ? '—' : displayDebt.toLocaleString('uz-UZ')}
              <span className="ml-1 text-base font-semibold text-red-400">so&apos;m</span>
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {sheetDebt !== null
                ? "Google Sheets jadvalidan yangilanadi"
                : "To'lanmagan to'lovlar asosida hisoblandi"}
            </p>
            {sheetNote && sheetDebt === null && (
              <p className="mt-1 text-xs text-amber-600">{sheetNote}</p>
            )}
          </div>

          <div className="online-card online-card-lift p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-500">To&apos;langan</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                <Check className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900">
              {loading ? '—' : paidTotal.toLocaleString('uz-UZ')}
              <span className="ml-1 text-base font-semibold text-gray-400">so&apos;m</span>
            </p>
          </div>

          <div className="online-card online-card-lift p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-500">Kutilayotgan</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900">{loading ? '—' : pendingCount}</p>
            <p className="mt-2 text-xs text-gray-500">ta to&apos;lov kutilmoqda</p>
          </div>
        </div>

        {subjectDebts.length > 0 && (
          <section className="online-card p-5 sm:p-6">
            <h2 className="text-base font-bold text-gray-900">Fanlar bo&apos;yicha qarzdorlik</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subjectDebts.map(([subject, debt]) => (
                <div
                  key={subject}
                  className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3"
                >
                  <p className="text-sm text-gray-600">{subject}</p>
                  <p className="mt-1 text-lg font-bold text-red-600">{debt.toLocaleString('uz-UZ')} so&apos;m</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {loading ? (
          <div className="space-y-3">
            <div className="online-skeleton h-32" />
            <div className="online-skeleton h-48" />
          </div>
        ) : monthlySubjectTotals.length === 0 ? (
          <div className="online-card flex flex-col items-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
              <CalendarRange className="h-7 w-7 text-green-600" />
            </div>
            <p className="mt-4 text-base font-semibold text-gray-800">Oylar bo&apos;yicha to&apos;lovlar topilmadi</p>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Hozircha to&apos;lanmagan oylik to&apos;lovlar yo&apos;q. Qarzdorlik bo&apos;lsa, yuqoridagi kartada ko&apos;rinadi.
            </p>
          </div>
        ) : (
          <section className="online-card overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <CalendarRange className="h-5 w-5 text-green-600" />
                Oylar bo&apos;yicha to&apos;lov summalari
              </h2>
            </div>
            <ul className="divide-y divide-gray-50">
              {monthlySubjectTotals.map(([compositeKey, amount]) => {
                const [monthKey, subjectName] = compositeKey.split('|||')
                return (
                  <li
                    key={compositeKey}
                    className="flex flex-col gap-2 px-5 py-4 transition hover:bg-green-50/30 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{subjectName}</p>
                      <p className="text-sm text-green-700">{getMonthTitleLabel(monthKey)}</p>
                      <p className="text-xs text-gray-500">{getMonthRangeLabel(monthKey)}</p>
                    </div>
                    <p className="text-xl font-bold tabular-nums text-gray-900">
                      {amount.toLocaleString('uz-UZ')} <span className="text-sm font-medium text-gray-500">so&apos;m</span>
                    </p>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {recentPaid.length > 0 && (
          <section className="online-card overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <CreditCard className="h-5 w-5 text-green-600" />
                So&apos;nggi to&apos;langanlar
              </h2>
            </div>
            <ul className="divide-y divide-gray-50">
              {recentPaid.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {p.tuitionMeta?.subjectName || "To'lov"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.paidAt
                        ? new Date(p.paidAt).toLocaleDateString('uz-UZ')
                        : new Date(p.createdAt).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                        getStatusStyle(p.status)
                      )}
                    >
                      {getStatusIcon(p.status)}
                      {getStatusLabel(p.status)}
                    </span>
                    <span className="font-bold tabular-nums text-gray-900">
                      {p.amount.toLocaleString('uz-UZ')} so&apos;m
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </DashboardLayout>
  )
}
