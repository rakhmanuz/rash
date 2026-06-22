'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, startTransition, useMemo } from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { useStudentShellRegistration } from '@/components/student-shell-context'
import { StudentThemeProvider } from '@/components/student-theme-context'
import { RashUzLogo } from '@/components/student-online/online-ui'
import { normalizeLearningMode } from '@/lib/learning-mode'
import { studentRootForMode } from '@/lib/navigation-policy'
import { isOnlineStudentPath } from '@/lib/student-online-route'
import { fourFromLastResults, formatPercentMetric, navScorePercent, paletteForIndex } from '@/lib/student-dashboard-helpers'
import { isStudentLegacySharedPath } from '@/lib/student-legacy-paths'
import { 
  LayoutDashboard, 
  LogOut, 
  User, 
  Menu, 
  X,
  GraduationCap,
  UserCog,
  Crown,
  Calendar,
  BookOpen,
  FileText,
  TrendingUp,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Shield,
  DollarSign,
  ClipboardList,
  Monitor,
  Trophy,
  Contact2,
  Briefcase,
  Layers,
  Medal,
  ClipboardCheck,
  ListChecks,
  Library,
  ShoppingCart,
} from 'lucide-react'

type DashboardNavLink = { href: string; label: string; icon: LucideIcon }
type DashboardNavSection = { sectionLabel: string }
type DashboardNavItem = DashboardNavLink | DashboardNavSection

const SUBJECT_INFINITY_SLOT_COUNT = 2

type SubjectInfinityRow = {
  subjectId: string
  subjectName: string
  infinityPoints: number
  isPlaceholder?: boolean
}

function padSubjectInfinityRows(
  rows: Array<{ subjectId: string; subjectName: string; infinityPoints: number }>
): SubjectInfinityRow[] {
  const result: SubjectInfinityRow[] = rows.slice(0, SUBJECT_INFINITY_SLOT_COUNT).map((r) => ({ ...r }))
  while (result.length < SUBJECT_INFINITY_SLOT_COUNT) {
    result.push({
      subjectId: `_slot_${result.length}`,
      subjectName: '—',
      infinityPoints: 0,
      isPlaceholder: true,
    })
  }
  return result
}

interface DashboardLayoutProps {
  children: React.ReactNode
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'MANAGER' | 'ASSISTANT_ADMIN' | 'RAHBAR' | 'XODIM'
}

const roleConfig: Record<
  DashboardLayoutProps['role'],
  { title: string; icon: LucideIcon; navItems: DashboardNavItem[] }
