'use client'

import { useEffect, useState } from 'react'

type AdminRole = 'ADMIN' | 'MANAGER' | 'ASSISTANT_ADMIN'

type AdminItem = {
  id: string
  username: string
  name: string
  role: AdminRole
  phone?: string | null
  isActive: boolean
  assignment?: string
}

const roles: AdminRole[] = ['ADMIN', 'MANAGER', 'ASSISTANT_ADMIN']

export default function HQAdminsPage() {
  const [admins, setAdmins] = useState<AdminItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    username: '',
    name: '',
    password: '',
    role: 'ASSISTANT_ADMIN' as AdminRole,
    phone: '',
    assignment: '',
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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold">Adminlar boshqaruvi</h1>
        <p className="mt-2 text-sm text-slate-300">
          Siz bu yerdan adminlarni tayinlaysiz va ular bajaradigan vazifalarni biriktirasiz.
        </p>
      </div>

      <form onSubmit={createAdmin} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Yangi admin qo‘shish</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            required
            placeholder="Username"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={form.username}
            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
          />
          <input
            required
            placeholder="To‘liq ism"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            required
            placeholder="Parol"
            type="password"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          />
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
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
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />
          <input
            placeholder="Biriktirilgan vazifa"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={form.assignment}
            onChange={(e) => setForm((p) => ({ ...p, assignment: e.target.value }))}
          />
        </div>
        <button
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
          type="submit"
        >
          {saving ? 'Saqlanmoqda...' : 'Admin yaratish'}
        </button>
      </form>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold">Mavjud adminlar</h2>
        {loading ? (
          <p className="mt-4 text-slate-400">Yuklanmoqda...</p>
        ) : admins.length === 0 ? (
          <p className="mt-4 text-slate-400">Hozircha adminlar yo‘q</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="py-2 pr-4">Ism</th>
                  <th className="py-2 pr-4">Username</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Vazifa</th>
                  <th className="py-2 pr-4">Holat</th>
                  <th className="py-2">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((item) => (
                  <tr key={item.id} className="border-b border-slate-900">
                    <td className="py-3 pr-4">{item.name}</td>
                    <td className="py-3 pr-4">{item.username}</td>
                    <td className="py-3 pr-4">{item.role}</td>
                    <td className="py-3 pr-4">{item.assignment || '-'}</td>
                    <td className="py-3 pr-4">
                      {item.isActive ? (
                        <span className="rounded bg-emerald-500/20 px-2 py-1 text-emerald-300">Faol</span>
                      ) : (
                        <span className="rounded bg-red-500/20 px-2 py-1 text-red-300">Nofaol</span>
                      )}
                    </td>
                    <td className="py-3 space-x-2">
                      <button
                        onClick={() => toggleActive(item)}
                        className="rounded border border-slate-700 px-2 py-1 hover:bg-slate-800"
                      >
                        {item.isActive ? 'To‘xtatish' : 'Faollashtirish'}
                      </button>
                      <button
                        onClick={() => updateAssignment(item)}
                        className="rounded border border-slate-700 px-2 py-1 hover:bg-slate-800"
                      >
                        Vazifa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
