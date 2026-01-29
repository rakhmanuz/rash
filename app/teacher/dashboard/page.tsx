'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { 
  Users, 
  BookOpen, 
  DollarSign,
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  Zap,
  MessageSquare,
  Bell,
  Calendar,
  Target,
  FileText,
  PenTool,
  CalendarDays
} from 'lucide-react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showMessages, setShowMessages] = useState(false)
  const [infinityPoints, setInfinityPoints] = useState(0)
  const [upcomingSchedules, setUpcomingSchedules] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalStudents: 0,
    pendingGrading: 0,
    monthlySalary: 0,
    bonus: 0,
    totalEarnings: 0,
    bonusRate: 0,
    averageMastery: 0,
    attendanceRate: 0,
    classMastery: 0,
    assignmentRate: 0,
    weeklyWrittenRate: 0,
    recentGrades: [] as any[],
    groupStats: [] as any[],
    groupStatsDetailed: [] as any[],
  })

  // Animated stats
  const [animatedStats, setAnimatedStats] = useState({
    attendanceRate: 0,
    classMastery: 0,
    assignmentRate: 0,
    weeklyWrittenRate: 0,
    totalGroups: 0,
    totalStudents: 0,
    totalEarnings: 0,
  })

  const statsRef = useRef({
    attendanceRate: 0,
    classMastery: 0,
    assignmentRate: 0,
    weeklyWrittenRate: 0,
  })

  // Smooth animation
  const animateStats = useCallback((targetStats: any) => {
    const duration = 2000
    const steps = 60
    const stepDuration = duration / steps
    let currentStep = 0

    const animate = () => {
      currentStep++
      const progress = Math.min(currentStep / steps, 1)
      const easeInOut = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2

      setAnimatedStats({
        attendanceRate: Math.round(targetStats.attendanceRate * easeInOut),
        classMastery: Math.round(targetStats.classMastery * easeInOut),
        assignmentRate: Math.round(targetStats.assignmentRate * easeInOut),
        weeklyWrittenRate: Math.round(targetStats.weeklyWrittenRate * easeInOut),
        totalGroups: targetStats.totalGroups,
        totalStudents: targetStats.totalStudents,
        totalEarnings: targetStats.totalEarnings,
      })

      if (currentStep < steps) {
        setTimeout(animate, stepDuration)
      }
    }

    animate()
  }, [])

  // Fetch stats with real-time updates
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/teacher/stats')
      const data = await res.json()
      if (data) {
        const prevStats = statsRef.current
        const hasChanged = 
          Math.abs(data.attendanceRate - (prevStats.attendanceRate || 0)) > 0.1 ||
          Math.abs(data.classMastery - (prevStats.classMastery || 0)) > 0.1 ||
          Math.abs(data.assignmentRate - (prevStats.assignmentRate || 0)) > 0.1 ||
          Math.abs(data.weeklyWrittenRate - (prevStats.weeklyWrittenRate || 0)) > 0.1

        setStats({
          totalGroups: data.totalGroups || 0,
          totalStudents: data.totalStudents || 0,
          pendingGrading: data.pendingGrading || 0,
          monthlySalary: data.monthlySalary || 0,
          bonus: data.bonus || 0,
          totalEarnings: data.totalEarnings || 0,
          bonusRate: data.bonusRate || 0,
          averageMastery: data.averageMastery || 0,
          attendanceRate: data.attendanceRate || 0,
          classMastery: data.classMastery || 0,
          assignmentRate: data.assignmentRate || 0,
          weeklyWrittenRate: data.weeklyWrittenRate || 0,
          recentGrades: data.recentGrades || [],
          groupStats: data.groupStats || [],
          groupStatsDetailed: data.groupStatsDetailed || [],
        })

        statsRef.current = {
          attendanceRate: data.attendanceRate || 0,
          classMastery: data.classMastery || 0,
          assignmentRate: data.assignmentRate || 0,
          weeklyWrittenRate: data.weeklyWrittenRate || 0,
        }

        if (hasChanged) {
          animateStats({
            attendanceRate: data.attendanceRate || 0,
            classMastery: data.classMastery || 0,
            assignmentRate: data.assignmentRate || 0,
            weeklyWrittenRate: data.weeklyWrittenRate || 0,
            totalGroups: data.totalGroups || 0,
            totalStudents: data.totalStudents || 0,
            totalEarnings: data.totalEarnings || 0,
          })
        } else {
          setAnimatedStats({
            attendanceRate: data.attendanceRate || 0,
            classMastery: data.classMastery || 0,
            assignmentRate: data.assignmentRate || 0,
            weeklyWrittenRate: data.weeklyWrittenRate || 0,
            totalGroups: data.totalGroups || 0,
            totalStudents: data.totalStudents || 0,
            totalEarnings: data.totalEarnings || 0,
          })
        }
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }, [animateStats])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(() => {
      fetchStats()
    }, 3000)
    return () => clearInterval(interval)
  }, [fetchStats])

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch('/api/messages')
        if (res.ok) {
          const data = await res.json()
          setMessages(data)
          setUnreadCount(data.filter((m: any) => !m.isRead).length)
        }
      } catch (err) {
        console.error('Error fetching messages:', err)
      }
    }
    fetchMessages()
    
    const interval = setInterval(() => {
      fetchMessages()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  // Fetch upcoming schedules
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await fetch('/api/teacher/schedules')
        if (res.ok) {
          const data = await res.json()
          setUpcomingSchedules(data)
        }
      } catch (err) {
        console.error('Error fetching schedules:', err)
      }
    }
    fetchSchedules()
    const interval = setInterval(fetchSchedules, 60000) // Update every minute
    return () => clearInterval(interval)
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

  const markAsRead = async (messageId: string) => {
    try {
      await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      })
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isRead: true, readAt: new Date() } : m
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking message as read:', err)
    }
  }

  // Calculate radar data for 4 main metrics
  const calculateRadarData = useCallback((
    attendanceRate: number,
    classMastery: number,
    assignmentRate: number,
    weeklyWrittenRate: number
  ) => [
    { 
      subject: 'Davomat', 
      A: attendanceRate, 
      fullMark: 100,
    },
    { 
      subject: 'Darsdagi o\'zlashtirish', 
      A: classMastery, 
      fullMark: 100,
    },
    { 
      subject: 'Vazifa topshirish', 
      A: assignmentRate, 
      fullMark: 100,
    },
    { 
      subject: 'Haftalik yozmaish', 
      A: weeklyWrittenRate, 
      fullMark: 100,
    },
  ], [])

  // Overall radar data
  const overallRadarData = useMemo(() => {
    return calculateRadarData(
      animatedStats.attendanceRate,
      animatedStats.classMastery,
      animatedStats.assignmentRate,
      animatedStats.weeklyWrittenRate
    )
  }, [animatedStats, calculateRadarData])

  // Format number safely
  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return '0'
    return num.toLocaleString('uz-UZ')
  }

  return (
    <DashboardLayout role="TEACHER">
      <div className="space-y-6">
        {/* Messages Section */}
        {messages.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-6 w-6" />
                <div>
                  <h3 className="font-semibold">Xabarlar</h3>
                  <p className="text-sm text-indigo-100">
                    {unreadCount > 0 ? `${unreadCount} ta yangi xabar` : 'Barcha xabarlar o\'qilgan'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMessages(!showMessages)}
                className="relative px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
                <Bell className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Messages List */}
        {showMessages && messages.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-gray-700 p-6 space-y-3 max-h-[400px] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Xabarlar
            </h3>
            {messages.map((message) => (
              <div
                key={message.id}
                onClick={() => !message.isRead && markAsRead(message.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  message.isRead
                    ? 'bg-slate-700/50 border-gray-600'
                    : 'bg-blue-500/20 border-blue-500/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-white">{message.title}</h4>
                  {!message.isRead && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Yangi
                    </span>
                  )}
                </div>
                <p className="text-gray-300 text-sm mb-2">{message.content}</p>
                <p className="text-gray-400 text-xs">
                  {new Date(message.createdAt).toLocaleDateString('uz-UZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Welcome Section - faqat ism */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-2xl p-6 text-white shadow-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-center">
            {session?.user?.name || 'O\'qituvchi'}
          </h1>
        </div>

        {/* Eng Yaqin Dars Jadvali */}
        <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-green-400" />
              Bugungi Dars Jadvali
            </h2>
          </div>
          {upcomingSchedules.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Yaqin orada darslar rejalashtirilmagan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSchedules.map((schedule) => {
                const times = Array.isArray(schedule.times) ? schedule.times : JSON.parse(schedule.times)
                
                return (
                  <div
                    key={schedule.id}
                    className="bg-slate-700/50 rounded-lg p-4 border border-green-500/50 bg-green-500/10 transition-all hover:border-green-500"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white font-semibold text-lg">{schedule.group.name}</span>
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            Bugun
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-gray-300 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">{times.join(', ')}</span>
                          </div>
                        </div>
                        {schedule.notes && (
                          <p className="text-gray-400 text-sm mt-2">{schedule.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Additional Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 backdrop-blur-sm rounded-xl p-6 border border-indigo-500/30 shadow-lg transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-indigo-500/20 p-3 rounded-lg">
                <Users className="h-6 w-6 text-indigo-400" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.totalGroups}</span>
            </div>
            <p className="text-gray-300 font-medium">Guruhlar</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/30 shadow-lg transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-cyan-500/20 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-cyan-400" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.totalStudents}</span>
            </div>
            <p className="text-gray-300 font-medium">O'quvchilar</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/30 shadow-lg transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-500/20 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-emerald-400" />
              </div>
              <span className="text-3xl font-bold text-white">{formatNumber(stats.totalEarnings)}</span>
            </div>
            <p className="text-gray-300 font-medium">Jami daromad</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overall Radar Chart */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-400" />
                Umumiy Ko'rsatkichlar
              </h2>
            </div>
            <div className="h-[400px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={overallRadarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]}
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                  />
                  <Radar
                    name="Umumiy ko'rsatkichlar"
                    dataKey="A"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                    strokeWidth={3}
                    isAnimationActive={true}
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value?: number) => [`${value || 0}%`, 'Ko\'rsatkich']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 relative z-10">
              {overallRadarData.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="text-lg font-bold text-white">
                    {item.A}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{item.subject}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Salary Info */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              Maosh ma'lumotlari
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-400" />
                  </div>
                  <span className="text-gray-300 font-medium">Asosiy maosh</span>
                </div>
                <span className="text-white font-bold text-lg">{formatNumber(stats.monthlySalary)} so'm</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-500/20 p-2 rounded-lg">
                    <Award className="h-5 w-5 text-yellow-400" />
                  </div>
                  <span className="text-gray-300 font-medium">Bonus ({stats.bonusRate || 0}%)</span>
                </div>
                <span className="text-green-400 font-bold text-lg">+{formatNumber(stats.bonus)} so'm</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <span className="text-green-400 font-semibold text-lg">Jami daromad</span>
                </div>
                <span className="text-green-400 font-bold text-2xl">{formatNumber(stats.totalEarnings)} so'm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Groups Detailed Stats */}
        {stats.groupStatsDetailed && stats.groupStatsDetailed.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Guruhlar Bo'yicha Ko'rsatkichlar
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {stats.groupStatsDetailed.map((group: any) => {
                const groupRadarData = calculateRadarData(
                  group.attendanceRate,
                  group.classMastery,
                  group.assignmentRate,
                  group.weeklyWrittenRate
                )

                return (
                  <div key={group.id} className="bg-slate-700/30 rounded-xl p-6 border border-gray-600/50">
                    <h3 className="text-lg font-bold text-white mb-4">{group.name}</h3>
                    <div className="h-[250px] mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={groupRadarData}>
                          <PolarGrid stroke="#4b5563" />
                          <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                          />
                          <PolarRadiusAxis 
                            angle={90} 
                            domain={[0, 100]}
                            tick={{ fill: '#6b7280', fontSize: 8 }}
                          />
                          <Radar
                            name={group.name}
                            dataKey="A"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.5}
                            strokeWidth={2}
                            isAnimationActive={true}
                            animationDuration={800}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1f2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#fff',
                            }}
                            formatter={(value?: number) => [`${value || 0}%`, 'Ko\'rsatkich']}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {groupRadarData.map((item, index) => (
                        <div key={index}>
                          <div className="text-sm font-bold text-white">{item.A}%</div>
                          <div className="text-xs text-gray-400 mt-1">{item.subject}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-600 text-center">
                      <span className="text-sm text-gray-400">O'quvchilar: </span>
                      <span className="text-white font-semibold">{group.students}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent Grades Chart */}
        {stats.recentGrades.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Baholar Tarixi
            </h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.recentGrades}>
                  <defs>
                    <linearGradient id="colorGrades" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    stroke="#4b5563"
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    stroke="#4b5563"
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value?: number) => [`${value || 0}%`, 'O\'rtacha']}
                  />
                  <Area
                    type="monotone"
                    dataKey="average"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorGrades)"
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
