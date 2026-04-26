'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { fireStipendCelebrationConfetti } from '@/lib/stipend-confetti'
import { formatDateShort, formatUzsInteger } from '@/lib/utils'
import { STIPEND_PROGRAMS, stipendMeta } from '@/lib/stipendiya'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Award, Calendar, Hash, Info, Medal, Sparkles } from 'lucide-react'

type AwardRow = {
  id: string
  program: string
  examTitle: string
  examDate: string
  amountUzs?: number | null
  awardLabel?: string | null
  scorePercent?: number | null
  notes?: string | null
  createdAt: string
}

const UZ_MONTHS = [
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
] as const

const accentStyles: Record<
  'amber' | 'violet' | 'sky' | 'emerald',
  { ring: string; badge: string; glow: string; heroFrom: string; heroTo: string }
> = {
  amber: {
    ring: 'border-amber-500/35 hover:border-amber-400/50',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    glow: 'shadow-[0_0_40px_-12px_rgba(245,158,11,0.35)]',
    heroFrom: 'from-amber-500/25',
    heroTo: 'to-orange-600/20',
  },
  violet: {
    ring: 'border-violet-500/35 hover:border-violet-400/50',
    badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    glow: 'shadow-[0_0_40px_-12px_rgba(139,92,246,0.35)]',
    heroFrom: 'from-violet-500/25',
    heroTo: 'to-fuchsia-600/20',
  },
  sky: {
    ring: 'border-sky-500/35 hover:border-sky-400/50',
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    glow: 'shadow-[0_0_40px_-12px_rgba(14,165,233,0.35)]',
    heroFrom: 'from-sky-500/25',
    heroTo: 'to-cyan-600/20',
  },
  emerald: {
    ring: 'border-emerald-500/35 hover:border-emerald-400/50',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    glow: 'shadow-[0_0_40px_-12px_rgba(52,211,153,0.35)]',
    heroFrom: 'from-emerald-500/25',
    heroTo: 'to-teal-600/20',
  },
}

/** Kazino / slot uslubida: 1 dan maqsadgacha; layoutdan oldin ishga tushadi (1 ko‘rinadi). */
function StipendHeroAmount({
  target,
  awardId,
}: {
  target: number
  awardId: string
}) {
  const targetN = Math.max(0, Math.round(Number(target)))
  const [display, setDisplay] = useState(() => (targetN >= 1 ? 1 : 0))
  const framesRef = useRef({ outer: 0, inner: 0 })

  useLayoutEffect(() => {
    cancelAnimationFrame(framesRef.current.outer)
    cancelAnimationFrame(framesRef.current.inner)

    if (targetN < 1) {
      setDisplay(0)
      return
    }

    if (targetN === 1) {
      setDisplay(1)
      return
    }

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const from = 1
    setDisplay(from)

    /** Avvalo «1» ko‘rinadi, keyin hisoblash boshlanadi */
    const holdMs = reduceMotion ? 350 : 1200

    const duration = reduceMotion
      ? Math.min(4200, Math.max(1800, targetN / 4500))
      : Math.min(
          15500,
          Math.max(6800, 5200 + Math.sqrt(targetN / 3200) * 1850)
        )

    const easeOutExpo = (t: number) =>
      t >= 1 ? 1 : 1 - Math.pow(2, -7 * t)

    const t0Ref = { v: performance.now() }

    const tick = (now: number) => {
      const elapsed = now - t0Ref.v
      if (elapsed < holdMs) {
        setDisplay(1)
        framesRef.current.inner = requestAnimationFrame(tick)
        return
      }
      const t = Math.min(1, (elapsed - holdMs) / duration)
      const next = Math.round(from + (targetN - from) * easeOutExpo(t))
      setDisplay(next)
      if (t < 1) {
        framesRef.current.inner = requestAnimationFrame(tick)
      } else {
        setDisplay(targetN)
      }
    }

    // Keyingi kadrda vaqt boshlanadi — birinchi bo‘yoga 1 chiqishi aniq bo‘ladi
    framesRef.current.outer = requestAnimationFrame(() => {
      t0Ref.v = performance.now()
      framesRef.current.inner = requestAnimationFrame(tick)
    })

    return () => {
      cancelAnimationFrame(framesRef.current.outer)
      cancelAnimationFrame(framesRef.current.inner)
    }
  }, [targetN, awardId])

  return (
    <span className="inline-block tabular-nums tracking-tight">{formatUzsInteger(display)}</span>
  )
}

