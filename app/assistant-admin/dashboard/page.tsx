'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { 
  UserPlus, 
  Users,
  BookOpen
} from 'lucide-react'

export default function AssistantAdminDashboard() {
  const { data: session } = useSession()

  return (
    <DashboardLayout role="ASSISTANT_ADMIN">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 sm:p-6 text-white">
          <h1 className="text-xl sm:text-2xl font-bold text-center">
            {session?.user?.name || 'Yordamchi Admin'}
          </h1>
          <p className="text-center text-sm sm:text-base mt-2 text-green-100">
            Yordamchi Admin Paneli
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Link
            href="/assistant-admin/students"
            className="bg-slate-800 rounded-xl p-6 border border-gray-700 hover:border-green-500 transition-colors group"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">
                  O'quvchi Qo'shish
                </h3>
                <p className="text-sm text-gray-400">
                  Yangi o'quvchi qo'shish va guruhga biriktirish
                </p>
              </div>
            </div>
          </Link>

          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">
                  O'quvchilar
                </h3>
                <p className="text-sm text-gray-400">
                  O'quvchilarni boshqarish
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <BookOpen className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-blue-400 font-semibold mb-2">Qo'llanma</h3>
              <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
                <li>Yangi o'quvchi qo'shish uchun "O'quvchi Qo'shish" tugmasini bosing</li>
                <li>O'quvchini guruhga biriktirish uchun o'quvchi ro'yxatidan guruhni tanlang</li>
                <li>Bu panelda faqat o'quvchi qo'shish va guruhga biriktirish funksiyalari mavjud</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
