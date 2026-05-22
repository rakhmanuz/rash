'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { canMutateInfinityPoints } from '@/lib/natijalar-read-auth'
import {
  Search,
  Plus,
  Minus,
  TrendingUp,
  Users,
  GraduationCap,
  UserCog,
  Crown,
  X,
  Loader2,
  History,
  FileText,
  ShoppingCart,
  ClipboardList,
  Layers,
  PieChart,
  Calendar,
  Trophy,
  Briefcase,
  RotateCcw,
} from 'lucide-react'

export interface InfinityManagementPageProps {
  layoutRole: 'ADMIN' | 'RAHBAR'
  showVazifaCleanup: boolean
  /** Masalan: «Rahbar · IQLASAN» */
  headBadge?: string
}

interface User {
  id: string
  name: string
  username: string
  role: string
  phone?: string
  infinityPoints: number
  isActive: boolean
  studentProfile?: {
    studentId: string
  }
  teacherProfile?: {
    id: string
  }
  subjectInfinityBreakdown?: {
    subjectId: string
    subjectName: string
    infinityPoints: number
    earnedPoints?: number
    spentPoints?: number
  }[]
}

interface Group {
  id: string
  name: string
  subject?: {
    id: string
    name: string
  } | null
}

interface InfinityHistoryItem {
  id: string
  userId: string
  amount: number
  balanceAfter: number
  source: string
  description: string | null
  createdAt: string
  user: {
    id: string
    name: string
    username: string
    studentProfile?: { studentId: string } | null
  }
}

const SOURCE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  TEST_RESULT: { label: 'Kunlik test', icon: <ClipboardList className="h-4 w-4" />, color: 'text-blue-400 bg-blue-500/20' },
  WRITTEN_WORK_RESULT: { label: 'Yozma ish', icon: <FileText className="h-4 w-4" />, color: 'text-amber-400 bg-amber-500/20' },
  ADMIN_ADD: { label: 'Admin qo\'shdi', icon: <Plus className="h-4 w-4" />, color: 'text-green-400 bg-green-500/20' },
  ADMIN_SUBTRACT: { label: 'Admin ayirdi', icon: <Minus className="h-4 w-4" />, color: 'text-red-400 bg-red-500/20' },
  ADMIN_RESET: { label: 'Balans nollash', icon: <RotateCcw className="h-4 w-4" />, color: 'text-orange-400 bg-orange-500/20' },
  MARKET_ORDER: { label: 'Market', icon: <ShoppingCart className="h-4 w-4" />, color: 'text-purple-400 bg-purple-500/20' },
}

