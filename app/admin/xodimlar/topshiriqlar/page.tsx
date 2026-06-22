'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ArrowLeft, Bell, ListTodo, Paperclip, Trash2, Upload, X as XIcon } from 'lucide-react'

type Employee = {
  id: string
  username: string
  name: string
  isActive: boolean
}

type XodimTask = {
  id: string
  title: string
  description?: string | null
  status: 'PENDING' | 'COMPLETED'
  dueDate?: string | null
  completionSeen: boolean
  assignedTo?: {
    id: string
    name: string
    username: string
  } | null
  attachments?: TaskAttachment[]
}

type TaskAttachment = {
  url: string
  name: string
  type: string
  size: number
  source?: 'ADMIN' | 'XODIM'
}

export default function XodimlarTopshiriqlariPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [tasks, setTasks] = useState<XodimTask[]>([])
  const [taskLoading, setTaskLoading] = useState(false)
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    assignedToIds: [] as string[],
    attachments: [] as TaskAttachment[],
  })
  const [uploading, setUploading] = useState(false)

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/admin/xodimlar')
      if (response.ok) {
        const all = (await response.json()) as Employee[]
        setEmployees(all.filter((x) => x.isActive))
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/admin/xodim-tasks')
      if (response.ok) {
        setTasks(await response.json())
      }
    } catch (error) {
      console.error('Error fetching xodim tasks:', error)
    }
  }

  useEffect(() => {
    fetchEmployees()
    fetchTasks()
  }, [])

  const toggleTaskReceiver = (userId: string) => {
    setTaskForm((prev) => {
      const exists = prev.assignedToIds.includes(userId)
      return {
        ...prev,
        assignedToIds: exists
          ? prev.assignedToIds.filter((id) => id !== userId)
          : [...prev.assignedToIds, userId],
      }
    })
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setTaskLoading(true)
    try {
      const response = await fetch('/api/admin/xodim-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskForm,
          dueDate: taskForm.dueDate || null,
        }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        alert(err?.error || 'Xatolik yuz berdi')
        return
      }

      setTaskForm({
        title: '',
        description: '',
        dueDate: '',
        assignedToIds: [],
        attachments: [],
      })
      await fetchTasks()
    } catch (error) {
      console.error('Error creating xodim task:', error)
      alert('Xatolik yuz berdi')
    } finally {
      setTaskLoading(false)
    }
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
      const uploaded: TaskAttachment[] = []
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: fd,
        })
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
        setTaskForm((prev) => ({
          ...prev,
          attachments: [...prev.attachments, ...uploaded],
        }))
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Fayl yuklashda xatolik yuz berdi')
    } finally {
      setUploading(false)
    }
  }

  const removeAttachment = (index: number) => {
    setTaskForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, idx) => idx !== index),
    }))
  }

  const markCompletionSeen = async (taskId: string) => {
    try {
      const response = await fetch(`/api/admin/xodim-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionSeen: true }),
      })
      if (!response.ok) return
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, completionSeen: true } : task))
      )
    } catch (error) {
      console.error('Error marking completion seen:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Topshiriqni o‘chirasizmi?')) return
    try {
      const response = await fetch(`/api/admin/xodim-tasks/${taskId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        alert(err?.error || 'Xatolik yuz berdi')
        return
      }
      await fetchTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const unreadCompletedTasks = tasks.filter((t) => t.status === 'COMPLETED' && !t.completionSeen)

  return (
    <DashboardLayout role="ADMIN">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Link
              href="/admin/xodimlar"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-600 bg-slate-900/50 px-3 text-sm text-slate-200 transition-colors hover:border-violet-500/60 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Orqaga
            </Link>
            <span className="rounded-md bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-300">
              Xodimlar / Topshiriqlar
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">Xodim topshiriqlari</h1>
          <p className="mt-1 text-sm text-gray-400">
            Topshiriq berish, bajarilgan topshiriqlarni izoh bilan tekshirish va nazorat qilish.
          </p>
        </div>

        <div className="rounded-xl border border-gray-700 bg-slate-800/80 p-4 sm:p-6">
          {unreadCompletedTasks.length > 0 && (
            <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 sm:p-4">
              <div className="mb-2 flex items-center gap-2 text-emerald-300">
                <Bell className="h-4 w-4" />
                <p className="text-sm font-semibold">
                  {unreadCompletedTasks.length} ta yangi tasdiqlangan topshiriq
                </p>
              </div>
              <div className="space-y-2">
                {unreadCompletedTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="rounded border border-emerald-400/20 bg-slate-900/30 p-3"
                  >
                    <p className="text-sm font-medium text-white">{task.title}</p>
                    <p className="text-xs text-emerald-200">
                      Xodim: {task.assignedTo?.name || task.assignedTo?.username}
                    </p>
                    {task.description && (
                      <p className="mt-1 whitespace-pre-line text-xs text-slate-300">
                        {task.description}
                      </p>
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
                            <span className={`rounded px-1 py-0.5 text-[10px] ${file.source === 'XODIM' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-violet-500/20 text-violet-300'}`}>
                              {file.source === 'XODIM' ? 'Xodim' : 'Admin'}
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => markCompletionSeen(task.id)}
                      className="mt-2 rounded bg-emerald-600 px-2.5 py-1 text-xs text-white hover:bg-emerald-500"
                    >
                      Ko&apos;rdim
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={handleCreateTask}
            className="mb-5 grid grid-cols-1 gap-3 rounded-lg border border-slate-600 bg-slate-700/30 p-3 sm:p-4 md:grid-cols-2"
          >
            <input
              type="text"
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Topshiriq nomi"
              className="h-10 w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 text-white outline-none focus:border-violet-500"
            />
            <input
              type="datetime-local"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 text-white outline-none focus:border-violet-500"
            />
            <textarea
              rows={3}
              value={taskForm.description}
              onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Tavsif (ixtiyoriy)"
              className="md:col-span-2 w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-white outline-none focus:border-violet-500"
            />
            <div className="md:col-span-2 rounded-lg border border-slate-600 bg-slate-900/40 p-3">
              <p className="mb-2 text-sm text-slate-300">Fayl biriktirish (JPG, PDF, Word, Excel)</p>
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
              {taskForm.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {taskForm.attachments.map((file, idx) => (
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
                        onClick={() => removeAttachment(idx)}
                        className="rounded p-1 text-red-300 hover:bg-red-500/20"
                        title="Olib tashlash"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="md:col-span-2 rounded-lg border border-slate-600 bg-slate-900/40 p-3">
              <p className="mb-2 text-sm text-slate-300">Xodimlarni tanlang:</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {employees.map((employee) => (
                  <label
                    key={employee.id}
                    className="flex items-center gap-2 rounded border border-slate-700 bg-slate-900/30 px-3 py-2 text-sm text-slate-200"
                  >
                    <input
                      type="checkbox"
                      checked={taskForm.assignedToIds.includes(employee.id)}
                      onChange={() => toggleTaskReceiver(employee.id)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-violet-500 focus:ring-violet-500"
                    />
                    <span>
                      {employee.name} (@{employee.username})
                    </span>
                  </label>
                ))}
              </div>
              {taskForm.assignedToIds.length === 0 && (
                <p className="mt-2 text-xs text-amber-300">Kamida bitta xodim tanlang.</p>
              )}
            </div>
            <button
              type="submit"
              disabled={taskLoading || taskForm.assignedToIds.length === 0}
              className="md:col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-60"
            >
              <ListTodo className="h-4 w-4" />
              {taskLoading ? 'Yuborilmoqda...' : 'Topshiriq berish'}
            </button>
          </form>

          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-6 text-sm text-gray-400">
                Hozircha topshiriqlar yo&apos;q.
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="rounded-lg border border-slate-700 bg-slate-900/30 p-3">
                  <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-medium text-white">{task.title}</p>
                      <p className="text-xs text-slate-400">
                        Kimga: {task.assignedTo?.name || task.assignedTo?.username}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {task.status === 'COMPLETED' ? 'Bajarilgan' : 'Jarayonda'}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        className="rounded bg-red-500/20 p-1.5 text-red-300 hover:bg-red-500/30"
                        title="Topshiriqni o'chirish"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {task.description && (
                    <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{task.description}</p>
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
                          <span className={`rounded px-1 py-0.5 text-[10px] ${file.source === 'XODIM' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-violet-500/20 text-violet-300'}`}>
                            {file.source === 'XODIM' ? 'Xodim' : 'Admin'}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                  {task.dueDate && (
                    <p className="mt-1 text-xs text-slate-500">
                      Muddat: {new Date(task.dueDate).toLocaleString('uz-UZ')}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
