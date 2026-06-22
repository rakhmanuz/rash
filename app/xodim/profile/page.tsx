'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { User, Save } from 'lucide-react'
import { employeeTypeLabel } from '@/lib/employee-types'

type XodimProfile = {
  id: string
  username: string
  name: string
  phone?: string | null
  employeeType?: string | null
  role: string
}

export default function XodimProfilePage() {
  const [profile, setProfile] = useState<XodimProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/xodim/profile')
        if (response.ok) {
          const data = await response.json()
          setProfile(data)
          setFormData((prev) => ({
            ...prev,
            name: data.name || '',
            phone: data.phone || '',
          }))
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (formData.newPassword) {
        if (!formData.currentPassword) {
          alert('Yangi parol uchun joriy parolni kiriting')
          setSaving(false)
          return
        }
        if (formData.newPassword !== formData.confirmPassword) {
          alert('Yangi parollar mos kelmadi')
          setSaving(false)
          return
        }
      }

      const response = await fetch('/api/xodim/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error?.error || 'Xatolik yuz berdi')
        return
      }

      const updated = await response.json()
      setProfile(updated)
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
      alert('Profil yangilandi')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="XODIM">
        <div className="flex min-h-[360px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-violet-400" />
            <p className="mt-3 text-sm text-slate-400">Yuklanmoqda...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="XODIM">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-full bg-violet-500/15 p-3">
              <User className="h-6 w-6 text-violet-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Profil</h1>
              <p className="text-sm text-slate-400">Shaxsiy ma&apos;lumotlar</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSave}>
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">Ism</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="h-11 w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-slate-300">Login</label>
              <input
                type="text"
                disabled
                value={profile?.username || ''}
                className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 text-slate-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-slate-300">Telefon</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className="h-11 w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-slate-300">Xodim turi</label>
              <input
                type="text"
                disabled
                value={employeeTypeLabel(profile?.employeeType)}
                className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 text-slate-400"
              />
            </div>

            <div className="border-t border-slate-700 pt-4">
              <p className="mb-3 text-sm font-medium text-slate-200">Parolni yangilash (ixtiyoriy)</p>
              <div className="space-y-3">
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  placeholder="Joriy parol"
                  className="h-11 w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 text-white outline-none focus:border-violet-500"
                />
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Yangi parol"
                  className="h-11 w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 text-white outline-none focus:border-violet-500"
                />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  placeholder="Yangi parolni tasdiqlang"
                  className="h-11 w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 text-white outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-violet-600 px-5 font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
