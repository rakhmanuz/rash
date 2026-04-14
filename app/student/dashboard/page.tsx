'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useStudentShellRegister } from '@/components/student-shell-context'
import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback, useRef, useMemo, startTransition } from 'react'
import { formatDateShort } from '@/lib/utils'
import {
  enrollmentLabel,
  fourFromLastResults,
  OVERVIEW_SUMMARY_ACCENTS,
  metricColorsForSubject,
  navScorePercent,
  paletteForIndex,
  resolveDisplayedPayload,
  teacherLine,
} from '@/lib/student-dashboard-helpers'
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
  Crown,
  PenTool,
  FileText,
  Clock,
  ChevronLeft,
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

type EnrollmentRow = { groupId: string; groupName: string; subjectName: string | null }

function dedupeEnrollmentsForStats(list: EnrollmentRow[] | undefined): EnrollmentRow[] {
  if (!list?.length) return []
  const seen = new Set<string>()
  return list.filter((e) => {
    if (seen.has(e.groupId)) return false
    seen.add(e.groupId)
    return true
  })
}

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
    yearlyDailyData?: any[]
    monthlyData: any[]
    dailyData: any[]
    enrollmentDate: string
    classMastery: number
    assignmentRate: number
    weeklyWrittenRate: number
    recentResults: any[]
    lastResults?: {
      attendance?: { percentage: number; date: string | null; label: string }
      homework?: { percentage: number; date: string | null; label: string }
      test?: { percentage: number; date: string | null; label: string }
      writtenWork?: { percentage: number; date: string | null; label: string }
    }
    statsScopeLabel?: string
    enrollmentsForStats?: Array<{
      groupId: string
      groupName: string
      subjectName: string | null
    }>
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
    yearlyDailyData: [],
    monthlyData: [],
    dailyData: [],
    enrollmentDate: '',
    classMastery: 0,
    assignmentRate: 0,
    weeklyWrittenRate: 0,
    recentResults: [],
    lastResults: undefined,
    statsScopeLabel: '',
    enrollmentsForStats: [],
  })

  /** overview = barcha fanlar (o'rtacha); aks holda guruh ID — faqat shu guruhing statistikasi */
  const [dashboardNav, setDashboardNav] = useState<'overview' | string>('overview')
  const dashboardNavRef = useRef<'overview' | string>('overview')
  const [perGroupStats, setPerGroupStats] = useState<Record<string, Record<string, unknown>>>({})
  const [baselineStats, setBaselineStats] = useState<Record<string, unknown> | null>(null)
  /** Birinchi stats yuklanmaguncha — bo‘sh state bilan eski gradient hero chiqib ketmasin */
  const [statsBootstrapDone, setStatsBootstrapDone] = useState(false)

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
  /** Diagrammalar: kichik ekranda margin / balandlik / radius */
  const [chartsCompact, setChartsCompact] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 640px)')
    const apply = () => setChartsCompact(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
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
    yearlyDailyData?: any[]
    monthlyData: any[]
    dailyData: any[]
    enrollmentDate: string
    classMastery: number
    assignmentRate: number
    weeklyWrittenRate: number
    recentResults: any[]
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
    yearlyDailyData: [] as any[],
    monthlyData: [] as any[],
    dailyData: [] as any[],
    enrollmentDate: '',
    classMastery: 0,
    assignmentRate: 0,
    weeklyWrittenRate: 0,
    recentResults: [],
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

  const ingestStatsPayload = useCallback((data: any) => {
    if (!data || data.error) return
    try {
      const prevStats = statsRef.current

      const hasChanged =
        Math.abs(data.attendanceRate - (prevStats.attendanceRate || 0)) > 0.1 ||
        Math.abs(data.masteryLevel - (prevStats.masteryLevel || 0)) > 0.1 ||
        data.level !== (prevStats.level || 1) ||
        data.completedTasks !== (prevStats.completedTasks || 0) ||
        data.debt !== (prevStats.debt || 0) ||
        data.pendingTasks !== (prevStats.pendingTasks || 0) ||
        (data.recentGrades?.length || 0) !== (prevStats.recentGrades?.length || 0) ||
        (data.attendanceHistory?.length || 0) !== (prevStats.attendanceHistory?.length || 0)

      const lr = data.lastResults || {}
      const targetStats = {
        ...data,
        attendanceRate: lr.attendance != null ? lr.attendance.percentage : 0,
        assignmentRate: lr.homework != null ? lr.homework.percentage : 0,
        classMastery: lr.test != null ? lr.test.percentage : 0,
        weeklyWrittenRate: lr.writtenWork != null ? lr.writtenWork.percentage : 0,
      }

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
        yearlyDailyData: data.yearlyDailyData || [],
        monthlyData: data.monthlyData || [],
        dailyData: data.dailyData || [],
        enrollmentDate: data.enrollmentDate || '',
        classMastery: data.classMastery || 0,
        assignmentRate: data.assignmentRate || 0,
        weeklyWrittenRate: data.weeklyWrittenRate || 0,
        recentResults: data.recentResults || [],
        lastResults: data.lastResults,
        statsScopeLabel: data.statsScopeLabel || '',
        enrollmentsForStats: dedupeEnrollmentsForStats(data.enrollmentsForStats),
      })

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
        yearlyDailyData: data.yearlyDailyData || [],
        monthlyData: data.monthlyData || [],
        dailyData: data.dailyData || [],
        enrollmentDate: data.enrollmentDate || '',
        classMastery: data.classMastery || 0,
        assignmentRate: data.assignmentRate || 0,
        weeklyWrittenRate: data.weeklyWrittenRate || 0,
        recentResults: data.recentResults || [],
      }

      if (hasChanged) {
        animateStats(targetStats)
      } else {
        setAnimatedStats({
          attendanceRate: targetStats.attendanceRate,
          masteryLevel: data.masteryLevel,
          level: data.level,
          totalScore: data.totalScore,
          pendingTasks: data.pendingTasks,
          completedTasks: data.completedTasks,
          debt: data.debt,
          assignmentRate: targetStats.assignmentRate,
          classMastery: targetStats.classMastery,
          studentAbility: targetStats.weeklyWrittenRate,
          weeklyWrittenRate: targetStats.weeklyWrittenRate,
        })
      }
    } catch (err) {
      console.error('Error ingesting stats:', err)
    }
  }, [animateStats])

  const refreshInFlight = useRef(false)
  const refreshDashboardData = useCallback(async () => {
    if (refreshInFlight.current) return
    refreshInFlight.current = true
    try {
      const res0 = await fetch('/api/student/stats', { credentials: 'include' })
      if (!res0.ok) return
      const baseline = await res0.json()
      if (baseline?.error) return
      setBaselineStats(baseline)
      const enrollments = baseline.enrollmentsForStats ?? []
      if (enrollments.length === 0) {
        setPerGroupStats({})
        return
      }
      const pairs = await Promise.all(
        enrollments.map(async (e: { groupId: string }) => {
          const r = await fetch(`/api/student/stats?groupId=${encodeURIComponent(e.groupId)}`, {
            credentials: 'include',
          })
          if (!r.ok) return [e.groupId, null] as const
          const j = await r.json()
          if (j?.error) return [e.groupId, null] as const
          return [e.groupId, j] as const
        })
      )
      const map: Record<string, Record<string, unknown>> = {}
      for (const [id, payload] of pairs) {
        if (payload) map[id] = payload as Record<string, unknown>
      }
      setPerGroupStats(map)
      if (dashboardNavRef.current !== 'overview' && !map[dashboardNavRef.current]) {
        setDashboardNav('overview')
      }
    } catch (err) {
      console.error('Error refreshing stats:', err)
    } finally {
      refreshInFlight.current = false
      setStatsBootstrapDone(true)
    }
  }, [])

  useEffect(() => {
    dashboardNavRef.current = dashboardNav
  }, [dashboardNav])

  useEffect(() => {
    if (!baselineStats) return
    let nav: 'overview' | string = dashboardNav
    if (nav !== 'overview' && !perGroupStats[nav]) {
      setDashboardNav('overview')
      return
    }
    const display = resolveDisplayedPayload(baselineStats, perGroupStats, nav) as any
    ingestStatsPayload(display)
  }, [baselineStats, perGroupStats, dashboardNav, ingestStatsPayload])

  useEffect(() => {
    setDashboardNav('overview')
    setStatsBootstrapDone(false)
    void refreshDashboardData()
    const interval = setInterval(() => {
      void refreshDashboardData()
    }, 30000)
    return () => clearInterval(interval)
  }, [session?.user?.id, refreshDashboardData])

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
    
    const interval = setInterval(() => {
      fetchGrades()
    }, 30000)
    
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
    }, 60000) // 1 daqiqa
    
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
    
    // Har bir item'dan test natijalarini olish (agar mavjud bo'lsa)
    return data.map((item, index) => ({
      name: index.toString(),
      davomat: item.rate || attendanceRate,
      topshiriq: item.assignmentRate !== undefined ? item.assignmentRate : assignmentRate,
      ozlashtirish: item.classMastery !== undefined ? item.classMastery : classMastery,
      qobilyat: item.weeklyWrittenRate !== undefined ? item.weeklyWrittenRate : weeklyWrittenRate,
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

  // Kunlik ustunlar (tepadagi 4 ta kartochka bilan bir hil darajalar)
  const dailyBarData = useMemo(() => [
    { name: 'Davomat', value: animatedStats.attendanceRate || 0, fill: '#22c55e' },
    { name: 'Topshiriq', value: animatedStats.assignmentRate || 0, fill: '#3b82f6' },
    { name: "O'zlashtirish", value: animatedStats.classMastery || 0, fill: '#eab308' },
    { name: 'Qobilyat', value: animatedStats.studentAbility ?? animatedStats.weeklyWrittenRate ?? 0, fill: '#a855f7' },
  ], [animatedStats.attendanceRate, animatedStats.assignmentRate, animatedStats.classMastery, animatedStats.studentAbility, animatedStats.weeklyWrittenRate])

  const hasSubjectShell = (stats.enrollmentsForStats?.length ?? 0) > 0
  const isOverviewShell = hasSubjectShell && dashboardNav === 'overview'
  const isDetailShell = hasSubjectShell && dashboardNav !== 'overview'

  const registerStudentShell = useStudentShellRegister()
  useEffect(() => {
    if (!registerStudentShell) return
    if (!hasSubjectShell) {
      registerStudentShell(null)
      return
    }
    registerStudentShell({
      enrollments: stats.enrollmentsForStats ?? [],
      dashboardNav,
      setDashboardNav,
      perGroupStats,
    })
  }, [
    registerStudentShell,
    hasSubjectShell,
    stats.enrollmentsForStats,
    dashboardNav,
    perGroupStats,
  ])

  useEffect(() => {
    if (!registerStudentShell) return
    return () => {
      registerStudentShell(null)
    }
  }, [registerStudentShell])

  const overviewBarRows = useMemo(() => {
    const list = stats.enrollmentsForStats ?? []
    return list
      .filter((e) => perGroupStats[e.groupId])
      .map((e, i) => {
        const f = fourFromLastResults((perGroupStats[e.groupId] as { lastResults?: unknown })?.lastResults)
        const p = paletteForIndex(i)
        const topshiriqBar =
          i === 0
            ? '#6ee7b7'
            : (['#93c5fd', '#fdba74', '#d8b4fe', '#fca5a5'] as const)[(i - 1) % 4]
        return {
          key: e.groupId,
          name: e.subjectName || e.groupName,
          ozlashtirish: f.test,
          topshiriq: f.homework,
          color: p.color,
          bg: p.bg,
          topshiriqBar,
        }
      })
  }, [stats.enrollmentsForStats, perGroupStats])

  const overviewRadar = useMemo(() => {
    const list = (stats.enrollmentsForStats ?? []).filter((e) => perGroupStats[e.groupId])
    const metricNames = ['Davomat', 'Topshiriq', "O'zlashtirish", 'Qobilyat']
    const rows: Array<Record<string, string | number>> = []
    for (let mi = 0; mi < 4; mi++) {
      const row: Record<string, string | number> = { metric: metricNames[mi] }
      list.forEach((e, si) => {
        const f = fourFromLastResults((perGroupStats[e.groupId] as { lastResults?: unknown })?.lastResults)
        const vals = [f.attendance, f.homework, f.test, f.written]
        row[`s${si}`] = mi === 3 ? Math.min(Math.round(vals[3] * 5), 100) : vals[mi]
      })
      rows.push(row)
    }
    return { rows, list }
  }, [stats.enrollmentsForStats, perGroupStats])

  // Yillik: (Topshiriq + O'zlashtirish + Qobilyat) / 3 * Davomat/100
  const yearlyLineChartData = useMemo(() => {
    const daily = stats.yearlyDailyData || []
    if (daily.length === 0) {
      const t = stats.assignmentRate || 0, o = stats.classMastery || 0, q = stats.weeklyWrittenRate || 0, d = stats.attendanceRate || 0
      const avg = Math.round(((t + o + q) / 3) * (d / 100))
      return [{ name: '1', avg, label: 'Joriy' }]
    }
    return daily.map((d: any, i: number) => ({
      name: String(i + 1),
      label: d.label,
      avg: d.avg ?? 0,
    }))
  }, [stats.yearlyDailyData, stats.attendanceRate, stats.assignmentRate, stats.classMastery, stats.weeklyWrittenRate])

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

        {!statsBootstrapDone ? (
          <div
            className="rounded-2xl border border-white/[0.08] bg-[#101318] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] animate-pulse space-y-4"
            aria-busy="true"
            aria-label="Ko‘rsatkichlar yuklanmoqda"
          >
            <div className="h-8 w-48 max-w-full rounded-lg bg-slate-800/90" />
            <div className="h-4 w-full max-w-lg rounded-md bg-slate-800/50" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 pt-2">
              {[0, 1, 2, 3].map((k) => (
                <div key={k} className="h-24 rounded-xl border border-white/5 bg-slate-800/50" />
              ))}
            </div>
            <div className="h-40 sm:h-48 rounded-xl border border-white/5 bg-slate-800/35" />
          </div>
        ) : !hasSubjectShell ? (
          <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-green-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-2xl relative overflow-hidden">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center">
              {session?.user?.name || 'O\'quvchi'}
            </h1>
            {stats.statsScopeLabel ? (
              <p className="text-center text-sm sm:text-base text-white/90 mt-2 font-medium">
                Ko‘rsatkichlar: {stats.statsScopeLabel}
              </p>
            ) : null}
          </div>
        ) : null}

        {hasSubjectShell && isOverviewShell ? (
          <div className="motion-reduce:animate-none animate-dashboard-pane rounded-2xl border border-white/[0.08] bg-[#101318] p-3 sm:p-6 md:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.4)] space-y-4 sm:space-y-6 text-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Barcha fanlar <span className="font-medium text-slate-400">— umumiy ko&apos;rinish</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                  Har bir fan uchun alohida hisoblangan davomat, topshiriq, o&apos;zlashtirish va qobiliyat shu yerda
                  o&apos;rtacha arifmetik bilan birlashtiriladi (bir fan bo&apos;lsa — shu fanning o&apos;zi).
                </p>
              </div>
              <div className="text-xs text-slate-300 bg-[#161b22] border border-white/10 rounded-lg px-3 py-1.5 self-start sm:self-auto">
                {new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {[
                { v: animatedStats.attendanceRate, l: "O'rtacha davomat" },
                { v: animatedStats.assignmentRate, l: "O'rtacha topshiriq" },
                { v: animatedStats.classMastery, l: "O'rtacha o'zlashtirish" },
                {
                  v: animatedStats.studentAbility ?? animatedStats.weeklyWrittenRate ?? 0,
                  l: "O'rtacha qobiliyat",
                },
              ].map((row, i) => (
                <div
                  key={row.l}
                  className="rounded-xl border border-white/[0.06] bg-[#161b22] px-3 py-3 text-center shadow-sm"
                >
                  <div
                    className="text-xl sm:text-2xl font-bold tabular-nums"
                    style={{ color: OVERVIEW_SUMMARY_ACCENTS[Math.min(i, 3)] }}
                  >
                    {row.v}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">{row.l}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
              {(stats.enrollmentsForStats ?? []).map((e, i) => {
                const pg = perGroupStats[e.groupId] as { lastResults?: unknown } | undefined
                if (!pg) return null
                const f = fourFromLastResults(pg.lastResults)
                const p = paletteForIndex(i)
                const score = navScorePercent(f)
                const metricCols = metricColorsForSubject(i)
                return (
                  <button
                    key={e.groupId}
                    type="button"
                    onClick={() => startTransition(() => setDashboardNav(e.groupId))}
                    className="rounded-xl border border-white/[0.07] bg-[#161b22] p-3 sm:p-4 text-left shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-white/15 w-full touch-manipulation active:scale-[0.99]"
                    style={{ borderTopWidth: 3, borderTopColor: p.color }}
                  >
                    {i === 0 ? (
                      <span className="inline-flex mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-300 bg-emerald-500/15 border border-emerald-400/35 rounded-full px-2 py-0.5">
                        Asosiy fan
                      </span>
                    ) : null}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ background: p.bg, color: p.color }}
                      >
                        {(e.subjectName || e.groupName).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="text-2xl font-bold tabular-nums" style={{ color: p.color }}>
                        {score}%
                      </div>
                    </div>
                    <div className="font-semibold text-sm text-slate-100">{enrollmentLabel(e)}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 mb-3">{teacherLine(e)}</div>
                    <div className="grid grid-cols-4 gap-1 sm:gap-1.5 text-center">
                      {[
                        { v: f.attendance, l: 'Davomat' },
                        { v: f.homework, l: 'Topsh.' },
                        { v: f.test, l: "O'zl." },
                        { v: f.written, l: 'Qobil.' },
                      ].map((m, j) => (
                        <div key={m.l} className="rounded-md bg-[#0d1117] border border-white/[0.06] py-1 px-0.5">
                          <div
                            className="text-[10px] sm:text-[11px] font-bold tabular-nums"
                            style={{ color: metricCols[j] }}
                          >
                            {m.v}%
                          </div>
                          <div className="text-[7px] sm:text-[8px] text-slate-500 uppercase tracking-wide">{m.l}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-0.5 h-1.5 sm:h-1">
                      {[f.attendance, f.homework, f.test, f.written].map((v, j) => (
                        <div key={j} className="flex-1 rounded-sm bg-slate-800/90 overflow-hidden">
                          <div
                            className="h-full rounded-sm transition-all"
                            style={{
                              width: `${Math.min(100, v)}%`,
                              background: metricCols[j],
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
              <div className="rounded-xl border border-white/[0.07] bg-[#161b22] p-3 sm:p-4 min-w-0">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-100 min-w-0">Fanlar bo&apos;yicha o&apos;zlashtirish</h3>
                  <span className="text-[10px] text-slate-400 bg-[#0d1117] border border-white/10 rounded-md px-2 py-0.5 shrink-0">
                    Oxirgi natija
                  </span>
                </div>
                <div className={chartsCompact ? 'h-[190px]' : 'h-[230px]'}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={overviewBarRows}
                      barCategoryGap="14%"
                      barGap={3}
                      margin={
                        chartsCompact
                          ? { top: 6, right: 4, left: 0, bottom: 28 }
                          : { top: 8, right: 10, left: 0, bottom: 52 }
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d3542" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#94a3b8', fontSize: chartsCompact ? 9 : 10 }}
                        interval={0}
                        angle={chartsCompact ? 0 : -25}
                        textAnchor={chartsCompact ? 'middle' : 'end'}
                        height={chartsCompact ? 40 : 60}
                        tickFormatter={(name: string) =>
                          chartsCompact && name.length > 12 ? `${name.slice(0, 11)}…` : name
                        }
                      />
                      <YAxis
                        domain={[0, 110]}
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        tickFormatter={(v) => `${v}%`}
                        width={36}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: 8,
                          fontSize: 12,
                          color: '#f1f5f9',
                        }}
                        formatter={(v, name) => [`${Number(v ?? 0)}%`, String(name ?? '')]}
                      />
                      <Bar dataKey="ozlashtirish" name="O'zlashtirish" radius={[4, 4, 0, 0]} strokeWidth={0}>
                        {overviewBarRows.map((e, i) => (
                          <Cell key={`oz-${i}`} fill={e.color} />
                        ))}
                      </Bar>
                      <Bar dataKey="topshiriq" name="Topshiriq" radius={[4, 4, 0, 0]} strokeWidth={0}>
                        {overviewBarRows.map((e, i) => (
                          <Cell key={`tp-${i}`} fill={e.topshiriqBar} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-[#161b22] p-3 sm:p-4 min-w-0">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-100 min-w-0">Davomat solishtirish</h3>
                  <span className="text-[10px] text-slate-400 bg-[#0d1117] border border-white/10 rounded-md px-2 py-0.5 shrink-0">
                    Fanlar
                  </span>
                </div>
                <div className={chartsCompact ? 'h-[210px]' : 'h-[240px]'}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={overviewRadar.rows}
                      cx="50%"
                      cy="50%"
                      outerRadius={chartsCompact ? '58%' : '70%'}
                    >
                      <PolarGrid stroke="#2d3542" />
                      <PolarAngleAxis
                        dataKey="metric"
                        tick={{ fill: '#94a3b8', fontSize: chartsCompact ? 9 : 10 }}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      {overviewRadar.list.map((e, si) => {
                        const p = paletteForIndex(si)
                        return (
                          <Radar
                            key={e.groupId}
                            name={enrollmentLabel(e)}
                            dataKey={`s${si}`}
                            stroke={p.color}
                            fill={p.bg}
                            fillOpacity={0.28}
                            strokeOpacity={0.9}
                            dot={false}
                          />
                        )
                      })}
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-1.5 mt-2 justify-center px-0.5">
                  {overviewRadar.list.map((e, si) => {
                    const p = paletteForIndex(si)
                    return (
                      <span
                        key={e.groupId}
                        className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-400 max-w-[100%] sm:max-w-none"
                      >
                        <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: p.color }} />
                        <span className="truncate sm:whitespace-normal">{enrollmentLabel(e)}</span>
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {hasSubjectShell && isDetailShell ? (
          <div
            key={dashboardNav}
            className="motion-reduce:animate-none animate-dashboard-pane rounded-2xl border border-white/[0.08] bg-[#101318] p-3 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] space-y-4 text-slate-100"
          >
            <button
              type="button"
              onClick={() => startTransition(() => setDashboardNav('overview'))}
              className="inline-flex w-full sm:w-auto justify-center items-center gap-2 min-h-[44px] touch-manipulation rounded-lg border border-white/10 bg-[#161b22] px-3 py-2 text-xs font-medium text-slate-300 shadow-sm hover:border-sky-500/40 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Barcha fanlarga qaytish
            </button>
            {(() => {
              const sel = stats.enrollmentsForStats?.find((x) => x.groupId === dashboardNav)
              const idx = Math.max(
                0,
                (stats.enrollmentsForStats ?? []).findIndex((x) => x.groupId === dashboardNav)
              )
              const p = paletteForIndex(idx)
              const pg = perGroupStats[dashboardNav as string] as { lastResults?: unknown } | undefined
              const f = fourFromLastResults(pg?.lastResults)
              const big = navScorePercent(f)
              return (
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                      style={{ background: p.bg, color: p.color }}
                    >
                      {(sel?.subjectName || sel?.groupName || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-lg sm:text-xl font-bold break-words" style={{ color: p.color }}>
                          {sel ? enrollmentLabel(sel) : 'Fan'}
                        </div>
                        {idx === 0 && sel ? (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300 bg-emerald-500/15 border border-emerald-400/35 rounded-full px-2 py-0.5 shrink-0">
                            Asosiy fan
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-400">{sel ? teacherLine(sel) : ''}</div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right sm:ml-auto shrink-0">
                    <div className="text-2xl sm:text-3xl font-bold tabular-nums" style={{ color: p.color }}>
                      {big}%
                    </div>
                    <div className="text-xs text-slate-500">Umumiy ball</div>
                  </div>
                </div>
              )
            })()}
          </div>
        ) : null}

        {statsBootstrapDone && (!hasSubjectShell || isDetailShell) && (
        <div className="space-y-4 sm:space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className={`bg-gradient-to-br ${getAttendanceCardBg(animatedStats.attendanceRate)} backdrop-blur-sm rounded-xl p-4 sm:p-6 border shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden`}>
            <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10">
              <div className={`${getAttendanceIconBg(animatedStats.attendanceRate)} p-2 sm:p-3 rounded-lg transition-transform duration-500 hover:scale-105`}>
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-white transition-all duration-500 ease-out">
                {animatedStats.attendanceRate}%
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 font-medium relative z-10">
              Davomat darajasi
              {stats.lastResults?.attendance?.date && (
                <span className="block text-[10px] text-gray-400 mt-0.5">
                  {stats.lastResults.attendance.label} {formatDateShort(stats.lastResults.attendance.date)}
                </span>
              )}
            </p>
            <div className="mt-3 w-full bg-slate-700/50 rounded-full h-2 relative z-10 overflow-hidden">
              <div 
                className={`${getAttendanceColor(animatedStats.attendanceRate)} h-2 rounded-full transition-all duration-700 ease-out relative`}
                style={{ width: `${animatedStats.attendanceRate}%` }}
              />
            </div>
          </div>

          <div className={`bg-gradient-to-br ${getHomeworkCardBg(animatedStats.assignmentRate)} backdrop-blur-sm rounded-xl p-4 sm:p-6 border shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden`}>
            <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10">
              <div className={`${getHomeworkIconBg(animatedStats.assignmentRate)} p-2 sm:p-3 rounded-lg transition-transform duration-500 hover:scale-105`}>
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-white transition-all duration-500 ease-out">
                {animatedStats.assignmentRate}%
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 font-medium relative z-10">
              Uydagi topshiriq
              {stats.lastResults?.homework?.date && (
                <span className="block text-[10px] text-gray-400 mt-0.5">
                  {stats.lastResults.homework.label} {formatDateShort(stats.lastResults.homework.date)}
                </span>
              )}
            </p>
            <div className="mt-3 w-full bg-slate-700/50 rounded-full h-2 relative z-10 overflow-hidden">
              <div 
                className={`${getHomeworkColor(animatedStats.assignmentRate)} h-2 rounded-full transition-all duration-700 ease-out relative`}
                style={{ width: `${animatedStats.assignmentRate}%` }}
              />
            </div>
          </div>

          <div className={`bg-gradient-to-br ${getTestMasteryCardBg(animatedStats.classMastery)} backdrop-blur-sm rounded-xl p-4 sm:p-6 border shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden`}>
            <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10">
              <div className={`${getTestMasteryIconBg(animatedStats.classMastery)} p-2 sm:p-3 rounded-lg transition-transform duration-500 hover:scale-105`}>
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-white transition-all duration-500 ease-out">
                {animatedStats.classMastery}%
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 font-medium relative z-10">
              O'zlashtirish darajasi
              {stats.lastResults?.test?.date && (
                <span className="block text-[10px] text-gray-400 mt-0.5">
                  {stats.lastResults.test.label} {formatDateShort(stats.lastResults.test.date)}
                </span>
              )}
            </p>
            <div className="mt-3 w-full bg-slate-700/50 rounded-full h-2 relative z-10 overflow-hidden">
              <div 
                className={`${getTestMasteryColor(animatedStats.classMastery)} h-2 rounded-full transition-all duration-700 ease-out relative`}
                style={{ width: `${animatedStats.classMastery}%` }}
              />
            </div>
          </div>

          <div className={`bg-gradient-to-br ${getWritingAbilityCardBg(animatedStats.studentAbility)} backdrop-blur-sm rounded-xl p-4 sm:p-6 border shadow-lg transform transition-all hover:scale-105 hover:shadow-xl`}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={`${getWritingAbilityIconBg(animatedStats.studentAbility)} p-2 sm:p-3 rounded-lg`}>
                <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-white transition-all duration-300">
                {animatedStats.studentAbility}%
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 font-medium">
              O'quvchi qobilyati
              {stats.lastResults?.writtenWork?.date && (
                <span className="block text-[10px] text-gray-400 mt-0.5">
                  {stats.lastResults.writtenWork.label} {formatDateShort(stats.lastResults.writtenWork.date)}
                </span>
              )}
            </p>
            <div className="mt-3 w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
              <div 
                className={`${getWritingAbilityColor(animatedStats.studentAbility)} h-2 rounded-full transition-all duration-700 ease-out relative`}
                style={{ width: `${animatedStats.studentAbility}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3 Ta Heartbeat Chart: Kunlik, Oylik, Yillik */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Kunlik Heartbeat Chart - 1-o'rin */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                Kunlik
              </h2>
              <div className="text-xs text-gray-400 hidden sm:inline">
                Bugungi kun
              </div>
            </div>
            <div className="h-[250px] sm:h-[300px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyBarData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} stroke="#4b5563" />
                  <YAxis type="number" domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} stroke="#4b5563" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: number | undefined) => [`${value != null ? `${value}%` : ''}`, '']}
                    cursor={{ fill: 'rgba(55, 65, 81, 0.3)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 sm:mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10">
              <div className="text-center">
                <div className="text-base sm:text-lg font-bold text-green-400">
                  {animatedStats.attendanceRate || 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Davomat</div>
              </div>
              <div className="text-center">
                <div className="text-base sm:text-lg font-bold text-blue-400">
                  {animatedStats.assignmentRate || 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Topshiriq</div>
              </div>
              <div className="text-center">
                <div className="text-base sm:text-lg font-bold text-yellow-400">
                  {animatedStats.classMastery || 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">O'zlashtirish</div>
              </div>
              <div className="text-center">
                <div className="text-base sm:text-lg font-bold text-purple-400">
                  {(animatedStats.studentAbility ?? animatedStats.weeklyWrittenRate) || 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Qobilyat</div>
              </div>
            </div>
          </div>

          {/* Oylik Heartbeat Chart - 2-o'rin */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                Oylik
              </h2>
              <div className="text-xs text-gray-400 hidden sm:inline">
                Oxirgi 30 kun
              </div>
            </div>
            <div className="h-[250px] sm:h-[300px] relative z-10">
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
            <div className="mt-3 sm:mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10">
              <div className="text-center">
                <div className="text-base sm:text-lg font-bold text-green-400">
                  {stats.attendanceRate || 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Davomat</div>
              </div>
              <div className="text-center">
                <div className="text-base sm:text-lg font-bold text-blue-400">
                  {stats.assignmentRate || 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Topshiriq</div>
              </div>
              <div className="text-center">
                <div className="text-base sm:text-lg font-bold text-yellow-400">
                  {stats.classMastery || 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">O'zlashtirish</div>
              </div>
              <div className="text-center">
                <div className="text-base sm:text-lg font-bold text-purple-400">
                  {stats.weeklyWrittenRate || 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Qobilyat</div>
              </div>
            </div>
          </div>

          {/* Yillik chiziq - dollor kursi uslubi (har dars, 4 daraja o'rtachasi, 100% ga nisbatan) */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-2xl relative overflow-hidden md:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                Yillik
              </h2>
              <div className="text-xs text-gray-400 hidden sm:inline">
                Kelgan kundan • har dars
              </div>
            </div>
            <div className="h-[250px] sm:h-[300px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={yearlyLineChartData}>
                  <defs>
                    <linearGradient id="yearlyAvgGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fill: '#9ca3af', fontSize: 9 }}
                    stroke="#4b5563"
                    interval="preserveStartEnd"
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
                    formatter={(value: number | undefined) => [`${value != null ? `${value}%` : ''} (o'rtacha)`, ''] as [string, string]}
                    labelFormatter={(label) => label ? `Dars: ${label}` : ''}
                  />
                  <Area
                    type="monotone"
                    dataKey="avg"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#yearlyAvgGradient)"
                    isAnimationActive
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center justify-center gap-4 text-xs text-gray-400 relative z-10">
              <span>(Topshiriq + O&apos;zlashtirish + Qobilyat) / 3 × Davomat%</span>
            </div>
          </div>

        </div>

        </div>
        )}


        {/* Reyting Bo'limi */}
        {rankings && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-4 sm:p-6 text-white">
              <h2 className="text-xl sm:text-2xl font-bold mb-2 flex items-center">
                <Trophy className="h-5 w-5 sm:h-7 sm:w-7 mr-2 sm:mr-3" />
                Reyting
              </h2>
              <p className="text-sm sm:text-base text-yellow-100">
                Guruh va umumiy kurs bo&apos;yicha eng yaxshi natijalar
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Umumiy Kurs Reytingi */}
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-2xl">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center">
                  <Crown className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-yellow-400" />
                  <span className="hidden sm:inline">Umumiy Kurs Reytingi (Top 5)</span>
                  <span className="sm:hidden">Kurs Reytingi</span>
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
                      className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-2xl"
                    >
                      <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3 flex items-center">
                        <Trophy className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-400" />
                        {group.groupName}
                      </h3>
                      <p className="text-xs text-gray-400 mb-2 sm:mb-3">O&apos;qituvchi: {group.teacherName}</p>
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

        {/* Oxirgi 10 ta natija */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-2xl">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-400" />
            Oxirgi 10 ta natija
          </h2>
          
          {stats.recentResults && stats.recentResults.length > 0 ? (
            <div className="space-y-3">
              {stats.recentResults.map((result: any, index: number) => {
                const getTypeIcon = () => {
                  if (result.type === 'written-work') {
                    return <PenTool className="h-4 w-4 text-orange-400" />
                  } else if (result.type === 'test') {
                    return <BookOpen className="h-4 w-4 text-blue-400" />
                  }
                  return <FileText className="h-4 w-4 text-gray-400" />
                }

                const getTypeColor = () => {
                  if (result.type === 'written-work') {
                    return 'bg-orange-500/20 border-orange-500/50'
                  } else if (result.type === 'test') {
                    if (result.typeLabel === 'Kunlik test') {
                      return 'bg-blue-500/20 border-blue-500/50'
                    } else {
                      return 'bg-purple-500/20 border-purple-500/50'
                    }
                  }
                  return 'bg-gray-500/20 border-gray-500/50'
                }

                const getPercentageColor = (percentage: number) => {
                  if (percentage >= 80) return 'text-green-400'
                  if (percentage >= 60) return 'text-yellow-400'
                  return 'text-red-400'
                }

                // Dars vaqti va sanasini formatlash
                const formatClassSchedule = () => {
                  if (result.classSchedule) {
                    const scheduleDate = new Date(result.classSchedule.date)
                    const times = typeof result.classSchedule.times === 'string'
                      ? JSON.parse(result.classSchedule.times)
                      : result.classSchedule.times
                    const timeStr = Array.isArray(times) && times.length > 0 ? times[0] : ''
                    return `${formatDateShort(scheduleDate.toISOString())} ${timeStr ? `- ${timeStr}` : ''}`
                  }
                  return formatDateShort(result.date)
                }

                return (
                  <div
                    key={result.id}
                    className={`p-3 sm:p-4 rounded-lg border ${getTypeColor()} transition-all hover:scale-[1.02]`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                        {getTypeIcon()}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm sm:text-base font-semibold text-white">
                              {result.typeLabel}
                            </span>
                            {result.title && (
                              <span className="text-xs text-gray-400 truncate">
                                - {result.title}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <Calendar className="h-3 w-3" />
                            <span>{formatClassSchedule()}</span>
                            {result.groupName && (
                              <>
                                <span>•</span>
                                <span>{result.groupName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <div className={`text-lg sm:text-xl font-bold ${getPercentageColor(result.percentage)}`}>
                          {result.percentage}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {result.correctAnswers} / {result.totalQuestions}
                        </div>
                        {result.type === 'written-work' && result.remainingTime !== undefined && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center justify-end">
                            <Clock className="h-3 w-3 mr-1" />
                            {result.remainingTime > 0 ? `${result.remainingTime} daqiqa qoldi` : 'Vaqtdan oldin topshirmagan'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Hozircha natijalar yo'q</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
