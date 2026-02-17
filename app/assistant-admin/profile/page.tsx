'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { User, Save, X } from 'lucide-react'

interface UserProfile {
  id: string
  username: string
  name: string
  phone?: string
  role: string
}

export default function AssistantAdminProfilePage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/auth/user')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Parol o'zgartirish tekshiruvi
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          alert('Yangi parollar mos kelmayapti')
          setSaving(false)
          return
        }
        if (formData.newPassword.length < 6) {
          alert('Parol kamida 6 ta belgidan iborat bo\'lishi kerak')
          setSaving(false)
          return
        }
      }

      const updateData: any = {
        name: formData.name,
        phone: formData.phone || null,
      }

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }

      const response = await fetch('/api/assistant-admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        alert('Profil muvaffaqiyatli yangilandi!')
        setShowEditModal(false)
        fetchProfile()
        setFormData({
          name: formData.name,
          phone: formData.phone,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="ASSISTANT_ADMIN">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-[var(--border-default)] border-t-indigo-500 mx-auto"></div>
            <p className="mt-4 text-[var(--text-secondary)]">Yuklanmoqda...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="ASSISTANT_ADMIN">
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-primary)] mb-1">Profil</h1>
          <p className="text-sm text-[var(--text-secondary)]">Shaxsiy ma&apos;lumotlarni boshqarish</p>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-[14px] border border-[var(--border-subtle)] p-6 sm:p-8 assistant-card-shadow">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[var(--accent-muted)] flex items-center justify-center flex-shrink-0">
                <User className="h-10 w-10 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">{profile?.name || 'Yordamchi Admin'}</h2>
                <p className="text-sm text-[var(--text-muted)]">@{profile?.username}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Role: Assistant Admin</p>
              </div>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="h-11 px-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-[10px] transition-all hover:-translate-y-0.5 shadow-lg"
            >
              Tahrirlash
            </button>
          </div>

          <div className="space-y-4 border-t border-[var(--border-subtle)] pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Ism</p>
                <p className="text-[var(--text-primary)]">{profile?.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Login</p>
                <p className="text-[var(--text-primary)] font-mono">{profile?.username || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Telefon</p>
                <p className="text-[var(--text-primary)]">{profile?.phone || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Rol</p>
                <p className="text-[var(--text-primary)]">Yordamchi Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] rounded-[20px] border border-[var(--border-subtle)] assistant-elevated-shadow w-full max-w-md animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Profilni Tahrirlash</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-[10px] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Ism</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Joriy Parol (parolni o&apos;zgartirish uchun)</label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                  placeholder="Parolni o'zgartirmaslik uchun bo'sh qoldiring"
                />
              </div>
              {formData.currentPassword && (
                <>
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Yangi Parol</label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Yangi Parolni Tasdiqlash</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full h-11 px-4 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[10px] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 text-sm"
                      minLength={6}
                    />
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-[10px] transition-all"
                >
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 h-11 px-4 border border-[var(--border-default)] text-[var(--text-secondary)] font-medium rounded-[10px] hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  Bekor qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
