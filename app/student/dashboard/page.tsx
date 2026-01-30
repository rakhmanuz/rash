'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { formatDateShort } from '@/lib/utils'
import { 
  Calendar, 
  TrendingUp, 
  Award, 
  DollarSign,
  BookOpen,
  CheckCircle2,
  Target,
  Zap,
  MessageSquare,
  Bell,
  Trophy,
  Medal,
  Crown
} from 'lucide-react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'

export default function StudentDashboard() {
  const { data: session } = useSession()
  const [grades30Days, setGrades30Days] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showMessages, setShowMessages] = useState(false)
  const [rankings, setRankings] = useState<any>(null)
  const [infinityPoints, setInfinityPoints] = useState(0)
  const [stats, setStats] = useState<{
    attendanceRate: number
    masteryLevel: number
    level: number
    totalScore: number
    pendingTasks: number
    completedTasks: number
    debt: number
    recentGrades: any[]
    attendanceHistory: any[]
    yearlyData: any[]
    monthlyData: any[]
    dailyData: any[]
    enrollmentDate: string
    classMastery: number
    assignmentRate: number
    weeklyWrittenRate: number
  }>({
    attendanceRate: 0,
    masteryLevel: 0,
    level: 1,
    totalScore: 0,
    pendingTasks: 0,
    completedTasks: 0,
    debt: 0,
    recentGrades: [],
    attendanceHistory: [],
    yearlyData: [],
    monthlyData: [],
    dailyData: [],
    enrollmentDate: '',
    classMastery: 0,
    assignmentRate: 0,
    weeklyWrittenRate: 0,
  })
  
  // Animated stats - 0 dan real qiymatlargacha
  const [animatedStats, setAnimatedStats] = useState<{
    attendanceRate: number
    masteryLevel: number
    level: number
    totalScore: number
    pendingTasks: number
    completedTasks: number
    debt: number
    assignmentRate: number
    classMastery: number
    studentAbility: number
    weeklyWrittenRate: number
  }>({
    attendanceRate: 0,
    masteryLevel: 0,
    level: 1,
    totalScore: 0,
    pendingTasks: 0,
    completedTasks: 0,
    debt: 0,
    assignmentRate: 0,
    classMastery: 0,
    studentAbility: 0,
    weeklyWrittenRate: 0,
  })
  
  const [isAnimating, setIsAnimating] = useState(true)
  const [showCelebration, setShowCelebration] = useState(false)
  const statsRef = useRef<{
    attendanceRate: number
    masteryLevel: number
    level: number
    totalScore: number
    pendingTasks: number
    completedTasks: number
    debt: number
    recentGrades: any[]
    attendanceHistory: any[]
    yearlyData: any[]
    monthlyData: any[]
    dailyData: any[]
    enrollmentDate: string
    classMastery: number
    assignmentRate: number
    weeklyWrittenRate: number
  }>({
    attendanceRate: 0,
    masteryLevel: 0,
    level: 1,
    totalScore: 0,
    pendingTasks: 0,
    completedTasks: 0,
    debt: 0,
    recentGrades: [],
    attendanceHistory: [] as any[],
    yearlyData: [] as any[],
    monthlyData: [] as any[],
    dailyData: [] as any[],
    enrollmentDate: '',
    classMastery: 0,
    assignmentRate: 0,
    weeklyWrittenRate: 0,
  }) // Previous stats uchun

  // Smooth animatsiya funksiyasi - yumshoq va sekin
  const animateStats = useCallback((targetStats: any) => {
    setIsAnimating(true)
    setShowCelebration(false)
    
    const duration = 2000 // 2 soniya - tezroq real-time uchun
    const steps = 60 // Kamroq qadamlar - tezroq
    const stepDuration = duration / steps
    
    let currentStep = 0
    
    const animate = () => {
      currentStep++
      const progress = Math.min(currentStep / steps, 1)
      
      // Yumshoq easing function (ease-in-out cubic)
      const easeInOut = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2
      
      setAnimatedStats({
        attendanceRate: Math.round(targetStats.attendanceRate * easeInOut),
        masteryLevel: Math.round(targetStats.masteryLevel * easeInOut),
        level: Math.floor(targetStats.level * easeInOut) || 1,
        totalScore: Math.round(targetStats.totalScore * easeInOut),
        pendingTasks: targetStats.pendingTasks,
        completedTasks: Math.round(targetStats.completedTasks * easeInOut),
        assignmentRate: Math.round((targetStats.assignmentRate || 0) * easeInOut),
        classMastery: Math.round((targetStats.classMastery || 0) * easeInOut),
        studentAbility: Math.round((targetStats.weeklyWrittenRate || 0) * easeInOut),
        weeklyWrittenRate: Math.round((targetStats.weeklyWrittenRate || 0) * easeInOut),
        debt: Math.round(targetStats.debt * easeInOut),
      })
      
      if (currentStep < steps) {
        setTimeout(animate, stepDuration)
      } else {
        setIsAnimating(false)
        // Animatsiya tugagach, celebration effekt
        if (targetStats.attendanceRate > 0 || targetStats.masteryLevel > 0) {
          setShowCelebration(true)
          setTimeout(() => setShowCelebration(false), 1500)
        }
      }
    }
    
    animate()
  }, [])

  // Real-time updates funksiyasi
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/student/stats')
      const data = await res.json()
      if (data) {
        const prevStats = statsRef.current
        
        // Faqat agar ma'lumotlar o'zgarganda animatsiya qilish
        const hasChanged = 
          Math.abs(data.attendanceRate - (prevStats.attendanceRate || 0)) > 0.1 ||
          Math.abs(data.masteryLevel - (prevStats.masteryLevel || 0)) > 0.1 ||
          data.level !== (prevStats.level || 1) ||
          data.completedTasks !== (prevStats.completedTasks || 0) ||
          data.debt !== (prevStats.debt || 0) ||
          data.pendingTasks !== (prevStats.pendingTasks || 0) ||
          (data.recentGrades?.length || 0) !== (prevStats.recentGrades?.length || 0) ||
          (data.attendanceHistory?.length || 0) !== (prevStats.attendanceHistory?.length || 0)

        // Stats'ni yangilash
        setStats({
          attendanceRate: data.attendanceRate || 0,
          masteryLevel: data.masteryLevel || 0,
          level: data.level || 1,
          totalScore: data.totalScore || 0,
          pendingTasks: data.pendingTasks || 0,
          completedTasks: data.completedTasks || 0,
          debt: data.debt || 0,
          recentGrades: data.recentGrades || [],
          attendanceHistory: data.attendanceHistory || [],
          yearlyData: data.yearlyData || [],
          monthlyData: data.monthlyData || [],
          dailyData: data.dailyData || [],
          enrollmentDate: data.enrollmentDate || '',
          classMastery: data.classMastery || 0,
          assignmentRate: data.assignmentRate || 0,
          weeklyWrittenRate: data.weeklyWrittenRate || 0,
        })
        
        // Previous stats'ni yangilash
        statsRef.current = {
          attendanceRate: data.attendanceRate || 0,
          masteryLevel: data.masteryLevel || 0,
          level: data.level || 1,
          totalScore: data.totalScore || 0,
          pendingTasks: data.pendingTasks || 0,
          completedTasks: data.completedTasks || 0,
          debt: data.debt || 0,
          recentGrades: data.recentGrades || [],
          attendanceHistory: data.attendanceHistory || [],
          yearlyData: data.yearlyData || [],
          monthlyData: data.monthlyData || [],
          dailyData: data.dailyData || [],
          enrollmentDate: data.enrollmentDate || '',
          classMastery: data.classMastery || 0,
          assignmentRate: data.assignmentRate || 0,
          weeklyWrittenRate: data.weeklyWrittenRate || 0,
        }
        
        // Agar o'zgarish bo'lsa, animatsiya qilish
        if (hasChanged) {
          animateStats(data)
        } else {
          // Agar o'zgarish bo'lmasa, faqat qiymatlarni yangilash (animatsiyasiz)
          setAnimatedStats({
            attendanceRate: data.attendanceRate,
            masteryLevel: data.masteryLevel,
            level: data.level,
            totalScore: data.totalScore,
            pendingTasks: data.pendingTasks,
            completedTasks: data.completedTasks,
            debt: data.debt,
            assignmentRate: data.assignmentRate || 0,
            classMastery: data.classMastery || 0,
            studentAbility: data.weeklyWrittenRate || 0,
            weeklyWrittenRate: data.weeklyWrittenRate || 0,
          })
        }
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }, [animateStats])

  useEffect(() => {
    // Birinchi marta yuklash
    fetchStats()

    // Real-time updates - har 3 soniyada yangilash
    const interval = setInterval(() => {
      fetchStats()
    }, 3000) // 3 soniya - real-time hissi

    // Cleanup
    return () => clearInterval(interval)
  }, [fetchStats])

  // Fetch grades for 30 days
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await fetch('/api/student/grades')
        if (res.ok) {
          const allGrades = await res.json()
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          thirtyDaysAgo.setHours(0, 0, 0, 0)
          
          const recent = allGrades.filter((grade: any) => {
            if (!grade.createdAt) return false
            const gradeDate = new Date(grade.createdAt)
            gradeDate.setHours(0, 0, 0, 0)
            return gradeDate >= thirtyDaysAgo
          })
          setGrades30Days(recent)
        }
      } catch (err) {
        console.error('Error fetching grades:', err)
      }
    }
    fetchGrades()
    
    // Real-time updates - har 3 soniyada yangilash
    const interval = setInterval(() => {
      fetchGrades()
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])

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

  // Helper function to calculate radar data - 4 ta asosiy ko'rsatkich
  // Yurak urishi diagrammasi uchun ma'lumotlar tayyorlash
  const prepareHeartbeatData = (data: any[], attendanceRate: number, assignmentRate: number, classMastery: number, weeklyWrittenRate: number) => {
    if (!data || data.length === 0) {
      // Agar ma'lumot bo'lmasa, joriy qiymatlardan statik diagramma yaratamiz
      return [
        { name: '0', davomat: attendanceRate, topshiriq: assignmentRate, ozlashtirish: classMastery, qobilyat: weeklyWrittenRate },
        { name: '1', davomat: attendanceRate, topshiriq: assignmentRate, ozlashtirish: classMastery, qobilyat: weeklyWrittenRate },
        { name: '2', davomat: attendanceRate, topshiriq: assignmentRate, ozlashtirish: classMastery, qobilyat: weeklyWrittenRate },
      ]
    }
    
    // Vaqt o'tishi bilan o'zgaruvchan ma'lumotlar
    return data.map((item, index) => ({
      name: index.toString(),
      davomat: item.rate || attendanceRate,
      topshiriq: assignmentRate + (Math.sin(index) * 5), // Yengil o'zgarish
      ozlashtirish: classMastery + (Math.cos(index) * 3),
      qobilyat: weeklyWrittenRate + (Math.sin(index * 0.5) * 2),
    }))
  }

  // Yillik heartbeat chart data (kelgan kunidan toki shu kungacha)
  // Kurs fikrini API'dan olish
  const [courseFeedback, setCourseFeedback] = useState<string>('')

  useEffect(() => {
    const fetchCourseFeedback = async () => {
      try {
        const attendanceRate = animatedStats.attendanceRate
        const assignmentRate = animatedStats.assignmentRate
        const mastery = animatedStats.classMastery
        const ability = animatedStats.studentAbility || animatedStats.weeklyWrittenRate || 0

        const response = await fetch(
          `/api/student/course-feedback?attendanceRate=${attendanceRate}&assignmentRate=${assignmentRate}&mastery=${mastery}&ability=${ability}`
        )

        if (response.ok) {
          const data = await response.json()
          if (data.feedbacks && data.feedbacks.length > 0) {
            setCourseFeedback(data.feedbacks.join('. ') + '.')
          } else {
            setCourseFeedback("Ma'lumotlar yetarli emas")
          }
        }
      } catch (error) {
        console.error('Error fetching course feedback:', error)
        setCourseFeedback("Ma'lumotlar yetarli emas")
      }
    }

    if (animatedStats.attendanceRate > 0 || animatedStats.assignmentRate > 0 || animatedStats.classMastery > 0) {
      fetchCourseFeedback()
    }
  }, [animatedStats.attendanceRate, animatedStats.assignmentRate, animatedStats.classMastery, animatedStats.studentAbility, animatedStats.weeklyWrittenRate])

  const yearlyHeartbeatData = useMemo(() => {
    const avgYearlyAttendance = stats.yearlyData && stats.yearlyData.length > 0
      ? Math.round(stats.yearlyData.reduce((sum, d) => sum + d.rate, 0) / stats.yearlyData.length)
      : stats.attendanceRate || 0
    return prepareHeartbeatData(
      stats.yearlyData || [],
      avgYearlyAttendance,
      stats.assignmentRate || 0,
      stats.classMastery || 0,
      stats.weeklyWrittenRate || 0
    )
  }, [stats.yearlyData, stats.classMastery, stats.assignmentRate, stats.weeklyWrittenRate, stats.attendanceRate])

  // Oylik heartbeat chart data (oxirgi 30 kun)
  const monthlyHeartbeatData = useMemo(() => {
    const avgMonthlyAttendance = stats.monthlyData && stats.monthlyData.length > 0
      ? Math.round(stats.monthlyData.reduce((sum, d) => sum + d.rate, 0) / stats.monthlyData.length)
      : stats.attendanceRate || 0
    return prepareHeartbeatData(
      stats.monthlyData || [],
      avgMonthlyAttendance,
      stats.assignmentRate || 0,
      stats.classMastery || 0,
      stats.weeklyWrittenRate || 0
    )
  }, [stats.monthlyData, stats.classMastery, stats.assignmentRate, stats.weeklyWrittenRate, stats.attendanceRate])

  // Kunlik heartbeat chart data (bugungi kun)
  const dailyHeartbeatData = useMemo(() => {
    const dailyAttendance = stats.dailyData && stats.dailyData.length > 0
      ? stats.dailyData[0]?.rate || 0
      : stats.attendanceRate || 0
    return prepareHeartbeatData(
      stats.dailyData || [],
      dailyAttendance,
      stats.assignmentRate || 0,
      stats.classMastery || 0,
      stats.weeklyWrittenRate || 0
    )
  }, [stats.dailyData, stats.classMastery, stats.assignmentRate, stats.weeklyWrittenRate, stats.attendanceRate])

  // Level to grade conversion (A=5, B+=4, B=3, C=2, D=1)
  const getGradeFromLevel = (level: number) => {
    if (level >= 5) return 'A'
    if (level >= 4) return 'B+'
    if (level >= 3) return 'B'
    if (level >= 2) return 'C'
    return 'D'
  }

  // Progress pie chart data
  const progressData = [
    { name: 'Bajarilgan', value: stats.completedTasks, color: '#22c55e' },
    { name: 'Kutilmoqda', value: stats.pendingTasks, color: '#eab308' },
  ]

  // Level progress calculation
  const levelProgress = ((animatedStats.level % 5) / 5) * 100
  const nextLevel = Math.ceil(stats.level / 5) * 5
  
  const currentGrade = getGradeFromLevel(animatedStats.level)
  const targetGrade = getGradeFromLevel(stats.level)

  // Progress bar ranglarini aniqlash funksiyalari
  const getAttendanceColor = (value: number) => {
    if (value >= 99) return 'bg-green-500'
    if (value >= 75) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getHomeworkColor = (value: number) => {
    if (value >= 75) return 'bg-green-500'
    if (value >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getTestMasteryColor = (value: number) => {
    if (value >= 81) return 'bg-green-500'
    if (value >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getWritingAbilityColor = (value: number) => {
    if (value >= 70) return 'bg-green-500'
    if (value >= 30) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // Kartochka fon ranglarini aniqlash funksiyalari
  const getAttendanceCardBg = (value: number) => {
    if (value >= 99) return 'from-green-500/20 to-green-600/20 border-green-500/30'
    if (value >= 75) return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30'
    return 'from-red-500/20 to-red-600/20 border-red-500/30'
  }

  const getHomeworkCardBg = (value: number) => {
    if (value >= 75) return 'from-green-500/20 to-green-600/20 border-green-500/30'
    if (value >= 40) return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30'
    return 'from-red-500/20 to-red-600/20 border-red-500/30'
  }

  const getTestMasteryCardBg = (value: number) => {
    if (value >= 81) return 'from-green-500/20 to-green-600/20 border-green-500/30'
    if (value >= 50) return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30'
    return 'from-red-500/20 to-red-600/20 border-red-500/30'
  }

  const getWritingAbilityCardBg = (value: number) => {
    if (value >= 70) return 'from-green-500/20 to-green-600/20 border-green-500/30'
    if (value >= 30) return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30'
    return 'from-red-500/20 to-red-600/20 border-red-500/30'
  }

  // Icon ranglarini aniqlash funksiyalari
  const getAttendanceIconBg = (value: number) => {
    if (value >= 99) return 'bg-green-500/20 text-green-400'
    if (value >= 75) return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-red-500/20 text-red-400'
  }

  const getHomeworkIconBg = (value: number) => {
    if (value >= 75) return 'bg-green-500/20 text-green-400'
    if (value >= 40) return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-red-500/20 text-red-400'
  }

  const getTestMasteryIconBg = (value: number) => {
    if (value >= 81) return 'bg-green-500/20 text-green-400'
    if (value >= 50) return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-red-500/20 text-red-400'
  }

  const getWritingAbilityIconBg = (value: number) => {
    if (value >= 70) return 'bg-green-500/20 text-green-400'
    if (value >= 30) return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-red-500/20 text-red-400'
  }

  return (
    <DashboardLayout role="STUDENT">
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
                  {formatDateShort(message.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Welcome Section - faqat ism */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-green-600 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-center">
            {session?.user?.name || 'O\'quvchi'}
          </h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`bg-gradient-to-br ${getAttendanceCardBg(animatedStats.attendanceRate)} backdrop-blur-sm rounded-xl p-6 border shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden`}>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`${getAttendanceIconBg(animatedStats.attendanceRate)} p-3 rounded-lg transition-transform duration-500 hover:scale-105`}>
                <Calendar className="h-6 w-6" />
              </div>
              <span className="text-3xl font-bold text-white transition-all duration-500 ease-out">
                {animatedStats.attendanceRate}%
              </span>
            </div>
            <p className="text-gray-300 font-medium relative z-10">Davomat darajasi</p>
            <div className="mt-3 w-full bg-slate-700/50 rounded-full h-2 relative z-10 overflow-hidden">
              <div 
                className={`${getAttendanceColor(animatedStats.attendanceRate)} h-2 rounded-full transition-all duration-700 ease-out relative`}
                style={{ width: `${animatedStats.attendanceRate}%` }}
              />
            </div>
          </div>

          <div className={`bg-gradient-to-br ${getHomeworkCardBg(animatedStats.assignmentRate)} backdrop-blur-sm rounded-xl p-6 border shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden`}>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`${getHomeworkIconBg(animatedStats.assignmentRate)} p-3 rounded-lg transition-transform duration-500 hover:scale-105`}>
                <BookOpen className="h-6 w-6" />
              </div>
              <span className="text-3xl font-bold text-white transition-all duration-500 ease-out">
                {animatedStats.assignmentRate}%
              </span>
            </div>
            <p className="text-gray-300 font-medium relative z-10">Uydagi topshiriq</p>
            <div className="mt-3 w-full bg-slate-700/50 rounded-full h-2 relative z-10 overflow-hidden">
              <div 
                className={`${getHomeworkColor(animatedStats.assignmentRate)} h-2 rounded-full transition-all duration-700 ease-out relative`}
                style={{ width: `${animatedStats.assignmentRate}%` }}
              />
            </div>
          </div>

          <div className={`bg-gradient-to-br ${getTestMasteryCardBg(animatedStats.classMastery)} backdrop-blur-sm rounded-xl p-6 border shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden`}>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`${getTestMasteryIconBg(animatedStats.classMastery)} p-3 rounded-lg transition-transform duration-500 hover:scale-105`}>
                <TrendingUp className="h-6 w-6" />
              </div>
              <span className="text-3xl font-bold text-white transition-all duration-500 ease-out">
                {animatedStats.classMastery}%
              </span>
            </div>
            <p className="text-gray-300 font-medium relative z-10">O'zlashtirish darajasi</p>
            <div className="mt-3 w-full bg-slate-700/50 rounded-full h-2 relative z-10 overflow-hidden">
              <div 
                className={`${getTestMasteryColor(animatedStats.classMastery)} h-2 rounded-full transition-all duration-700 ease-out relative`}
                style={{ width: `${animatedStats.classMastery}%` }}
              />
            </div>
          </div>

          <div className={`bg-gradient-to-br ${getWritingAbilityCardBg(animatedStats.studentAbility)} backdrop-blur-sm rounded-xl p-6 border shadow-lg transform transition-all hover:scale-105 hover:shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`${getWritingAbilityIconBg(animatedStats.studentAbility)} p-3 rounded-lg`}>
                <Zap className="h-6 w-6" />
              </div>
              <span className="text-3xl font-bold text-white transition-all duration-300">
                {animatedStats.studentAbility}%
              </span>
            </div>
            <p className="text-gray-300 font-medium">O'quvchi qobilyati</p>
            <div className="mt-3 w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
              <div 
                className={`${getWritingAbilityColor(animatedStats.studentAbility)} h-2 rounded-full transition-all duration-700 ease-out relative`}
                style={{ width: `${animatedStats.studentAbility}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3 Ta Heartbeat Chart: Kunlik, Oylik, Yillik */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kunlik Heartbeat Chart - 1-o'rin */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-yellow-400" />
                Kunlik
              </h2>
              <div className="text-xs text-gray-400">
                Bugungi kun
              </div>
            </div>
            <div className="h-[300px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyHeartbeatData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    stroke="#4b5563"
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    stroke="#4b5563"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="davomat" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="topshiriq" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ozlashtirish" 
                    stroke="#eab308" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="qobilyat" 
                    stroke="#a855f7" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 relative z-10">
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">
                  {stats.attendanceRate || 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Davomat</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">
                  {stats.assignmentRate || 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Topshiriq</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-400">
                  {stats.classMastery || 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">O'zlashtirish</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-400">
                  {stats.weeklyWrittenRate || 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Qobilyat</div>
              </div>
            </div>
          </div>

          {/* Oylik Heartbeat Chart - 2-o'rin */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-400" />
                Oylik
              </h2>
              <div className="text-xs text-gray-400">
                Oxirgi 30 kun
              </div>
            </div>
            <div className="h-[300px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyHeartbeatData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    stroke="#4b5563"
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    stroke="#4b5563"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="davomat" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="topshiriq" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ozlashtirish" 
                    stroke="#eab308" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="qobilyat" 
                    stroke="#a855f7" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 relative z-10">
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">
                  {stats.attendanceRate || 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Davomat</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">
                  {stats.assignmentRate || 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Topshiriq</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-400">
                  {stats.classMastery || 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">O'zlashtirish</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-400">
                  {stats.weeklyWrittenRate || 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Qobilyat</div>
              </div>
            </div>
          </div>

          {/* Yillik Heartbeat Chart - 3-o'rin */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-green-400" />
                Yillik
              </h2>
              <div className="text-xs text-gray-400">
                Kelgan kundan
              </div>
            </div>
            <div className="h-[300px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearlyHeartbeatData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    stroke="#4b5563"
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    stroke="#4b5563"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="davomat" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="topshiriq" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ozlashtirish" 
                    stroke="#eab308" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="qobilyat" 
                    stroke="#a855f7" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 relative z-10">
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">
                  {stats.attendanceRate || 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Davomat</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">
                  {stats.assignmentRate || 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Topshiriq</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-400">
                  {stats.classMastery || 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">O'zlashtirish</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-400">
                  {stats.weeklyWrittenRate || 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Qobilyat</div>
              </div>
            </div>
          </div>

        </div>


        {/* Reyting Bo'limi */}
        {rankings && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-2 flex items-center">
                <Trophy className="h-7 w-7 mr-3" />
                Reyting
              </h2>
              <p className="text-yellow-100">
                Guruh va umumiy kurs bo&apos;yicha eng yaxshi natijalar
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Umumiy Kurs Reytingi */}
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Crown className="h-6 w-6 mr-2 text-yellow-400" />
                  Umumiy Kurs Reytingi (Top 5)
                </h3>
                {rankings.currentStudent?.overallRank && (
                  <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 font-semibold">
                      Sizning o&apos;rningiz: <span className="text-2xl">{rankings.currentStudent.overallRank}</span>
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      O&apos;zlashtirish: {rankings.currentStudent.masteryLevel.toFixed(1)}%
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  {rankings.overallRankings.map((student: any, index: number) => {
                    const isCurrentUser = student.id === rankings.currentStudent?.id
                    const medalColors = [
                      { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', icon: Crown },
                      { bg: 'bg-gray-400/20', border: 'border-gray-400/50', text: 'text-gray-300', icon: Medal },
                      { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400', icon: Medal },
                    ]
                    const medal = medalColors[index] || { bg: 'bg-slate-700/50', border: 'border-gray-600', text: 'text-gray-300', icon: Award }
                    const MedalIcon = medal.icon

                    return (
                      <div
                        key={student.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isCurrentUser
                            ? 'bg-green-500/20 border-green-500/50'
                            : `${medal.bg} ${medal.border}`
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-500 text-white' :
                            'bg-slate-700 text-gray-300'
                          }`}>
                            {index === 0 ? <Crown className="h-5 w-5" /> : student.rank}
                          </div>
                          <div>
                            <p className={`font-semibold ${isCurrentUser ? 'text-green-400' : medal.text}`}>
                              {student.name}
                              {isCurrentUser && <span className="ml-2 text-xs">(Siz)</span>}
                            </p>
                            <p className="text-xs text-gray-400">{student.studentId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${isCurrentUser ? 'text-green-400' : medal.text}`}>
                            {student.masteryLevel.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Guruh Reytinglari */}
              <div className="space-y-4">
                {rankings.groupRankings.map((group: any) => {
                  const currentStudentRank = rankings.currentStudent?.groupRanks?.find(
                    (r: any) => r.groupId === group.groupId
                  )

                  return (
                    <div
                      key={group.groupId}
                      className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl"
                    >
                      <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                        <Trophy className="h-5 w-5 mr-2 text-blue-400" />
                        {group.groupName}
                      </h3>
                      <p className="text-xs text-gray-400 mb-3">O&apos;qituvchi: {group.teacherName}</p>
                      {currentStudentRank && (
                        <div className="mb-3 p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                          <p className="text-blue-400 font-semibold text-sm">
                            Sizning o&apos;rningiz: <span className="text-xl">{currentStudentRank.rank}</span>
                          </p>
                        </div>
                      )}
                      <div className="space-y-2">
                        {group.students.map((student: any, index: number) => {
                          const isCurrentUser = student.id === rankings.currentStudent?.id
                          const medalColors = [
                            { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400' },
                            { bg: 'bg-gray-400/20', border: 'border-gray-400/50', text: 'text-gray-300' },
                            { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400' },
                          ]
                          const medal = medalColors[index] || { bg: 'bg-slate-700/50', border: 'border-gray-600', text: 'text-gray-300' }

                          return (
                            <div
                              key={student.id}
                              className={`flex items-center justify-between p-2 rounded-lg border ${
                                isCurrentUser
                                  ? 'bg-green-500/20 border-green-500/50'
                                  : `${medal.bg} ${medal.border}`
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                  index === 0 ? 'bg-yellow-500 text-white' :
                                  index === 1 ? 'bg-gray-400 text-white' :
                                  index === 2 ? 'bg-orange-500 text-white' :
                                  'bg-slate-700 text-gray-300'
                                }`}>
                                  {index === 0 ? <Crown className="h-4 w-4" /> : student.rank}
                                </div>
                                <div>
                                  <p className={`text-sm font-semibold ${isCurrentUser ? 'text-green-400' : medal.text}`}>
                                    {student.name}
                                    {isCurrentUser && <span className="ml-1 text-xs">(Siz)</span>}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-sm font-bold ${isCurrentUser ? 'text-green-400' : medal.text}`}>
                                  {student.masteryLevel.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
