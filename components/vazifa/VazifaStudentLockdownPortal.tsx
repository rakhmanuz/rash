'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
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
  maxAttempts?: number
  usedAttempts?: number
  canStartMore?: boolean
  allowed: boolean
  activeAttempt: {
    id: string
    startedAt: string
    deadlineAt: string
    durationMinutes: number
    assignedQuestions?: { id: string; imageUrl: string }[] | null
  } | null
  recentSubmissions?: {
    id: string
    submittedAt: string
    closedByTimer: boolean
    aiScore: number | null
    aiFeedback: string
  }[]
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
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

function parseBankDraft(
  raw: string | null,
  aq: { id: string }[]
): { answers: Record<string, string>; approaches: Record<string, string> } {
  const empty = () => {
    const answers: Record<string, string> = {}
    const approaches: Record<string, string> = {}
    for (const q of aq) {
      answers[q.id] = ''
      approaches[q.id] = ''
    }
    return { answers, approaches }
  }
  if (!raw) return empty()
  try {
    const o = JSON.parse(raw) as Record<string, unknown>
    const idSet = new Set(aq.map((q) => q.id))
    if (o && typeof o === 'object' && o.v === 1 && o.answers && typeof o.answers === 'object') {
      const ans = o.answers as Record<string, string>
      const app = (o.approaches && typeof o.approaches === 'object' ? o.approaches : {}) as Record<
        string,
        string
      >
      const answers: Record<string, string> = {}
      const approaches: Record<string, string> = {}
      for (const q of aq) {
        answers[q.id] = typeof ans[q.id] === 'string' ? ans[q.id] : ''
        approaches[q.id] = typeof app[q.id] === 'string' ? app[q.id] : ''
      }
      return { answers, approaches }
    }
    if (
      o &&
      typeof o === 'object' &&
      Object.keys(o).length > 0 &&
      Object.keys(o).every((k) => idSet.has(k))
    ) {
      const answers: Record<string, string> = {}
      const approaches: Record<string, string> = {}
      for (const q of aq) {
        const val = (o as Record<string, string>)[q.id]
        answers[q.id] = typeof val === 'string' ? val : ''
        approaches[q.id] = ''
      }
      return { answers, approaches }
    }
  } catch {
    /* */
  }
  return empty()
}

