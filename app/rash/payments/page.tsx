'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Search, User, LogOut, Check, AlertCircle, Loader2, Wallet, Hash } from 'lucide-react'

const PRESET_AMOUNTS = [100_000, 200_000, 300_000, 500_000, 1_000_000]

function formatAmount(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value
  return new Intl.NumberFormat('uz-UZ').format(num)
}

export default function RashPaymentsPage() {
  const router = useRouter()
  const [studentIdInput, setStudentIdInput] = useState('')
  const [amount, setAmount] = useState('')
  const [student, setStudent] = useState<{
    id: string
    studentId: string
    name: string
    groupName: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const searchStudent = useCallback(async () => {
    const id = studentIdInput.trim()
    if (!id) {
      setError("O'quvchi ID kiriting")
      setStudent(null)
      return
    }

    setError('')
    setLoading(true)
    setStudent(null)

    try {
      const res = await fetch(`/api/rash/students/by-id/${encodeURIComponent(id)}`)
      if (res.ok) {
        const data = await res.json()
        setStudent({
          id: data.id,
          studentId: data.studentId,
          name: data.name,
          groupName: data.groupName,
        })
        setSuccess('')
      } else {
        const err = await res.json()
        setError(err.error || "O'quvchi topilmadi")
        setStudent(null)
      }
    } catch {
      setError('Xatolik yuz berdi')
      setStudent(null)
    } finally {
      setLoading(false)
    }
  }, [studentIdInput])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student) {
      setError("Avval o'quvchini qidiring")
      return
    }
    const amt = parseFloat(amount.replace(/\s/g, ''))
    if (isNaN(amt) || amt <= 0) {
      setError('Summani kiriting')
      return
    }

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/rash/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          amount: amt,
        }),
      })

      if (res.ok) {
        setSuccess(`To'lov ${formatAmount(amt)} so'm muvaffaqiyatli saqlandi`)
        setAmount('')
        setStudentIdInput('')
        setStudent(null)
      } else {
        const err = await res.json()
        setError(err.error || 'Xatolik')
      }
    } catch {
      setError('Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
    router.refresh()
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    setAmount(raw ? formatAmount(raw) : '')
  }

  const handlePresetAmount = (val: number) => {
    setAmount(formatAmount(val))
  }

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(37,99,235,0.18),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(30,64,175,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,64,175,0.10)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_40%,transparent_100%)]" />
      </div>

      <header className="relative z-10 border-b border-blue-900/50 bg-[#06153a]/50 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <h1 className="font-semibold text-white">To&apos;lov kiritish</h1>
              <p className="text-xs text-slate-500">rash.com.uz</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors text-sm"
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto p-4 pb-8 space-y-6">
        {/* O'quvchi qidirish */}
        <section className="bg-[#06153a]/60 backdrop-blur-sm border border-blue-900/60 rounded-2xl p-5">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
            <Hash className="h-4 w-4 text-slate-500" />
            O&apos;quvchi ID
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                value={studentIdInput}
                onChange={(e) => {
                  setStudentIdInput(e.target.value)
                  setStudent(null)
                  setError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && searchStudent()}
                placeholder="Masalan: RASH-001"
                className="w-full pl-12 pr-4 py-3 bg-[#020b23]/70 border border-blue-900/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-slate-500"
              />
            </div>
            <button
              type="button"
              onClick={searchStudent}
              disabled={loading}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium disabled:opacity-50 transition-colors flex items-center gap-2 shrink-0"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Qidirish
                </>
              )}
            </button>
          </div>
        </section>

        {/* O'quvchi ma'lumotlari */}
        {student && (
          <section
            className="bg-[#06153a]/60 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-5 animate-slide-up"
          >
            <p className="text-xs font-medium text-blue-300/90 uppercase tracking-wider mb-3">
              Tanlangan o&apos;quvchi
            </p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center shrink-0">
                <User className="h-7 w-7 text-blue-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white truncate">{student.name}</p>
                <p className="text-slate-400 text-sm mt-0.5">
                  {student.groupName || "Guruh yo'q"}
                </p>
                <p className="text-slate-500 text-xs mt-1 font-mono">{student.studentId}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" title="Topildi" />
            </div>
          </section>
        )}

        {/* Xatolik */}
        {error && (
          <div
            className="flex items-center gap-3 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Muvaffaqiyat */}
        {success && (
          <div
            className="flex items-center gap-3 text-blue-300 text-sm bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3"
            role="status"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
              <Check className="h-5 w-5" />
            </div>
            {success}
          </div>
        )}

        {/* To'lov form */}
        <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-[#06153a]/60 backdrop-blur-sm border border-blue-900/60 rounded-2xl p-5 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
              <Wallet className="h-4 w-4 text-slate-500" />
              To&apos;lov summasi (so&apos;m)
            </label>

            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={handleAmountChange}
              placeholder="500 000"
              className="w-full px-4 py-4 bg-[#020b23]/70 border border-blue-900/60 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-slate-500"
            />

            <div className="flex flex-wrap gap-2 mt-3">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePresetAmount(val)}
                  className="px-3 py-1.5 text-sm rounded-lg bg-[#020b23] hover:bg-blue-950 text-slate-300 hover:text-white border border-blue-900/60 transition-colors"
                >
                  {formatAmount(val)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!student || loading}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 transition-all duration-200 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saqlanmoqda...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                To&apos;lovni saqlash
              </>
            )}
          </button>
        </section>
        </form>
      </main>
    </div>
  )
}
