'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'

type QLite = { id: string; imageUrl: string; sortOrder: number }

type TopicPractice = {
  id: string
  title: string
  part: { id: string; title: string }
  questions: QLite[]
}

export default function StudentTestBankPracticePage() {
  const params = useParams()
  const router = useRouter()
  const partId = params.partId as string
  const topicId = params.topicId as string
  const [topic, setTopic] = useState<TopicPractice | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<Record<string, boolean | null>>({})
  const [checking, setChecking] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/student/test-bank/topics/${topicId}`)
    if (!res.ok) setTopic(null)
    else setTopic(await res.json())
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

  const checkOne = async (questionId: string) => {
    const answer = answers[questionId] ?? ''
    setChecking(questionId)
    try {
      const res = await fetch(`/api/student/test-bank/questions/${questionId}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setResult((r) => ({ ...r, [questionId]: data.correct === true }))
      } else {
        setResult((r) => ({ ...r, [questionId]: null }))
      }
    } finally {
      setChecking(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="STUDENT">
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 text-sky-400 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!topic) {
    return (
      <DashboardLayout role="STUDENT">
        <p className="text-red-400">Topilmadi</p>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6 max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => router.push(`/student/test-banka/${partId}`)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {topic.part.title}
        </button>
        <h1 className="text-xl font-bold text-white">{topic.title}</h1>

        <div className="space-y-10">
          {topic.questions.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-3">
              <p className="text-xs text-slate-500">Savol {i + 1}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={q.imageUrl} alt="" className="w-full max-h-80 object-contain rounded-lg bg-black/30" />
              <input
                type="text"
                value={answers[q.id] ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  setAnswers((a) => ({ ...a, [q.id]: v }))
                  setResult((r) => ({ ...r, [q.id]: null }))
                }}
                placeholder="Javobingizni yozing"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-600 text-white placeholder-slate-500"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={checking === q.id}
                  onClick={() => checkOne(q.id)}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium"
                >
                  {checking === q.id ? 'Tekshirilmoqda…' : 'Tekshirish'}
                </button>
                {result[q.id] === true && <span className="text-sm text-emerald-400 font-medium">To‘g‘ri</span>}
                {result[q.id] === false && <span className="text-sm text-red-400 font-medium">Noto‘g‘ri</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
