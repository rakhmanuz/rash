'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { 
  Users, 
  GraduationCap, 
  UserCog,
  DollarSign,
  TrendingUp,
  BookOpen,
  AlertCircle,
  MessageSquare,
  Send,
  X
} from 'lucide-react'

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalGroups: 0,
    totalRevenue: 0,
    totalDebt: 0,
    averageMastery: 0,
    attendanceRate: 0,
  })
  const [infinityPoints, setInfinityPoints] = useState(0)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageForm, setMessageForm] = useState({
    title: '',
    content: '',
    recipientRole: 'STUDENT',
    recipientId: '',
  })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data) setStats(data)
      })
      .catch(err => console.error(err))
  }, [])

  // Fetch infinity points
  useEffect(() => {
    const fetchInfinityPoints = async () => {
      try {
        const res = await fetch('/api/user/infinity')
        if (res.ok) {
          const data = await res.json()
          setInfinityPoints(data.infinityPoints || 0)
        }
      } catch (err) {
        console.error('Error fetching infinity points:', err)
      }
    }
    fetchInfinityPoints()
    
    const interval = setInterval(() => {
      fetchInfinityPoints()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    try {
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageForm),
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message || 'Xabar muvaffaqiyatli yuborildi!')
        setShowMessageModal(false)
        setMessageForm({ title: '', content: '', recipientRole: 'STUDENT', recipientId: '' })
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Xatolik yuz berdi')
    } finally {
      setSending(false)
    }
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Welcome Section - faqat ism */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold text-center">
            {session?.user?.name || 'Admin'}
          </h1>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <GraduationCap className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">{stats.totalStudents}</span>
            </div>
            <p className="text-gray-400">O&apos;quvchilar</p>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <UserCog className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">{stats.totalTeachers}</span>
            </div>
            <p className="text-gray-400">O&apos;qituvchilar</p>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="h-8 w-8 text-green-400" />
              <span className="text-2xl font-bold text-white">{stats.totalGroups}</span>
            </div>
            <p className="text-gray-400">Guruhlar</p>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8 text-yellow-400" />
              <span className="text-2xl font-bold text-white">{stats.totalRevenue.toLocaleString()}</span>
            </div>
            <p className="text-gray-400">Jami daromad</p>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-400" />
              Moliyaviy holat
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                <span className="text-gray-400">Jami kirim</span>
                <span className="text-green-400 font-semibold">{stats.totalRevenue.toLocaleString()} so&apos;m</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                <span className="text-gray-400">Qarzdorlik</span>
                <span className="text-red-400 font-semibold">{stats.totalDebt.toLocaleString()} so&apos;m</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                <span className="text-green-400 font-semibold">Sof daromad</span>
                <span className="text-green-400 font-bold text-lg">{(stats.totalRevenue - stats.totalDebt).toLocaleString()} so&apos;m</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-400" />
              KPI Ko&apos;rsatkichlari
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">O&apos;rtacha o&apos;zlashtirish</span>
                  <span className="text-white">{stats.averageMastery}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats.averageMastery}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Davomat darajasi</span>
                  <span className="text-white">{stats.attendanceRate}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats.attendanceRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {stats.totalDebt > 0 && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-400" />
              <div>
                <h3 className="text-red-400 font-semibold mb-1">Qarzdorlik mavjud</h3>
                <p className="text-gray-300">
                  Jami qarzdorlik: <span className="font-semibold">{stats.totalDebt.toLocaleString()} so&apos;m</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Send Message Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2 flex items-center">
                <MessageSquare className="h-6 w-6 mr-2" />
                Xabar Yuborish
              </h2>
              <p className="text-blue-100">
                O&apos;quvchilar va o&apos;qituvchilarga xabar yuborish
              </p>
            </div>
            <button
              onClick={() => setShowMessageModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
            >
              <Send className="h-5 w-5" />
              <span>Xabar Yuborish</span>
            </button>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <MessageSquare className="h-6 w-6 mr-2" />
                Yangi Xabar Yuborish
              </h2>
              <button
                onClick={() => setShowMessageModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSendMessage} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Qabul qiluvchi
                </label>
                <select
                  required
                  value={messageForm.recipientRole}
                  onChange={(e) => setMessageForm({ ...messageForm, recipientRole: e.target.value, recipientId: '' })}
                  className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="STUDENT">Barcha O&apos;quvchilar</option>
                  <option value="TEACHER">Barcha O&apos;qituvchilar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sarlavha
                </label>
                <input
                  type="text"
                  required
                  value={messageForm.title}
                  onChange={(e) => setMessageForm({ ...messageForm, title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Xabar sarlavhasi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Xabar matni
                </label>
                <textarea
                  required
                  value={messageForm.content}
                  onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Xabar matnini kiriting..."
                />
              </div>
              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Yuborilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Yuborish</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
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
