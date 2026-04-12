'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Maximize2,
  PlayCircle,
  Shield,
  Timer,
} from 'lucide-react'

declare global {
  interface Window {
    rashVazifa?: {
      enterExamLockdown: () => Promise<void>
      exitExamLockdown: () => Promise<void>
    }
  }
}

type ExamStatus = {
  lockdownOpen: boolean
  title: string
  instructions: string
  durationMinutes: number
  allowed: boolean
  activeAttempt: {
    id: string
    startedAt: string
    deadlineAt: string
    durationMinutes: number
  } | null
}

const BG = '#111827'
const ACCENT = '#22c55e'
const ACCENT_DIM = 'rgba(34, 197, 94, 0.15)'
const DRAFT_PREFIX = 'rash-vazifa-draft:'

function isAllowedTypingKey(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return false
  const nav = [
    'Backspace',
    'Delete',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
    'Tab',
    'Enter',
  ]
  if (nav.includes(e.key)) return true
  if (e.key.length !== 1) return false
  return /^[\p{L}\p{N}\s'ʼʻ.,;:!?\-]$/u.test(e.key)
}

function formatRemaining(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

export function VazifaStudentLockdownPortal() {
  const [status, setStatus] = useState<ExamStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [lockdown, setLockdown] = useState(false)
  const [content, setContent] = useState('')
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [deadlineAt, setDeadlineAt] = useState<Date | null>(null)
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const [remainingSec, setRemainingSec] = useState<number | null>(null)

  const [fullscreenBroken, setFullscreenBroken] = useState(false)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [doneMsg, setDoneMsg] = useState<string | null>(null)

  const lockdownRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const finishBtnRef = useRef<HTMLButtonElement>(null)
  const confirmModalRef = useRef<HTMLDivElement>(null)
  const autoSubmittedRef = useRef(false)

  useEffect(() => {
    lockdownRef.current = lockdown
  }, [lockdown])

  const onTimeUpRef = useRef<() => Promise<void>>(async () => {})

  const refreshStatus = useCallback(async (): Promise<ExamStatus | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/student/vazifa-exam', { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Ma’lumot olinmadi')
        setStatus(null)
        return null
      }
      const next: ExamStatus = {
        lockdownOpen: Boolean(data.lockdownOpen),
        title: String(data.title || 'Vazifa topshirish'),
        instructions: String(data.instructions || ''),
        durationMinutes: Number(data.durationMinutes) || 45,
        allowed: Boolean(data.allowed),
        activeAttempt: data.activeAttempt || null,
      }
      setStatus(next)
      return next
    } catch {
      setError('Tarmoq xatosi')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshStatus()
    const t = setInterval(() => {
      void refreshStatus()
    }, 15_000)
    return () => clearInterval(t)
  }, [refreshStatus])

  useEffect(() => {
    if (!lockdown || !attemptId) return
    try {
      localStorage.setItem(DRAFT_PREFIX + attemptId, content)
    } catch {
      /* */
    }
  }, [content, lockdown, attemptId])

  const enterFullscreen = async () => {
    const el = document.documentElement
    try {
      if (el.requestFullscreen) await el.requestFullscreen()
      else if ((el as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
        await (el as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen()
      }
    } catch {
      /* */
    }
  }

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch {
      /* */
    }
  }

  const enterLockdownShell = async () => {
    setFullscreenBroken(false)
    autoSubmittedRef.current = false
    setLockdown(true)
    await enterFullscreen()
    try {
      await window.rashVazifa?.enterExamLockdown?.()
    } catch {
      /* */
    }
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  const teardownLockdown = async () => {
    try {
      await window.rashVazifa?.exitExamLockdown?.()
    } catch {
      /* */
    }
    await exitFullscreen()
    setLockdown(false)
    setShowFinishConfirm(false)
    setFullscreenBroken(false)
    setAttemptId(null)
    setDeadlineAt(null)
    setStartedAt(null)
    setRemainingSec(null)
    autoSubmittedRef.current = false
  }

  const apiSubmit = async (opts: { closedByTimer: boolean }) => {
    if (!attemptId) return { ok: false as const, err: 'Seans yo‘q' }
    const res = await fetch('/api/student/vazifa-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId,
        content,
        closedByTimer: opts.closedByTimer,
      }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      return { ok: false as const, err: data?.error || 'Xato' }
    }
    try {
      localStorage.removeItem(DRAFT_PREFIX + attemptId)
    } catch {
      /* */
    }
    return { ok: true as const }
  }

  useEffect(() => {
    onTimeUpRef.current = async () => {
      if (!attemptId) return
      setSubmitting(true)
      setError(null)
      const res = await fetch('/api/student/vazifa-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          content,
          closedByTimer: true,
        }),
      })
      const data = await res.json().catch(() => null)
      setSubmitting(false)
      if (!res.ok) {
        setError(data?.error || 'Avtomatik yopishda xato')
        await teardownLockdown()
        await refreshStatus()
        return
      }
      try {
        localStorage.removeItem(DRAFT_PREFIX + attemptId)
      } catch {
        /* */
      }
      setDoneMsg('Imtihon vaqti tugadi. Javob yuborildi.')
      setContent('')
      await teardownLockdown()
      await refreshStatus()
    }
  }, [attemptId, content, refreshStatus])

  useEffect(() => {
    if (!lockdown || !deadlineAt) {
      setRemainingSec(null)
      return
    }
    const tick = () => {
      const sec = (deadlineAt.getTime() - Date.now()) / 1000
      setRemainingSec(sec)
      if (sec <= 0 && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true
        void onTimeUpRef.current()
      }
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [lockdown, deadlineAt])

  const submitManualAndTeardown = async () => {
    if (!attemptId) return
    setSubmitting(true)
    setError(null)
    const r = await apiSubmit({ closedByTimer: false })
    setSubmitting(false)
    setShowFinishConfirm(false)
    if (!r.ok) {
      setError(r.err || 'Topshirishda xato')
      await teardownLockdown()
      await refreshStatus()
      return
    }
    setDoneMsg('Javobingiz qabul qilindi. Rahmat!')
    setContent('')
    await teardownLockdown()
    await refreshStatus()
  }

  const startNewSession = async () => {
    setError(null)
    const res = await fetch('/api/student/vazifa-exam/start', { method: 'POST' })
    const data = await res.json().catch(() => null)
    if (res.status === 409 && data?.activeAttempt) {
      return resumeSession(data.activeAttempt as NonNullable<ExamStatus['activeAttempt']>)
    }
    if (!res.ok) {
      setError(data?.error || 'Boshlashda xato')
      return
    }
    const att = data?.attempt
    if (!att?.id || !att.deadlineAt) {
      setError('Server javobi noto‘g‘ri')
      return
    }
    setContent('')
    setAttemptId(att.id)
    setStartedAt(new Date(att.startedAt))
    setDeadlineAt(new Date(att.deadlineAt))
    await enterLockdownShell()
  }

  const resumeSession = async (a: NonNullable<ExamStatus['activeAttempt']>) => {
    setAttemptId(a.id)
    setStartedAt(new Date(a.startedAt))
    setDeadlineAt(new Date(a.deadlineAt))
    let draft = ''
    try {
      draft = localStorage.getItem(DRAFT_PREFIX + a.id) || ''
    } catch {
      /* */
    }
    setContent(draft)
    await enterLockdownShell()
  }

  const handleBoshlash = async () => {
    const s = await refreshStatus()
    if (!s?.lockdownOpen) {
      setError('Admin imtihon oynasini ochmagan.')
      return
    }
    if (!s.allowed) {
      setError('Siz navbat ro‘yxatida emassiz. Admin sizni qo‘shmaguncha kuting.')
      return
    }
    if (s.activeAttempt) {
      await resumeSession(s.activeAttempt)
      return
    }
    await startNewSession()
  }

  useEffect(() => {
    if (!lockdown) return

    const onFs = () => {
      if (lockdownRef.current && !document.fullscreenElement) {
        setFullscreenBroken(true)
      }
    }
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [lockdown])

  useEffect(() => {
    if (!lockdown) return

    const onKey = (e: KeyboardEvent) => {
      if (showFinishConfirm) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setShowFinishConfirm(false)
        }
        return
      }
      if (!isAllowedTypingKey(e)) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault()
    }

    const onCopyCut = (e: ClipboardEvent) => {
      e.preventDefault()
    }

    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('keydown', onKey, true)
    window.addEventListener('paste', onPaste, true)
    window.addEventListener('copy', onCopyCut, true)
    window.addEventListener('cut', onCopyCut, true)
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('paste', onPaste, true)
      window.removeEventListener('copy', onCopyCut, true)
      window.removeEventListener('cut', onCopyCut, true)
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [lockdown, showFinishConfirm])

  useEffect(() => {
    if (!lockdown) return
    const onCtx = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', onCtx)
    return () => document.removeEventListener('contextmenu', onCtx)
  }, [lockdown])

  useEffect(() => {
    if (!lockdown) return
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as Node | null
      if (!t) return
      if (showFinishConfirm) {
        if (confirmModalRef.current?.contains(t)) return
        e.preventDefault()
        const first = confirmModalRef.current?.querySelector('button') as HTMLButtonElement | undefined
        first?.focus()
        return
      }
      const ta = textareaRef.current
      const btn = finishBtnRef.current
      if (t === ta || t === btn) return
      e.preventDefault()
      ta?.focus()
    }
    document.addEventListener('focusin', onFocusIn, true)
    return () => document.removeEventListener('focusin', onFocusIn, true)
  }, [lockdown, showFinishConfirm])

  useEffect(() => {
    if (showFinishConfirm && confirmModalRef.current) {
      const first = confirmModalRef.current.querySelector('button') as HTMLButtonElement | undefined
      requestAnimationFrame(() => first?.focus())
    }
  }, [showFinishConfirm])

  const canShowPrimary =
    status?.lockdownOpen &&
    status.allowed &&
    !lockdown

  const primaryLabel = status?.activeAttempt ? 'Davom etish' : 'Boshlash'

  if (loading && !status) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-slate-700 py-16"
        style={{ backgroundColor: BG }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: ACCENT }} />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {doneMsg && (
          <div
            className="flex items-start gap-3 rounded-xl border p-4"
            style={{
              backgroundColor: ACCENT_DIM,
              borderColor: 'rgba(34, 197, 94, 0.35)',
            }}
          >
            <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
            <p className="text-slate-100">{doneMsg}</p>
            <button
              type="button"
              onClick={() => setDoneMsg(null)}
              className="ml-auto text-sm text-slate-400 hover:text-white"
            >
              Yopish
            </button>
          </div>
        )}

        {error && !lockdown && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div
          className="rounded-xl border border-slate-700 p-5 sm:p-8 shadow-xl"
          style={{ backgroundColor: BG }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2
                className="text-xl sm:text-2xl font-bold flex items-center gap-2"
                style={{ color: ACCENT }}
              >
                <ClipboardCheck className="h-7 w-7" />
                {status?.title || 'Vazifa topshirish'}
              </h2>
              <p className="mt-2 text-sm text-slate-400 max-w-2xl">
                Admin sizni <strong className="text-slate-200">navbat</strong>ga qo‘shgan va imtihon oynasini{' '}
                <strong className="text-slate-200">ochgan</strong> bo‘lsa, <strong className="text-slate-200">Boshlash</strong>{' '}
                paydo bo‘ladi. Vaqt admin belgilagan muddatdan oshsa, javob avtomatik yuboriladi. O‘zingiz ham{' '}
                <strong className="text-slate-200">Tugatish</strong> bilan yakunlashingiz mumkin.
              </p>
              {status ? (
                <p className="mt-2 text-xs text-slate-500">
                  Imtihon davomi: <strong className="text-slate-300">{status.durationMinutes} daqiqa</strong>
                  {status.allowed ? (
                    <span className="text-green-400"> · Siz navbatdasiz</span>
                  ) : (
                    <span> · Navbatda emassiz</span>
                  )}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="h-4 w-4" style={{ color: ACCENT }} />
              Lockdown
            </div>
          </div>

          {status?.instructions ? (
            <div
              className="mt-6 rounded-lg border border-slate-600 p-4 text-sm text-slate-200 whitespace-pre-wrap"
              style={{ backgroundColor: 'rgba(17, 24, 39, 0.8)' }}
            >
              {status.instructions}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {canShowPrimary ? (
              <button
                type="button"
                onClick={() => handleBoshlash()}
                disabled={lockdown}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3.5 text-base font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-40"
                style={{ backgroundColor: ACCENT }}
              >
                {status?.activeAttempt ? (
                  <PlayCircle className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
                {primaryLabel}
              </button>
            ) : (
              <p className="text-slate-500 text-sm">
                {!status?.lockdownOpen
                  ? 'Admin imtihon oynasini hali ochmagan.'
                  : !status.allowed
                    ? 'Admin sizni bugungi navbatga qo‘shmagan. O‘qituvchi yoki admin bilan bog‘laning.'
                    : ''}
              </p>
            )}
            <button
              type="button"
              onClick={() => refreshStatus()}
              className="text-sm text-slate-400 hover:text-white underline-offset-2 hover:underline"
            >
              Yangilash
            </button>
          </div>
        </div>
      </div>

      {lockdown && (
        <div
          className="fixed inset-0 z-[100] flex flex-col"
          style={{ backgroundColor: BG }}
          role="presentation"
        >
          <header
            className="flex-shrink-0 border-b border-slate-700 px-4 py-3 flex items-center justify-between gap-3"
            style={{ pointerEvents: 'none' }}
          >
            <span className="text-sm font-medium text-slate-300 truncate">{status?.title}</span>
            <div className="flex items-center gap-3 text-xs tabular-nums">
              {remainingSec !== null && (
                <span
                  className={`flex items-center gap-1 font-bold ${
                    remainingSec <= 60 ? 'text-amber-400' : 'text-slate-300'
                  }`}
                >
                  <Timer className="h-4 w-4" style={{ color: remainingSec <= 60 ? '#fbbf24' : ACCENT }} />
                  {formatRemaining(remainingSec)}
                </span>
              )}
              <span className="text-slate-500">
                {startedAt ? new Date(startedAt).toLocaleTimeString('uz-UZ') : ''}
              </span>
            </div>
          </header>

          {fullscreenBroken && (
            <div
              className="absolute inset-0 z-[110] flex items-center justify-center p-6"
              style={{ backgroundColor: 'rgba(0,0,0,0.92)', pointerEvents: 'auto' }}
            >
              <div className="max-w-md text-center space-y-4">
                <AlertTriangle className="h-12 w-12 mx-auto text-amber-400" />
                <p className="text-lg text-white font-semibold">To‘liq ekran rejimi buzildi</p>
                <p className="text-sm text-slate-400">
                  Imtihon davomida to‘liq ekran saqlanishi kerak. Qayta yoqing.
                </p>
                <button
                  type="button"
                  style={{ backgroundColor: ACCENT }}
                  className="rounded-lg px-6 py-3 font-semibold text-white"
                  onClick={async () => {
                    setFullscreenBroken(false)
                    await enterFullscreen()
                  }}
                >
                  Qayta to‘liq ekran
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 p-4 flex flex-col gap-4" style={{ pointerEvents: 'none' }}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              className="flex-1 min-h-[200px] w-full resize-none rounded-lg border border-slate-600 p-4 text-base leading-relaxed text-slate-100 outline-none focus:ring-2 focus:ring-green-500/40 font-mono"
              style={{
                backgroundColor: '#0f172a',
                pointerEvents: 'none',
                caretColor: ACCENT,
              }}
              placeholder="Javobingizni klaviatura bilan yozing..."
            />
          </div>

          <footer className="flex-shrink-0 border-t border-slate-700 p-4 flex justify-center">
            <button
              ref={finishBtnRef}
              type="button"
              style={{ backgroundColor: ACCENT, pointerEvents: 'auto' }}
              className="rounded-lg px-12 py-4 text-lg font-bold text-white shadow-lg hover:brightness-110"
              onClick={() => setShowFinishConfirm(true)}
            >
              Tugatish
            </button>
          </footer>

          {showFinishConfirm && (
            <div
              className="absolute inset-0 z-[120] flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0,0,0,0.85)', pointerEvents: 'auto' }}
            >
              <div
                ref={confirmModalRef}
                className="max-w-lg w-full rounded-xl border border-slate-600 p-6 space-y-4"
                style={{ backgroundColor: '#1e293b' }}
              >
                <h3 className="text-lg font-semibold text-white">Topshirishni tasdiqlaysizmi?</h3>
                <p className="text-sm text-slate-400">
                  Matn serverga yuboriladi va imtihon seansi yopiladi.
                </p>
                <div className="flex flex-wrap gap-3 justify-end pt-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-500 px-4 py-2 text-slate-200 hover:bg-slate-700"
                    onClick={() => setShowFinishConfirm(false)}
                    disabled={submitting}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    style={{ backgroundColor: ACCENT }}
                    className="inline-flex items-center gap-2 rounded-lg px-5 py-2 font-semibold text-white disabled:opacity-50"
                    disabled={submitting || !content.trim()}
                    onClick={() => submitManualAndTeardown()}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Ha, topshiraman
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
