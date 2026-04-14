'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Loader2,
  RotateCcw,
  Save,
  Search,
  Shield,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UserPlus,
  Users,
  FileText,
  Clock,
} from 'lucide-react'

const BG = '#111827'
const ACCENT = '#22c55e'

type Settings = {
  id: string
  lockdownOpen: boolean
  title: string
  instructions: string
  durationMinutes: number
  testBankTopicId?: string | null
  examQuestionCount?: number
  maxAttempts?: number
  testBankPartId?: string | null
  topicPartLabel?: { partTitle: string; topicTitle: string } | null
  updatedAt: string
}

type PartOpt = { id: string; title: string; sortOrder: number }
type TopicOpt = { id: string; title: string; partId: string }

type AllowedRow = {
  id: string
  studentId: string
  name: string
  username: string
  addedAt: string
}

type StudentRow = {
  id: string
  studentId: string
  name: string
  username: string
}

type SubmissionRow = {
  id: string
  content: string
  startedAt: string
  submittedAt: string
  closedByTimer: boolean
  student: {
    studentId: string
    user: { name: string; username: string }
  }
}

function parseAiFromSubmission(content: string): {
  aiScore: number | null
  aiFeedback: string
  aiMethod: string
} {
  try {
    const obj = JSON.parse(content) as {
      mode?: string
      aiScore?: number
      aiFeedback?: string
      aiMethod?: string
      scoreLine?: string
    }
    const aiScore = typeof obj.aiScore === 'number' ? Math.max(0, Math.min(75, Math.round(obj.aiScore))) : null
    const aiFeedback = typeof obj.aiFeedback === 'string' ? obj.aiFeedback.trim() : ''
    const aiMethod = typeof obj.aiMethod === 'string' ? obj.aiMethod.trim() : ''
    if (aiScore !== null || aiFeedback || aiMethod) return { aiScore, aiFeedback, aiMethod }
    if (typeof obj.scoreLine === 'string' && obj.scoreLine.trim()) {
      return { aiScore: null, aiFeedback: obj.scoreLine.trim(), aiMethod: '' }
    }
  } catch {
    /* oddiy matn submission */
  }
  return { aiScore: null, aiFeedback: '', aiMethod: '' }
}

