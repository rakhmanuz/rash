'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useEffect, useState } from 'react'
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  ListTodo,
  CheckCircle2,
  X,
  UserCog,
  Bell,
} from 'lucide-react'

const defaultAssistantPermissions = () => ({
  students: { view: false, create: false, edit: false, delete: false },
  schedules: { view: false, create: false, edit: false, delete: false },
  tests: { view: false, create: false, edit: false, delete: false },
  payments: { view: false, create: false, edit: false, delete: false },
  reports: { view: false, create: false, edit: false, delete: false },
})

export default function AssistengPage() {
  const [assistantAdmins, setAssistantAdmins] = useState<any[]>([])
  const [assistantTasks, setAssistantTasks] = useState<any[]>([])
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [taskSaving, setTaskSaving] = useState(false)

  const [adminForm, setAdminForm] = useState({
    username: '',
    name: '',
    password: '',
    phone: '',
    permissions: defaultAssistantPermissions(),
    isActive: true,
  })

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    assignedToIds: [] as string[],
  })

  useEffect(() => {
    fetchAssistantAdmins()
    fetchAssistantTasks()
  }, [])

  const fetchAssistantAdmins = async () => {
    try {
      const res = await fetch('/api/admin/assistant-admins')
      if (res.ok) {
        setAssistantAdmins(await res.json())
      }
    } catch (err) {
      console.error('Error fetching assistant admins:', err)
    }
  }

  const fetchAssistantTasks = async () => {
    try {
      const res = await fetch('/api/admin/assistant-tasks')
      if (res.ok) {
        setAssistantTasks(await res.json())
      }
    } catch (err) {
      console.error('Error fetching assistant tasks:', err)
    }
  }

  const setSimplePermission = (
    type: 'payments' | 'students' | 'reports' | 'schedules' | 'tests',
    enabled: boolean
  ) => {
    setAdminForm((prev) => {
      const key = type
      const current = (prev.permissions as any)[key] || {}
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [key]: {
            ...current,
            view: enabled,
            create: enabled ? true : current.create,
            edit: enabled ? true : current.edit,
            delete: enabled ? true : current.delete,
          },
        },
      }
    })
  }

  const handleOpenAdminModal = (admin?: any) => {
    if (admin) {
      setEditingAdmin(admin)
      const permissions = admin.assistantAdminProfile?.permissions
        ? JSON.parse(admin.assistantAdminProfile.permissions)
        : defaultAssistantPermissions()

      setAdminForm({
        username: admin.username,
        name: admin.name,
        password: '',
        phone: admin.phone || '',
        permissions: {
          ...defaultAssistantPermissions(),
          ...permissions,
          payments: { ...defaultAssistantPermissions().payments, ...(permissions?.payments || {}) },
          students: { ...defaultAssistantPermissions().students, ...(permissions?.students || {}) },
          reports: { ...defaultAssistantPermissions().reports, ...(permissions?.reports || {}) },
          schedules: { ...defaultAssistantPermissions().schedules, ...(permissions?.schedules || {}) },
          tests: { ...defaultAssistantPermissions().tests, ...(permissions?.tests || {}) },
        },
        isActive: admin.isActive,
      })
    } else {
      setEditingAdmin(null)
      setAdminForm({
        username: '',
        name: '',
        password: '',
        phone: '',
        permissions: defaultAssistantPermissions(),
        isActive: true,
      })
    }
    setShowAdminModal(true)
  }

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editingAdmin
        ? `/api/admin/assistant-admins/${editingAdmin.id}`
        : '/api/admin/assistant-admins'
      const method = editingAdmin ? 'PUT' : 'POST'
      const body = editingAdmin ? { ...adminForm, password: adminForm.password || undefined } : adminForm

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setShowAdminModal(false)
        fetchAssistantAdmins()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error saving admin:', error)
      alert('Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Yordamchi adminni o‘chirasizmi?')) return
    try {
      const response = await fetch(`/api/admin/assistant-admins/${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchAssistantAdmins()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error deleting admin:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setTaskSaving(true)
    try {
      const response = await fetch('/api/admin/assistant-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskForm,
          dueDate: taskForm.dueDate || null,
        }),
      })

      if (response.ok) {
        setTaskForm({
          title: '',
          description: '',
          dueDate: '',
          assignedToIds: [],
        })
        fetchAssistantTasks()
        const data = await response.json()
        if (data?.count) {
          alert(`${data.count} ta yordamchi adminga topshiriq yuborildi`)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Xatolik yuz berdi')
    } finally {
      setTaskSaving(false)
    }
  }

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

  const markCompletionSeen = async (taskId: string) => {
    try {
      const response = await fetch(`/api/admin/assistant-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionSeen: true }),
      })
      if (response.ok) {
        setAssistantTasks((prev) =>
          prev.map((task) => (task.id === taskId ? { ...task, completionSeen: true } : task))
        )
      }
    } catch (error) {
      console.error('Error marking completion seen:', error)
    }
  }

  const unreadCompletedTasks = assistantTasks.filter(
    (task) => task.status === 'COMPLETED' && !task.completionSeen
  )

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-xl p-4 sm:p-6 text-white">
          <h1 className="text-xl sm:text-2xl font-bold">Assisteng</h1>
          <p className="text-blue-100 text-sm mt-1">
            Yordamchi adminlarni boshqarish va topshiriq berish markazi
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="mb-5">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-blue-400" />
              Topshiriqlar
            </h2>
          </div>

          {unreadCompletedTasks.length > 0 && (
            <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 sm:p-4">
              <div className="mb-2 flex items-center gap-2 text-emerald-300">
                <Bell className="h-4 w-4" />
                <p className="text-sm font-semibold">
                  {unreadCompletedTasks.length} ta topshiriq bajarilgani haqida yangi xabar
                </p>
              </div>
              <div className="space-y-2">
                {unreadCompletedTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-3 rounded border border-emerald-400/20 bg-slate-900/30 px-3 py-2">
                    <div>
                      <p className="text-sm text-white">{task.title}</p>
                      <p className="text-xs text-emerald-200">
                        Bajarildi: {task.assignedTo?.name || task.assignedTo?.username}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => markCompletionSeen(task.id)}
                      className="rounded bg-emerald-600 px-2.5 py-1 text-xs text-white hover:bg-emerald-500"
                    >
                      Ko&apos;rdim
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-700/40 border border-gray-600 rounded-lg p-3 sm:p-4">
            <input
              type="text"
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Topshiriq nomi"
              className="w-full px-3 py-2 bg-slate-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="md:col-span-2 rounded-lg border border-gray-600 bg-slate-800 p-3">
              <p className="mb-2 text-sm font-medium text-gray-200">Yordamchi adminlar (galichka bilan tanlang)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {assistantAdmins
                  .filter((admin) => admin.isActive)
                  .map((admin) => (
                    <label
                      key={admin.id}
                      className="flex items-center gap-2 rounded border border-gray-700 bg-slate-900/40 px-3 py-2 text-sm text-gray-200 hover:border-blue-500/40"
                    >
                      <input
                        type="checkbox"
                        checked={taskForm.assignedToIds.includes(admin.id)}
                        onChange={() => toggleTaskReceiver(admin.id)}
                        className="h-4 w-4 rounded border-gray-500 bg-slate-800 text-blue-500 focus:ring-blue-500"
                      />
                      <span>{admin.name} ({admin.username})</span>
                    </label>
                  ))}
              </div>
              {taskForm.assignedToIds.length === 0 && (
                <p className="mt-2 text-xs text-amber-300">Kamida bitta yordamchi admin tanlang.</p>
              )}
            </div>
            <textarea
              value={taskForm.description}
              onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Tavsif (ixtiyoriy)"
              rows={3}
              className="md:col-span-2 w-full px-3 py-2 bg-slate-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <input
              type="datetime-local"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={taskSaving || taskForm.assignedToIds.length === 0}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {taskSaving ? 'Yuborilmoqda...' : 'Topshiriq berish'}
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {assistantTasks.length === 0 ? (
              <div className="text-sm text-gray-400 py-3">Hozircha topshiriqlar yo&apos;q.</div>
            ) : (
              assistantTasks.slice(0, 10).map((task) => (
                <div key={task.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-600 bg-slate-700/30 p-3">
                  <div>
                    <p className="text-white font-medium">{task.title}</p>
                    {task.description && <p className="text-sm text-gray-400 mt-0.5">{task.description}</p>}
                    <p className="text-xs text-gray-500 mt-1">Kimga: {task.assignedTo?.name || task.assignedTo?.username}</p>
                  </div>
                  <div className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
                    task.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {task.status === 'COMPLETED' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ListTodo className="h-3.5 w-3.5" />}
                    {task.status === 'COMPLETED' ? 'Bajarilgan' : 'Jarayonda'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-purple-400" />
                Yordamchi Adminlar
              </h2>
              <p className="text-sm sm:text-base text-gray-400">
                Yordamchi admin qo&apos;shish, tahrirlash va ruxsat berish.
              </p>
            </div>
            <button
              onClick={() => handleOpenAdminModal()}
              className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Yangi Admin</span>
            </button>
          </div>

          <div className="space-y-3">
            {assistantAdmins.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Hozircha yordamchi adminlar mavjud emas</p>
              </div>
            ) : (
              assistantAdmins.map((admin) => {
                const permissions = admin.assistantAdminProfile?.permissions
                  ? JSON.parse(admin.assistantAdminProfile.permissions)
                  : {}
                const activePermissions = Object.keys(permissions).filter(
                  (key) => permissions[key]?.view || permissions[key]?.create || permissions[key]?.edit || permissions[key]?.delete
                ).length

                return (
                  <div
                    key={admin.id}
                    className="bg-slate-700/50 rounded-lg p-4 border border-gray-600 hover:border-purple-500/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-semibold text-base sm:text-lg">
                            {admin.name}
                          </h3>
                          {admin.isActive ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                              Faol
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                              Nofaol
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mb-2">
                          Username: <span className="text-gray-300">{admin.username}</span>
                        </p>
                        <p className="text-gray-400 text-sm">
                          Ruxsatlar: <span className="text-purple-400 font-medium">{activePermissions} bo&apos;lim</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenAdminModal(admin)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                          title="O'chirish"
                        >
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-2xl my-4 sm:my-8 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
              <h2 className="text-base sm:text-lg font-semibold text-white flex items-center">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-400" />
                <span className="hidden sm:inline">{editingAdmin ? 'Yordamchi Adminni Tahrirlash' : 'Yangi Yordamchi Admin'}</span>
                <span className="sm:hidden">{editingAdmin ? 'Tahrirlash' : 'Yangi Admin'}</span>
              </h2>
              <button onClick={() => setShowAdminModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <form id="assisteng-admin-form" onSubmit={handleSaveAdmin} className="p-3 sm:p-4 space-y-4 sm:space-y-5">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                    <UserCog className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-400" />
                    Asosiy Ma&apos;lumotlar
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Username *</label>
                      <input
                        type="text"
                        required
                        value={adminForm.username}
                        onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Ism *</label>
                      <input
                        type="text"
                        required
                        value={adminForm.name}
                        onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Parol {!editingAdmin && '*'}</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required={!editingAdmin}
                          value={adminForm.password}
                          onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 pr-9 text-sm"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Telefon</label>
                      <input
                        type="tel"
                        value={adminForm.phone}
                        onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adminForm.isActive}
                          onChange={(e) => setAdminForm({ ...adminForm, isActive: e.target.checked })}
                          className="w-4 h-4 text-purple-600 bg-slate-700 border-gray-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-xs sm:text-sm font-medium text-gray-300">Faol</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-400" />
                    Ruxsatlar
                  </h3>
                  <div className="bg-slate-700/50 rounded-lg p-3 sm:p-4 space-y-3">
                    {[
                      { key: 'payments', label: "To'lovlar", desc: "To'lovlar bo'limiga ruxsat" },
                      { key: 'students', label: "Yangi o'quvchilar", desc: "O'quvchilar bo'limiga ruxsat" },
                      { key: 'reports', label: 'Hisobotlar', desc: "Hisobotlar bo'limiga ruxsat" },
                      { key: 'schedules', label: 'Dars rejalari', desc: "Dars rejalari bo'limiga ruxsat" },
                      { key: 'tests', label: 'Testlar', desc: "Testlar bo'limiga ruxsat" },
                    ].map((perm) => (
                      <label key={perm.key} className="flex items-center justify-between gap-3 rounded-lg border border-gray-600 p-3 hover:bg-slate-600/40 transition-colors cursor-pointer">
                        <div>
                          <p className="text-sm sm:text-base text-white font-medium">{perm.label}</p>
                          <p className="text-xs text-gray-400">{perm.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean((adminForm.permissions as any)?.[perm.key]?.view)}
                          onChange={(e) => setSimplePermission(perm.key as any, e.target.checked)}
                          className="w-4 h-4 text-purple-600 bg-slate-700 border-gray-600 rounded focus:ring-purple-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 border-t border-gray-700 flex-shrink-0 bg-slate-800">
              <button
                type="submit"
                form="assisteng-admin-form"
                disabled={loading}
                className="flex-1 px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Saqlanmoqda...' : 'Saqlash'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="flex-1 px-3 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm sm:text-base"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
