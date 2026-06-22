'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'
import { Layers, Plus, Trash2, Pencil, X } from 'lucide-react'

interface Subject {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
}

export default function SubjectsPage() {
  const { data: session } = useSession()
  const [items, setItems] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<Subject | null>(null)
  const [editName, setEditName] = useState('')

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      const r = await fetch('/api/admin/subjects', { credentials: 'include' })
      if (r.ok) {
        setItems(await r.json())
      } else {
        const j = await r.json().catch(() => ({}))
        setLoadError(j.error || `Yuklash xatosi (${r.status})`)
        setItems([])
      }
    } catch {
      setLoadError("Serverga ulanib bo'lmadi")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const r = await fetch('/api/admin/subjects', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    })
    if (r.ok) {
      setName('')
      load()
    } else {
      const j = await r.json().catch(() => ({}))
      alert(j.error || 'Xatolik')
    }
  }

  const startEdit = (s: Subject) => {
    setEditing(s)
    setEditName(s.name)
  }

  const saveEdit = async () => {
    if (!editing) return
    const trimmed = editName.trim()
    if (!trimmed) return
    const r = await fetch(`/api/admin/subjects/${editing.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed, sortOrder: editing.sortOrder, isActive: editing.isActive }),
    })
    if (r.ok) {
      setEditing(null)
      load()
    } else {
      const j = await r.json().catch(() => ({}))
      alert(j.error || 'Xatolik')
    }
  }

  const handleDelete = async (s: Subject) => {
    if (!confirm(`"${s.name}" o'chirilsinmi? Guruhlarda fan bo'sh qoldiriladi.`)) return
    const r = await fetch(`/api/admin/subjects/${s.id}`, { method: 'DELETE', credentials: 'include' })
    if (r.ok) load()
    else {
      const j = await r.json().catch(() => ({}))
      alert(j.error || 'Xatolik')
    }
  }

  const layoutRole = session?.user?.role === 'MANAGER' ? 'MANAGER' : 'ADMIN'

  return (
    <DashboardLayout role={layoutRole}>
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div>
          <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-white sm:text-3xl">
            <Layers className="h-7 w-7 text-violet-400" />
            Fanlar
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-gray-400">
            Har bir guruhni fan bilan bog&apos;lash uchun avval fanlarni kiriting. Masalan: Matematika, Ingliz tili.
            Fan qo&apos;shilgach, har bir qatorda tahrirlash va o&apos;chirish tugmalari paydo bo&apos;ladi; o&apos;chirilganda
            bog&apos;langan guruhlarda fan maydoni bo&apos;sh qoladi.
          </p>
        </div>

        {loadError && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">{loadError}</p>
        )}

        <div className="rounded-xl border border-gray-700 bg-slate-800/70 p-4 sm:p-5">
          <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Yangi fan nomi"
              className="h-11 flex-1 rounded-lg border border-gray-700 bg-slate-900 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 font-medium text-white transition-colors hover:bg-violet-500"
            >
              <Plus className="h-4 w-4" />
              Qo&apos;shish
            </button>
          </form>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-700 bg-slate-800/80">
          {loading ? (
            <p className="p-8 text-center text-gray-400">Yuklanmoqda...</p>
          ) : items.length === 0 ? (
            <p className="p-8 text-center text-gray-400">Hozircha fanlar yo&apos;q</p>
          ) : (
            <ul className="divide-y divide-gray-700/80">
              {items.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                  <span className="text-base font-medium text-white">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="rounded-lg p-2 text-blue-400 transition-colors hover:bg-blue-500/15"
                      title="Tahrirlash"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/15"
                      title="O'chirish"
                    >
                      <Trash2 className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">O&apos;chirish</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-md space-y-4 rounded-xl border border-gray-700 bg-slate-800 p-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Fanni tahrirlash</h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-md p-1 text-gray-400 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-600 bg-slate-900 px-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="h-10 rounded-lg px-4 text-gray-300 transition-colors hover:bg-slate-700"
              >
                Bekor
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="h-10 rounded-lg bg-violet-600 px-4 text-white transition-colors hover:bg-violet-500"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
