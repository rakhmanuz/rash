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
  ChevronRight
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'MANAGER'
}

const roleConfig = {
  STUDENT: {
    title: 'O\'quvchi Paneli',
    icon: GraduationCap,
    navItems: [
      { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/student/attendance', label: 'Davomat', icon: User },
      { href: '/student/grades', label: 'Baholar', icon: User },
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role && session.user.role !== role && role !== 'ADMIN') {
      // Redirect based on actual role
      if (session.user.role === 'ADMIN' || session.user.role === 'MANAGER') {
        router.push('/admin/dashboard')
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
      const interval = setInterval(fetchInfinityPoints, 5000)
      return () => clearInterval(interval)
    }
  }, [status, session])

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

  const config = roleConfig[role]
  const Icon = config.icon

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-[55] bg-slate-800 border-r border-gray-700 transform transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
      } w-64`}>
        <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-gray-700">
                <Link href="/" className={`flex items-center space-x-2 group ${sidebarCollapsed ? 'justify-center' : ''}`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-green-500 group-hover:text-green-400 transition-colors flex-shrink-0" />
                </Link>
            <div className="flex items-center space-x-2">
              {/* Desktop collapse button */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex text-gray-400 hover:text-white transition-colors"
                aria-label="Toggle sidebar"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
              </button>
              {/* Mobile close button - faqat sidebar ochilganda ko'rinadi */}
              {sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden text-gray-400 hover:text-white p-1"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              )}
            </div>
          </div>

          {/* Infinity Counter */}
          {status === 'authenticated' && session && (
            <div className={`px-2 sm:px-4 py-2 sm:py-3 border-b border-gray-700 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
              <div className={`flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-slate-700/50 to-slate-800/50 backdrop-blur-md border border-green-500/40 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <span className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                  ∞
                </span>
                {!sidebarCollapsed && (
                  <span className="text-white text-xs sm:text-sm font-bold truncate">{infinityPoints}</span>
                )}
                {sidebarCollapsed && (
                  <span className="text-white text-xs font-bold">{infinityPoints}</span>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-2 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
            {config.navItems.map((item) => {
              const ItemIcon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)} // Mobile'da sidebar'ni yopish
                  className={`flex items-center space-x-2 sm:space-x-3 px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-300 rounded-lg transition-colors group ${
                    sidebarCollapsed ? 'justify-center' : ''
                  } ${
                    isActive 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'hover:bg-slate-700 hover:text-white'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <ItemIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="whitespace-nowrap truncate">{item.label}</span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-2 sm:p-4 border-t border-gray-700">
            {!sidebarCollapsed && (
              <div className="mb-2 sm:mb-4 px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-700/50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-400">Foydalanuvchi</p>
                <p className="text-white text-xs sm:text-sm font-medium truncate">{session.user?.name || session.user?.email || 'User'}</p>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center space-x-2 sm:space-x-3 px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-300 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
              title={sidebarCollapsed ? 'Chiqish' : undefined}
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="truncate">Chiqish</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Mobile menu button - floating - faqat sidebar yopilganda ko'rinadi */}
        {!sidebarOpen && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setSidebarOpen(true)
            }}
            className="lg:hidden fixed top-3 left-3 sm:top-4 sm:left-4 z-[60] bg-slate-800 text-gray-400 hover:text-white p-2 rounded-lg border border-gray-700 shadow-lg active:bg-slate-700"
            aria-label="Open menu"
            style={{ touchAction: 'manipulation' }}
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        )}

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 overflow-y-auto w-full max-w-full">
          <div className="w-full max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[50] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{ touchAction: 'manipulation' }}
        />
      )}
    </div>
  )
}