export function AdminVazifaExamManager() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const [settings, setSettings] = useState<Settings | null>(null)
  const [titleDraft, setTitleDraft] = useState('')
  const [instrDraft, setInstrDraft] = useState('')
  const [durationDraft, setDurationDraft] = useState('45')
  const [parts, setParts] = useState<PartOpt[]>([])
  const [topics, setTopics] = useState<TopicOpt[]>([])
  const [partIdDraft, setPartIdDraft] = useState('')
  const [topicIdDraft, setTopicIdDraft] = useState('')
  const [questionCountDraft, setQuestionCountDraft] = useState('0')
  const [maxAttemptsDraft, setMaxAttemptsDraft] = useState('1')
  const [allowed, setAllowed] = useState<AllowedRow[]>([])
  const [rows, setRows] = useState<SubmissionRow[]>([])
  const [students, setStudents] = useState<StudentRow[]>([])
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [examRes, stRes] = await Promise.all([
        fetch('/api/admin/vazifa-exam', { cache: 'no-store' }),
        fetch('/api/admin/students', { cache: 'no-store' }),
      ])
      const examData = await examRes.json().catch(() => null)
      if (!examRes.ok) {
        setError(examData?.error || 'Imtihon ma’lumoti olinmadi')
        return
      }
      const s = examData.settings as Settings
      setSettings(s)
      setTitleDraft(s.title)
      setInstrDraft(s.instructions || '')
      setDurationDraft(String(s.durationMinutes ?? 45))
      setTopicIdDraft(s.testBankTopicId || '')
      setPartIdDraft(s.testBankPartId || '')
      setQuestionCountDraft(String(s.examQuestionCount ?? 0))
      setMaxAttemptsDraft(String(s.maxAttempts ?? 1))
      setAllowed(examData.allowedStudents || [])
      setRows(examData.recentSubmissions || [])

      if (stRes.ok) {
        const list = await stRes.json()
        const mapped: StudentRow[] = (Array.isArray(list) ? list : []).map(
          (x: { id: string; studentId?: string; user?: { name?: string; username?: string } }) => ({
            id: x.id,
            studentId: String(x.studentId || ''),
            name: String(x.user?.name || ''),
            username: String(x.user?.username || ''),
          })
        )
        setStudents(mapped)
      }

      const pRes = await fetch('/api/admin/test-bank/parts', { cache: 'no-store' })
      if (pRes.ok) {
        const plist = await pRes.json()
        setParts(Array.isArray(plist) ? plist : [])
      }
    } catch {
      setError('Tarmoq xatosi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true)
    setError(null)
    setOk(null)
    try {
      const res = await fetch('/api/admin/vazifa-exam', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Saqlashda xato')
        return
      }
      if (data.settings) {
        const s = data.settings as Settings
        setSettings(s)
        setTitleDraft(s.title)
        setInstrDraft(s.instructions || '')
        setDurationDraft(String(s.durationMinutes ?? 45))
        setTopicIdDraft(s.testBankTopicId || '')
        setPartIdDraft(s.testBankPartId || '')
        setQuestionCountDraft(String(s.examQuestionCount ?? 0))
        setMaxAttemptsDraft(String(s.maxAttempts ?? 1))
      }
      setOk('Saqlandi')
      setTimeout(() => setOk(null), 2500)
      await load()
    } catch {
      setError('Tarmoq xatosi')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!partIdDraft) {
      setTopics([])
      return
    }
    let cancelled = false
    fetch(`/api/admin/test-bank/parts/${partIdDraft}/topics`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.topics) return
        setTopics(data.topics as TopicOpt[])
      })
      .catch(() => {
        if (!cancelled) setTopics([])
      })
    return () => {
      cancelled = true
    }
  }, [partIdDraft])

  const saveMeta = () => {
    const d = parseInt(durationDraft, 10)
    const qc = parseInt(questionCountDraft, 10)
    const ma = parseInt(maxAttemptsDraft, 10)
    const examQuestionCount = Number.isFinite(qc) ? Math.min(50, Math.max(0, qc)) : 0
    const maxAttempts = Number.isFinite(ma) ? Math.min(20, Math.max(1, ma)) : 1
    patch({
      title: titleDraft.trim() || undefined,
      instructions: instrDraft,
      durationMinutes: Number.isFinite(d) ? d : undefined,
      examQuestionCount,
      maxAttempts,
      testBankTopicId: examQuestionCount > 0 ? topicIdDraft.trim() || null : null,
    })
  }

  const toggleOpen = () => {
    if (!settings) return
    patch({ lockdownOpen: !settings.lockdownOpen })
  }

  const addToQueue = async (studentInternalId: string) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/vazifa-exam/allowed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: [studentInternalId] }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Qo‘shishda xato')
        return
      }
      setOk('Navbatga qo‘shildi')
      setTimeout(() => setOk(null), 2000)
      await load()
    } catch {
      setError('Tarmoq xatosi')
    } finally {
      setSaving(false)
    }
  }

  const removeFromQueue = async (studentInternalId: string) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/vazifa-exam/allowed', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: [studentInternalId] }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || 'Olib tashlashda xato')
        return
      }
      await load()
    } catch {
      setError('Tarmoq xatosi')
    } finally {
      setSaving(false)
    }
  }

  const clearQueue = async () => {
    if (!window.confirm('Barcha navbatni tozalaysizmi?')) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/vazifa-exam/allowed', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearAll: true }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || 'Xato')
        return
      }
      await load()
    } catch {
      setError('Tarmoq xatosi')
    } finally {
      setSaving(false)
    }
  }

  const resetAttemptsForStudent = async (studentInternalId: string, label: string) => {
    if (!window.confirm(`${label} uchun urinishlarni nol qilasizmi?`)) return
    setSaving(true)
    setError(null)
    setOk(null)
    try {
      const res = await fetch('/api/admin/vazifa-exam/reset-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: [studentInternalId] }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Urinishni tiklashda xato')
        return
      }
      setOk('Urinishlar tiklandi')
      setTimeout(() => setOk(null), 2000)
      await load()
    } catch {
      setError('Tarmoq xatosi')
    } finally {
      setSaving(false)
    }
  }

  const allowedSet = useMemo(() => new Set(allowed.map((a) => a.id)), [allowed])

  const filteredStudents = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return students.slice(0, 80)
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(t) ||
          s.username.toLowerCase().includes(t) ||
          s.studentId.toLowerCase().includes(t)
      )
      .slice(0, 80)
  }, [students, q])

  const rowsWithAi = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        ai: parseAiFromSubmission(r.content),
      })),
    [rows]
  )

  if (loading && !settings) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-green-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
          {error}
        </div>
      )}
      {ok && (
        <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-green-200 text-sm">
          {ok}
        </div>
      )}

      <div
        className="rounded-2xl border border-slate-700 overflow-hidden shadow-2xl"
        style={{ backgroundColor: BG }}
      >
        <div
          className="border-b border-slate-700 px-6 py-5"
          style={{ background: `linear-gradient(135deg, ${BG} 0%, #0f172a 100%)` }}
        >
          <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: ACCENT }}>
            <Shield className="h-8 w-8" />
            Imtihon / vazifa kabineti
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-3xl">
            Kelgan o‘quvchilarni pastdan qidiring va <strong className="text-slate-200">navbatga</strong> qo‘shing.
            <strong className="text-slate-200"> Testlar bazasidan</strong> qism, mavzu va savollar sonini tanlang —
            navbatdagi har bir o‘quchi <strong className="text-slate-200">Boshlash</strong> bosganda shu mavzudan
            tasodifiy tanlangan rasmli savollar oladi. Keyin <strong className="text-slate-200">imtihon oynasini oching</strong>{' '}
            — faqat navbatdagilarda Boshlash chiqadi. <strong className="text-slate-200">Muddat</strong> bo‘yicha taymer;
            tugagach javob avtomatik yuboriladi.
          </p>
        </div>

        <div className="p-6 space-y-8">
          <div
            className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 rounded-xl border border-slate-600 p-5"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
          >
            <div className="flex items-start gap-4">
              {settings?.lockdownOpen ? (
                <ToggleRight className="h-12 w-12 flex-shrink-0" style={{ color: ACCENT }} />
              ) : (
                <ToggleLeft className="h-12 w-12 flex-shrink-0 text-slate-500" />
              )}
              <div>
                <p className="text-lg font-semibold text-white">Imtihon oynasi (Boshlash ko‘rinishi)</p>
                <p className="text-sm text-slate-400 mt-1">
                  {settings?.lockdownOpen
                    ? 'Ochiq — navbatdagi o‘quvchilar Boshlashni ko‘radi.'
                    : 'Yopiq — hech kim yangi seans boshlay olmaydi (davom etayotgan seanslar taymer bilan tugaydi).'}
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={toggleOpen}
              className={`rounded-xl px-6 py-3 font-semibold text-white shadow-lg min-w-[220px] ${
                settings?.lockdownOpen ? 'bg-amber-600 hover:bg-amber-500' : ''
              }`}
              style={!settings?.lockdownOpen ? { backgroundColor: ACCENT } : undefined}
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : settings?.lockdownOpen ? 'Yopish' : 'Ochish'}
            </button>
          </div>

          <div className="rounded-xl border border-slate-600 p-4 space-y-4" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
            <p className="text-sm font-semibold text-slate-200">Testlar bazasi (rasm + ochiq javob)</p>
            <p className="text-xs text-slate-500">
              Savollar soni 0 bo‘lsa — eski rejim: o‘quvchi bitta matn maydoniga yozadi. 1 va undan yuqori bo‘lsa — tanlangan mavzudan tasodifiy rasmlar chiqadi.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Qism</label>
                <select
                  value={partIdDraft}
                  onChange={(e) => {
                    const v = e.target.value
                    setPartIdDraft(v)
                    setTopicIdDraft('')
                  }}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500/40"
                >
                  <option value="">— tanlang —</option>
                  {parts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sortOrder}-qism: {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Mavzu</label>
                <select
                  value={topicIdDraft}
                  onChange={(e) => setTopicIdDraft(e.target.value)}
                  disabled={!partIdDraft}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500/40 disabled:opacity-50"
                >
                  <option value="">— mavzu —</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Savollar soni (random)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={questionCountDraft}
                  onChange={(e) => setQuestionCountDraft(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500/40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Vaqt / muddat (daqiqa)
                </label>
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={durationDraft}
                  onChange={(e) => setDurationDraft(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500/40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Urinishlar soni (har o‘quvchi)</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxAttemptsDraft}
                  onChange={(e) => setMaxAttemptsDraft(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500/40"
                />
              </div>
            </div>
            {settings?.topicPartLabel && (settings.examQuestionCount ?? 0) > 0 ? (
              <p className="text-xs text-green-400/90">
                Saqlangan: {settings.topicPartLabel.partTitle} → {settings.topicPartLabel.topicTitle} ·{' '}
                {settings.examQuestionCount} ta savol
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium text-slate-300">Sarlavha</label>
              <input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                maxLength={200}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500/40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Ko‘rsatmalar (o‘quvchi ko‘radi)</label>
            <textarea
              value={instrDraft}
              onChange={(e) => setInstrDraft(e.target.value)}
              rows={5}
              maxLength={8000}
              className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500/40 resize-y min-h-[120px]"
            />
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={saveMeta}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-3 font-semibold text-white"
            style={{ backgroundColor: '#334155' }}
          >
            <Save className="h-5 w-5" />
            Matn va muddatni saqlash
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div
          className="rounded-2xl border border-slate-700 overflow-hidden"
          style={{ backgroundColor: BG }}
        >
          <div className="border-b border-slate-700 px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-white font-semibold">
              <UserPlus className="h-5 w-5" style={{ color: ACCENT }} />
              Navbatga qo‘shish
            </div>
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ism, login yoki ID..."
                className="w-full rounded-lg border border-slate-600 bg-slate-900 pl-9 pr-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-green-500/30"
              />
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-900/95 border-b border-slate-700 text-slate-400">
                <tr>
                  <th className="px-3 py-2">O‘quvchi</th>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2 w-28" />
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="px-3 py-2 text-slate-200">
                      {s.name}
                      <div className="text-xs text-slate-500">{s.username}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-400 font-mono text-xs">{s.studentId}</td>
                    <td className="px-3 py-2">
                      {allowedSet.has(s.id) ? (
                        <span className="text-xs text-green-400">navbatda</span>
                      ) : (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => addToQueue(s.id)}
                          className="text-xs font-semibold rounded-md px-2 py-1 text-white"
                          style={{ backgroundColor: ACCENT }}
                        >
                          + Navbat
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div
          className="rounded-2xl border border-slate-700 overflow-hidden flex flex-col"
          style={{ backgroundColor: BG }}
        >
          <div className="border-b border-slate-700 px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Users className="h-5 w-5" style={{ color: ACCENT }} />
              Bugungi navbat ({allowed.length})
            </div>
            <button
              type="button"
              disabled={saving || allowed.length === 0}
              onClick={clearQueue}
              className="text-xs text-red-300 hover:text-red-200 disabled:opacity-40"
            >
              Hammasini tozalash
            </button>
          </div>
          <div className="flex-1 max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-900/95 border-b border-slate-700 text-slate-400">
                <tr>
                  <th className="px-3 py-2">O‘quvchi</th>
                  <th className="px-3 py-2 w-24 text-center">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {allowed.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-3 py-8 text-center text-slate-500">
                      Navbat bo‘sh
                    </td>
                  </tr>
                ) : (
                  allowed.map((a) => (
                    <tr key={a.id} className="border-b border-slate-800">
                      <td className="px-3 py-2 text-slate-200">
                        {a.name}
                        <div className="text-xs text-slate-500">
                          {a.username} · {a.studentId}
                        </div>
                      </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => resetAttemptsForStudent(a.id, a.name)}
                          className="p-1.5 rounded-md text-amber-300 hover:bg-amber-500/10"
                          title="Urinishni tiklash"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => removeFromQueue(a.id)}
                          className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10"
                          title="Olib tashlash"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl border border-slate-700 overflow-hidden"
        style={{ backgroundColor: BG }}
      >
        <div className="border-b border-slate-700 px-6 py-4 flex items-center gap-2">
          <FileText className="h-5 w-5" style={{ color: ACCENT }} />
          <h3 className="text-lg font-semibold text-white">So‘nggi topshirishlar</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="px-4 py-3 font-medium">O‘quvchi</th>
                <th className="px-4 py-3 font-medium">Vaqt</th>
                <th className="px-4 py-3 font-medium">Turi</th>
                <th className="px-4 py-3 font-medium">AI ball</th>
                <th className="px-4 py-3 font-medium">AI izoh va usul</th>
              </tr>
            </thead>
            <tbody>
              {rowsWithAi.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    Hali topshirish yo‘q
                  </td>
                </tr>
              ) : (
                rowsWithAi.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-slate-200">
                      {r.student.user.name}
                      <span className="block text-xs text-slate-500">{r.student.user.username}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                      {new Date(r.submittedAt).toLocaleString('uz-UZ')}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {r.closedByTimer ? (
                        <span className="text-amber-400">Taymer</span>
                      ) : (
                        <span className="text-green-400">O‘zi</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {r.ai.aiScore !== null ? (
                        <span className="font-semibold text-emerald-300">{r.ai.aiScore}%</span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300 max-w-xl text-xs">
                      {r.ai.aiFeedback || r.ai.aiMethod ? (
                        <div className="space-y-1">
                          {r.ai.aiFeedback ? (
                            <p className="line-clamp-2">
                              <span className="text-slate-400">Asos:</span> {r.ai.aiFeedback}
                            </p>
                          ) : null}
                          {r.ai.aiMethod ? (
                            <p className="line-clamp-2 text-emerald-100/90">
                              <span className="text-emerald-300">Yechish usuli:</span> {r.ai.aiMethod}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-500">AI izoh yo‘q</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 space-y-3 text-sm text-slate-400">
        <p>
          <strong className="text-slate-200">10 ta kompyuter:</strong> har birida{' '}
          <strong className="text-slate-200">windows-vazifa-client</strong> (yoki brauzer) ochib,
          <code className="mx-1 text-green-400/90">?examLab=1</code> bilan login sahifasidan kiriting — pastdagi boshqa
          havolalar yashirin. Imtihon tugagach navbatni tozalang yoki keyingi guruhni qo‘shing.
        </p>
        <p>
          <strong className="text-slate-200">OS darajasida</strong> boshqa dasturlarni to‘liq o‘chirish uchun Windows
          Assigned Access / kiosk siyosati yoki maxsus hisoblardan foydalanish kerak — brauzer yolg‘iz buni 100% bera
          olmaydi.
        </p>
      </div>
    </div>
  )
}
