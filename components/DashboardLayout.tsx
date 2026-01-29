'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
  const [sidebarOpen, setSidebarOpen] = useState(false) // Mobile uchun
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Desktop uchun

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
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 bg-slate-800 border-r border-gray-700 transform transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
      } w-64`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <Link href="/" className={`flex items-center space-x-2 group ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <Icon className="h-7 w-7 text-green-500 group-hover:text-green-400 transition-colors flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="text-2xl font-black tracking-tight">
                  <span className="text-white">RASH</span>
                </span>
              )}
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
              {/* Mobile close button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {config.navItems.map((item) => {
              const ItemIcon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 text-gray-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors group ${
                    sidebarCollapsed ? 'justify-center' : ''
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <ItemIcon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="whitespace-nowrap">{item.label}</span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-700">
            {!sidebarCollapsed && (
              <div className="mb-4 px-4 py-2 bg-slate-700/50 rounded-lg">
                <p className="text-sm text-gray-400">Foydalanuvchi</p>
                <p className="text-white font-medium truncate">{session.user?.name || session.user?.email}</p>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-gray-300 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
              title={sidebarCollapsed ? 'Chiqish' : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>Chiqish</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0'}`}>
        {/* Top Bar */}
        <header className="bg-slate-800 border-b border-gray-700 px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <Menu className="h-6 w-6" />
              </button>
              {/* Desktop collapse button */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex text-gray-400 hover:text-white transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-6 w-6" />
              </button>
              {/* Mobile Logo */}
              <Link href="/" className="lg:hidden flex items-center space-x-2">
                <Icon className="h-6 w-6 text-green-500" />
                <span className="text-xl font-black">
                  <span className="text-white">RASH</span>
                </span>
              </Link>
            </div>
            <div className="w-6"></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
