import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        studentProfile: {
          include: {
            enrollments: {
              where: { isActive: true },
              include: {
                group: {
                  include: {
                    classSchedules: true,
                  },
                },
              },
            },
            attendances: true,
            assignments: true,
            payments: true,
            grades: true,
            testResults: {
              include: {
                test: {
                  include: {
                    classSchedule: true,
                  },
                },
              },
            },
            writtenWorkResults: {
              include: {
                writtenWork: {
                  include: {
                    classSchedule: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user || !user.studentProfile) {
      return NextResponse.json({
        attendanceRate: 0,
        masteryLevel: 0,
        level: 1,
        totalScore: 0,
        pendingTasks: 0,
        completedTasks: 0,
        debt: 0,
      })
    }

    const student = user.studentProfile

    // Get all class schedules for student's active groups
    const studentGroupIds = student.enrollments
      .filter(e => e.isActive)
      .map(e => e.groupId)
    
    const allClassSchedules = student.enrollments
      .filter(e => e.isActive)
      .flatMap(e => e.group.classSchedules || [])

    // Get all attendances with class schedule information
    const allAttendances = await prisma.attendance.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        classSchedule: {
          include: {
            group: true,
          },
        },
      },
    })

    // Calculate attendance rate based on arrival time
    // Har bir dars uchun alohida hisoblaymiz
    const calculateAttendancePercentage = (attendance: any, classSchedule: any): number => {
      if (!attendance.isPresent) {
        return 0 // Kelmagan = 0%
      }

      if (!attendance.arrivalTime || !classSchedule) {
        // Eski ma'lumotlar uchun (arrivalTime yo'q bo'lsa) - faqat bor/yo'q
        return 100 // Bor = 100%
      }

      const arrivalTime = new Date(attendance.arrivalTime)
      const classDate = new Date(classSchedule.date)
      
      // Dars vaqtlarini olish
      const scheduleTimes = typeof classSchedule.times === 'string' 
        ? JSON.parse(classSchedule.times) 
        : classSchedule.times
      
      if (!Array.isArray(scheduleTimes) || scheduleTimes.length === 0) {
        return 100 // Vaqt yo'q bo'lsa, 100% qaytaramiz
      }

      // Birinchi dars vaqtini olish (masalan "15:00")
      const firstTime = scheduleTimes[0]
      const [hours, minutes] = firstTime.split(':').map(Number)
      
      // Dars boshlanish vaqti
      const classStartTime = new Date(classDate)
      classStartTime.setHours(hours, minutes, 0, 0)
      
      // Dars tugash vaqti (3 soatdan keyin)
      const classEndTime = new Date(classStartTime)
      classEndTime.setHours(classEndTime.getHours() + 3)

      // Agar dars boshlanishidan oldin kelsa = 100%
      if (arrivalTime <= classStartTime) {
        return 100
      }

      // Agar dars tugashidan keyin kelsa = 0%
      if (arrivalTime >= classEndTime) {
        return 0
      }

      // Dars vaqtida kelsa: qolgan vaqt / 3 soat * 100%
      const remainingTime = classEndTime.getTime() - arrivalTime.getTime()
      const totalClassTime = 3 * 60 * 60 * 1000 // 3 soat millisekundlarda
      const percentage = (remainingTime / totalClassTime) * 100
      
      return Math.max(0, Math.min(100, Math.round(percentage)))
    }

    // Bugungi kun yoki kechagi kun bilan tushun dars rejalarini topish
    // UTC vaqtida ishlash uchun
    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const yesterday = new Date(today)
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    
    // Bugungi kun uchun dars rejalarini topish (UTC)
    const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0))
    const todayEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999))
    
    // Kechagi kun bilan tushun dars rejalarini topish (UTC)
    const yesterdayStart = new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate(), 0, 0, 0, 0))
    const yesterdayEnd = new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate(), 23, 59, 59, 999))
    
    // Bugungi kun uchun dars rejalarini topish
    const todaySchedules = await prisma.classSchedule.findMany({
      where: {
        groupId: { in: studentGroupIds },
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    })
    
    // Bugungi kun uchun davomatlarni topish
    const todayAttendances = allAttendances.filter(att => {
      if (!att.classScheduleId) return false
      const scheduleDate = new Date(att.classSchedule?.date || att.date)
      const scheduleDateUTC = new Date(Date.UTC(
        scheduleDate.getUTCFullYear(),
        scheduleDate.getUTCMonth(),
        scheduleDate.getUTCDate()
      ))
      return scheduleDateUTC.getTime() === today.getTime() && studentGroupIds.includes(att.groupId)
    })
    
    // Agar bugun dars bo'lmasa yoki davomat yo'q bo'lsa, kechagi kun bilan tushun dars rejalarini topish
    const useToday = todaySchedules.length > 0 && todayAttendances.length > 0
    const targetDate = useToday ? today : yesterday
    const targetDateStart = useToday ? todayStart : yesterdayStart
    const targetDateEnd = useToday ? todayEnd : yesterdayEnd
    
    const targetSchedules = useToday
      ? todaySchedules 
      : await prisma.classSchedule.findMany({
          where: {
            groupId: { in: studentGroupIds },
            date: {
              gte: yesterdayStart,
              lte: yesterdayEnd,
            },
          },
        })
    
    const targetScheduleIds = targetSchedules.map(s => s.id)
    
    // Calculate attendance rate - faqat bugungi kun (yoki kechagi kun) uchun
    const relevantAttendances = allAttendances.filter(att => {
      // Faqat classScheduleId bo'lgan attendance'larni hisoblaymiz
      if (!att.classScheduleId) return false
      
      // Faqat bugungi kun (yoki kechagi kun) uchun dars rejalari
      if (!targetScheduleIds.includes(att.classScheduleId)) return false
      
      // Guruh tekshiruvi
      return studentGroupIds.includes(att.groupId)
    })

    const totalAttendances = relevantAttendances.length
    if (totalAttendances === 0) {
      return NextResponse.json({
        attendanceRate: 0,
        masteryLevel: 0,
        level: 1,
        totalScore: 0,
        pendingTasks: 0,
        completedTasks: 0,
        debt: 0,
        attendanceHistory: [],
        yearlyData: [],
        monthlyData: [],
        dailyData: [],
        enrollmentDate: new Date().toISOString(),
        classMastery: 0,
        assignmentRate: 0,
        weeklyWrittenRate: 0,
      })
    }

    const attendancePercentages = relevantAttendances.map(att => 
      calculateAttendancePercentage(att, att.classSchedule)
    )
    const attendanceRate = Math.round(
      attendancePercentages.reduce((sum, p) => sum + p, 0) / totalAttendances
    )

    // Calculate uyga vazifa (homework) - test natijalari type = "uyga_vazifa"
    // Faqat bugungi kun (yoki kechagi kun) uchun dars rejalari bilan bog'langan testlar
    const homeworkTests = student.testResults.filter((result: any) => 
      result.test && 
      result.test.type === 'uyga_vazifa' &&
      result.test.classScheduleId !== null && // Faqat dars rejasi bilan bog'langan testlar
      targetScheduleIds.includes(result.test.classScheduleId) // Faqat bugungi kun (yoki kechagi kun) uchun
    )
    let homeworkCorrectAnswers = 0
    let homeworkTotalQuestions = 0
    
    homeworkTests.forEach((result: any) => {
      if (result.test) {
        homeworkCorrectAnswers += result.correctAnswers || 0
        homeworkTotalQuestions += result.test.totalQuestions || 0
      }
    })
    
    const assignmentRate = homeworkTotalQuestions > 0
      ? Math.round((homeworkCorrectAnswers / homeworkTotalQuestions) * 100)
      : 0

    // Calculate pending and completed tasks (legacy support)
    const pendingTasks = student.assignments.filter(a => !a.isCompleted).length
    const completedTasks = student.assignments.filter(a => a.isCompleted).length

    // Calculate o'zlashtirish darajasi (class mastery) - kunlik test natijalari foizi
    // Faqat kunlik testlardagi to'g'ri javoblar / kunlik testlardagi umumiy savollar
    // Faqat bugungi kun (yoki kechagi kun) uchun dars rejalari bilan bog'langan testlar
    const dailyTestResults = student.testResults.filter((result: any) => 
      result.test && 
      result.test.type === 'kunlik_test' &&
      result.test.classScheduleId !== null && // Faqat dars rejasi bilan bog'langan testlar
      targetScheduleIds.includes(result.test.classScheduleId) // Faqat bugungi kun (yoki kechagi kun) uchun
    )
    let dailyTestCorrectAnswers = 0
    let dailyTestTotalQuestions = 0
    
    dailyTestResults.forEach((result: any) => {
      if (result.test) {
        dailyTestCorrectAnswers += result.correctAnswers || 0
        dailyTestTotalQuestions += result.test.totalQuestions || 0
      }
    })
    
    const classMastery = dailyTestTotalQuestions > 0
      ? Math.round((dailyTestCorrectAnswers / dailyTestTotalQuestions) * 100)
      : 0

    // Calculate haftalik yozmaish (weekly written work) - writtenWorkResults orqali
    // Faqat bugungi kun (yoki kechagi kun) uchun dars rejalari bilan bog'langan yozma ishlar
    const weeklyWrittenResults = student.writtenWorkResults.filter((result: any) => 
      result.writtenWork && 
      result.writtenWork.classScheduleId !== null && // Faqat dars rejasi bilan bog'langan yozma ishlar
      targetScheduleIds.includes(result.writtenWork.classScheduleId) // Faqat bugungi kun (yoki kechagi kun) uchun
    )
    const weeklyWrittenRate = weeklyWrittenResults.length > 0
      ? Math.round(
          weeklyWrittenResults.reduce((sum, r) => sum + (r.score / (r.writtenWork?.maxScore || 100)) * 100, 0) / 
          weeklyWrittenResults.length
        )
      : 0

    // Calculate debt
    const debt = student.payments
      .filter(p => p.status === 'PENDING' || p.status === 'OVERDUE')
      .reduce((sum, p) => sum + p.amount, 0)

    // Get recent grades for progress chart (last 10)
    const recentGrades = student.grades
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .reverse()
      .map((grade, index) => ({
        name: `Test ${index + 1}`,
        score: Math.round((grade.score / grade.maxScore) * 100),
        date: new Date(grade.createdAt).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }),
      }))

    // Get student enrollment date (first attendance or createdAt)
    const enrollmentDate = student.attendances.length > 0
      ? new Date(Math.min(...student.attendances.map(a => new Date(a.date).getTime())))
      : new Date(student.createdAt)
    
    // now and today already defined above
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

    // Yillik ma'lumotlar (kelgan kunidan toki shu kungacha)
    const yearlyAttendances = student.attendances
      .filter(a => new Date(a.date) >= enrollmentDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce((acc: any, att) => {
        const date = new Date(att.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!acc[monthKey]) {
          acc[monthKey] = { present: 0, total: 0 }
        }
        acc[monthKey].total++
        if (att.isPresent) acc[monthKey].present++
        return acc
      }, {})

    const yearlyData = Object.entries(yearlyAttendances).map(([month, data]: [string, any]) => ({
      month: new Date(month + '-01').toLocaleDateString('uz-UZ', { month: 'short', year: 'numeric' }),
      present: data.present,
      absent: data.total - data.present,
      rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
    }))

    // Oylik ma'lumotlar (oxirgi 30 kun)
    const monthlyAttendances = student.attendances
      .filter(a => new Date(a.date) >= oneMonthAgo)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce((acc: any, att) => {
        const date = new Date(att.date)
        const dayKey = date.toISOString().split('T')[0]
        if (!acc[dayKey]) {
          acc[dayKey] = { present: 0, total: 0 }
        }
        acc[dayKey].total++
        if (att.isPresent) acc[dayKey].present++
        return acc
      }, {})

    const monthlyData = Object.entries(monthlyAttendances).map(([day, data]: [string, any]) => ({
      day: new Date(day).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }),
      present: data.present,
      absent: data.total - data.present,
      rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
    }))

    // Kunlik ma'lumotlar (bugungi kun) - use todayAttendancesForDaily which is already defined above
    const dailyData = todayAttendancesForDaily.length > 0
      ? [{
          time: 'Bugun',
          present: todayAttendancesForDaily.filter(a => a.isPresent).length,
          absent: todayAttendancesForDaily.filter(a => !a.isPresent).length,
          rate: todayAttendancesForDaily.length > 0
            ? Math.round((todayAttendancesForDaily.filter(a => a.isPresent).length / todayAttendancesForDaily.length) * 100)
            : 0,
        }]
      : [{
          time: 'Bugun',
          present: 0,
          absent: 0,
          rate: 0,
        }]

    // Get attendance history (last 30 days) - legacy support
    // Get attendance with class schedule information
    const attendancesWithSchedule = await prisma.attendance.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        classSchedule: {
          include: {
            group: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 100, // Last 100 attendance records
    })

    // Group by date and class schedule, showing each class separately
    const attendanceHistory = attendancesWithSchedule
      .map((att) => {
        const scheduleTimes = att.classSchedule 
          ? (typeof att.classSchedule.times === 'string' 
              ? JSON.parse(att.classSchedule.times) 
              : att.classSchedule.times)
          : []
        const timeStr = Array.isArray(scheduleTimes) && scheduleTimes.length > 0 
          ? scheduleTimes[0] 
          : ''
        
        return {
          date: new Date(att.date).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }),
          time: timeStr,
          present: att.isPresent ? 1 : 0,
          classScheduleId: att.classScheduleId,
          groupName: att.classSchedule?.group?.name || '',
          arrivalTime: att.arrivalTime,
        }
      })
      .slice(-30) // Last 30 records

    return NextResponse.json({
      attendanceRate,
      masteryLevel: Math.round(student.masteryLevel),
      level: student.level,
      totalScore: student.totalScore,
      pendingTasks,
      completedTasks,
      debt,
      recentGrades,
      attendanceHistory,
      yearlyData,
      monthlyData,
      dailyData,
      enrollmentDate: enrollmentDate.toISOString(),
      // 4 ta asosiy ko'rsatkich
      classMastery, // O'zlashtirish darajasi (test natijalari foizi)
      assignmentRate, // Uydagi topshiriq
      weeklyWrittenRate, // O'quvchi qobilyati (yozma ish)
    })
  } catch (error) {
    console.error('Error fetching student stats:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
