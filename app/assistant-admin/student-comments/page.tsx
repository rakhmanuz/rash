'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  MessageSquare,
  Send,
  User,
  Loader2,
  BookOpen,
} from 'lucide-react'

interface Student {
  id: string
  studentId: string
  user: { id: string; name: string; username: string; phone?: string }
  currentGroupName?: string
}

interface Comment {
  id: string
  content: string
  createdAt: string
  author: { id: string; name: string; username: string }
}

export default function StudentCommentsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [permissions, setPermissions] = useState<any>(null)
  const [permissionsLoading, setPermissionsLoading] = useState(true)
  const [permissionsError, setPermissionsError] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Student[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchPermissions = useCallback(async () => {
    setPermissionsError(false)
    setPermissionsLoading(true)
    try {
      const res = await fetch('/api/assistant-admin/permissions')
      if (res.ok) {
        const data = await res.json()
        setPermissions(data)
      } else {
        setPermissions(null)
        setPermissionsError(true)
      }
    } catch {
      setPermissions(null)
      setPermissionsError(true)
    } finally {
      setPermissionsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  useEffect(() => {
    if (permissionsLoading || permissionsError) return
    if (permissions !== null && !permissions?.studentComments?.view) {
      router.replace('/assistant-admin/dashboard')
    }
  }, [permissionsLoading, permissionsError, permissions, router])

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(
        `/api/assistant-admin/students?search=${encodeURIComponent(q.trim())}`
      )
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data)
      } else {
        setSearchResults([])
      }
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      runSearch(searchQuery)
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery, runSearch])

  useEffect(() => {
    if (!selectedStudent) {
      setComments([])
      return
    }
    setCommentsLoading(true)
    fetch(`/api/assistant-admin/students/${selectedStudent.id}/comments`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false))
  }, [selectedStudent])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !newComment.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(
        `/api/assistant-admin/students/${selectedStudent.id}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newComment.trim() }),
        }
      )
      if (res.ok) {
        const created = await res.json()
        setComments((prev) => [...prev, created])
        setNewComment('')
      } else {
        const err = await res.json()
        alert(err.error || 'Fikr qo\'shishda xatolik')
      }
    } catch {
      alert('Fikr qo\'shishda xatolik')
    } finally {
      setSubmitting(false)
    }
  }

  const canView = permissions !== null && Boolean(permissions?.studentComments?.view)
  const inputClass =
    'w-full px-4 py-3 min-h-[44px] text-[14px] bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)] focus:ring-2 focus:ring-indigo-500/20'

  if (permissionsLoading && !permissions) {
    return (
      <DashboardLayout role="ASSISTANT_ADMIN">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (permissionsError || (permissions !== null && !canView)) {
    return (
      <DashboardLayout role="ASSISTANT_ADMIN">
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          {permissionsError ? (
            <>
              <p className="text-[var(--text-muted)] text-center">Ruxsatlarni yuklashda xatolik.</p>
              <button
                type="button"
                onClick={() => fetchPermissions()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[var(--radius-md)] font-medium"
              >
                Qayta urinish
              </button>
            </>
          ) : (
            <p className="text-[var(--text-muted)]">Sizda bu boʻlimni koʻrish ruxsati yoʻq.</p>
          )}
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="ASSISTANT_ADMIN">
      <div className="space-y-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            O'quvchi fikrlari
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Faqat qidiruv orqali: o'quvchi ID, ismi yoki familyasi yozilsa topiladi. Ro'yxat yo'q — faqat qidiruv natijasida tanlangan o'quvchiga fikr qoldiriladi.
          </p>
        </div>

        {/* Qidiruv — faqat ID, ism, familya orqali */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-4 sm:p-5 assistant-card-shadow">
          <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2">
            O'quvchini qidirish (ID, ism yoki familya)
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ID (ST-001), ism yoki familya yozing"
              className={`${inputClass} pl-10`}
            />
          </div>
          {searching && (
            <div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Qidirilmoqda...
            </div>
          )}
          {searchQuery.trim() && !searching && searchResults.length > 0 && (
            <ul className="mt-3 border border-[var(--border-subtle)] rounded-[var(--radius-md)] overflow-hidden divide-y divide-[var(--border-subtle)] max-h-[280px] overflow-y-auto">
              {searchResults.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudent(s)
                      setSearchQuery('')
                      setSearchResults([])
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--text-primary)] truncate">
                        {s.user.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {s.studentId}
                        {s.currentGroupName ? ` · ${s.currentGroupName}` : ''}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {searchQuery.trim() && !searching && searchResults.length === 0 && (
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Hech narsa topilmadi. Boshqa so'z bilan qidiring.
            </p>
          )}
        </div>

        {/* Tanlangan o'quvchi va fikrlar */}
        {selectedStudent ? (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] overflow-hidden assistant-card-shadow">
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {selectedStudent.user.name}
                </h2>
                <p className="text-sm text-[var(--text-muted)]">
                  {selectedStudent.studentId}
                  {selectedStudent.currentGroupName
                    ? ` · ${selectedStudent.currentGroupName}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="ml-auto text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Boshqasini tanlash
              </button>
            </div>

            <div className="p-5">
              {/* Fikrlar ro'yxati */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Fikrlar ({comments.length})
                </h3>
                {commentsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 rounded-[var(--radius-lg)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                    <MessageSquare className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
                    <p className="text-[var(--text-muted)]">
                      Hozircha fikr yo'q. Birinchi fikrni siz qoldiring.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                    {comments.map((c) => (
                      <li
                        key={c.id}
                        className="flex gap-3 p-4 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                          <User className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {c.author.name}
                          </p>
                          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5 whitespace-pre-wrap break-words">
                            {c.content}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] mt-1">
                            {new Date(c.createdAt).toLocaleString('uz-UZ')}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Yangi fikr form */}
              <form onSubmit={handleSubmitComment} className="space-y-3">
                <label className="block text-[13px] font-semibold text-[var(--text-secondary)]">
                  Yangi fikr qo'shish
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Masalan: Daftarni tekshirdim, 10 ta xato bor."
                  rows={3}
                  className={inputClass}
                  disabled={submitting}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="inline-flex items-center gap-2 h-[42px] px-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-[var(--radius-md)] transition-all"
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  Yuborish
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-12 text-center assistant-card-shadow">
            <MessageSquare className="h-16 w-16 text-[var(--text-muted)] mx-auto mb-4 opacity-40" />
            <p className="text-[var(--text-secondary)] font-medium">
              Qidiruv natijasida o'quvchini tanlang
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Yuqorida ID, ism yoki familya yozing — topilgan o'quvchini tanlaganingizda unga fikr qo'shasiz yoki mavjud fikrlarni ko'rasiz.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