export function VazifaStudentLockdownPortal() {
  const [status, setStatus] = useState<ExamStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [lockdown, setLockdown] = useState(false)
  const [content, setContent] = useState('')
  const [assignedQs, setAssignedQs] = useState<{ id: string; imageUrl: string }[] | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [approaches, setApproaches] = useState<Record<string, string>>({})
  const [approachText, setApproachText] = useState('')
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [deadlineAt, setDeadlineAt] = useState<Date | null>(null)
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const [remainingSec, setRemainingSec] = useState<number | null>(null)

  const [fullscreenBroken, setFullscreenBroken] = useState(false)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [frozenRemainingSec, setFrozenRemainingSec] = useState<number | null>(null)
  const [doneMsg, setDoneMsg] = useState<string | null>(null)
  const [showPostSubmitAnalyzing, setShowPostSubmitAnalyzing] = useState(false)
  const [showLockdownResult, setShowLockdownResult] = useState(false)
  const [resultCard, setResultCard] = useState<{
    score: number | null
    feedback: string
    method: string
  } | null>(null)

  const lockdownRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const examFormRef = useRef<HTMLDivElement>(null)
  const finishBtnRef = useRef<HTMLButtonElement>(null)
  const confirmModalRef = useRef<HTMLDivElement>(null)
  const autoSubmittedRef = useRef(false)

  const answersRef = useRef(answers)
  const approachesRef = useRef(approaches)
  const contentRef = useRef(content)
  const approachTextRef = useRef(approachText)
  const assignedQsRef = useRef(assignedQs)

  useLayoutEffect(() => {
    answersRef.current = answers
    approachesRef.current = approaches
    contentRef.current = content
    approachTextRef.current = approachText
    assignedQsRef.current = assignedQs
  }, [answers, approaches, content, approachText, assignedQs])

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
      const aa = data.activeAttempt
      const next: ExamStatus = {
        lockdownOpen: Boolean(data.lockdownOpen),
        title: String(data.title || 'Vazifa topshirish'),
        instructions: String(data.instructions || ''),
        durationMinutes: Number(data.durationMinutes) || 45,
        maxAttempts: Number(data.maxAttempts) || 1,
        usedAttempts: Number(data.usedAttempts) || 0,
        canStartMore: Boolean(data.canStartMore ?? true),
        allowed: Boolean(data.allowed),
        activeAttempt: aa
          ? {
              id: String(aa.id),
              startedAt: String(aa.startedAt),
              deadlineAt: String(aa.deadlineAt),
              durationMinutes: Number(aa.durationMinutes) || 45,
              assignedQuestions: Array.isArray(aa.assignedQuestions) ? aa.assignedQuestions : null,
            }
          : null,
        recentSubmissions: Array.isArray(data.recentSubmissions)
          ? data.recentSubmissions.map(
              (x: {
                id?: string
                submittedAt?: string
                closedByTimer?: boolean
                aiScore?: number | null
                aiFeedback?: string
              }) => ({
                id: String(x.id || ''),
                submittedAt: String(x.submittedAt || ''),
                closedByTimer: Boolean(x.closedByTimer),
                aiScore:
                  typeof x.aiScore === 'number' ? Math.max(0, Math.min(75, Math.round(x.aiScore))) : null,
                aiFeedback: typeof x.aiFeedback === 'string' ? x.aiFeedback : '',
              })
            )
          : [],
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
      if (assignedQs && assignedQs.length > 0) {
        localStorage.setItem(
          DRAFT_PREFIX + attemptId,
          JSON.stringify({ v: 1, answers, approaches })
        )
      } else {
        localStorage.setItem(
          DRAFT_PREFIX + attemptId,
          JSON.stringify({ v: 1, t: content, y: approachText })
        )
      }
    } catch {
      /* */
    }
  }, [content, approachText, answers, approaches, lockdown, attemptId, assignedQs])

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
    requestAnimationFrame(() => {
      const el = examFormRef.current?.querySelector(
        'textarea, input[type="text"]'
      ) as HTMLElement | null
      el?.focus()
    })
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
    setIsFinalizing(false)
    setFrozenRemainingSec(null)
    setFullscreenBroken(false)
    setAttemptId(null)
    setDeadlineAt(null)
    setStartedAt(null)
    setRemainingSec(null)
    setAssignedQs(null)
    setAnswers({})
    setApproaches({})
    setApproachText('')
    setShowPostSubmitAnalyzing(false)
    setShowLockdownResult(false)
    autoSubmittedRef.current = false
  }

  const buildSubmitContent = useCallback(() => {
    if (assignedQs && assignedQs.length > 0) {
      return JSON.stringify({
        mode: 'bank',
        items: assignedQs.map((q) => ({
          questionId: q.id,
          answer: (answers[q.id] || '').trim(),
          approach: (approaches[q.id] || '').trim(),
        })),
      })
    }
    const answer = content.trim()
    const ap = approachText.trim()
    if (ap) return JSON.stringify({ v: 2, answer, approach: ap })
    return content
  }, [assignedQs, answers, approaches, content, approachText])

  const apiSubmit = async (opts: { closedByTimer: boolean }) => {
    if (!attemptId)
      return {
        ok: false as const,
        err: 'Seans yo‘q',
        aiScore: null as number | null,
        aiFeedback: null as string | null,
        aiMethod: null as string | null,
      }
    const res = await fetch('/api/student/vazifa-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId,
        content: buildSubmitContent(),
        closedByTimer: opts.closedByTimer,
      }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      return {
        ok: false as const,
        err: data?.error || 'Xato',
        aiScore: null as number | null,
        aiFeedback: null as string | null,
        aiMethod: null as string | null,
      }
    }
    try {
      localStorage.removeItem(DRAFT_PREFIX + attemptId)
    } catch {
      /* */
    }
    return {
      ok: true as const,
      aiScore: typeof data?.aiScore === 'number' ? data.aiScore : null,
      aiFeedback: typeof data?.aiFeedback === 'string' ? data.aiFeedback : null,
      aiMethod: typeof data?.aiMethod === 'string' ? data.aiMethod : null,
    }
  }

  useEffect(() => {
    onTimeUpRef.current = async () => {
      if (!attemptId) return
      setSubmitting(true)
      setError(null)
      const aq = assignedQsRef.current
      const payloadContent =
        aq && aq.length > 0
          ? JSON.stringify({
              mode: 'bank',
              items: aq.map((q) => ({
                questionId: q.id,
                answer: (answersRef.current[q.id] || '').trim(),
                approach: (approachesRef.current[q.id] || '').trim(),
              })),
            })
          : JSON.stringify({
              v: 2,
              answer: contentRef.current.trim(),
              approach: approachTextRef.current.trim(),
            })
      const res = await fetch('/api/student/vazifa-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          content: payloadContent,
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
      const aiScore = typeof data?.aiScore === 'number' ? data.aiScore : null
      const aiFeedback = typeof data?.aiFeedback === 'string' ? data.aiFeedback : null
      const aiMethod = typeof data?.aiMethod === 'string' ? data.aiMethod : null
      setShowPostSubmitAnalyzing(true)
      await new Promise((r) => setTimeout(r, 3400))
      setShowPostSubmitAnalyzing(false)
      setResultCard({
        score: aiScore,
        feedback: aiFeedback || '',
        method: aiMethod || '',
      })
      setShowLockdownResult(true)
      setContent('')
      setApproachText('')
    }
  }, [attemptId, refreshStatus])

  useEffect(() => {
    if (!lockdown || !deadlineAt) {
      setRemainingSec(null)
      return
    }
    if (isFinalizing) return
    const tick = () => {
      const sec = (deadlineAt.getTime() - Date.now()) / 1000
      setRemainingSec(sec)
      if (sec <= 0 && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true
        setShowFinishConfirm(true)
        setIsFinalizing(true)
        setFrozenRemainingSec(0)
        void onTimeUpRef.current()
      }
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [lockdown, deadlineAt, isFinalizing])

  const submitManualAndTeardown = async () => {
    if (!attemptId) return
    setIsFinalizing(true)
    setFrozenRemainingSec((prev) => prev ?? Math.max(0, Math.floor(remainingSec ?? 0)))
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
    setShowPostSubmitAnalyzing(true)
    await new Promise((r) => setTimeout(r, 3400))
    setShowPostSubmitAnalyzing(false)
    setResultCard({
      score: r.aiScore,
      feedback: r.aiFeedback || '',
      method: r.aiMethod || '',
    })
    setShowLockdownResult(true)
    setContent('')
    setApproachText('')
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
    setApproachText('')
    setIsFinalizing(false)
    setFrozenRemainingSec(null)
    const aq = att.assignedQuestions
    if (Array.isArray(aq) && aq.length > 0) {
      setAssignedQs(aq)
      const draft = parseBankDraft(localStorage.getItem(DRAFT_PREFIX + att.id), aq)
      setAnswers(draft.answers)
      setApproaches(draft.approaches)
    } else {
      setAssignedQs(null)
      setAnswers({})
      setApproaches({})
    }
    setAttemptId(att.id)
    setStartedAt(new Date(att.startedAt))
    setDeadlineAt(new Date(att.deadlineAt))
    await enterLockdownShell()
  }

  const resumeSession = async (a: NonNullable<ExamStatus['activeAttempt']>) => {
    setIsFinalizing(false)
    setFrozenRemainingSec(null)
    setAttemptId(a.id)
    setStartedAt(new Date(a.startedAt))
    setDeadlineAt(new Date(a.deadlineAt))
    const aq = a.assignedQuestions
    if (Array.isArray(aq) && aq.length > 0) {
      setAssignedQs(aq)
      const draft = parseBankDraft(localStorage.getItem(DRAFT_PREFIX + a.id), aq)
      setAnswers(draft.answers)
      setApproaches(draft.approaches)
      setContent('')
      setApproachText('')
    } else {
      setAssignedQs(null)
      setAnswers({})
      setApproaches({})
      const raw = (() => {
        try {
          return localStorage.getItem(DRAFT_PREFIX + a.id) || ''
        } catch {
          return ''
        }
      })()
      try {
        const o = JSON.parse(raw) as { v?: number; t?: string; y?: string }
        if (o && typeof o === 'object' && o.v === 1 && typeof o.t === 'string') {
          setContent(o.t)
          setApproachText(typeof o.y === 'string' ? o.y : '')
        } else {
          setContent(raw)
          setApproachText('')
        }
      } catch {
        setContent(raw)
        setApproachText('')
      }
    }
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
      const t = e.target as Node | null
      if (examFormRef.current?.contains(t)) {
        return
      }
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
      const t = e.target as Node | null
      if (examFormRef.current?.contains(t)) {
        return
      }
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
      if (examFormRef.current?.contains(t)) return
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
    (status.canStartMore ?? true) &&
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
        {resultCard && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.16em] text-emerald-300">AI Natija</p>
                <p className="mt-2 text-4xl sm:text-6xl font-black text-white">
                  {resultCard.score !== null ? `${resultCard.score}%` : '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResultCard(null)}
                className="text-sm text-slate-300 hover:text-white underline"
              >
                Yopish
              </button>
            </div>
                {resultCard.feedback ? (
                  <div className="mt-4 text-sm sm:text-base text-emerald-50 leading-relaxed">
                    <strong className="text-white">Asos:</strong>
                    <div className="mt-1 prose prose-invert max-w-none prose-p:my-1">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {resultCard.feedback}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : null}
                {resultCard.method ? (
                  <div className="mt-3 text-sm sm:text-base text-slate-100 leading-relaxed">
                    <strong className="text-white">To‘g‘ri yechish usuli:</strong>
                    <div className="mt-1 prose prose-invert max-w-none prose-p:my-1">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {resultCard.method}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : null}
          </div>
        )}

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
                  <span>
                    {' '}
                    · Urinish: <strong className="text-slate-300">{status.usedAttempts ?? 0}</strong>/
                    <strong className="text-slate-300">{status.maxAttempts ?? 1}</strong>
                  </span>
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
                    : status && status.canStartMore === false
                      ? 'Urinishlar limiti tugagan. Qayta boshlash uchun admin bilan bog‘laning.'
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

        {!lockdown && status?.recentSubmissions && status.recentSubmissions.length > 0 ? (
          <div className="rounded-xl border border-slate-700 p-5 sm:p-6" style={{ backgroundColor: BG }}>
            <h3 className="text-base font-semibold text-white">Oldingi topshirishlar natijasi</h3>
            <div className="mt-4 space-y-2">
              {status.recentSubmissions.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="text-xs text-slate-400">
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleString('uz-UZ') : '—'}
                    <span className="ml-2">
                      {r.closedByTimer ? '· Taymer bilan yuborilgan' : '· Qo‘lda yuborilgan'}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-emerald-300">
                    {r.aiScore !== null ? `${r.aiScore}%` : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {lockdown && (
        <div
          className="fixed inset-0 z-[100] flex flex-col"
          style={{ backgroundColor: BG }}
          role="presentation"
        >
          <header
            className="flex-shrink-0 border-b border-slate-700 px-3 py-4 sm:px-6"
            style={{ pointerEvents: 'none' }}
          >
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <span className="order-2 truncate text-center text-sm font-medium text-slate-400 sm:order-1 sm:max-w-[38%] sm:text-left">
                {status?.title}
              </span>
              <div className="order-1 flex flex-1 flex-col items-center sm:order-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Qolgan vaqt
                </span>
                {remainingSec !== null ? (
                  <div
                    className={`mt-1 flex items-center gap-2 sm:gap-3 font-black tabular-nums leading-none tracking-tight ${
                      remainingSec <= 30 ? 'text-red-400' : 'text-white'
                    }`}
                    style={{ fontSize: 'clamp(2.5rem, 10vw, 4rem)' }}
                  >
                    <Timer
                      className="h-9 w-9 shrink-0 sm:h-12 sm:w-12"
                      style={{ color: remainingSec <= 30 ? '#f87171' : ACCENT }}
                    />
                    <span>{formatRemaining(isFinalizing ? frozenRemainingSec ?? remainingSec : remainingSec)}</span>
                  </div>
                ) : null}
                {startedAt && deadlineAt ? (
                  <p className="mt-2 text-center text-xs text-slate-500">
                    Imtihon:{' '}
                    <strong className="text-slate-300">
                      {Math.max(1, Math.round((deadlineAt.getTime() - startedAt.getTime()) / 60_000))}{' '}
                      daqiqa
                    </strong>{' '}
                    (admin belgilagan)
                  </p>
                ) : null}
              </div>
              <div className="order-3 hidden text-right text-xs tabular-nums text-slate-500 sm:block">
                {startedAt ? new Date().toLocaleTimeString('uz-UZ') : ''}
              </div>
            </div>
          </header>

          {showPostSubmitAnalyzing && (
            <div
              className="absolute inset-0 z-[125] flex flex-col items-center justify-center px-6"
              style={{ backgroundColor: 'rgba(3, 7, 18, 0.94)', pointerEvents: 'auto' }}
            >
              <div className="mb-10 h-20 w-20 rounded-full border-4 border-emerald-500/25 border-t-emerald-400 shadow-[0_0_40px_rgba(34,197,94,0.25)] animate-spin" />
              <div className="mb-6 flex gap-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2.5 w-2.5 rounded-full bg-emerald-400/90 animate-bounce"
                    style={{ animationDelay: `${i * 160}ms` }}
                  />
                ))}
              </div>
              <p className="max-w-lg text-center text-xl font-semibold leading-snug text-white sm:text-2xl">
                Javobingiz qabul qilindi.
              </p>
              <p className="mt-3 max-w-lg text-center text-base text-emerald-100/90 sm:text-lg">
                Endi tahlil qilinmoqda…
              </p>
            </div>
          )}

          {showLockdownResult && resultCard && (
            <div
              className="absolute inset-0 z-[126] flex items-center justify-center px-4"
              style={{ backgroundColor: 'rgba(2, 6, 23, 0.95)', pointerEvents: 'auto' }}
            >
              <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-emerald-400/40 bg-slate-950/90 p-6 sm:p-8 shadow-[0_0_80px_rgba(16,185,129,0.22)]">
                <div className="pointer-events-none absolute inset-0 opacity-40">
                  <div className="absolute left-8 top-8 animate-pulse text-emerald-300/70 text-2xl">∫</div>
                  <div className="absolute right-10 top-12 animate-bounce text-cyan-300/70 text-xl">π</div>
                  <div className="absolute left-1/3 bottom-10 animate-pulse text-violet-300/70 text-xl">√x</div>
                  <div className="absolute right-1/4 bottom-8 animate-bounce text-amber-300/70 text-xl">Σ</div>
                </div>
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">Rash fikri</p>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <div>
                    <p
                      className={`mb-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        resultCard.feedback.startsWith('To‘g‘ri')
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {resultCard.feedback.startsWith('To‘g‘ri') ? 'To‘g‘ri' : 'Xato'}
                    </p>
                    <p className="text-slate-300 text-sm">Natija foizi</p>
                    <p className="text-5xl sm:text-7xl font-black text-white leading-none">
                      {resultCard.score !== null ? `${resultCard.score}%` : '—'}
                    </p>
                  </div>
                  <div className="h-16 w-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-400 animate-spin" />
                </div>
                {resultCard.feedback ? (
                  <div className="mt-5 text-sm sm:text-base text-emerald-50 leading-relaxed">
                    <strong className="text-white">Fikr:</strong>
                    <div className="mt-1 prose prose-invert max-w-none prose-p:my-1">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {resultCard.feedback}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : null}
                {resultCard.method ? (
                  <div className="mt-3 text-sm sm:text-base text-slate-100 leading-relaxed">
                    <strong className="text-white">Tavsiya etilgan usul:</strong>
                    <div className="mt-1 prose prose-invert max-w-none prose-p:my-1">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {resultCard.method}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : null}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    style={{ backgroundColor: ACCENT }}
                    className="rounded-xl px-6 py-3 font-semibold text-white hover:brightness-110"
                    onClick={async () => {
                      setShowLockdownResult(false)
                      setDoneMsg(
                        resultCard.score !== null
                          ? `Rahmat! Javobingiz saqlandi. AI foiz: ${resultCard.score}%`
                          : 'Rahmat! Javobingiz saqlandi.'
                      )
                      await teardownLockdown()
                      await refreshStatus()
                    }}
                  >
                    Davom etish
                  </button>
                </div>
              </div>
            </div>
          )}

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

          <div ref={examFormRef} className="flex-1 min-h-0 p-4 flex flex-col gap-4 overflow-hidden" style={{ pointerEvents: 'auto' }}>
            {assignedQs && assignedQs.length > 0 ? (
              <div className="flex-1 min-h-0 overflow-y-auto space-y-8 pr-1">
                {assignedQs.map((q, idx) => (
                  <div key={q.id} className="rounded-xl border border-slate-600 bg-[#0f172a] p-4 space-y-3">
                    <p className="text-xs text-slate-500">Savol {idx + 1}</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={q.imageUrl}
                      alt=""
                      className="max-h-64 w-full object-contain rounded-lg border border-slate-700 bg-black/30"
                    />
                    <input
                      type="text"
                      value={answers[q.id] ?? ''}
                      onChange={(e) => {
                        const v = e.target.value
                        setAnswers((prev) => ({ ...prev, [q.id]: v }))
                      }}
                      spellCheck={false}
                      autoComplete="off"
                      className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-3 text-base text-slate-100 outline-none focus:ring-2 focus:ring-green-500/40"
                      placeholder="Javobingizni yozing"
                    />
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        Yondashuv (yechim yo‘li, qadamlar)
                      </label>
                      <textarea
                        value={approaches[q.id] ?? ''}
                        onChange={(e) =>
                          setApproaches((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        spellCheck={false}
                        autoComplete="off"
                        rows={3}
                        className="w-full resize-y rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-sm leading-relaxed text-slate-100 outline-none focus:ring-2 focus:ring-green-500/40"
                        placeholder="Masalan: qanday formuladan foydalandingiz, qisqa izoh…"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-4">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  className="min-h-[180px] flex-1 w-full resize-none rounded-lg border border-slate-600 p-4 font-mono text-base leading-relaxed text-slate-100 outline-none focus:ring-2 focus:ring-green-500/40"
                  style={{
                    backgroundColor: '#0f172a',
                    caretColor: ACCENT,
                  }}
                  placeholder="Javobingizni klaviatura bilan yozing..."
                />
                <div className="flex-shrink-0">
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Yondashuv (yechim yo‘li, qadamlar)
                  </label>
                  <textarea
                    value={approachText}
                    onChange={(e) => setApproachText(e.target.value)}
                    spellCheck={false}
                    autoComplete="off"
                    rows={4}
                    className="w-full resize-y rounded-lg border border-slate-600 bg-slate-950 p-3 text-sm leading-relaxed text-slate-100 outline-none focus:ring-2 focus:ring-green-500/40"
                    placeholder="Yechim strategiyasi yoki asosiy qadamlarni yozing…"
                  />
                </div>
              </div>
            )}
          </div>

          <footer className="flex-shrink-0 border-t border-slate-700 p-4 flex justify-center">
            <button
              ref={finishBtnRef}
              type="button"
              style={{ backgroundColor: ACCENT, pointerEvents: 'auto' }}
              className="rounded-lg px-12 py-4 text-lg font-bold text-white shadow-lg hover:brightness-110"
              onClick={() => {
                setShowFinishConfirm(true)
                setIsFinalizing(true)
                setFrozenRemainingSec(Math.max(0, Math.floor(remainingSec ?? 0)))
              }}
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
                  {assignedQs && assignedQs.length > 0
                    ? 'Barcha savol javoblari serverga yuboriladi va seans yopiladi.'
                    : 'Matn serverga yuboriladi va imtihon seansi yopiladi.'}
                </p>
                <div className="flex flex-wrap gap-3 justify-end pt-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-500 px-4 py-2 text-slate-200 hover:bg-slate-700"
                    onClick={() => {
                      setShowFinishConfirm(false)
                      setIsFinalizing(false)
                      setFrozenRemainingSec(null)
                    }}
                    disabled={submitting}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    style={{ backgroundColor: ACCENT }}
                    className="inline-flex items-center gap-2 rounded-lg px-5 py-2 font-semibold text-white disabled:opacity-50"
                    disabled={
                      submitting ||
                      (assignedQs && assignedQs.length > 0
                        ? assignedQs.some((q) => !(answers[q.id] || '').trim())
                        : !content.trim())
                    }
                    onClick={() => submitManualAndTeardown()}
                  >
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
