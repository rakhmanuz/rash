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
  Clock3
} from 'lucide-react'

export default function AssistantAdminDashboard() {
  const { data: session } = useSession()
  const [permissions, setPermissions] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [taskLoading, setTaskLoading] = useState(true)

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await fetch('/api/assistant-admin/permissions')
        if (response.ok) {
          setPermissions(await response.json())
        }
      } catch (error) {
        console.error('Error loading assistant permissions:', error)
      }
    }
    fetchPermissions()
  }, [])

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/assistant-admin/tasks')
        if (response.ok) {
          setTasks(await response.json())
        }
      } catch (error) {
        console.error('Error loading assistant tasks:', error)
      } finally {
        setTaskLoading(false)
      }
    }
    fetchTasks()
  }, [])

  const confirmTaskCompleted = async (taskId: string) => {
    try {
      const response = await fetch(`/api/assistant-admin/tasks/${taskId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (response.ok) {
        const updated = await response.json()
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)))
      } else {
        const error = await response.json().catch(() => ({}))
        if (error?.error) {
          alert(error.error)
        }
      }
    } catch (error) {
      console.error('Error confirming task:', error)
    }
  }

  const quickTasks = [
    { key: 'payments', title: 'To\'lovlar', href: '/assistant-admin/payments', desc: 'To\'lovlarni ko\'rish va boshqarish' },
    { key: 'students', title: 'Yangi o\'quvchilar', href: '/assistant-admin/students', desc: 'Yangi o\'quvchilar bilan ishlash' },
    { key: 'reports', title: 'Hisobotlar', href: '/assistant-admin/reports', desc: 'Kunlik va umumiy hisobotlar' },
    { key: 'schedules', title: 'Dars rejalari', href: '/assistant-admin/schedules', desc: 'Dars jadvali va rejalari' },
    { key: 'tests', title: 'Testlar', href: '/assistant-admin/tests', desc: 'Testlar bilan ishlash' },
  ].filter((item) => permissions?.[item.key]?.view)

  return (
    <DashboardLayout role="ASSISTANT_ADMIN">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl p-4 sm:p-6 text-white">
          <h1 className="text-xl sm:text-2xl font-bold text-center">
            {session?.user?.name || 'Yordamchi Admin'}
          </h1>
          <p className="text-center text-sm sm:text-base mt-2 text-green-100">
            Yordamchi Admin Paneli
          </p>
        </div>

        {/* Priority Task Board */}
        <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border-2 border-blue-500/40 shadow-lg shadow-blue-900/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-blue-400" />
              Muhim topshiriqlar
            </h2>
            <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300">
              Admindan topshiriq
            </span>
          </div>

          {taskLoading ? (
            <p className="text-sm text-gray-400">Topshiriqlar yuklanmoqda...</p>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-gray-400">Hozircha yangi topshiriq yo&apos;q.</p>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 10).map((task) => (
                <div key={task.id} className="rounded-lg border border-gray-700 bg-slate-900/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`font-medium ${task.status === 'COMPLETED' ? 'text-gray-400 line-through' : 'text-white'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-gray-400 mt-0.5">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>Admin: {task.assignedBy?.name || task.assignedBy?.username}</span>
                        {task.dueDate && (
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            Muddat: {new Date(task.dueDate).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => confirmTaskCompleted(task.id)}
                      disabled={task.status === 'COMPLETED'}
                      className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs ${
                        task.status === 'COMPLETED'
                          ? 'bg-emerald-700/50 text-emerald-100 cursor-not-allowed'
                          : 'bg-green-600/80 text-white hover:bg-green-600'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {task.status === 'COMPLETED' ? 'Tasdiqlangan' : 'Bajarildi'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {quickTasks.length === 0 ? (
            <div className="sm:col-span-2 bg-slate-800 rounded-xl p-6 border border-gray-700 text-center text-gray-400">
              Sizga hali biror bo&apos;lim uchun ruxsat berilmagan.
            </div>
          ) : (
            quickTasks.map((task) => (
              <Link
                key={task.key}
                href={task.href}
                className="bg-slate-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-colors group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                    <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">{task.title}</h3>
                    <p className="text-sm text-gray-400">{task.desc}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Info Card */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <BookOpen className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-blue-400 font-semibold mb-2">Qo'llanma</h3>
              <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
                <li>Admin bergan ruxsatlar asosida sizga bo&apos;limlar ochiladi.</li>
                <li>Ruxsat bo&apos;lmagan bo&apos;limlar menyuda ko&apos;rinmaydi va ochilmaydi.</li>
                <li>Keyingi bosqichda bosh sahifaga vazifalar ro&apos;yxatini qo&apos;shamiz.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
