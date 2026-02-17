'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  UserPlus, 
  BookOpen,
  ListTodo,
  CheckCircle2,
  Clock3,
  Users,
  GraduationCap,
  ClipboardCheck,
  Wallet,
  ChevronRight
} from 'lucide-react'

export default function AssistantAdminDashboard() {
  const { data: session } = useSession()
  const [permissions, setPermissions] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [taskLoading, setTaskLoading] = useState(true)
  const [stats, setStats] = useState({ students: 0, groups: 0 })

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await fetch('/api/assistant-admin/permissions')
        if (res.ok) setPermissions(await res.json())
      } catch (e) {
        console.error(e)
      }
    }
    fetchPermissions()
  }, [])

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/assistant-admin/tasks')
        if (res.ok) setTasks(await res.json())
      } catch (e) {
        console.error(e)
      } finally {
        setTaskLoading(false)
      }
    }
    fetchTasks()
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (permissions?.students?.view) {
          const s = await fetch('/api/assistant-admin/students')
          if (s.ok) {
            const data = await s.json()
            setStats((prev) => ({ ...prev, students: Array.isArray(data) ? data.length : 0 }))
          }
        }
        if (permissions?.groups?.view) {
          const g = await fetch('/api/assistant-admin/groups')
          if (g.ok) {
            const data = await g.json()
            setStats((prev) => ({ ...prev, groups: Array.isArray(data) ? data.filter((x: any) => x.isActive !== false).length : 0 }))
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchStats()
  }, [permissions])

  const confirmTaskCompleted = async (taskId: string) => {
    try {
      const res = await fetch(`/api/assistant-admin/tasks/${taskId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        const updated = await res.json()
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)))
      } else {
        const err = await res.json().catch(() => ({}))
        if (err?.error) alert(err.error)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const quickTasks = [
    { key: 'students', title: "Yangi o'quvchi", href: '/assistant-admin/students', desc: "O'quvchi qo'shish", icon: UserPlus },
    { key: 'payments', title: "To'lovlar", href: '/assistant-admin/payments', desc: "To'lovlarni boshqarish", icon: Wallet },
    { key: 'groups', title: 'Guruhlar', href: '/assistant-admin/groups', desc: "Guruhlar ro'yxati", icon: GraduationCap },
    { key: 'schedules', title: 'Dars rejalari', href: '/assistant-admin/schedules', desc: 'Jadval', icon: ClipboardCheck },
    { key: 'tests', title: 'Testlar', href: '/assistant-admin/tests', desc: 'Testlar', icon: BookOpen },
    { key: 'reports', title: 'Hisobotlar', href: '/assistant-admin/reports', desc: 'Hisobotlar', icon: ListTodo },
  ].filter((item) => permissions?.[item.key]?.view)

  const today = new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <DashboardLayout role="ASSISTANT_ADMIN">
      <div className="space-y-8 animate-fade-in-up">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Assalomu alaykum, {session?.user?.name || 'Yordamchi Admin'}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{today}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-6 assistant-card-shadow hover:border-[var(--border-hover)] hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-[var(--radius-md)] bg-indigo-500/12">
                <Users className="h-5 w-5 text-indigo-400" />
              </div>
              <span className="text-xs text-[var(--text-muted)]">Jami</span>
            </div>
            <p className="text-[28px] font-bold text-[var(--text-primary)] mt-4">{stats.students}</p>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">O'quvchilar</p>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-6 assistant-card-shadow hover:border-[var(--border-hover)] hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-[var(--radius-md)] bg-emerald-500/12">
                <GraduationCap className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-xs text-[var(--text-muted)]">Faol</span>
            </div>
            <p className="text-[28px] font-bold text-[var(--text-primary)] mt-4">{stats.groups}</p>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Guruhlar</p>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-6 assistant-card-shadow hover:border-[var(--border-hover)] hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-[var(--radius-md)] bg-amber-500/12">
                <ClipboardCheck className="h-5 w-5 text-amber-400" />
              </div>
              <span className="text-xs text-[var(--text-muted)]">Bugun</span>
            </div>
            <p className="text-[28px] font-bold text-[var(--text-primary)] mt-4">—</p>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Davomat</p>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-6 assistant-card-shadow hover:border-[var(--border-hover)] hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-[var(--radius-md)] bg-cyan-500/12">
                <Wallet className="h-5 w-5 text-cyan-400" />
              </div>
              <span className="text-xs text-[var(--text-muted)]">Oylik</span>
            </div>
            <p className="text-[28px] font-bold text-[var(--text-primary)] mt-4">—</p>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Tushumlar</p>
          </div>
        </div>

        {/* Muhim topshiriqlar */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-6 assistant-card-shadow">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-indigo-400" />
              Muhim topshiriqlar
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-[var(--radius-sm)] bg-indigo-500/12 text-indigo-400 font-medium">
              Admindan topshiriq
            </span>
          </div>

          {taskLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 skeleton-shimmer rounded-[var(--radius-md)]" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <ListTodo className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-3 opacity-50" />
              <p className="text-sm text-[var(--text-muted)]">Hozircha yangi topshiriq yo'q</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 10).map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between gap-4 p-4 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium text-[14px] ${task.status === 'COMPLETED' ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-[var(--text-muted)] mt-0.5">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--text-muted)]">
                      <span>Admin: {task.assignedBy?.name || task.assignedBy?.username || '—'}</span>
                      {task.dueDate && (
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {new Date(task.dueDate).toLocaleDateString('uz-UZ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => confirmTaskCompleted(task.id)}
                    disabled={task.status === 'COMPLETED'}
                    className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-2 text-xs font-medium min-h-[40px] ${
                      task.status === 'COMPLETED'
                        ? 'bg-emerald-500/15 text-emerald-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {task.status === 'COMPLETED' ? 'Bajarildi' : 'Bajarildi'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tezkor harakatlar */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Tezkor harakatlar</h2>
          {quickTasks.length === 0 ? (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-12 text-center">
              <UserPlus className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-3 opacity-50" />
              <p className="text-sm text-[var(--text-muted)]">Sizga hali biror bo'lim uchun ruxsat berilmagan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickTasks.map((task, i) => {
                const TaskIcon = task.icon
                return (
                  <Link
                    key={task.key}
                    href={task.href}
                    className="group flex items-center gap-4 p-5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] assistant-card-shadow hover:border-indigo-500/30 hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="p-3 rounded-[var(--radius-md)] bg-indigo-500/12 group-hover:bg-indigo-500/20 transition-colors">
                      <TaskIcon className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--text-primary)]">{task.title}</h3>
                      <p className="text-sm text-[var(--text-muted)] truncate">{task.desc}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[var(--text-muted)] group-hover:text-indigo-400 flex-shrink-0 transition-colors" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Qo'llanma */}
        <div className="bg-indigo-500/8 border border-indigo-500/20 rounded-[var(--radius-lg)] p-6">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-[var(--radius-md)] bg-indigo-500/15">
              <BookOpen className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-indigo-400 mb-2">Qo'llanma</h3>
              <ul className="text-sm text-[var(--text-secondary)] space-y-2 list-disc list-inside">
                <li>Admin bergan ruxsatlar asosida sizga bo'limlar ochiladi.</li>
                <li>Ruxsat bo'lmagan bo'limlar menyuda ko'rinmaydi.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
