'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  ShoppingCart,
  TrendingUp,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'MANAGER' | 'ASSISTANT_ADMIN'
}

const roleConfig = {
  STUDENT: {
    title: 'O\'quvchi Paneli',
    icon: GraduationCap,
    navItems: [
      { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/student/attendance', label: 'Davomat', icon: User },
      { href: '/student/payments', label: 'To\'lovlar', icon: User },
      { href: '/student/market', label: 'Market', icon: ShoppingCart },
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
      { href: '/teacher/market', label: 'Market', icon: ShoppingCart },
    ],
  },
      ADMIN: {
        title: 'Admin Paneli',
        icon: Crown,
        navItems: [
          { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/admin/students', label: 'O\'quvchilar', icon: User },
          { href: '/admin/teachers', label: 'O\'qituvchilar', icon: User },
          { href: '/admin/groups', label: 'Guruhlar', icon: User },
          { href: '/admin/schedules', label: 'Dars Rejasi', icon: Calendar },
          { href: '/admin/tests', label: 'Testlar', icon: BookOpen },
          { href: '/admin/payments', label: 'To\'lovlar', icon: User },
          { href: '/admin/market', label: 'Market', icon: ShoppingCart },
          { href: '/admin/infinity', label: 'Infinitylar', icon: TrendingUp },
          { href: '/admin/course-feedback', label: 'Kurs Fikrlari', icon: MessageSquare },
          { href: '/admin/reports', label: 'Hisobotlar', icon: FileText },
          { href: '/admin/assisteng', label: 'Assisteng', icon: Shield },
        ],
      },
      MANAGER: {
        title: 'Menejer Paneli',
        icon: Crown,
        navItems: [
          { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/admin/infinity', label: 'Infinitylar', icon: TrendingUp },
          { href: '/admin/students', label: 'O\'quvchilar', icon: User },
          { href: '/admin/teachers', label: 'O\'qituvchilar', icon: User },
          { href: '/admin/groups', label: 'Guruhlar', icon: User },
          { href: '/admin/schedules', label: 'Dars Rejasi', icon: Calendar },
          { href: '/admin/tests', label: 'Testlar', icon: BookOpen },
          { href: '/admin/payments', label: 'To\'lovlar', icon: User },
          { href: '/admin/market', label: 'Market', icon: ShoppingCart },
          { href: '/admin/course-feedback', label: 'Kurs Fikrlari', icon: MessageSquare },
          { href: '/admin/reports', label: 'Hisobotlar', icon: FileText },
          { href: '/admin/assisteng', label: 'Assisteng', icon: Shield },
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
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
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
    const navItems: any[] = [
      { href: '/assistant-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
    if (assistantAdminPermissions.payments?.view) {
      navItems.push({ href: '/assistant-admin/payments', label: 'To\'lovlar', icon: User })
    }
    if (assistantAdminPermissions.students?.view) {
      navItems.push({ href: '/assistant-admin/students', label: 'O\'quvchilar', icon: User })
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
    if (assistantAdminPermissions.market?.view) {
      navItems.push({ href: '/assistant-admin/market', label: 'Market', icon: ShoppingCart })
    }
    navItems.push({ href: '/assistant-admin/profile', label: 'Profil', icon: User })

    config = { ...config, navItems }
  }

  const Icon = config.icon
  const isAssistantAdminTheme = role === 'ASSISTANT_ADMIN'
  const accentTextClass = isAssistantAdminTheme ? 'text-indigo-400' : 'text-green-400'
  const activeItemClass = isAssistantAdminTheme
    ? 'bg-indigo-500/12 text-indigo-400 shadow-[inset_3px_0_0_0_#6366f1]'
    : 'bg-green-500/20 text-green-400 border border-green-500/30'
  const hoverItemClass = isAssistantAdminTheme
    ? 'hover:bg-white/5 hover:text-[var(--text-primary)]'
    : 'hover:bg-slate-700 hover:text-white'

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' })
  }

  return (
    <div className={`min-h-screen flex overflow-hidden font-sans ${isAssistantAdminTheme ? 'bg-[var(--bg-primary)]' : 'bg-slate-900'}`}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[55] transform transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'} w-[280px] ${
        isAssistantAdminTheme 
          ? 'assistant-glass border-r border-[var(--border-subtle)]' 
          : 'bg-slate-800 border-r border-gray-700'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center justify-between px-4 py-5 border-b ${isAssistantAdminTheme ? 'border-[var(--border-subtle)]' : 'border-gray-700'}`}>
            <Link href="/" className={`flex items-center gap-2 ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
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
          {status === 'authenticated' && session && !isAssistantAdminTheme && (
            <div className={`px-3 py-3 border-b border-gray-700 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
              <div className={`flex items-center gap-2 bg-slate-700/50 border border-green-500/40 rounded-[var(--radius-md)] px-3 py-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <span className="text-lg font-black bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">∞</span>
                {!sidebarCollapsed && <span className="text-white text-sm font-semibold">{infinityPoints}</span>}
                {sidebarCollapsed && <span className="text-white text-xs font-bold">{infinityPoints}</span>}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
            {config.navItems.map((item) => {
              const ItemIcon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 h-[42px] px-3 rounded-[var(--radius-md)] text-[14px] font-medium transition-all duration-150 ${
                    sidebarCollapsed ? 'justify-center px-0' : ''
                  } ${isActive ? activeItemClass : `text-[var(--text-secondary)] ${hoverItemClass}`}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <ItemIcon className="h-[18px] w-[18px] flex-shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          <div className={`p-4 border-t ${isAssistantAdminTheme ? 'border-[var(--border-subtle)]' : 'border-gray-700'}`}>
            {!sidebarCollapsed && (
              <div className={`mb-3 px-3 py-2 rounded-[var(--radius-md)] ${isAssistantAdminTheme ? 'bg-white/[0.04]' : 'bg-slate-700/50'}`}>
                <p className="text-[12px] text-[var(--text-muted)]">Foydalanuvchi</p>
                <p className="text-[14px] font-medium text-[var(--text-primary)] truncate">{session.user?.name || session.user?.email || 'User'}</p>
              </div>
            )}
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
      <div className={`flex-1 flex flex-col transition-all duration-300 ml-0 ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'}`}>
        {!sidebarOpen && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSidebarOpen(true) }}
            className={`lg:hidden fixed top-4 left-4 z-[60] p-2.5 rounded-[var(--radius-md)] shadow-lg min-h-[44px] ${
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

        <main className="flex-1 p-4 sm:p-5 lg:p-6 xl:p-8 overflow-y-auto w-full max-w-full">
          <div className="w-full max-w-[1200px] mx-auto">{children}</div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{ touchAction: 'manipulation' }}
        />
      )}
    </div>
  )
}
