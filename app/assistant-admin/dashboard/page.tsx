'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  UserPlus, 
  Users,
  BookOpen
} from 'lucide-react'

export default function AssistantAdminDashboard() {
  const { data: session } = useSession()
  const [permissions, setPermissions] = useState<any>(null)

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await fetch('/api/assistant-admin/permissions')
        if (response.ok) {
          setPermissions(await response.json())
        }
      } catch (error) {
        console.error('Error loading assistant permissions:', error)
      }
    }
    fetchPermissions()
  }, [])

  const quickTasks = [
    { key: 'payments', title: 'To\'lovlar', href: '/assistant-admin/payments', desc: 'To\'lovlarni ko\'rish va boshqarish' },
    { key: 'students', title: 'Yangi o\'quvchilar', href: '/assistant-admin/students', desc: 'Yangi o\'quvchilar bilan ishlash' },
    { key: 'reports', title: 'Hisobotlar', href: '/assistant-admin/reports', desc: 'Kunlik va umumiy hisobotlar' },
    { key: 'schedules', title: 'Dars rejalari', href: '/assistant-admin/schedules', desc: 'Dars jadvali va rejalari' },
    { key: 'tests', title: 'Testlar', href: '/assistant-admin/tests', desc: 'Testlar bilan ishlash' },
  ].filter((item) => permissions?.[item.key]?.view)

  return (
    <DashboardLayout role="ASSISTANT_ADMIN">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl p-4 sm:p-6 text-white">
          <h1 className="text-xl sm:text-2xl font-bold text-center">
            {session?.user?.name || 'Yordamchi Admin'}
          </h1>
          <p className="text-center text-sm sm:text-base mt-2 text-green-100">
            Yordamchi Admin Paneli
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {quickTasks.length === 0 ? (
            <div className="sm:col-span-2 bg-slate-800 rounded-xl p-6 border border-gray-700 text-center text-gray-400">
              Sizga hali biror bo&apos;lim uchun ruxsat berilmagan.
            </div>
          ) : (
            quickTasks.map((task) => (
              <Link
                key={task.key}
                href={task.href}
                className="bg-slate-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-colors group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                    <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">{task.title}</h3>
                    <p className="text-sm text-gray-400">{task.desc}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Info Card */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <BookOpen className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-blue-400 font-semibold mb-2">Qo'llanma</h3>
              <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
                <li>Admin bergan ruxsatlar asosida sizga bo&apos;limlar ochiladi.</li>
                <li>Ruxsat bo&apos;lmagan bo&apos;limlar menyuda ko&apos;rinmaydi va ochilmaydi.</li>
                <li>Keyingi bosqichda bosh sahifaga vazifalar ro&apos;yxatini qo&apos;shamiz.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
