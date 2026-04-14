'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Loader2, Trash2, Upload } from 'lucide-react'
import { imageFileFromDataTransfer } from '@/lib/imageFromClipboardOrDrop'

type QuestionRow = {
  id: string
  imageUrl: string
  correctAnswer: string
  hint: string | null
  sortOrder: number
}

type TopicDetail = {
  id: string
  title: string
  part: { id: string; title: string; sortOrder: number }
  questions: QuestionRow[]
}

export default function AdminTestBankTopicQuestionsPage() {
  const params = useParams()
  const router = useRouter()
  const partId = params.partId as string
  const topicId = params.topicId as string
  const [topic, setTopic] = useState<TopicDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | 'new' | null>(null)
  const [newCorrect, setNewCorrect] = useState('')
  const [newHint, setNewHint] = useState('')
  const [newFile, setNewFile] = useState<File | null>(null)
  const newPreviewUrl = useMemo(() => (newFile ? URL.createObjectURL(newFile) : null), [newFile])
  useEffect(() => {
    return () => {
      if (newPreviewUrl) URL.revokeObjectURL(newPreviewUrl)
    }
  }, [newPreviewUrl])

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/test-bank/topics/${topicId}`)
    if (!res.ok) {
      setTopic(null)
      return
    }
    setTopic(await res.json())
  }, [topicId])

  useEffect(() => {
    let c = false
    setLoading(true)
    load().finally(() => {
      if (!c) setLoading(false)
    })
    return () => {
      c = true
    }
  }, [load])

  const uploadFile = async (file: File): Promise<string | null> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'Yuklashda xato')
      return null
    }
    return data.url || null
  }

  const addQuestion = async () => {
    if (!newFile) {
      alert('Avval savol rasmini tanlang')
      return
    }
    const ca = newCorrect.trim()
    if (!ca) {
      alert('To‘g‘ri javobni yozing (ochiq format). Bir nechta variant: 42|42.0')
      return
    }
    setUploadingId('new')
    try {
      const url = await uploadFile(newFile)
      if (!url) return
      const res = await fetch(`/api/admin/test-bank/topics/${topicId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: url,
          correctAnswer: ca,
          hint: newHint.trim() || null,
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(d.error || 'Xato')
        return
      }
      setNewFile(null)
      setNewCorrect('')
      setNewHint('')
      await load()
    } finally {
      setUploadingId(null)
    }
  }

  const replaceImage = async (qid: string, file: File) => {
    setUploadingId(qid)
    try {
      const url = await uploadFile(file)
      if (!url) return
      const res = await fetch(`/api/admin/test-bank/questions/${qid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url }),
      })
      if (!res.ok) alert('Xato')
      else await load()
    } finally {
      setUploadingId(null)
    }
  }

  const updateAnswer = async (qid: string, correctAnswer: string, hint: string) => {
    const res = await fetch(`/api/admin/test-bank/questions/${qid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correctAnswer: correctAnswer.trim(), hint: hint.trim() || null }),
    })
    if (!res.ok) alert('Xato')
    else await load()
  }

  const deleteQ = async (qid: string) => {
    if (!confirm('Savolni o‘chirish?')) return
    const res = await fetch(`/api/admin/test-bank/questions/${qid}`, { method: 'DELETE' })
    if (res.ok) await load()
    else alert('Xato')
  }

  if (loading) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 text-violet-400 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!topic) {
    return (
      <DashboardLayout role="ADMIN">
        <p className="text-red-400">Mavzu topilmadi.</p>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-8 max-w-4xl">
        <button
          type="button"
          onClick={() => router.push(`/admin/testlar/${partId}`)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {topic.part.title} — mavzular
        </button>

        <div>
          <h1 className="text-2xl font-bold text-white">{topic.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Savollarni rasm sifatida qo‘shing. Yonida to‘g‘ri javob (ochiq); o‘quchi shu matn bilan solishtiriladi.
          </p>
        </div>

        <div className="rounded-xl border border-violet-500/30 bg-slate-800/60 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-violet-200">Yangi savol</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Savol rasmi</label>
              <ImagePickPasteDrop
                disabled={uploadingId === 'new'}
                previewUrl={newPreviewUrl}
                onFile={(f) => setNewFile(f)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To‘g‘ri javob (ochiq)</label>
              <input
                value={newCorrect}
                onChange={(e) => setNewCorrect(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-gray-600 text-white"
                placeholder="masalan: 12 yoki π|pi|3.14"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Mentor izohi (ixtiyoriy, faqat admin)</label>
              <input
                value={newHint}
                onChange={(e) => setNewHint(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-gray-600 text-white"
              />
            </div>
          </div>
          <button
            type="button"
            disabled={uploadingId === 'new'}
            onClick={addQuestion}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {uploadingId === 'new' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Savolni qo‘shish
          </button>
        </div>

        <div className="space-y-8">
          {topic.questions.map((q, idx) => (
            <QuestionEditorRow
              key={q.id}
              index={idx + 1}
              q={q}
              uploading={uploadingId === q.id}
              onReplaceImage={(file) => replaceImage(q.id, file)}
              onSaveAnswer={(ca, h) => updateAnswer(q.id, ca, h)}
              onDelete={() => deleteQ(q.id)}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

function QuestionEditorRow({
  index,
  q,
  uploading,
  onReplaceImage,
  onSaveAnswer,
  onDelete,
}: {
  index: number
  q: QuestionRow
  uploading: boolean
  onReplaceImage: (f: File) => void
  onSaveAnswer: (ca: string, hint: string) => void
  onDelete: () => void
}) {
  const [ca, setCa] = useState(q.correctAnswer)
  const [hint, setHint] = useState(q.hint || '')
  useEffect(() => {
    setCa(q.correctAnswer)
    setHint(q.hint || '')
  }, [q.correctAnswer, q.hint])

  return (
    <div className="rounded-xl border border-gray-700 bg-slate-800/80 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-400">Savol {index}</span>
        <button type="button" onClick={onDelete} className="p-2 text-gray-500 hover:text-red-400 rounded-lg">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={q.imageUrl} alt="" className="max-h-72 w-auto rounded-lg border border-gray-600 bg-black/20" />
          <label className="block text-xs text-gray-500">Rasmni almashtirish</label>
          <ImagePickPasteDrop
            disabled={uploading}
            previewUrl={null}
            onFile={(f) => onReplaceImage(f)}
            compact
          />
          {uploading && <Loader2 className="h-4 w-4 animate-spin text-violet-400" />}
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">To‘g‘ri javob</label>
            <textarea
              value={ca}
              onChange={(e) => setCa(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-gray-600 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Admin izohi</label>
            <input
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-gray-600 text-white text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => onSaveAnswer(ca, hint)}
            className="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm"
          >
            Javobni saqlash
          </button>
        </div>
      </div>
    </div>
  )
}

function ImagePickPasteDrop({
  disabled,
  previewUrl,
  onFile,
  compact,
}: {
  disabled?: boolean
  previewUrl: string | null
  onFile: (f: File) => void
  compact?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const apply = (f: File | null) => {
    if (!f || disabled) return
    if (!f.type.startsWith('image/')) {
      alert('Faqat rasm fayli')
      return
    }
    onFile(f)
  }

  const onPaste = (e: React.ClipboardEvent) => {
    const f = imageFileFromDataTransfer(e.clipboardData)
    if (f) {
      e.preventDefault()
      e.stopPropagation()
      apply(f)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const f = imageFileFromDataTransfer(e.dataTransfer)
    apply(f)
  }

  return (
    <div
      tabIndex={disabled ? -1 : 0}
      onPaste={onPaste}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`rounded-lg border-2 border-dashed border-gray-600 bg-slate-900/40 outline-none transition-colors ${
        disabled ? 'opacity-50 pointer-events-none' : 'hover:border-gray-500 focus:border-violet-500/80 focus:ring-2 focus:ring-violet-500/25'
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      {!compact && previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="" className="max-h-48 w-full object-contain rounded-md mb-3 border border-gray-700 bg-black/20" />
      )}
      <p className={`text-gray-400 ${compact ? 'text-xs mb-2' : 'text-sm mb-3'}`}>
        {compact
          ? 'Bu yerni bosing, Ctrl+V (nusxa olingan rasm) yoki fayl / surib tashlash.'
          : 'Bu blokni bosing (fokus), keyin skrinshot yoki nusxa olingan rasmni Ctrl+V qiling. Yoki fayl tanlang / rasmni shu yerga torting.'}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm disabled:opacity-50"
        >
          Fayl tanlash
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null
            apply(f)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
