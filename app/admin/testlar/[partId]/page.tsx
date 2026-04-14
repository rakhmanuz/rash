'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Loader2, Plus, Trash2, Pencil } from 'lucide-react'

type TopicRow = {
  id: string
  title: string
  sortOrder: number
  _count: { questions: number }
}

type PartDetail = {
  id: string
  title: string
  sortOrder: number
  topics: TopicRow[]
}

export default function AdminTestBankPartTopicsPage() {
  const params = useParams()
  const router = useRouter()
  const partId = params.partId as string
  const [part, setPart] = useState<PartDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [editPartTitle, setEditPartTitle] = useState('')
  const [editingPart, setEditingPart] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/test-bank/parts/${partId}/topics`)
    if (!res.ok) {
      setPart(null)
      return
    }
    const data = await res.json()
    setPart(data)
    setEditPartTitle(data.title || '')
  }, [partId])

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

  const addTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/test-bank/parts/${partId}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (res.ok) {
        setNewTitle('')
        await load()
      } else {
        const d = await res.json().catch(() => ({}))
        alert(d.error || 'Xato')
      }
    } finally {
      setSaving(false)
    }
  }

  const deleteTopic = async (topicId: string) => {
    if (!confirm('Mavzu va uning barcha savollarini o‘chirish?')) return
    const res = await fetch(`/api/admin/test-bank/topics/${topicId}`, { method: 'DELETE' })
    if (res.ok) await load()
    else alert('Xato')
  }

  const savePartTitle = async () => {
    const title = editPartTitle.trim()
    if (!title) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/test-bank/parts/${partId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (res.ok) {
        setEditingPart(false)
        await load()
      } else alert('Xato')
    } finally {
      setSaving(false)
    }
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

  if (!part) {
    return (
      <DashboardLayout role="ADMIN">
        <p className="text-red-400">Qism topilmadi.</p>
        <Link href="/admin/testlar" className="text-violet-400 underline mt-4 inline-block">
          Orqaga
        </Link>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => router.push('/admin/testlar')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Barcha qismlar
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            {editingPart ? (
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <input
                  value={editPartTitle}
                  onChange={(e) => setEditPartTitle(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-gray-600 text-white max-w-md"
                />
                <button
                  type="button"
                  disabled={saving}
                  onClick={savePartTitle}
                  className="px-3 py-2 bg-violet-600 rounded-lg text-white text-sm"
                >
                  Saqlash
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPart(false)
                    setEditPartTitle(part.title)
                  }}
                  className="px-3 py-2 border border-gray-600 rounded-lg text-gray-300 text-sm"
                >
                  Bekor
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white">{part.title}</h1>
                <button
                  type="button"
                  title="Qism nomini tahrirlash"
                  onClick={() => setEditingPart(true)}
                  className="p-2 rounded-lg text-gray-500 hover:text-violet-300 hover:bg-slate-800"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500">{part.sortOrder}-qism · Mavzular ro‘yxati</p>
          </div>
        </div>

        <form onSubmit={addTopic} className="flex flex-col sm:flex-row gap-3 max-w-xl">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Yangi mavzu nomi"
            className="flex-1 px-4 py-3 rounded-lg bg-slate-800 border border-gray-700 text-white"
          />
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg font-medium"
          >
            <Plus className="h-5 w-5" />
            Mavzu qo‘shish
          </button>
        </form>

        <div className="space-y-2">
          {part.topics.length === 0 ? (
            <p className="text-gray-500 py-8 text-center border border-dashed border-gray-700 rounded-xl">
              Hozircha mavzu yo‘q. Yuqoridan qo‘shing.
            </p>
          ) : (
            part.topics.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-700 bg-slate-800/80 p-4"
              >
                <Link href={`/admin/testlar/${partId}/${t.id}`} className="flex-1 min-w-0 group">
                  <h2 className="font-semibold text-white group-hover:text-violet-200 truncate">{t.title}</h2>
                  <p className="text-xs text-gray-500">{t._count.questions} ta savol (rasm)</p>
                </Link>
                <button
                  type="button"
                  onClick={() => deleteTopic(t.id)}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-slate-900 shrink-0"
                  title="O‘chirish"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
