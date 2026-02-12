'use client'

import { useEffect, useState } from 'react'

type AdminRole = 'ADMIN' | 'MANAGER' | 'ASSISTANT_ADMIN'
type PermissionAction = 'view' | 'create' | 'edit' | 'delete'
type PermissionSection = 'students' | 'teachers' | 'groups' | 'schedules' | 'tests' | 'payments' | 'market' | 'reports'

type SectionPermission = Partial<Record<PermissionAction, boolean>>
type PermissionsState = Record<PermissionSection, SectionPermission>

type AdminItem = {
  id: string
  username: string
  name: string
  role: AdminRole
  phone?: string | null
  isActive: boolean
  assignment?: string
  permissions?: PermissionsState
}

const roles: AdminRole[] = ['ADMIN', 'MANAGER', 'ASSISTANT_ADMIN']
const permissionSections: PermissionSection[] = ['students', 'teachers', 'groups', 'schedules', 'tests', 'payments', 'market', 'reports']
const permissionActions: PermissionAction[] = ['view', 'create', 'edit', 'delete']

function buildDefaultPermissions(): PermissionsState {
  return {
    students: { view: false, create: false, edit: false, delete: false },
    teachers: { view: false, create: false, edit: false, delete: false },
    groups: { view: false, create: false, edit: false, delete: false },
    schedules: { view: false, create: false, edit: false, delete: false },
    tests: { view: false, create: false, edit: false, delete: false },
    payments: { view: true, create: true, edit: false, delete: false },
    market: { view: false, create: false, edit: false, delete: false },
    reports: { view: false },
  }
}

function getSectionLabel(section: PermissionSection) {
  const map: Record<PermissionSection, string> = {
    students: "O'quvchilar",
    teachers: "O'qituvchilar",
    groups: 'Guruhlar',
    schedules: 'Dars Rejasi',
    tests: 'Testlar',
    payments: "To'lovlar (rash.com.uz)",
    market: 'Market',
    reports: 'Hisobotlar',
  }
  return map[section]
}

