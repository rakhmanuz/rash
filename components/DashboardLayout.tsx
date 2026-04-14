'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, startTransition } from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { useStudentShellRegistration } from '@/components/student-shell-context'
import { fourFromLastResults, navScorePercent, paletteForIndex } from '@/lib/student-dashboard-helpers'
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
} from 'lucide-react'

type DashboardNavLink = { href: string; label: string; icon: LucideIcon }
type DashboardNavSection = { sectionLabel: string }
type DashboardNavItem = DashboardNavLink | DashboardNavSection

interface DashboardLayoutProps {
  children: React.ReactNode
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'MANAGER' | 'ASSISTANT_ADMIN' | 'RAHBAR'
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
      { href: '/student/attendance', label: 'Davomat', icon: User },
      { href: '/student/payments', label: 'To\'lovlar', icon: DollarSign },
      { href: '/student/stipendiya', label: 'Stipendiya', icon: Medal },
      { href: '/student/vazifa-topshirirish', label: 'Vazifa topshirirish', icon: ClipboardCheck },
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
          { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { sectionLabel: 'Markaz va moliya' },
          { href: '/admin/students', label: 'O\'quvchilar', icon: User },
          { href: '/admin/malumotlar', label: 'Ma\'lumotlar', icon: Contact2 },
          { href: '/admin/payments', label: 'To\'lovlar', icon: DollarSign },
          { href: '/admin/subjects', label: 'Fanlar', icon: Layers },
          { href: '/admin/groups', label: 'Guruhlar', icon: User },
          { sectionLabel: 'O\'qituv va jadval' },
          { href: '/admin/schedules', label: 'Dars rejasi', icon: Calendar },
          { href: '/admin/teachers', label: 'O\'qituvchilar', icon: UserCog },
          { sectionLabel: 'Test va topshiriqlar' },
          { href: '/admin/testlar', label: 'Testlar', icon: Library },
          { href: '/admin/tests', label: 'Topshiriqlar', icon: ListChecks },
          { href: '/admin/natijalar', label: 'Natijalar', icon: Trophy },
          { href: '/admin/savollar', label: 'Savollar', icon: ClipboardList },
          { href: '/admin/vazifa-topshirirish', label: 'Vazifa topshirirish', icon: ClipboardCheck },
          { sectionLabel: 'Rag\'bat va savdo' },
          { href: '/admin/stipendiya', label: 'Stipendiya', icon: Medal },
          { href: '/admin/infinity', label: 'Infinitylar', icon: TrendingUp },
          { sectionLabel: 'Qo\'llab-quvvatlash' },
          { href: '/admin/course-feedback', label: 'Kurs fikrlari', icon: MessageSquare },
          { sectionLabel: 'Tahlil va nazorat' },
          { href: '/admin/reports', label: 'Hisobotlar', icon: FileText },
          { href: '/admin/assisteng', label: 'Assisteng', icon: Shield },
          { href: '/monitor', label: 'Monitor', icon: Monitor },
        ],
      },
      MANAGER: {
        title: 'Menejer Paneli',
        icon: Crown,
        navItems: [
          { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { sectionLabel: 'Markaz va moliya' },
          { href: '/admin/students', label: 'O\'quvchilar', icon: User },
          { href: '/admin/malumotlar', label: 'Ma\'lumotlar', icon: Contact2 },
          { href: '/admin/payments', label: 'To\'lovlar', icon: DollarSign },
          { href: '/admin/subjects', label: 'Fanlar', icon: Layers },
          { href: '/admin/groups', label: 'Guruhlar', icon: User },
          { sectionLabel: 'O\'qituv va jadval' },
          { href: '/admin/schedules', label: 'Dars rejasi', icon: Calendar },
          { href: '/admin/teachers', label: 'O\'qituvchilar', icon: UserCog },
          { sectionLabel: 'Test va topshiriqlar' },
          { href: '/admin/testlar', label: 'Testlar', icon: Library },
          { href: '/admin/tests', label: 'Topshiriqlar', icon: ListChecks },
          { href: '/admin/natijalar', label: 'Natijalar', icon: Trophy },
          { href: '/admin/savollar', label: 'Savollar', icon: ClipboardList },
          { href: '/admin/vazifa-topshirirish', label: 'Vazifa topshirirish', icon: ClipboardCheck },
          { sectionLabel: 'Rag\'bat va savdo' },
          { href: '/admin/stipendiya', label: 'Stipendiya', icon: Medal },
          { href: '/admin/infinity', label: 'Infinitylar', icon: TrendingUp },
          { sectionLabel: 'Qo\'llab-quvvatlash' },
          { href: '/admin/course-feedback', label: 'Kurs fikrlari', icon: MessageSquare },
          { sectionLabel: 'Tahlil va nazorat' },
          { href: '/admin/reports', label: 'Hisobotlar', icon: FileText },
          { href: '/admin/assisteng', label: 'Assisteng', icon: Shield },
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
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const studentShell = useStudentShellRegistration()
  const [sidebarOpen, setSidebarOpen] = useState(false) // Mobile uchun
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Desktop uchun
  const [infinityPoints, setInfinityPoints] = useState(0)
  const [assistantAdminPermissions, setAssistantAdminPermissions] = useState<any>(null)

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
      } else {
        router.push('/student/dashboard')
      }
    }
  }, [status, session, router, role])

  // Fetch infinity points
  useEffect(() => {
    if (status === 'authenticated' && session) {
      const fetchInfinityPoints = async () => {
        try {
          const response = await fetch('/api/user/infinity')
          if (response.ok) {
            const data = await response.json()
            setInfinityPoints(data.infinityPoints || 0)
          }
        } catch (error) {
          console.error('Error fetching infinity points:', error)
        }
      }

      fetchInfinityPoints()
      const interval = setInterval(fetchInfinityPoints, 60000) // 1 daqiqa
      return () => clearInterval(interval)
    }
  }, [status, session])

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
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  // Assistant admin uchun ruxsatlar asosida dinamik bo'limlar
  let config = roleConfig[role]
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
    : isStudentTheme
      ? 'text-emerald-400'
      : 'text-green-400'
  const activeItemClass = isAssistantAdminTheme
    ? 'bg-indigo-500/12 text-indigo-400 shadow-[inset_3px_0_0_0_#6366f1]'
    : isStudentTheme
      ? 'bg-sky-500/18 text-sky-100 shadow-[inset_3px_0_0_0_#38bdf8] border border-sky-500/30'
      : 'bg-green-500/20 text-green-400 border border-green-500/30'
  const hoverItemClass = isAssistantAdminTheme
    ? 'hover:bg-white/5 hover:text-[var(--text-primary)]'
    : isStudentTheme
      ? 'hover:bg-slate-800 hover:text-white'
      : 'hover:bg-slate-700 hover:text-white'

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' })
  }

  return (
    <div
      className={`min-h-screen flex overflow-x-hidden overflow-y-auto font-sans ${
        isAssistantAdminTheme ? 'bg-[var(--bg-primary)]' : isStudentTheme ? 'bg-[#070a0f]' : 'bg-slate-900'
      }`}
    >
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 pt-[env(safe-area-inset-top,0px)] transform transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'} w-[280px] max-w-[min(280px,100vw-3rem)] ${
        isAssistantAdminTheme
          ? 'assistant-glass border-r border-[var(--border-subtle)]'
          : isStudentTheme
            ? 'bg-slate-900 border-r border-slate-800'
            : 'bg-slate-800 border-r border-gray-700'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div
            className={`flex items-center justify-between px-4 py-5 border-b ${
              isAssistantAdminTheme ? 'border-[var(--border-subtle)]' : isStudentTheme ? 'border-slate-800' : 'border-gray-700'
            }`}
          >
            <Link href="/" className={`flex items-center gap-2 ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
              {isStudentTheme ? (
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
          {status === 'authenticated' && session && !isAssistantAdminTheme && session.user?.role !== 'RAHBAR' && (
            <div
              className={`px-3 py-3 border-b ${isStudentTheme ? 'border-slate-800' : 'border-gray-700'} ${sidebarCollapsed ? 'flex justify-center' : ''}`}
            >
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
            </div>
          )}

          {/* Navigation — <a> + router.push: bosganda ishonchli o'tish */}
          <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
            {isStudentTheme &&
              !sidebarCollapsed &&
              pathname === '/student/dashboard' &&
              studentShell &&
              studentShell.enrollments.length > 0 && (
                <div className="pb-3 mb-2 border-b border-slate-800 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      startTransition(() => {
                        studentShell.setDashboardNav('overview')
                      })
                      setSidebarOpen(false)
                      router.push('/student/dashboard')
                    }}
                    className={`w-full flex items-center gap-3 min-h-[44px] sm:min-h-[42px] touch-manipulation px-3 rounded-lg text-left text-[14px] font-medium transition-all ${
                      studentShell.dashboardNav === 'overview'
                        ? 'bg-sky-500/18 text-sky-100 border border-sky-500/30 shadow-[inset_3px_0_0_0_#38bdf8]'
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
                              if (pathname !== '/student/dashboard') router.push('/student/dashboard')
                            }}
                            className={`w-full flex items-center gap-2 min-h-[44px] sm:min-h-[40px] touch-manipulation py-2 sm:py-1.5 px-3 rounded-lg text-left text-[13px] font-medium transition-colors ${
                              active
                                ? 'bg-sky-500/15 text-sky-100 border border-sky-500/25'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                              style={{ backgroundColor: p.color }}
                            />
                            <span className="truncate flex-1 min-w-0">{e.subjectName || e.groupName}</span>
                            <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: p.color }}>
                              {pct}%
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
                pathname === '/student/dashboard' &&
                studentShell &&
                studentShell.enrollments.length > 0 &&
                item.href === '/student/dashboard'
              if (hideDashboardDuplicate) return null
              return (
                <a
                  key={`${navIdx}-${item.href}`}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault()
                    setSidebarOpen(false)
                    if (role === 'STUDENT' && item.href === '/student/dashboard' && studentShell) {
                      startTransition(() => {
                        studentShell.setDashboardNav('overview')
                      })
                    }
                    router.push(item.href)
                  }}
                  className={`flex items-center gap-3 h-[42px] px-3 rounded-[var(--radius-md)] text-[14px] font-medium transition-all duration-150 ${
                    sidebarCollapsed ? 'justify-center px-0' : ''
                  } ${isActive ? activeItemClass : `text-[var(--text-secondary)] ${hoverItemClass}`}`}
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
              isAssistantAdminTheme ? 'border-[var(--border-subtle)]' : isStudentTheme ? 'border-slate-800' : 'border-gray-700'
            }`}
          >
            {!sidebarCollapsed &&
              (isStudentTheme ? (
                <div className="mb-3 flex items-center gap-3 px-2 py-2.5 rounded-lg bg-slate-800/70 border border-slate-700/60">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-emerald-700 flex items-center justify-center text-[12px] font-bold text-white shrink-0">
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
                    <p className="text-[13px] font-semibold text-white truncate">
                      {session.user?.name || "O'quvchi"}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{session.user?.email || ''}</p>
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
            isStudentTheme ? 'text-slate-100 selection:bg-emerald-500/25 selection:text-white' : ''
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
  )
}
