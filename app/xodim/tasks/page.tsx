'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CheckCircle2, ClipboardList, MessageSquareText, Paperclip, Upload, X } from 'lucide-react'

type Task = {
  id: string
  title: string
  description?: string | null
  status: 'PENDING' | 'COMPLETED'
  dueDate?: string | null
  completedAt?: string | null
  assignedBy?: { name?: string | null; username?: string | null } | null
  attachments?: Array<{
    url: string
    name: string
    type: string
    size: number
    source?: 'ADMIN' | 'XODIM'
  }>
}

export default function XodimTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [note, setNote] = useState('')
  const [completionAttachments, setCompletionAttachments] = useState<
    Array<{ url: string; name: string; type: string; size: number }>
  >([])
  const [uploading, setUploading] = useState(false)

  const pendingTasks = useMemo(() => tasks.filter((t) => t.status === 'PENDING'), [tasks])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/xodim/tasks')
      if (response.ok) {
        setTasks(await response.json())
      }
    } catch (error) {
      console.error('Error fetching xodim tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const openConfirmModal = (task: Task) => {
    setSelectedTask(task)
    setNote('')
    setCompletionAttachments([])
  }

  const closeConfirmModal = () => {
    setSelectedTask(null)
    setNote('')
    setCompletionAttachments([])
    setUploading(false)
    setConfirming(false)
  }

  const formatFileSize = (size: number) => {
    if (!size || size <= 0) return '—'
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const uploaded: Array<{ url: string; name: string; type: string; size: number }> = []
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        const response = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          alert(err?.error || `${file.name} yuklanmadi`)
          continue
        }
        const data = await response.json()
        uploaded.push({
          url: data.url,
          name: file.name,
          type: file.type,
          size: file.size,
        })
      }
      if (uploaded.length > 0) {
        setCompletionAttachments((prev) => [...prev, ...uploaded])
      }
    } catch (error) {
      console.error('Error uploading completion files:', error)
      alert('Fayl yuklashda xatolik yuz berdi')
    } finally {
      setUploading(false)
    }
  }

  const removeCompletionAttachment = (index: number) => {
    setCompletionAttachments((prev) => prev.filter((_, idx) => idx !== index))
  }

  const completeTask = async () => {
    if (!selectedTask) return
    const trimmed = note.trim()
    if (!trimmed) {
      alert('Iltimos, izoh kiriting')
      return
    }

    setConfirming(true)
    try {
      const response = await fetch(`/api/xodim/tasks/${selectedTask.id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completionNote: trimmed,
          completionAttachments,
        }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        alert(err?.error || 'Xatolik yuz berdi')
        return
      }
      closeConfirmModal()
      await fetchTasks()
    } catch (error) {
      console.error('Error completing task:', error)
      alert('Xatolik yuz berdi')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <DashboardLayout role="XODIM">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-5">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <ClipboardList className="h-6 w-6 text-violet-300" />
            Topshiriqlar
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Admin tomonidan berilgan vazifalar. Yakunlashda izoh yozib tasdiqlang.
          </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4 sm:p-6">
          <div className="mb-4 text-sm text-slate-300">
            Kutilayotgan topshiriqlar: <span className="font-semibold">{pendingTasks.length}</span>
          </div>
          {loading ? (
            <div className="text-sm text-slate-400">Yuklanmoqda...</div>
          ) : tasks.length === 0 ? (
            <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-8 text-center text-sm text-slate-400">
              Hozircha topshiriq yo&apos;q
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-slate-700 bg-slate-900/30 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <p className="font-semibold text-white">{task.title}</p>
                        {task.status === 'COMPLETED' ? (
                          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                            Bajarilgan
                          </span>
                        ) : (
                          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
                            Jarayonda
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="whitespace-pre-line text-sm text-slate-300">{task.description}</p>
                      )}
                      {Array.isArray(task.attachments) && task.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {task.attachments.map((file, idx) => (
                            <a
                              key={`${file.url}-${idx}`}
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-slate-700/80 px-2 py-1 text-xs text-slate-200 hover:bg-slate-600"
                            >
                              <Paperclip className="h-3 w-3" />
                              {file.name}
                            </a>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-xs text-slate-500">
                        Admin: {task.assignedBy?.name || task.assignedBy?.username || '—'}
                        {task.dueDate
                          ? ` · Muddat: ${new Date(task.dueDate).toLocaleString('uz-UZ')}`
                          : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={task.status === 'COMPLETED'}
                      onClick={() => openConfirmModal(task)}
                      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold ${
                        task.status === 'COMPLETED'
                          ? 'cursor-not-allowed bg-slate-700 text-slate-400'
                          : 'bg-violet-600 text-white hover:bg-violet-500'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Tasdiqlash
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-xl border border-slate-700 bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-700 p-4">
              <h2 className="text-lg font-semibold text-white">Topshiriqni tasdiqlash</h2>
              <button
                type="button"
                onClick={closeConfirmModal}
                className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-4">
              <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-3 text-sm text-violet-100">
                <p className="font-semibold">{selectedTask.title}</p>
                <p className="mt-1 text-violet-200">
                  Tasdiqlashdan oldin bajarilgan ish bo&apos;yicha izoh yozing.
                </p>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm text-slate-300">
                  <MessageSquareText className="h-4 w-4 text-violet-300" />
                  Izoh *
                </label>
                <textarea
                  required
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Masalan: topshiriq bajarildi, hujjatlar tekshirildi..."
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
                />
              </div>
              <div className="rounded-lg border border-slate-600 bg-slate-900/40 p-3">
                <p className="mb-2 text-sm text-slate-300">
                  Fayl biriktirish (ixtiyoriy): JPG, PDF, Word, Excel
                </p>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-500 px-3 py-2 text-sm text-slate-200 hover:border-violet-500/70">
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Yuklanmoqda...' : 'Fayl tanlash'}
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx"
                    disabled={uploading}
                    onChange={(e) => {
                      void uploadFiles(e.target.files)
                      e.currentTarget.value = ''
                    }}
                    className="hidden"
                  />
                </label>
                {completionAttachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {completionAttachments.map((file, idx) => (
                      <div
                        key={`${file.url}-${idx}`}
                        className="flex items-center justify-between rounded border border-slate-700 bg-slate-900/50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-white">{file.name}</p>
                          <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCompletionAttachment(idx)}
                          className="rounded p-1 text-red-300 hover:bg-red-500/20"
                          title="Olib tashlash"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeConfirmModal}
                  className="h-10 rounded-lg border border-slate-600 px-4 text-sm text-slate-300 hover:bg-slate-700"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={completeTask}
                  disabled={confirming}
                  className="h-10 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
                >
                  {confirming ? 'Tasdiqlanmoqda...' : 'Ha, tasdiqlayman'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