export default function HQAdminsPage() {
  const [admins, setAdmins] = useState<AdminItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<AdminItem | null>(null)
  const [permissionsDraft, setPermissionsDraft] = useState<PermissionsState>(buildDefaultPermissions())
  const [form, setForm] = useState({
    username: '',
    name: '',
    password: '',
    role: 'ASSISTANT_ADMIN' as AdminRole,
    phone: '',
    assignment: '',
    permissions: buildDefaultPermissions() as PermissionsState,
  })

  async function loadAdmins() {
    setLoading(true)
    try {
      const res = await fetch('/api/hq/admins')
      if (!res.ok) throw new Error('Yuklab bo‘lmadi')
      const data = await res.json()
      setAdmins(data)
    } catch (e) {
      console.error(e)
      alert('Adminlar ro‘yxatini yuklab bo‘lmadi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdmins()
  }, [])

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/hq/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Xatolik')
      setForm({
        username: '',
        name: '',
        password: '',
        role: 'ASSISTANT_ADMIN',
        phone: '',
        assignment: '',
        permissions: buildDefaultPermissions(),
      })
      await loadAdmins()
    } catch (e: any) {
      alert(e?.message || 'Yaratib bo‘lmadi')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(item: AdminItem) {
    try {
      const res = await fetch(`/api/hq/admins/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Yangilab bo‘lmadi')
      await loadAdmins()
    } catch (e: any) {
      alert(e?.message || 'Xatolik')
    }
  }

  async function updateAssignment(item: AdminItem) {
    const newAssignment = window.prompt('Yangi vazifa matnini kiriting', item.assignment || '')
    if (newAssignment === null) return
    try {
      const res = await fetch(`/api/hq/admins/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment: newAssignment }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Yangilab bo‘lmadi')
      await loadAdmins()
    } catch (e: any) {
      alert(e?.message || 'Xatolik')
    }
  }

  function openPermissionsModal(item: AdminItem) {
    setEditingAdmin(item)
    setPermissionsDraft(item.permissions || buildDefaultPermissions())
    setPermissionsModalOpen(true)
  }

  function togglePermission(section: PermissionSection, action: PermissionAction) {
    // reports section only supports view in existing schema
    if (section === 'reports' && action !== 'view') return

    setPermissionsDraft((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [action]: !(prev[section] || {})[action],
      },
    }))
  }

  async function savePermissions() {
    if (!editingAdmin) return

    setSaving(true)
    try {
      const res = await fetch(`/api/hq/admins/${editingAdmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: permissionsDraft }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Saqlab bo‘lmadi')
      setPermissionsModalOpen(false)
      setEditingAdmin(null)
      await loadAdmins()
    } catch (e: any) {
      alert(e?.message || 'Xatolik')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-500/30 bg-[#06153a] p-6">
        <h1 className="text-2xl font-bold text-blue-50">Adminlar boshqaruvi</h1>
        <p className="mt-2 text-sm text-blue-100/80">
          Siz bu yerdan adminlarni tayinlaysiz va ular bajaradigan vazifalarni biriktirasiz.
        </p>
      </div>

      <form onSubmit={createAdmin} className="rounded-2xl border border-blue-500/25 bg-[#07173f] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-blue-50">Yangi admin qo‘shish</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            required
            placeholder="Username"
            className="rounded-lg border border-blue-900/60 bg-[#020b23] px-3 py-2"
            value={form.username}
            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
          />
          <input
            required
            placeholder="To‘liq ism"
            className="rounded-lg border border-blue-900/60 bg-[#020b23] px-3 py-2"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            required
            placeholder="Parol"
            type="password"
            className="rounded-lg border border-blue-900/60 bg-[#020b23] px-3 py-2"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          />
          <select
            className="rounded-lg border border-blue-900/60 bg-[#020b23] px-3 py-2"
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as AdminRole }))}
          >
            {roles.map((role) => (
              <option value={role} key={role}>
                {role}
              </option>
            ))}
          </select>
          <input
            placeholder="Telefon"
            className="rounded-lg border border-blue-900/60 bg-[#020b23] px-3 py-2"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />
          <input
            placeholder="Biriktirilgan vazifa"
            className="rounded-lg border border-blue-900/60 bg-[#020b23] px-3 py-2"
            value={form.assignment}
            onChange={(e) => setForm((p) => ({ ...p, assignment: e.target.value }))}
          />
        </div>
        <button
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
          type="submit"
        >
          {saving ? 'Saqlanmoqda...' : 'Admin yaratish'}
        </button>
      </form>

      <div className="rounded-2xl border border-blue-500/25 bg-[#07173f] p-6">
        <h2 className="text-lg font-semibold text-blue-50">Mavjud adminlar</h2>
        {loading ? (
          <p className="mt-4 text-blue-200/70">Yuklanmoqda...</p>
        ) : admins.length === 0 ? (
          <p className="mt-4 text-blue-200/70">Hozircha adminlar yo‘q</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-blue-900/60 text-left">
                  <th className="py-2 pr-4">Ism</th>
                  <th className="py-2 pr-4">Username</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Vazifa</th>
                  <th className="py-2 pr-4">Ruxsat</th>
                  <th className="py-2 pr-4">Holat</th>
                  <th className="py-2">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((item) => (
                  <tr key={item.id} className="border-b border-blue-950/80">
                    <td className="py-3 pr-4">{item.name}</td>
                    <td className="py-3 pr-4">{item.username}</td>
                    <td className="py-3 pr-4">{item.role}</td>
                    <td className="py-3 pr-4">{item.assignment || '-'}</td>
                    <td className="py-3 pr-4">
                      {item.permissions ? (
                        <span className="rounded bg-indigo-500/20 px-2 py-1 text-indigo-200">
                          {permissionSections.filter((section) => item.permissions?.[section]?.view).length} bo‘lim
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {item.isActive ? (
                        <span className="rounded bg-blue-500/20 px-2 py-1 text-blue-200">Faol</span>
                      ) : (
                        <span className="rounded bg-red-500/20 px-2 py-1 text-red-200">Nofaol</span>
                      )}
                    </td>
                    <td className="py-3 space-x-2">
                      <button
                        onClick={() => toggleActive(item)}
                        className="rounded border border-blue-900/60 px-2 py-1 hover:bg-blue-900/40"
                      >
                        {item.isActive ? 'To‘xtatish' : 'Faollashtirish'}
                      </button>
                      <button
                        onClick={() => updateAssignment(item)}
                        className="rounded border border-blue-900/60 px-2 py-1 hover:bg-blue-900/40"
                      >
                        Vazifa
                      </button>
                      {item.role === 'ASSISTANT_ADMIN' && (
                        <button
                          onClick={() => openPermissionsModal(item)}
                          className="rounded border border-indigo-700/70 px-2 py-1 hover:bg-indigo-900/40"
                        >
                          Ruxsat
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {permissionsModalOpen && editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-blue-500/30 bg-[#06153a] p-6">
            <h3 className="text-xl font-semibold text-blue-50">
              Ruxsatlarni sozlash: {editingAdmin.name}
            </h3>
            <p className="mt-2 text-sm text-blue-100/75">
              `rash.com.uz`da assistant-admin faqat quyidagi ruxsatlar asosida ishlaydi. Ayniqsa `payments.view` va `payments.create` to‘lov oqimini boshqaradi.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-blue-900/60 text-left">
                    <th className="py-2 pr-4">Bo‘lim</th>
                    {permissionActions.map((action) => (
                      <th key={action} className="py-2 pr-4 capitalize">
                        {action}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissionSections.map((section) => (
                    <tr key={section} className="border-b border-blue-950/80">
                      <td className="py-3 pr-4 font-medium">{getSectionLabel(section)}</td>
                      {permissionActions.map((action) => {
                        const disabled = section === 'reports' && action !== 'view'
                        const checked = Boolean(permissionsDraft[section]?.[action])
                        return (
                          <td key={`${section}-${action}`} className="py-3 pr-4">
                            <input
                              type="checkbox"
                              disabled={disabled}
                              checked={checked}
                              onChange={() => togglePermission(section, action)}
                              className="h-4 w-4"
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={savePermissions}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
              <button
                onClick={() => {
                  setPermissionsModalOpen(false)
                  setEditingAdmin(null)
                }}
                className="rounded-lg border border-blue-900/60 px-4 py-2 text-blue-100 hover:bg-blue-900/40"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