> = {
  STUDENT: {
    title: 'O\'quvchi Paneli',
    icon: GraduationCap,
    navItems: [
      { href: '/student/dashboard', label: 'Barcha fanlar', icon: LayoutDashboard },
      { href: '/student/lessons', label: 'Darslar', icon: BookOpen },
      { href: '/student/vazifa-topshirirish', label: 'Topshiriq', icon: ClipboardCheck },
      { href: '/student/payments', label: 'To\'lovlar', icon: DollarSign },
      { href: '/student/market', label: 'Marketpleys', icon: ShoppingCart },
    ],
  },
  TEACHER: {
    title: 'O\'qituvchi Paneli',
    icon: UserCog,
    navItems: [
      { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/teacher/groups', label: 'Guruhlar', icon: User },
      { href: '/teacher/attendance', label: 'Davomat Olish', icon: Calendar },
      { href: '/teacher/grading', label: 'Baholash', icon: BookOpen },
      { href: '/teacher/salary', label: 'Maosh', icon: User },
    ],
  },
      ADMIN: {
        title: 'Admin Paneli',
        icon: Crown,
        navItems: [
          { sectionLabel: 'Asosiy' },
          { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { sectionLabel: 'O‘quv markazi' },
          { href: '/admin/students', label: 'O\'quvchilar', icon: User },
          { href: '/admin/teachers', label: 'O\'qituvchilar', icon: UserCog },
          { href: '/admin/xodimlar', label: 'Xodimlar', icon: Briefcase },
          { sectionLabel: 'Dars jarayoni' },
          { href: '/admin/groups', label: 'Guruhlar', icon: User },
          { href: '/admin/schedules', label: 'Dars reja', icon: Calendar },
          { href: '/admin/tests', label: 'Topshiriqlar', icon: ListChecks },
          { sectionLabel: 'Moliya va rag‘bat' },
          { href: '/admin/payments', label: 'To\'lovlar', icon: DollarSign },
          { href: '/admin/infinity', label: 'Infinitylar', icon: TrendingUp },
          { href: '/admin/stipendiya', label: 'Spendiya', icon: Medal },
          { sectionLabel: 'Test tizimi' },
          { href: '/admin/testlar', label: 'Testlar', icon: Library },
          { href: '/admin/savollar', label: 'Savollar', icon: ClipboardList },
          { href: '/admin/vazifa-topshirirish', label: 'Vazifa topshirirish', icon: ClipboardCheck },
          { sectionLabel: 'Tahlil' },
          { href: '/admin/reports', label: 'Hisobotlar', icon: FileText },
          { href: '/admin/natijalar', label: 'Natijalar', icon: Trophy },
          { href: '/admin/reyting', label: 'Reyting', icon: Trophy },
          { sectionLabel: 'Savdo' },
          { href: '/admin/market', label: 'Marketpleys', icon: ShoppingCart },
          { sectionLabel: 'Qo‘shimcha' },
          { href: '/admin/malumotlar', label: 'Ma\'lumotlar', icon: Contact2 },
          { href: '/admin/subjects', label: 'Fanlar', icon: Layers },
          { href: '/admin/assisteng', label: 'Asistent', icon: Shield },
          { href: '/monitor', label: 'Monitor', icon: Monitor },
        ],
      },
      MANAGER: {
        title: 'Menejer Paneli',
        icon: Crown,
        navItems: [
          { sectionLabel: 'Asosiy' },
          { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { sectionLabel: 'O‘quv markazi' },
          { href: '/admin/students', label: 'O\'quvchilar', icon: User },
          { href: '/admin/teachers', label: 'O\'qituvchilar', icon: UserCog },
          { href: '/admin/xodimlar', label: 'Xodimlar', icon: Briefcase },
          { sectionLabel: 'Dars jarayoni' },
          { href: '/admin/groups', label: 'Guruhlar', icon: User },
          { href: '/admin/schedules', label: 'Dars reja', icon: Calendar },
          { href: '/admin/tests', label: 'Topshiriqlar', icon: ListChecks },
          { sectionLabel: 'Moliya va rag‘bat' },
          { href: '/admin/payments', label: 'To\'lovlar', icon: DollarSign },
          { href: '/admin/infinity', label: 'Infinitylar', icon: TrendingUp },
          { href: '/admin/stipendiya', label: 'Spendiya', icon: Medal },
          { sectionLabel: 'Test tizimi' },
          { href: '/admin/testlar', label: 'Testlar', icon: Library },
          { href: '/admin/savollar', label: 'Savollar', icon: ClipboardList },
          { href: '/admin/vazifa-topshirirish', label: 'Vazifa topshirirish', icon: ClipboardCheck },
          { sectionLabel: 'Tahlil' },
          { href: '/admin/reports', label: 'Hisobotlar', icon: FileText },
          { href: '/admin/natijalar', label: 'Natijalar', icon: Trophy },
          { href: '/admin/reyting', label: 'Reyting', icon: Trophy },
          { sectionLabel: 'Savdo' },
          { href: '/admin/market', label: 'Marketpleys', icon: ShoppingCart },
          { sectionLabel: 'Qo‘shimcha' },
          { href: '/admin/malumotlar', label: 'Ma\'lumotlar', icon: Contact2 },
          { href: '/admin/subjects', label: 'Fanlar', icon: Layers },
          { href: '/admin/assisteng', label: 'Asistent', icon: Shield },
          { href: '/monitor', label: 'Monitor', icon: Monitor },
        ],
      },
      ASSISTANT_ADMIN: {
        title: 'Yordamchi Admin Paneli',
        icon: UserCog,
        navItems: [
          { href: '/assistant-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/assistant-admin/payments', label: 'To\'lovlar', icon: User },
          { href: '/assistant-admin/students', label: 'Yangi o\'quvchilar', icon: User },
          { href: '/assistant-admin/reports', label: 'Hisobotlar', icon: FileText },
          { href: '/assistant-admin/schedules', label: 'Dars rejalari', icon: Calendar },
          { href: '/assistant-admin/tests', label: 'Testlar', icon: BookOpen },
          { href: '/assistant-admin/profile', label: 'Profil', icon: User },
        ],
      },
      RAHBAR: {
        title: 'Rahbar paneli',
        icon: Briefcase,
        navItems: [
          { href: '/rahbar/dashboard', label: 'Guruh hisobotlari', icon: FileText },
          { href: '/rahbar/natijalar', label: 'Natijalar', icon: Trophy },
          { sectionLabel: 'IQLASAN' },
          { href: '/rahbar/infinity', label: 'Infinity tahlili', icon: TrendingUp },
          { href: '/rahbar/infinitylar', label: 'Infinitylar', icon: Layers },
        ],
      },
      XODIM: {
        title: 'Xodim paneli',
        icon: Briefcase,
        navItems: [
          { href: '/xodim/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/xodim/tasks', label: 'Topshiriqlar', icon: ClipboardList },
          { href: '/xodim/faoliyat-paneli', label: 'Faoliyat paneli', icon: TrendingUp },
          { href: '/xodim/payments', label: 'To\'lovlar', icon: DollarSign },
          { href: '/xodim/jadval', label: 'Ish jadvali', icon: Calendar },
          { href: '/xodim/profile', label: 'Profil', icon: User },
        ],
      },
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const studentShell = useStudentShellRegistration()
  const [sidebarOpen, setSidebarOpen] = useState(false) // Mobile uchun
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Desktop uchun
  const [infinityPoints, setInfinityPoints] = useState(0)
  const [subjectInfinityBreakdown, setSubjectInfinityBreakdown] = useState<
    Array<{ subjectId: string; subjectName: string; infinityPoints: number }>
  >([])
  const [infinityLoading, setInfinityLoading] = useState(true)
  const [assistantAdminPermissions, setAssistantAdminPermissions] = useState<any>(null)
  const studentBasePath = studentRootForMode(normalizeLearningMode(session?.user?.learningMode))
  const isOnlineLightTheme =
    role === 'STUDENT' && (isOnlineStudentPath(pathname) || studentBasePath === '/student-online')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role && session.user.role !== role && role !== 'ADMIN' && role !== 'ASSISTANT_ADMIN') {
      // Redirect based on actual role
      if (session.user.role === 'ADMIN' || session.user.role === 'MANAGER') {
        router.push('/admin/dashboard')
      } else if (session.user.role === 'ASSISTANT_ADMIN') {
        router.push('/assistant-admin/dashboard')
      } else if (session.user.role === 'RAHBAR') {
        router.push('/rahbar/dashboard')
      } else if (session.user.role === 'TEACHER') {
        router.push('/teacher/dashboard')
      } else if (session.user.role === 'XODIM') {
        router.push('/xodim/dashboard')
      } else {
        router.push(`${studentBasePath}/dashboard`)
      }
    }
  }, [status, session, router, role, studentBasePath])

  // Fetch infinity points
  useEffect(() => {
    if (status === 'authenticated' && session) {
      const fetchInfinityPoints = async (opts?: { silent?: boolean }) => {
        if (!opts?.silent) setInfinityLoading(true)
        try {
          const response = await fetch('/api/user/infinity')
          if (response.ok) {
            const data = await response.json()
            setInfinityPoints(data.infinityPoints || 0)
            setSubjectInfinityBreakdown(
              Array.isArray(data.subjectInfinityBreakdown) ? data.subjectInfinityBreakdown : []
            )
          }
        } catch (error) {
          console.error('Error fetching infinity points:', error)
        } finally {
          setInfinityLoading(false)
        }
      }

      void fetchInfinityPoints()
      const interval = setInterval(() => void fetchInfinityPoints({ silent: true }), 60000) // 1 daqiqa
      return () => clearInterval(interval)
    }
    setInfinityLoading(false)
  }, [status, session])

  const subjectInfinitySlots = useMemo(
    () => padSubjectInfinityRows(subjectInfinityBreakdown),
    [subjectInfinityBreakdown]
  )

  // Fetch assistant admin permissions
  useEffect(() => {
    if (status === 'authenticated' && session && role === 'ASSISTANT_ADMIN') {
      const fetchPermissions = async () => {
        try {
          const response = await fetch('/api/assistant-admin/permissions')
          if (response.ok) {
            const data = await response.json()
            setAssistantAdminPermissions(data)
          }
        } catch (error) {
          console.error('Error fetching permissions:', error)
        }
      }
      fetchPermissions()
    }
  }, [status, session, role])

  if (status === 'loading') {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isOnlineLightTheme ? 'bg-[#eef2f6]' : 'bg-slate-900'
        }`}
      >
        <div className="text-center">
          <div
            className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${
              isOnlineLightTheme ? 'border-emerald-500' : 'border-green-500'
            }`}
          />
          <p className={`mt-4 ${isOnlineLightTheme ? 'text-slate-500' : 'text-gray-400'}`}>Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  // Assistant admin uchun ruxsatlar asosida dinamik bo'limlar
  let config = roleConfig[role]
  if (role === 'STUDENT') {
    config = {
      ...config,
      navItems: (config.navItems || []).map((item) => {
        if ('sectionLabel' in item) return item
        if (!item.href.startsWith('/student')) return item
        if (isStudentLegacySharedPath(item.href)) return item
        return { ...item, href: item.href.replace('/student', studentBasePath) }
      }),
    }
  }
  if (role === 'STUDENT' && studentBasePath === '/student-online') {
    const reytingHref = `${studentBasePath}/reyting`
    const reytingItem = { href: reytingHref, label: 'Reyting', icon: Trophy }
    const items = config.navItems || []
    const already = items.some((x) => !('sectionLabel' in x) && x.href === reytingHref)
    const tasksIdx = items.findIndex(
      (x) => !('sectionLabel' in x) && x.label === 'Topshiriq'
    )
    if (!already && tasksIdx !== -1) {
      config = {
        ...config,
        navItems: [...items.slice(0, tasksIdx + 1), reytingItem, ...items.slice(tasksIdx + 1)],
      }
    }
  }
  if (role === 'ASSISTANT_ADMIN' && assistantAdminPermissions) {
    const navItems: DashboardNavItem[] = [
      { href: '/assistant-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
    if (assistantAdminPermissions.payments?.view) {
      navItems.push({ href: '/assistant-admin/payments', label: 'To\'lovlar', icon: User })
    }
    if (assistantAdminPermissions.students?.view) {
      navItems.push({ href: '/assistant-admin/students', label: 'O\'quvchilar', icon: User })
    }
    if (assistantAdminPermissions.studentComments?.view) {
      navItems.push({ href: '/assistant-admin/student-comments', label: 'O\'quvchi fikrlari', icon: MessageSquare })
    }
    if (assistantAdminPermissions.groups?.view) {
      navItems.push({ href: '/assistant-admin/groups', label: 'Guruhlar', icon: User })
    }
    if (assistantAdminPermissions.teachers?.view) {
      navItems.push({ href: '/assistant-admin/teachers', label: 'O\'qituvchilar', icon: User })
    }
    if (assistantAdminPermissions.reports?.view) {
      navItems.push({ href: '/assistant-admin/reports', label: 'Hisobotlar', icon: FileText })
    }
    if (assistantAdminPermissions.schedules?.view) {
      navItems.push({ href: '/assistant-admin/schedules', label: 'Dars rejalari', icon: Calendar })
    }
    if (assistantAdminPermissions.tests?.view) {
      navItems.push({ href: '/assistant-admin/tests', label: 'Testlar', icon: BookOpen })
    }
    navItems.push({ href: '/assistant-admin/profile', label: 'Profil', icon: User })

    config = { ...config, navItems }
  }

  const Icon = config.icon
  const isAssistantAdminTheme = role === 'ASSISTANT_ADMIN'
  const isStudentTheme = role === 'STUDENT'
  const accentTextClass = isAssistantAdminTheme
    ? 'text-indigo-400'
    : isOnlineLightTheme
      ? 'text-emerald-600'
      : isStudentTheme
        ? 'text-emerald-400'
        : 'text-green-400'
  const activeItemClass = isAssistantAdminTheme
    ? 'bg-indigo-500/12 text-indigo-400 shadow-[inset_3px_0_0_0_#6366f1]'
    : isOnlineLightTheme
      ? 'online-nav-active'
      : isStudentTheme
        ? 'bg-sky-500/18 text-sky-100 shadow-[inset_3px_0_0_0_#38bdf8] border border-sky-500/30'
        : 'bg-green-500/20 text-green-400 border border-green-500/30'
  const hoverItemClass = isAssistantAdminTheme
    ? 'hover:bg-white/5 hover:text-[var(--text-primary)]'
    : isOnlineLightTheme
      ? 'online-nav-idle'
      : isStudentTheme
        ? 'hover:bg-slate-800 hover:text-white'
        : 'hover:bg-slate-700 hover:text-white'
  const navIdleTextClass = isOnlineLightTheme ? '' : 'text-[var(--text-secondary)]'

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' })
  }

  return (
    <StudentThemeProvider theme={isOnlineLightTheme ? 'online-light' : 'dark'}>
    <div
      className={`min-h-screen flex overflow-x-hidden overflow-y-auto font-sans ${
        isAssistantAdminTheme
          ? 'bg-[var(--bg-primary)]'
          : isOnlineLightTheme
            ? 'online-shell online-page-bg'
            : isStudentTheme
              ? 'bg-[#070a0f]'
              : 'bg-slate-900'
      }`}
    >
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 pt-[env(safe-area-inset-top,0px)] transform transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'} w-[280px] max-w-[min(280px,100vw-3rem)] ${
        isAssistantAdminTheme
          ? 'assistant-glass border-r border-[var(--border-subtle)]'
          : isOnlineLightTheme
            ? 'bg-white border-r border-gray-200 shadow-sm'
            : isStudentTheme
              ? 'bg-slate-900 border-r border-slate-800'
              : 'bg-slate-800 border-r border-gray-700'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div
            className={`flex items-center justify-between gap-2 border-b ${
              isOnlineLightTheme ? 'px-3 py-4' : 'px-4 py-5'
            } ${
              isAssistantAdminTheme
                ? 'border-[var(--border-subtle)]'
                : isOnlineLightTheme
                  ? 'border-slate-200'
                  : isStudentTheme
                    ? 'border-slate-800'
                    : 'border-gray-700'
            }`}
          >
            <Link
              href="/"
              className={`flex min-w-0 items-center ${
                sidebarCollapsed ? 'justify-center w-full' : isOnlineLightTheme ? 'flex-1' : 'gap-2'
              }`}
            >
              {isOnlineLightTheme ? (
                <RashUzLogo variant={sidebarCollapsed ? 'mark' : 'full'} />
              ) : isStudentTheme ? (
                sidebarCollapsed ? (
                  <span className="text-[16px] font-black bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                    r
                  </span>
                ) : (
                  <span className="text-[18px] font-bold tracking-tight bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
                    rash.uz
                  </span>
                )
              ) : (
                <>
                  <Icon className={`h-6 w-6 flex-shrink-0 ${accentTextClass}`} />
                  {!sidebarCollapsed && isAssistantAdminTheme && (
                    <div>
                      <span className="text-[18px] font-bold bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent">RASH</span>
                      <p className="text-[11px] text-[var(--text-muted)] tracking-wider">Assistant Panel</p>
                    </div>
                  )}
                  {!sidebarCollapsed && !isAssistantAdminTheme && (
                    <span className="font-semibold text-white truncate">{config.title}</span>
                  )}
                </>
              )}
            </Link>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex p-1.5 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
                aria-label="Toggle sidebar"
              >
                {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </button>
              {sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Infinity Counter - faqat rash.uz uchun */}
          {status === 'authenticated' &&
            session &&
            !isAssistantAdminTheme &&
            session.user?.role !== 'RAHBAR' &&
            session.user?.role !== 'XODIM' && (
            <div
              className={`px-3 py-3 border-b ${
                isOnlineLightTheme ? 'border-slate-200' : isStudentTheme ? 'border-slate-800' : 'border-gray-700'
              } ${sidebarCollapsed ? 'flex justify-center' : ''}`}
            >
              {!isStudentTheme ? (
                <div
                  className={`flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 ${
                    isStudentTheme
                      ? 'bg-slate-800/80 border border-emerald-500/25'
                      : 'bg-slate-700/50 border border-green-500/40'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <span
                    className={`text-lg font-black bg-clip-text text-transparent bg-gradient-to-r ${
                      isStudentTheme ? 'from-emerald-400 to-teal-300' : 'from-green-400 to-teal-400'
                    }`}
                  >
                    ∞
                  </span>
                  {!sidebarCollapsed && <span className="text-white text-sm font-semibold">{infinityPoints}</span>}
                  {sidebarCollapsed && <span className="text-white text-xs font-bold">{infinityPoints}</span>}
                </div>
              ) : null}
              {!sidebarCollapsed && isStudentTheme ? (
                <div
                  className={`mt-2 flex h-[4.75rem] min-h-[4.75rem] flex-col justify-center gap-1 rounded-[var(--radius-md)] px-2.5 py-2 ${
                    isOnlineLightTheme
                      ? 'border border-emerald-100 bg-emerald-50/80'
                      : 'border border-slate-700/70 bg-slate-800/50'
                  }`}
                  aria-label="Fan bo'yicha infinity"
                >
                  {infinityLoading ? (
                    <>
                      <div
                        className={`h-[1.375rem] w-full animate-pulse rounded ${
                          isOnlineLightTheme ? 'bg-emerald-100' : 'bg-slate-700/80'
                        }`}
                      />
                      <div
                        className={`h-[1.375rem] w-full animate-pulse rounded ${
                          isOnlineLightTheme ? 'bg-emerald-100' : 'bg-slate-700/80'
                        }`}
                      />
                    </>
                  ) : (
                    subjectInfinitySlots.map((row) => (
                      <div
                        key={row.subjectId}
                        className="flex h-[1.375rem] min-h-[1.375rem] items-center justify-between gap-2 text-xs leading-none"
                      >
                        <span
                          className={`truncate ${
                            row.isPlaceholder
                              ? isOnlineLightTheme
                                ? 'text-slate-400/60'
                                : 'text-slate-500/50'
                              : isOnlineLightTheme
                                ? 'text-slate-700'
                                : 'text-slate-300'
                          }`}
                        >
                          {row.subjectName}
                        </span>
                        <span
                          className={`shrink-0 font-semibold tabular-nums ${
                            row.isPlaceholder
                              ? isOnlineLightTheme
                                ? 'text-emerald-600/40'
                                : 'text-emerald-300/40'
                              : isOnlineLightTheme
                                ? 'text-emerald-600'
                                : 'text-emerald-300'
                          }`}
                        >
                          {row.infinityPoints} ∞
                        </span>
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Navigation — <a> + router.push: bosganda ishonchli o'tish */}
          <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
            {isStudentTheme &&
              !sidebarCollapsed &&
              pathname === `${studentBasePath}/dashboard` &&
              studentShell &&
              studentShell.enrollments.length > 0 && (
                <div
                  className={`pb-3 mb-2 border-b space-y-2 ${
                    isOnlineLightTheme ? 'border-emerald-100' : 'border-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      startTransition(() => {
                        studentShell.setDashboardNav('overview')
                      })
                      setSidebarOpen(false)
                      router.push(`${studentBasePath}/dashboard`)
                    }}
                    className={`w-full flex items-center gap-3 min-h-[44px] sm:min-h-[42px] touch-manipulation px-3 rounded-2xl text-left text-[14px] font-semibold transition-all ${
                      studentShell.dashboardNav === 'overview'
                        ? isOnlineLightTheme
                          ? 'online-nav-active online-sidebar-glow'
                          : 'bg-sky-500/18 text-sky-100 border border-sky-500/30 shadow-[inset_3px_0_0_0_#38bdf8]'
                        : isOnlineLightTheme
                          ? 'online-nav-idle border border-transparent'
                          : 'text-slate-300 border border-slate-600/50 hover:border-sky-500/35 hover:bg-slate-800/90'
                    }`}
                  >
                    <LayoutDashboard className="h-[18px] w-[18px] flex-shrink-0" />
                    <span className="truncate">Barcha fanlar</span>
                  </button>
                  <div className="pt-1">
                    <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Fanlar
                    </div>
                    <div className="space-y-0.5">
                      {studentShell.enrollments.map((e, i) => {
                        const pg = studentShell.perGroupStats[e.groupId]
                        if (!pg) return null
                        const f = fourFromLastResults(pg.lastResults)
                        const pct = navScorePercent(f)
                        const p = paletteForIndex(i)
                        const active = studentShell.dashboardNav === e.groupId
                        return (
                          <button
                            type="button"
                            key={e.groupId}
                            onClick={() => {
                              startTransition(() => {
                                studentShell.setDashboardNav(e.groupId)
                              })
                              setSidebarOpen(false)
                              if (pathname !== `${studentBasePath}/dashboard`) router.push(`${studentBasePath}/dashboard`)
                            }}
                            className={`w-full flex items-center gap-2 min-h-[44px] sm:min-h-[40px] touch-manipulation py-2 sm:py-1.5 px-3 rounded-2xl text-left text-[13px] font-semibold transition-colors ${
                              active
                                ? isOnlineLightTheme
                                  ? 'online-nav-active'
                                  : 'bg-sky-500/15 text-sky-100 border border-sky-500/25'
                                : isOnlineLightTheme
                                  ? 'online-nav-idle border border-transparent'
                                  : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                              style={{ backgroundColor: p.color }}
                            />
                            <span className="truncate flex-1 min-w-0">{e.subjectName || e.groupName}</span>
                            <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: p.color }}>
                              {formatPercentMetric(pct)}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            {config.navItems.map((item, navIdx) => {
              if ('sectionLabel' in item) {
                if (sidebarCollapsed) return null
                return (
                  <div
                    key={`section-${item.sectionLabel}-${navIdx}`}
                    className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {item.sectionLabel}
                  </div>
                )
              }
              const ItemIcon = item.icon
              const isActive = pathname === item.href
              const hideDashboardDuplicate =
                isStudentTheme &&
                pathname === `${studentBasePath}/dashboard` &&
                studentShell &&
                studentShell.enrollments.length > 0 &&
                item.href === `${studentBasePath}/dashboard`
              if (hideDashboardDuplicate) return null
              return (
                <a
                  key={`${navIdx}-${item.href}`}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault()
                    setSidebarOpen(false)
                    if (role === 'STUDENT' && item.href === `${studentBasePath}/dashboard` && studentShell) {
                      startTransition(() => {
                        studentShell.setDashboardNav('overview')
                      })
                    }
                    router.push(item.href)
                  }}
                  className={`flex items-center gap-3 h-[42px] px-3 rounded-xl text-[14px] font-medium transition-all duration-150 ${
                    sidebarCollapsed ? 'justify-center px-0' : ''
                  } ${isActive ? activeItemClass : `${navIdleTextClass} ${hoverItemClass}`}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <ItemIcon className="h-[18px] w-[18px] flex-shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </a>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          <div
            className={`p-4 border-t ${
              isAssistantAdminTheme
                ? 'border-[var(--border-subtle)]'
                : isOnlineLightTheme
                  ? 'border-slate-200'
                  : isStudentTheme
                    ? 'border-slate-800'
                    : 'border-gray-700'
            }`}
          >
            {!sidebarCollapsed &&
              (isStudentTheme ? (
                <div
                  className={`mb-3 flex items-center gap-3 px-2 py-2.5 rounded-lg ${
                    isOnlineLightTheme
                      ? 'border border-emerald-100 bg-emerald-50/70'
                      : 'bg-slate-800/70 border border-slate-700/60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 ${
                      isOnlineLightTheme
                        ? 'bg-gradient-to-br from-emerald-400 to-green-600'
                        : 'bg-gradient-to-br from-sky-500 to-emerald-700'
                    }`}
                  >
                    {(session.user?.name || session.user?.email || '?')
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((x) => x[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[13px] font-semibold truncate ${
                        isOnlineLightTheme ? 'text-slate-800' : 'text-white'
                      }`}
                    >
                      {session.user?.name || "O'quvchi"}
                    </p>
                    <p className={`text-[11px] truncate ${isOnlineLightTheme ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {isOnlineLightTheme ? "O'quvchi" : session.user?.email || ''}
                    </p>
                  </div>
                </div>
              ) : (
                <div className={`mb-3 px-3 py-2 rounded-[var(--radius-md)] ${isAssistantAdminTheme ? 'bg-white/[0.04]' : 'bg-slate-700/50'}`}>
                  <p className="text-[12px] text-[var(--text-muted)]">Foydalanuvchi</p>
                  <p className="text-[14px] font-medium text-[var(--text-primary)] truncate">{session.user?.name || session.user?.email || 'User'}</p>
                </div>
              ))}
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center gap-3 h-[42px] px-3 rounded-[var(--radius-md)] text-[14px] font-medium text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400 transition-colors ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
              title={sidebarCollapsed ? 'Chiqish' : undefined}
            >
              <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
              {!sidebarCollapsed && <span>Chiqish</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ml-0 ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'}`}>
        {!sidebarOpen && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSidebarOpen(true) }}
            className={`lg:hidden fixed left-4 z-[60] p-3 rounded-[var(--radius-md)] shadow-lg min-h-[48px] min-w-[48px] top-[max(1rem,env(safe-area-inset-top,0px))] ${
              isAssistantAdminTheme
                ? 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white border border-[var(--border-default)]'
                : isOnlineLightTheme
                  ? 'bg-white text-slate-600 hover:text-emerald-700 border border-slate-200'
                  : 'bg-slate-800 text-gray-400 hover:text-white border border-gray-700'
            }`}
            aria-label="Open menu"
            style={{ touchAction: 'manipulation' }}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <main
          className={`flex-1 w-full min-w-0 max-w-full overflow-y-auto overflow-x-auto px-4 pt-14 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:px-5 sm:pt-5 sm:pb-5 lg:px-6 lg:pt-6 lg:pb-6 xl:px-8 xl:pb-8 ${
            isOnlineLightTheme
              ? 'text-slate-800 selection:bg-emerald-200/60 selection:text-slate-900'
              : isStudentTheme
                ? 'text-slate-100 selection:bg-emerald-500/25 selection:text-white'
                : ''
          }`}
        >
          <div className="w-full min-w-0 max-w-full">{children}</div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{ touchAction: 'manipulation' }}
        />
      )}
    </div>
    </StudentThemeProvider>
  )
}
