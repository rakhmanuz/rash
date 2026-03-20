'use client'

import { useEffect, useState } from 'react'
import { Clock, Users, Sparkles, Lock, User, LogOut } from 'lucide-react'

const UZ_OFFSET_MS = 5 * 60 * 60 * 1000
// O'zbekiston vaqtini UTC komponentlari orqali ko'rsatish (brauzer local vaqtiga qo'shmasligi uchun)
const UZ_WEEKDAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
const UZ_MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']

function useUZNow() {
  const [now, setNow] = useState(() => new Date(Date.now() + UZ_OFFSET_MS))
  useEffect(() => {
    const t = setInterval(() => {
      setNow(new Date(Date.now() + UZ_OFFSET_MS))
    }, 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

function formatUZTime(date: Date): string {
  const h = date.getUTCHours()
  const m = date.getUTCMinutes()
  const s = date.getUTCSeconds()
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatUZDate(date: Date): string {
  const day = date.getUTCDay()
  const d = date.getUTCDate()
  const month = date.getUTCMonth()
  const year = date.getUTCFullYear()
  return `${UZ_WEEKDAYS[day]}, ${d} ${UZ_MONTHS[month]} ${year}`
}

interface ScheduleItem {
  id: string
  groupName: string
  teacherName: string
  times: string[]
  isCurrent: boolean
}

export default function MonitorPage() {
  const uzNow = useUZNow()
  const [authChecked, setAuthChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [data, setData] = useState<{
    dateKey: string
    now: { hours: number; minutes: number }
    currentLessons: ScheduleItem[]
    todaySchedule: ScheduleItem[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Login form
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/monitor/auth')
        const ok = res.ok
        setIsLoggedIn(ok)
        if (!ok) {
          setAuthChecked(true)
          setLoading(false)
          return
        }
      } catch {
        setIsLoggedIn(false)
        setAuthChecked(true)
        setLoading(false)
        return
      }
      setAuthChecked(true)

      const fetchSchedule = async () => {
        try {
          const r = await fetch('/api/monitor/schedule')
          if (!r.ok) {
            setError('Ma\'lumot yuklanmadi')
            return
          }
          const json = await r.json()
          setData(json)
          setError(null)
        } catch {
          setError('Xatolik')
        } finally {
          setLoading(false)
        }
      }
      fetchSchedule()
      const interval = setInterval(fetchSchedule, 45000)
      return () => clearInterval(interval)
    }
    checkAuth()
  }, [isLoggedIn])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const res = await fetch('/api/monitor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setLoginError(json.error || 'Login yoki parol noto\'g\'ri')
        setLoginLoading(false)
        return
      }
      setIsLoggedIn(true)
      setLoading(true)
      setLoginPassword('')
      setLoginLoading(false)
    } catch {
      setLoginError('Xatolik')
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/monitor/logout', { method: 'POST' })
    setIsLoggedIn(false)
    setData(null)
    setLoading(true)
  }

  // Auth tekshirilmoqda yoki schedule yuklanmoqda
  if (!authChecked || (isLoggedIn && loading && !data)) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  // Login sahifa — faqat monitor login/parol
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-transparent to-cyan-950/15 pointer-events-none" />
        <div className="relative w-full max-w-sm">
          <div className="rounded-3xl border border-slate-700/80 bg-slate-900/60 backdrop-blur-sm p-8 shadow-2xl">
            <div className="text-center mb-6">
              <p className="text-emerald-400/90 text-sm font-medium tracking-widest uppercase mb-2">
                Monitor panel
              </p>
              <h1 className="text-2xl font-bold text-white">Kirish</h1>
              <p className="text-slate-500 text-sm mt-1">Login va parolni kiriting</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <p className="text-red-400 text-sm text-center">{loginError}</p>
              )}
              <div>
                <label className="block text-slate-400 text-sm mb-1.5">Login</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    placeholder="Login"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1.5">Parol</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    placeholder="Parol"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors disabled:opacity-50"
              >
                {loginLoading ? '...' : 'Kirish'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-6 p-6">
        <p className="text-amber-400 text-xl">{error}</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300"
        >
          <LogOut className="h-5 w-5" /> Chiqish
        </button>
      </div>
    )
  }

  if (!data) return null

  const dateLabel = formatUZDate(uzNow)
  const timeLabel = formatUZTime(uzNow)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-auto relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-transparent to-cyan-950/15" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[80%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/8 via-transparent to-transparent" />
        <div className="absolute bottom-0 right-0 w-[60%] h-[50%] bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-500/6 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(10,10,15,0.4)_100%)]" />
      </div>

      <div className="relative z-10">
        <div className="absolute top-5 right-5 z-20 opacity-70 hover:opacity-100 transition-opacity">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm"
          >
            <LogOut className="h-4 w-4" /> Chiqish
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-10 sm:py-14">
          <header className="text-center mb-12 sm:mb-16">
            <p className="inline-flex items-center gap-2 text-emerald-400/90 text-sm sm:text-base font-medium tracking-[0.2em] uppercase mb-4">
              <Sparkles className="h-4 w-4" /> O‘zbekiston vaqti
            </p>
            <p className="text-slate-500 text-xl sm:text-2xl mb-2 capitalize tracking-wide">{dateLabel}</p>
            <p className="text-6xl sm:text-8xl md:text-9xl font-black tabular-nums tracking-tight bg-gradient-to-r from-emerald-300 via-cyan-300 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(52,211,153,0.25)]">
              {timeLabel}
            </p>
            <p className="mt-2 text-slate-600 text-lg font-medium">rash — bugungi darslar</p>
          </header>

          <section className="mb-14 sm:mb-20">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-4 w-4">
                <span className="absolute h-4 w-4 rounded-full bg-emerald-400 animate-ping opacity-75" />
                <span className="relative h-4 w-4 rounded-full bg-emerald-500" />
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                Hozir davom etayotgan darslar
              </h2>
            </div>

            {data.currentLessons.length === 0 ? (
              <div className="relative rounded-3xl border border-slate-700/80 bg-slate-900/40 backdrop-blur-sm p-12 sm:p-16 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5" />
                <p className="relative text-slate-500 text-xl sm:text-2xl">Hozircha dars yo‘q</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {data.currentLessons.map((item) => (
                  <div key={item.id} className="group relative rounded-3xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/25 via-emerald-600/15 to-cyan-500/20" />
                    <div className="absolute inset-0 border border-emerald-400/40 group-hover:border-emerald-400/60 transition-colors rounded-3xl" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(52,211,153,0.15)_0%,transparent_50%)]" />
                    <div className="relative p-8 sm:p-10">
                      <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
                        Live
                      </span>
                      <p className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                        {item.groupName}
                      </p>
                      <p className="text-slate-400 flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5 text-emerald-400/80" /> {item.teacherName}
                      </p>
                      <p className="text-emerald-400 font-semibold text-lg mt-3 flex items-center gap-2">
                        <Clock className="h-5 w-5" /> {item.times.join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-400 mb-6 tracking-tight">
              Bugungi darslar jadvali
            </h2>
            {data.todaySchedule.length === 0 ? (
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-10 text-center">
                <p className="text-slate-500 text-lg">Bugun dars rejasi yo‘q</p>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-700/60 bg-slate-900/30 backdrop-blur-sm overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6 sm:p-8">
                  {data.todaySchedule.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl p-5 sm:p-6 border transition-all ${
                        item.isCurrent
                          ? 'bg-emerald-500/15 border-emerald-400/50 shadow-[0_0_30px_rgba(52,211,153,0.12)]'
                          : 'bg-slate-800/40 border-slate-600/50 hover:border-slate-500'
                      }`}
                    >
                      <p className="font-mono text-emerald-400 font-bold text-lg mb-1">{item.times.join(', ')}</p>
                      <p className="text-white font-bold text-xl mb-0.5">{item.groupName}</p>
                      <p className="text-slate-500 text-sm">{item.teacherName}</p>
                      {item.isCurrent && (
                        <span className="inline-flex items-center gap-1.5 mt-3 text-emerald-400 text-sm font-semibold">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          Dars davom etmoqda
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