export function InfinityManagementPage({
  layoutRole,
  showVazifaCleanup,
  headBadge,
}: InfinityManagementPageProps) {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<'users' | 'history'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [history, setHistory] = useState<InfinityHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyFilterUser, setHistoryFilterUser] = useState('')
  const [historyFilterSource, setHistoryFilterSource] = useState('')
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<User | null>(null)
  const [userHistory, setUserHistory] = useState<InfinityHistoryItem[]>([])
  const [userHistoryLoading, setUserHistoryLoading] = useState(false)
  const [cleanupVazifaLoading, setCleanupVazifaLoading] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [subjectFilter, setSubjectFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [stats, setStats] = useState<{
    summary: { totalInfinity: number; totalUsers: number; averageInfinity: number }
    byGroup: { groupId: string; groupName: string; totalInfinity: number; userCount: number; averageInfinity: number }[]
    bySource: { source: string; totalAmount: number; count: number }[]
  } | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [historyDateFrom, setHistoryDateFrom] = useState('')
  const [historyDateTo, setHistoryDateTo] = useState('')
  const [roleFilter, setRoleFilter] = useState('') // '' = barcha, STUDENT, TEACHER, ...
  const [topPeriod, setTopPeriod] = useState<'week' | 'month' | 'range'>('week')
  const [topDateFrom, setTopDateFrom] = useState('')
  const [topDateTo, setTopDateTo] = useState('')
  const [topCollectors, setTopCollectors] = useState<{
    periodLabel: string
    items: { userId: string; name: string; username: string; role: string; studentId: string | null; totalEarned: number; actionCount: number }[]
  } | null>(null)
  const [topCollectorsLoading, setTopCollectorsLoading] = useState(false)

  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustTargetUser, setAdjustTargetUser] = useState<User | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustSubjectId, setAdjustSubjectId] = useState('')
  const [adjustSubmitting, setAdjustSubmitting] = useState(false)

  const [showResetModal, setShowResetModal] = useState(false)
  const [resetModalSearch, setResetModalSearch] = useState('')
  const [resetSelectedIds, setResetSelectedIds] = useState<Set<string>>(() => new Set())
  const [resetReason, setResetReason] = useState('')
  const [resetSubmitting, setResetSubmitting] = useState(false)

  const sessionCanMutateInfinity = canMutateInfinityPoints(session?.user?.role)

  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchUsers()
      fetchGroups()
      fetchStats()
    } else if (status === 'unauthenticated') {
      setLoading(false)
      setError('Siz tizimga kirmagansiz')
    }
  }, [status, session, groupFilter, subjectFilter])

  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      const url = new URL('/api/admin/infinity/stats', window.location.origin)
      if (groupFilter) url.searchParams.set('groupId', groupFilter)
      if (subjectFilter) url.searchParams.set('subjectId', subjectFilter)
      const res = await fetch(url.toString(), { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      } else {
        setStats(null)
      }
    } catch {
      setStats(null)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchTopCollectors = async () => {
    if (topPeriod === 'range' && (!topDateFrom || !topDateTo)) {
      alert('Sanadan-sanagacha tanlaganda ikkala sana ham tanlanishi kerak')
      return
    }
    setTopCollectorsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('period', topPeriod)
      if (topPeriod === 'range') {
        params.set('dateFrom', topDateFrom)
        params.set('dateTo', topDateTo)
      }
      if (groupFilter) params.set('groupId', groupFilter)
      if (subjectFilter) params.set('subjectId', subjectFilter)
      const res = await fetch(`/api/admin/infinity/top-collectors?${params}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setTopCollectors({ periodLabel: data.periodLabel, items: data.items || [] })
      } else {
        setTopCollectors(null)
      }
    } catch {
      setTopCollectors(null)
    } finally {
      setTopCollectorsLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/admin/groups', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        const mapped = Array.isArray(data)
          ? data.map((g: { id: string; name: string; subject?: { id: string; name: string } | null }) => ({
              id: g.id,
              name: g.name,
              subject: g.subject ?? null,
            }))
          : []
        setGroups(mapped)
        setSubjectFilter((prev) => {
          if (prev) return prev
          const mathSubject = mapped.find((g) => g.subject?.name?.toLowerCase().includes('matemat'))?.subject
          return mathSubject?.id ?? ''
        })
      }
    } catch {
      setGroups([])
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const url = new URL('/api/admin/infinity', window.location.origin)
      if (groupFilter) url.searchParams.set('groupId', groupFilter)
      if (subjectFilter) url.searchParams.set('subjectId', subjectFilter)
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Session cookie'larini yuborish uchun
      })
      
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setUsers(data)
          if (data.length === 0) {
            setError('Hozircha foydalanuvchilar topilmadi')
          }
        } else {
          setError('Ma\'lumotlar formati noto\'g\'ri')
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        if (response.status === 401) {
          setError('Siz tizimga kirmagansiz')
        } else if (response.status === 403) {
          setError('Sizda bu sahifaga kirish huquqi yo\'q')
        } else {
          setError(errorData.error || `Ma'lumotlarni yuklashda xatolik (${response.status})`)
        }
      }
    } catch (error: any) {
      console.error('Error fetching users:', error)
      setError(`Xatolik: ${error.message || 'Ma\'lumotlarni yuklashda xatolik'}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const params = new URLSearchParams()
      if (historyFilterUser) params.set('userId', historyFilterUser)
      if (historyFilterSource) params.set('source', historyFilterSource)
      if (historyDateFrom) params.set('dateFrom', historyDateFrom)
      if (historyDateTo) params.set('dateTo', historyDateTo)
      params.set('limit', '200')
      const res = await fetch(`/api/admin/infinity/history?${params}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'history' && status === 'authenticated') {
      fetchHistory()
    }
  }, [activeTab, status, historyFilterUser, historyFilterSource, historyDateFrom, historyDateTo])

  useEffect(() => {
    if (!groupFilter || !subjectFilter) return
    const selectedGroup = groups.find((g) => g.id === groupFilter)
    if (selectedGroup?.subject?.id !== subjectFilter) {
      setGroupFilter('')
    }
  }, [groupFilter, subjectFilter, groups])

  const openAdjustInfinity = (user: User) => {
    setAdjustTargetUser(user)
    setAdjustAmount('')
    setAdjustReason('')
    const enrolled = user.subjectInfinityBreakdown ?? []
    const defaultSubject =
      subjectFilter && enrolled.some((s) => s.subjectId === subjectFilter)
        ? subjectFilter
        : enrolled.length === 1
          ? enrolled[0].subjectId
          : ''
    setAdjustSubjectId(defaultSubject)
    setShowAdjustModal(true)
  }

  const submitInfinityAdjust = async (operation: 'add' | 'subtract') => {
    if (!adjustTargetUser || adjustSubmitting) return
    const n = parseInt(String(adjustAmount).trim(), 10)
    if (!Number.isFinite(n) || n <= 0) {
      alert("Miqdor musbat butun son bo'lishi kerak")
      return
    }
    const breakdown = adjustTargetUser.subjectInfinityBreakdown ?? []
    const selectedSubject = breakdown.find((s) => s.subjectId === adjustSubjectId)
    if (operation === 'subtract' && breakdown.length > 0 && !selectedSubject) {
      alert("Ayirish uchun qaysi fan ekanini tanlang")
      return
    }
    if (
      operation === 'subtract' &&
      selectedSubject &&
      n > (selectedSubject.infinityPoints ?? 0)
    ) {
      alert(
        `${selectedSubject.subjectName} fanidan mavjud: ${selectedSubject.infinityPoints} ∞. Ayirish: ${n} ∞.`
      )
      return
    }
    setAdjustSubmitting(true)
    try {
      const res = await fetch('/api/admin/infinity', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: adjustTargetUser.id,
          amount: n,
          operation,
          reason: adjustReason.trim() || undefined,
          subjectId: selectedSubject?.subjectId,
          subjectName: selectedSubject?.subjectName,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(typeof data.error === 'string' ? data.error : 'Xatolik')
        return
      }
      const newPts: number = typeof data.newPoints === 'number' ? data.newPoints : adjustTargetUser.infinityPoints || 0
      const mergedUser: User = {
        ...adjustTargetUser,
        ...(data.user && typeof data.user === 'object' ? data.user : {}),
        infinityPoints: newPts,
      }
      void fetchUsers()
      setSelectedUserForHistory((prev) =>
        prev?.id === mergedUser.id ? { ...prev, infinityPoints: newPts } : prev
      )
      if (showHistoryModal && selectedUserForHistory?.id === mergedUser.id) {
        void openUserHistory(mergedUser)
      }
      if (activeTab === 'history') void fetchHistory()
      void fetchStats()
      if (topCollectors) void fetchTopCollectors()
      setShowAdjustModal(false)
      setAdjustTargetUser(null)
      setAdjustAmount('')
      setAdjustReason('')
      setAdjustSubjectId('')
    } catch {
      alert('Tarmoq xatosi')
    } finally {
      setAdjustSubmitting(false)
    }
  }

  const openUserHistory = async (user: User) => {
    setSelectedUserForHistory(user)
    setShowHistoryModal(true)
    setUserHistoryLoading(true)
    try {
      const res = await fetch(`/api/admin/infinity/history?userId=${user.id}&limit=100`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setUserHistory(data)
      } else {
        setUserHistory([])
      }
    } catch {
      setUserHistory([])
    } finally {
      setUserHistoryLoading(false)
    }
  }

  const formatDateTime = (s: string) => {
    const d = new Date(s)
    const date = d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const time = d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    return `${date} ${time}`
  }

  const openResetInfinityModal = () => {
    setResetModalSearch('')
    setResetSelectedIds(new Set())
    setResetReason('')
    setShowResetModal(true)
  }

  const toggleResetStudent = (id: string) => {
    setResetSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const resetModalStudents = users.filter((u) => {
    if (u.role !== 'STUDENT') return false
    const q = resetModalSearch.trim().toLowerCase()
    if (!q) return true
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.studentProfile?.studentId ?? '').toLowerCase().includes(q)
    )
  })

  const selectAllResetModalVisible = () => {
    setResetSelectedIds((prev) => {
      const next = new Set(prev)
      for (const u of resetModalStudents) next.add(u.id)
      return next
    })
  }

  const clearResetSelection = () => {
    setResetSelectedIds(new Set())
  }

  const submitResetInfinity = async () => {
    const ids = [...resetSelectedIds]
    if (ids.length === 0) {
      alert("Kamida bitta o'quvchini tanlang")
      return
    }
    if (
      !confirm(
        `Tanlangan ${ids.length} ta o'quvchining barcha ∞ ballari nolga tushiriladi. Davom etasizmi?`
      )
    ) {
      return
    }
    setResetSubmitting(true)
    try {
      const res = await fetch('/api/admin/infinity/reset-students', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: ids, reason: resetReason.trim() || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(typeof data.error === 'string' ? data.error : 'Xatolik')
        return
      }
      if (typeof data.message === 'string') {
        alert(data.message)
      }
      const historyPeer = selectedUserForHistory
      setShowResetModal(false)
      setResetSelectedIds(new Set())
      setResetReason('')
      void fetchUsers()
      void fetchStats()
      if (activeTab === 'history') void fetchHistory()
      if (topCollectors) void fetchTopCollectors()
      if (showHistoryModal && historyPeer && ids.includes(historyPeer.id)) {
        void openUserHistory({ ...historyPeer, infinityPoints: 0 })
      }
    } catch {
      alert('Tarmoq xatosi')
    } finally {
      setResetSubmitting(false)
    }
  }

  const handleCleanupVazifa = async () => {
    if (cleanupVazifaLoading || !confirm('Uyga vazifa uchun berilgan barcha infinity ballarni olib tashlashni xohlaysizmi? Ballar foydalanuvchilardan ayiriladi.')) return
    setCleanupVazifaLoading(true)
    try {
      const res = await fetch('/api/admin/infinity/cleanup-vazifa', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        alert(data.message || 'Bajarildi.')
        fetchUsers()
        if (activeTab === 'history') fetchHistory()
      } else {
        alert(data.error || 'Xatolik')
      }
    } catch (e) {
      alert('Xatolik yuz berdi')
    } finally {
      setCleanupVazifaLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return <GraduationCap className="h-4 w-4" />
      case 'TEACHER':
        return <UserCog className="h-4 w-4" />
      case 'ADMIN':
      case 'MANAGER':
        return <Crown className="h-4 w-4" />
      case 'RAHBAR':
        return <Briefcase className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return 'O\'quvchi'
      case 'TEACHER':
        return 'O\'qituvchi'
      case 'ADMIN':
        return 'Admin'
      case 'MANAGER':
        return 'Menejer'
      case 'RAHBAR':
        return 'Rahbar'
      default:
        return role
    }
  }

  const filteredUsers = users
    .filter((user) => {
      const matchSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.studentProfile?.studentId.toLowerCase().includes(searchTerm.toLowerCase())
      const matchRole = !roleFilter || user.role === roleFilter
      return matchSearch && matchRole
    })

  const totalPoints = filteredUsers.reduce((sum, user) => sum + (user.infinityPoints || 0), 0)
  const subjectOptions = groups.reduce((acc: { id: string; name: string }[], g) => {
    const subject = g.subject
    if (!subject) return acc
    if (!acc.some((s) => s.id === subject.id)) {
      acc.push({ id: subject.id, name: subject.name })
    }
    return acc
  }, [])
  const visibleGroups = subjectFilter ? groups.filter((g) => g.subject?.id === subjectFilter) : groups

  return (
    <DashboardLayout role={layoutRole}>
      <div className="space-y-4 sm:space-y-6 min-w-0 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:flex-wrap">
          <div className="min-w-0">
            {headBadge ? (
              <p className="text-xs sm:text-sm text-green-400/90 mb-1 font-medium">{headBadge}</p>
            ) : null}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 flex flex-wrap items-center gap-2">
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                ∞
              </span>
              Infinitylar
              <span className="text-xs font-normal text-green-400/90 bg-green-400/20 px-2 py-0.5 rounded border border-green-400/40" title="Yangi build yuklanganida ko‘rinadi">
                v2
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">Foydalanuvchilar balanslari, statistikalar va to‘liq tarix</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:flex-wrap sm:justify-end">
            {sessionCanMutateInfinity ? (
              <button
                type="button"
                onClick={openResetInfinityModal}
                disabled={resetSubmitting}
                className="min-h-[48px] w-full sm:w-auto px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                title="Tanlangan o'quvchilarning ∞ balansini nolga tushirish (tarixda saqlanadi)"
              >
                <RotateCcw className="h-4 w-4" />
                ∞ ni nolga tushirish
              </button>
            ) : null}
            {showVazifaCleanup ? (
              <button
                type="button"
                onClick={handleCleanupVazifa}
                disabled={cleanupVazifaLoading}
                className="min-h-[48px] w-full sm:w-auto px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                title="Uyga vazifa uchun noto'g'ri berilgan infinity ballarni olib tashlash"
              >
                {cleanupVazifaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Uyga vazifa ∞ olib tashlash
              </button>
            ) : null}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-700/50 pb-2 overflow-x-auto touch-pan-x -mx-1 px-1 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`min-h-[48px] shrink-0 px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Users className="h-4 w-4" />
            Foydalanuvchilar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`min-h-[48px] shrink-0 px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <History className="h-4 w-4" />
            Tarix
          </button>
        </div>

        {activeTab === 'users' && (
          <>
        {/* Statistics Cards — tanlangan guruh/filtr bo'yicha */}
        {(groupFilter || subjectFilter) && (
          <p className="text-sm text-gray-400 flex items-center gap-1">
            <GraduationCap className="h-4 w-4" />
            Ko&apos;rsatkichlar:
            {subjectFilter ? (
              <span className="text-white font-medium"> fan — {subjectOptions.find((s) => s.id === subjectFilter)?.name || subjectFilter}</span>
            ) : null}
            {groupFilter ? (
              <span className="text-white font-medium">, guruh — {groups.find((g) => g.id === groupFilter)?.name || groupFilter}</span>
            ) : null}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Jami Infinity</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{totalPoints.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Jami Foydalanuvchilar</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{filteredUsers.length}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">O'rtacha Infinity</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {filteredUsers.length > 0 ? Math.round(totalPoints / filteredUsers.length) : 0}
                </p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Guruh bo'yicha statistikalar */}
        <div className="bg-slate-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
          <div className="px-3 sm:px-4 py-3 border-b border-gray-700/50 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 shrink-0 text-green-400" />
              <h2 className="font-semibold text-white text-sm sm:text-base">Guruh bo&apos;yicha statistikalar</h2>
            </div>
            <span className="text-gray-400 text-xs sm:text-sm leading-snug">(Ma&apos;lumot: guruhdagi o&apos;quvchilar va ularning joriy ∞ balansi)</span>
          </div>
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-green-500" />
            </div>
          ) : stats?.byGroup?.length ? (
            <div className="overflow-x-auto touch-pan-x">
              <table className="w-full min-w-[360px] text-sm">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Guruh</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase">Jami ∞</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase">O&apos;quvchilar</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase">O&apos;rtacha ∞</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {[...(stats.byGroup || [])]
                    .sort((a, b) => b.totalInfinity - a.totalInfinity)
                    .map((row) => (
                      <tr key={row.groupId} className="hover:bg-slate-700/30">
                        <td className="px-4 py-2 font-medium text-white">{row.groupName}</td>
                        <td className="px-4 py-2 text-right text-green-400 font-semibold">{row.totalInfinity.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right text-gray-300">{row.userCount}</td>
                        <td className="px-4 py-2 text-right text-gray-300">{row.averageInfinity}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-4 py-6 text-center text-gray-400 text-sm">Guruhlar bo&apos;yicha ma&apos;lumot topilmadi</p>
          )}
        </div>

        {/* Ma'lumot qayerdan keladi (manba bo'yicha) */}
        <div className="bg-slate-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700/50 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-green-400" />
            <h2 className="font-semibold text-white">Ma&apos;lumot qayerdan keladi</h2>
            <span className="text-gray-400 text-sm">(Infinity tarixidagi manbalar bo&apos;yicha yig&apos;indi)</span>
          </div>
          {statsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-green-500" />
            </div>
          ) : stats?.bySource?.length ? (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {stats.bySource.map((row) => {
                const src = SOURCE_LABELS[row.source] || { label: row.source, icon: null, color: 'text-gray-400 bg-gray-500/20' }
                return (
                  <div
                    key={row.source}
                    className={`rounded-lg border p-3 ${src.color} border-current/30`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {src.icon}
                      <span className="font-medium text-sm">{src.label}</span>
                    </div>
                    <p className="text-lg font-bold">
                      {row.totalAmount >= 0 ? '+' : ''}{row.totalAmount} ∞
                    </p>
                    <p className="text-xs opacity-80">{row.count} ta harakat</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="px-4 py-6 text-center text-gray-400 text-sm">Manba bo&apos;yicha ma&apos;lumot topilmadi</p>
          )}
        </div>

        {/* Eng ko'p to'plaganlar — oy / hafta / sanadan-sanagacha */}
        <div className="bg-slate-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700/50 flex items-center gap-2 flex-wrap">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h2 className="font-semibold text-white">Eng ko&apos;p to&apos;plaganlar</h2>
            <span className="text-gray-400 text-sm">(Tanlangan davrda qo&apos;shilgan ∞ ballar bo&apos;yicha)</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Davr</label>
                <select
                  value={topPeriod}
                  onChange={(e) => setTopPeriod(e.target.value as 'week' | 'month' | 'range')}
                  className="px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-green-500"
                >
                  <option value="week">So&apos;nggi 7 kun (hafta)</option>
                  <option value="month">So&apos;nggi 30 kun (oy)</option>
                  <option value="range">Sanadan-sanagacha</option>
                </select>
              </div>
              {topPeriod === 'range' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Dan</label>
                    <input
                      type="date"
                      value={topDateFrom}
                      onChange={(e) => setTopDateFrom(e.target.value)}
                      className="px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Gacha</label>
                    <input
                      type="date"
                      value={topDateTo}
                      onChange={(e) => setTopDateTo(e.target.value)}
                      className="px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </>
              )}
              {(groupFilter || subjectFilter) && (
                <p className="text-gray-400 text-sm flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  {subjectFilter ? `Fan: ${subjectOptions.find((s) => s.id === subjectFilter)?.name || subjectFilter}` : ''}
                  {groupFilter ? ` | Guruh: ${groups.find((g) => g.id === groupFilter)?.name || groupFilter}` : ''}
                </p>
              )}
              <button
                type="button"
                onClick={fetchTopCollectors}
                disabled={topCollectorsLoading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {topCollectorsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
                Ko&apos;rsatish
              </button>
            </div>
            {topCollectors && (
              <>
                <p className="text-sm text-gray-400">Davr: {topCollectors.periodLabel}</p>
                {topCollectorsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                  </div>
                ) : topCollectors.items.length === 0 ? (
                  <p className="py-6 text-center text-gray-400 text-sm">Ushbu davrda to&apos;plangan ballar topilmadi</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-700/50">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-700/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">#</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Foydalanuvchi</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase">Toplangan ∞</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase">Harakatlar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {topCollectors.items.map((row, i) => (
                          <tr key={row.userId} className="hover:bg-slate-700/30">
                            <td className="px-4 py-2 text-gray-300">{i + 1}</td>
                            <td className="px-4 py-2">
                              <div className="font-medium text-white">{row.name}</div>
                              <div className="text-gray-400 text-xs">@{row.username}{row.studentId ? ` • ${row.studentId}` : ''}</div>
                            </td>
                            <td className="px-4 py-2 text-right text-green-400 font-semibold">+{row.totalEarned} ∞</td>
                            <td className="px-4 py-2 text-right text-gray-300">{row.actionCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Error Message (users tab) */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center space-x-2">
            <X className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Search va guruh filtri */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-gray-700/50 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Ism, username yoki ID bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full min-h-[48px] pl-10 pr-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-base sm:text-sm"
              />
            </div>
            <div className="flex items-center gap-2 sm:min-w-[200px]">
              <GraduationCap className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full min-h-[48px] px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Barcha fanlar</option>
                {subjectOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 sm:min-w-[200px]">
              <GraduationCap className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full min-h-[48px] px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Barcha guruhlar</option>
                {visibleGroups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 sm:min-w-[160px]">
              <UserCog className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full min-h-[48px] px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Barcha rollar</option>
                <option value="STUDENT">O&apos;quvchi</option>
                <option value="TEACHER">O&apos;qituvchi</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Menejer</option>
                <option value="RAHBAR">Rahbar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto touch-pan-x -mx-1 px-1 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[520px]">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Foydalanuvchi
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Infinity Ballar
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Tarix
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 sm:px-6 py-8 text-center text-gray-400">
                        Foydalanuvchilar topilmadi
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {index + 1}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap max-w-[200px] sm:max-w-none">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {getRoleIcon(user.role)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-400">
                                @{user.username}
                                {user.studentProfile && ` • ${user.studentProfile.studentId}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex items-start gap-2 flex-wrap">
                            <div>
                              <div className="flex items-center space-x-2">
                              <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                                ∞
                              </span>
                              <span className="text-lg font-bold text-white">
                                {user.infinityPoints || 0}
                              </span>
                              </div>
                              {user.subjectInfinityBreakdown &&
                              user.subjectInfinityBreakdown.length > 0 &&
                              user.subjectInfinityBreakdown.length > 1 ? (
                                <div className="mt-2 rounded-lg border border-gray-600/80 bg-slate-900/50 p-2 text-xs">
                                  <div className="text-gray-500 mb-1">Fan bo&apos;yicha:</div>
                                  {user.subjectInfinityBreakdown.map((s) => (
                                    <div key={s.subjectId} className="flex justify-between gap-2 text-gray-300">
                                      <span className="truncate">{s.subjectName}</span>
                                      <span className="text-emerald-300 font-medium tabular-nums shrink-0">
                                        {s.infinityPoints} ∞
                                      </span>
                                    </div>
                                  ))}
                                  {(() => {
                                    const subjectSum = user.subjectInfinityBreakdown!.reduce(
                                      (sum, s) => sum + (s.infinityPoints || 0),
                                      0
                                    )
                                    const other = Math.max(0, (user.infinityPoints || 0) - subjectSum)
                                    return other > 0 ? (
                                      <div className="flex justify-between gap-2 text-gray-400 mt-1 pt-1 border-t border-gray-700/80">
                                        <span>Boshqa</span>
                                        <span className="text-amber-300/90 font-medium tabular-nums shrink-0">
                                          {other} ∞
                                        </span>
                                      </div>
                                    ) : null
                                  })()}
                                </div>
                              ) : null}
                            </div>
                            {sessionCanMutateInfinity ? (
                              <button
                                type="button"
                                onClick={() => openAdjustInfinity(user)}
                                className="inline-flex items-center gap-1 rounded-lg border border-green-500/40 bg-green-500/15 px-2 py-1.5 text-xs font-medium text-green-300 hover:bg-green-500/25 min-h-[40px] sm:min-h-0"
                                title="Infinity qo‘shish yoki ayirish"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openUserHistory(user)}
                            className="flex items-center justify-center min-h-[44px] min-w-[44px] sm:min-w-0 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                          >
                            <History className="h-4 w-4" />
                            <span>Tarix</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

          </>
        )}

        {/* History tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-gray-700/50">
              <p className="text-gray-400 text-sm mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Filtrlarni qo&apos;llang va &quot;Qidirish&quot;ni bosing
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="w-full sm:w-auto sm:min-w-0">
                  <label className="block text-xs text-gray-400 mb-1">Sana dan</label>
                  <input
                    type="date"
                    value={historyDateFrom}
                    onChange={(e) => setHistoryDateFrom(e.target.value)}
                    className="w-full min-h-[48px] px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="w-full sm:w-auto sm:min-w-0">
                  <label className="block text-xs text-gray-400 mb-1">Sana gacha</label>
                  <input
                    type="date"
                    value={historyDateTo}
                    onChange={(e) => setHistoryDateTo(e.target.value)}
                    className="w-full min-h-[48px] px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <select
                  value={historyFilterSource}
                  onChange={(e) => setHistoryFilterSource(e.target.value)}
                  className="w-full min-h-[48px] sm:w-auto sm:min-w-[160px] px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Barcha manbalar</option>
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <select
                  value={historyFilterUser}
                  onChange={(e) => setHistoryFilterUser(e.target.value)}
                  className="w-full min-h-[48px] sm:w-auto sm:min-w-[180px] px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Barcha foydalanuvchilar</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (@{u.username})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={fetchHistory}
                  className="w-full min-h-[48px] sm:w-auto px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Qidirish
                </button>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
              {historyLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                </div>
              ) : (
                <div className="overflow-x-auto touch-pan-x -mx-1 px-1 sm:mx-0 sm:px-0">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Sana va vaqt</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Foydalanuvchi</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">O'zgarish</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Manba</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Tafsilot</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Qolgan balans</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                            Tarix bo'yicha yozuvlar topilmadi
                          </td>
                        </tr>
                      ) : (
                        history.map((h) => {
                          const src = SOURCE_LABELS[h.source] || { label: h.source, icon: null, color: 'text-gray-400 bg-gray-500/20' }
                          return (
                            <tr key={h.id} className="hover:bg-slate-700/30">
                              <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{formatDateTime(h.createdAt)}</td>
                              <td className="px-4 py-3 text-sm text-white">
                                {h.user.name}
                                <span className="text-gray-400 text-xs block">@{h.user.username}{h.user.studentProfile?.studentId ? ` • ${h.user.studentProfile.studentId}` : ''}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={h.amount >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                                  {h.amount >= 0 ? '+' : ''}{h.amount} ∞
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${src.color}`}>
                                  {src.icon}
                                  {src.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-300 max-w-[220px] truncate" title={h.description || ''}>
                                {h.description || '—'}
                              </td>
                              <td className="px-4 py-3 text-sm text-white font-medium">{h.balanceAfter} ∞</td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal — tanlangan o'quvchilarning ∞ balansini nolga tushirish */}
        {showResetModal && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm p-0 sm:items-center sm:p-4">
            <div className="flex max-h-[min(92dvh,100vh)] w-full max-w-lg flex-col rounded-t-2xl border border-gray-700 bg-slate-800 shadow-xl sm:max-h-[85vh] sm:rounded-xl">
              <div className="flex items-start justify-between border-b border-gray-700 p-4 sm:p-5 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <RotateCcw className="h-5 w-5 text-orange-400" />∞ balansini nolga tushirish
                  </h2>
                  <p className="mt-1 text-sm text-gray-400">
                    Faqat o&apos;quvchilar. Har bir tanlangan uchun alohida tarix yozuvi yaratiladi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!resetSubmitting) {
                      setShowResetModal(false)
                      setResetSelectedIds(new Set())
                    }
                  }}
                  className="text-gray-400 hover:text-white p-1"
                  aria-label="Yopish"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4 sm:p-5 min-h-0">
                <input
                  type="text"
                  value={resetModalSearch}
                  onChange={(e) => setResetModalSearch(e.target.value)}
                  placeholder="O'quvchi qidirish (ism, @username, ID)..."
                  disabled={resetSubmitting}
                  className="w-full min-h-[48px] rounded-lg border border-gray-600 bg-slate-700 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={resetSubmitting || resetModalStudents.length === 0}
                    onClick={selectAllResetModalVisible}
                    className="text-xs font-medium rounded-lg border border-gray-600 px-3 py-2 text-gray-200 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Ko&apos;rinadiganlarni tanlash ({resetModalStudents.length})
                  </button>
                  <button
                    type="button"
                    disabled={resetSubmitting || resetSelectedIds.size === 0}
                    onClick={clearResetSelection}
                    className="text-xs font-medium rounded-lg border border-gray-600 px-3 py-2 text-gray-200 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Tanlovni tozalash
                  </button>
                  <span className="text-sm text-orange-300/90 self-center">Tanlangan: {resetSelectedIds.size}</span>
                </div>
                <div className="min-h-[200px] flex-1 overflow-auto rounded-lg border border-gray-700/80 bg-slate-900/40">
                  {resetModalStudents.length === 0 ? (
                    <p className="p-4 text-center text-sm text-gray-400">
                      O&apos;quvchilar topilmadi. Yuqoridagi qidiruv yoki guruh filtri yordamida ro&apos;yxatni tekshiring.
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-700/50">
                      {resetModalStudents.map((u) => {
                        const checked = resetSelectedIds.has(u.id)
                        const pts = u.infinityPoints ?? 0
                        return (
                          <li key={u.id}>
                            <label className="flex cursor-pointer items-start gap-3 px-3 py-3 hover:bg-slate-700/25">
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 rounded border-gray-500 text-orange-600 focus:ring-orange-500"
                                checked={checked}
                                disabled={resetSubmitting}
                                onChange={() => toggleResetStudent(u.id)}
                              />
                              <span className="min-w-0 flex-1">
                                <span className="font-medium text-white">{u.name}</span>
                                <span className="block text-xs text-gray-400">
                                  @{u.username}
                                  {u.studentProfile?.studentId ? ` • ${u.studentProfile.studentId}` : ''}
                                </span>
                              </span>
                              <span className="shrink-0 text-sm font-semibold text-green-400">∞ {pts}</span>
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Sabap (ixtiyoriy, tarixda)</label>
                  <textarea
                    value={resetReason}
                    onChange={(e) => setResetReason(e.target.value)}
                    rows={2}
                    disabled={resetSubmitting}
                    placeholder="Masalan: chetga chiqarish, xato to‘ldirish..."
                    className="w-full resize-none rounded-lg border border-gray-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end border-t border-gray-700 pt-4">
                  <button
                    type="button"
                    disabled={resetSubmitting}
                    onClick={() => {
                      setShowResetModal(false)
                      setResetSelectedIds(new Set())
                    }}
                    className="min-h-[48px] rounded-lg border border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-slate-700"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    disabled={resetSubmitting || resetSelectedIds.size === 0}
                    onClick={() => void submitResetInfinity()}
                    className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                  >
                    {resetSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                    Tanlanganlarni nollash
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal — Infinity qo‘shish / ayirish */}
        {showAdjustModal && adjustTargetUser && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm p-0 sm:items-center sm:p-4">
            <div className="flex w-full max-w-md flex-col rounded-t-2xl border border-gray-700 bg-slate-800 shadow-xl sm:rounded-xl">
              <div className="flex items-start justify-between border-b border-gray-700 p-4 sm:p-5">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400">∞</span>
                    Infinity o‘zgartirish
                  </h2>
                  <p className="mt-1 text-sm text-gray-400">
                    {adjustTargetUser.name} · @{adjustTargetUser.username}
                  </p>
                  <p className="mt-1 text-sm text-white">
                    Umumiy balans:{' '}
                    <span className="text-green-400 font-semibold">{adjustTargetUser.infinityPoints ?? 0} ∞</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!adjustSubmitting) {
                      setShowAdjustModal(false)
                      setAdjustTargetUser(null)
                      setAdjustSubjectId('')
                    }
                  }}
                  className="text-gray-400 hover:text-white p-1"
                  aria-label="Yopish"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 p-4 sm:p-5">
                {adjustTargetUser.subjectInfinityBreakdown &&
                adjustTargetUser.subjectInfinityBreakdown.length > 0 ? (
                  <div className="rounded-lg border border-gray-600 bg-slate-900/60 p-3 space-y-2">
                    <p className="text-xs font-medium text-gray-400">Fan bo&apos;yicha mavjud balans</p>
                    {adjustTargetUser.subjectInfinityBreakdown.map((s) => (
                      <div key={s.subjectId} className="flex justify-between text-sm text-gray-200">
                        <span>
                          {s.subjectName}
                          {s.earnedPoints != null && s.earnedPoints !== s.infinityPoints ? (
                            <span className="text-gray-500 text-xs ml-1">(yig&apos;ilgan {s.earnedPoints})</span>
                          ) : null}
                        </span>
                        <span className="text-emerald-300 font-semibold tabular-nums">{s.infinityPoints} ∞</span>
                      </div>
                    ))}
                    {(() => {
                      const earned = adjustTargetUser.subjectInfinityBreakdown!.reduce(
                        (sum, s) => sum + (s.infinityPoints || 0),
                        0
                      )
                      const other = Math.max(0, (adjustTargetUser.infinityPoints || 0) - earned)
                      return other > 0 ? (
                        <div className="flex justify-between text-sm text-gray-400 pt-2 border-t border-gray-700">
                          <span>Boshqa manbalar</span>
                          <span className="text-amber-300/90 font-medium tabular-nums">{other} ∞</span>
                        </div>
                      ) : null
                    })()}
                  </div>
                ) : null}
                {adjustTargetUser.subjectInfinityBreakdown &&
                adjustTargetUser.subjectInfinityBreakdown.length > 0 ? (
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">
                      Qaysi fan (ayirishda majburiy)
                    </label>
                    <select
                      value={adjustSubjectId}
                      onChange={(e) => setAdjustSubjectId(e.target.value)}
                      disabled={adjustSubmitting}
                      className="w-full min-h-[48px] rounded-lg border border-gray-600 bg-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">— Fan tanlang —</option>
                      {adjustTargetUser.subjectInfinityBreakdown.map((s) => (
                        <option key={s.subjectId} value={s.subjectId}>
                          {s.subjectName} (mavjud {s.infinityPoints} ∞)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Miqdor</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="Masalan: 10"
                    disabled={adjustSubmitting}
                    className="w-full min-h-[48px] rounded-lg border border-gray-600 bg-slate-700 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Sabab (ixtiyoriy)</label>
                  <textarea
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    rows={2}
                    disabled={adjustSubmitting}
                    placeholder="Tarixda ko‘rinadi"
                    className="w-full resize-none rounded-lg border border-gray-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={adjustSubmitting}
                    onClick={() => {
                      if (!adjustSubmitting) {
                        setShowAdjustModal(false)
                        setAdjustTargetUser(null)
                        setAdjustSubjectId('')
                      }
                    }}
                    className="min-h-[48px] rounded-lg border border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-slate-700"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    disabled={
                      adjustSubmitting ||
                      ((adjustTargetUser.subjectInfinityBreakdown?.length ?? 0) > 0 && !adjustSubjectId)
                    }
                    onClick={() => void submitInfinityAdjust('subtract')}
                    className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {adjustSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4" />}
                    Ayirish
                  </button>
                  <button
                    type="button"
                    disabled={adjustSubmitting}
                    onClick={() => void submitInfinityAdjust('add')}
                    className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {adjustSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Qo'shish
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal - Foydalanuvchi tarixi */}
        {showHistoryModal && selectedUserForHistory && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-0 sm:items-center sm:p-4">
            <div className="flex max-h-[min(92dvh,100vh)] w-full max-w-3xl flex-col rounded-t-2xl border border-gray-700 bg-slate-800 shadow-xl sm:max-h-[85vh] sm:rounded-xl">
              <div className="p-4 sm:p-6 border-b border-gray-700 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <History className="h-5 w-5 text-green-400" />
                      Infinity tarixi
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                      {selectedUserForHistory.name} • @{selectedUserForHistory.username}
                      {selectedUserForHistory.studentProfile && ` • ${selectedUserForHistory.studentProfile.studentId}`}
                    </p>
                    <p className="text-white font-semibold mt-1">
                      Joriy balans: <span className="text-green-400">{selectedUserForHistory.infinityPoints ?? 0} ∞</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowHistoryModal(false); setSelectedUserForHistory(null) }}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="overflow-auto flex-1 p-4">
                {userHistoryLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                  </div>
                ) : userHistory.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Ushbu foydalanuvchi uchun harakatlar topilmadi</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">Sana va vaqt</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">O'zgarish</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">Manba</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">Tafsilot</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">Balans</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {userHistory.map((h) => {
                        const src = SOURCE_LABELS[h.source] || { label: h.source, icon: null, color: 'text-gray-400 bg-gray-500/20' }
                        return (
                          <tr key={h.id} className="hover:bg-slate-700/30">
                            <td className="px-3 py-2 text-gray-300 whitespace-nowrap">{formatDateTime(h.createdAt)}</td>
                            <td className="px-3 py-2">
                              <span className={h.amount >= 0 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                                {h.amount >= 0 ? '+' : ''}{h.amount} ∞
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${src.color}`}>
                                {src.icon}
                                {src.label}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-300 max-w-[200px] truncate" title={h.description || ''}>{h.description || '—'}</td>
                            <td className="px-3 py-2 text-white font-medium">{h.balanceAfter} ∞</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