export default function StudentStipendiyaPage() {
  const [rows, setRows] = useState<AwardRow[]>([])
  const [loading, setLoading] = useState(true)
  const confettiFiredRef = useRef<string | null>(null)

  const fetchAwards = useCallback(async () => {
    try {
      const res = await fetch('/api/student/stipendiya')
      if (res.ok) {
        const data = await res.json()
        setRows(Array.isArray(data) ? data : [])
      } else {
        setRows([])
      }
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAwards()
  }, [fetchAwards])

  const hasAmount = (r: AwardRow) =>
    r.amountUzs != null && Number.isFinite(r.amountUzs) && r.amountUzs > 0

  /** API tartibi: examDate desc — birinchi summali yozuv eng yangi */
  const primary = useMemo(() => {
    for (const r of rows) {
      if (
        r.amountUzs != null &&
        Number.isFinite(r.amountUzs) &&
        r.amountUzs > 0
      )
        return r
    }
    return null
  }, [rows])
  const otherRows = useMemo(
    () => rows.filter((r) => r.id !== primary?.id),
    [rows, primary]
  )

  const primaryMeta = primary ? stipendMeta(primary.program) : undefined
  const primaryAccent = primaryMeta
    ? accentStyles[primaryMeta.accent]
    : accentStyles.emerald
  const primaryMonthLabel = useMemo(() => {
    if (!primary) return ''
    const d = new Date(primary.examDate)
    if (Number.isNaN(d.getTime())) return ''
    return UZ_MONTHS[d.getUTCMonth()] ?? ''
  }, [primary])

  const byProgram = useMemo(() => {
    const m = new Map<string, AwardRow[]>()
    for (const p of STIPEND_PROGRAMS) m.set(p.code, [])
    for (const r of rows) {
      const list = m.get(r.program) ?? []
      list.push(r)
      m.set(r.program, list)
    }
    return m
  }, [rows])

  /** Konfetti: faqat haqiqiy stipendiya summasi (>0) bo‘lsa; 0 / null / yo‘q — effekt yo‘q */
  useEffect(() => {
    if (loading || !primary || !hasAmount(primary)) return
    if (typeof window === 'undefined') return

    const key = `${primary.id}-${primary.amountUzs}`
    /* Bir marta: bir xil yozuv uchun qayta-zaryad */
    if (confettiFiredRef.current === key) return

    /**
     * React Strict Mode: effekt → cleanup (clearTimeout) → effekt.
     * Refni timeoutdan OLDIN yozmaslik kerak — aks holda 2-chi effekt «allaqachon
     * ishlandi» deb qoladi va konfetti hech qachon chiqmaydi.
     */
    let cancelled = false
    const t = window.setTimeout(() => {
      if (cancelled) return
      if (!hasAmount(primary)) return
      confettiFiredRef.current = key
      fireStipendCelebrationConfetti()
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [loading, primary])

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-2xl border border-slate-600/40 bg-gradient-to-br from-slate-800/90 via-slate-900/95 to-slate-950 p-6 sm:p-8 shadow-xl">
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="relative">
            <div>
              <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-emerald-400/90">
                <Sparkles className="h-3.5 w-3.5" />
                O‘quvchi kabineti
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Stipendiya
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                Tasdiqlangan stipendiyangiz va summasi shu sahifada ko‘rinadi.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Award className="h-5 w-5 text-amber-400" />
            Dasturlar bo‘yicha
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {STIPEND_PROGRAMS.map((p) => {
              const list = byProgram.get(p.code) ?? []
              const st = accentStyles[p.accent]
              return (
                <div
                  key={p.code}
                  className={`rounded-xl border bg-slate-900/40 p-5 transition-colors ${st.ring} ${st.glow}`}
                >
                  <span
                    className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${st.badge}`}
                  >
                    {p.code === 'RASH_UZ' ? 'rash.uz' : p.code}
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-white">
                    {p.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                    {p.subtitle}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500" />
            <p className="mt-4 text-slate-500">Yuklanmoqda...</p>
          </div>
        ) : !primary ? (
          <>
            <div className="flex gap-3 rounded-xl border border-blue-500/25 bg-blue-500/5 px-4 py-3 text-sm text-slate-300">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
              <p>
                Hozircha sizga stipendiya summasi biriktirilmagan. Admin
                stipendiyani tasdiqlagach, bu yerda katta kartada ko‘rinadi.
              </p>
            </div>
            <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/30 py-16 text-center">
              <Medal className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-slate-400">
                Stipendiya hali ko‘rinmayapti
              </p>
            </div>
          </>
        ) : (
          <div
            className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${primaryAccent.heroFrom} via-slate-900/95 ${primaryAccent.heroTo} p-8 sm:p-12 md:p-14 shadow-2xl ${primaryAccent.glow} min-h-[280px] sm:min-h-[320px]`}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.12),transparent_55%)]" />
            <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
            <div className="relative flex h-full min-h-[220px] flex-col justify-between">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-center sm:gap-3">
                <p className="order-1 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 sm:order-2 sm:justify-self-center sm:text-center sm:text-sm sm:tracking-[0.22em] md:text-base">
                  {primaryMonthLabel
                    ? `${primaryMonthLabel} oyi uchun stipendiya miqdori`
                    : 'Sizning stipendiyangiz'}
                </p>
                <span
                  className={`order-2 inline-flex justify-self-start rounded-xl border px-3 py-1.5 text-xs font-semibold ${primaryAccent.badge} sm:order-1 sm:px-4 sm:py-2 sm:text-sm`}
                >
                  {primaryMeta?.title ?? primary.program}
                </span>
                <span className="order-3 flex items-center justify-self-end gap-1.5 text-xs text-slate-400 sm:gap-2 sm:text-sm">
                  <Calendar className="h-4 w-4" />
                  {formatDateShort(primary.examDate)}
                </span>
              </div>
              <div className="-mt-4 space-y-2 text-center sm:-mt-6">
                <p className="text-6xl font-extrabold tracking-tight sm:text-7xl md:text-8xl lg:text-9xl">
                  <span className="inline-block bg-gradient-to-r from-white via-white to-slate-200 bg-clip-text text-transparent">
                    <StipendHeroAmount
                      target={primary.amountUzs ?? 0}
                      awardId={primary.id}
                    />
                  </span>{' '}
                  <span className="text-4xl font-bold text-emerald-200/90 sm:text-5xl md:text-6xl">
                    so‘m
                  </span>
                </p>
              </div>
              {primary.examTitle && primary.examTitle !== 'Stipendiya' && (
                <p className="text-sm text-slate-400">{primary.examTitle}</p>
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
