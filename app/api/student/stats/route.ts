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

    // Calculate attendance rate based on arrival time
    // Faqat mavjud darslar bo'yicha hisoblaymiz
    // Dars 15:00 da boshlanadi, 3 soat davom etadi (18:00 gacha)
    const calculateAttendancePercentage = (attendance: any): number => {
      if (!attendance.isPresent) {
        return 0 // Kelmagan = 0%
      }

      if (!attendance.arrivalTime) {
        // Eski ma'lumotlar uchun (arrivalTime yo'q bo'lsa) - faqat bor/yo'q
        return 100 // Bor = 100%
      }

      const arrivalTime = new Date(attendance.arrivalTime)
      const classDate = new Date(attendance.date)
      
      // Dars boshlanish vaqti: 15:00
      const classStartTime = new Date(classDate)
      classStartTime.setHours(15, 0, 0, 0)
      
      // Dars tugash vaqti: 18:00 (3 soatdan keyin)
      const classEndTime = new Date(classDate)
      classEndTime.setHours(18, 0, 0, 0)

      // Agar 15:00 dan oldin kelsa = 100%
      if (arrivalTime <= classStartTime) {
        return 100
      }

      // Agar 18:00 dan keyin kelsa = 0%
      if (arrivalTime >= classEndTime) {
        return 0
      }

      // 15:00-18:00 orasida kelsa: qolgan vaqt / 3 soat * 100%
      const remainingTime = classEndTime.getTime() - arrivalTime.getTime()
      const totalClassTime = 3 * 60 * 60 * 1000 // 3 soat millisekundlarda
      const percentage = (remainingTime / totalClassTime) * 100
      
      return Math.max(0, Math.min(100, Math.round(percentage)))
    }

    // Calculate attendance rate - faqat mavjud darslar bo'yicha
    // Attendance'lar faqat mavjud darslar bo'yicha hisoblanadi
    const UZBEKISTAN_OFFSET = 5 * 60 * 60 * 1000
    const relevantAttendances = student.attendances.filter(att => {
      // Agar attendance'ning sanasi mavjud darslar sanalarida bo'lsa, uni hisoblaymiz
      const attDate = new Date(att.date)
      const attUzDate = new Date(attDate.getTime() + UZBEKISTAN_OFFSET)
      const attDateStr = `${attUzDate.getUTCFullYear()}-${String(attUzDate.getUTCMonth() + 1).padStart(2, '0')}-${String(attUzDate.getUTCDate()).padStart(2, '0')}`
      
      return allClassSchedules.some(schedule => {
        const scheduleDate = new Date(schedule.date)
        const scheduleUzDate = new Date(scheduleDate.getTime() + UZBEKISTAN_OFFSET)
        const scheduleDateStr = `${scheduleUzDate.getUTCFullYear()}-${String(scheduleUzDate.getUTCMonth() + 1).padStart(2, '0')}-${String(scheduleUzDate.getUTCDate()).padStart(2, '0')}`
        return scheduleDateStr === attDateStr && studentGroupIds.includes(schedule.groupId)
      })
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
      })
    }

    const attendancePercentages = relevantAttendances.map(calculateAttendancePercentage)
    const attendanceRate = Math.round(
      attendancePercentages.reduce((sum, p) => sum + p, 0) / totalAttendances
    )

    // Calculate uyga vazifa (homework) - test natijalari type = "uyga_vazifa"
    // Faqat mavjud darslar bilan bog'langan testlar
    const homeworkTests = student.testResults.filter((result: any) => 
      result.test && 
      result.test.type === 'uyga_vazifa' &&
      result.test.classScheduleId !== null // Faqat dars rejasi bilan bog'langan testlar
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
    // Faqat mavjud darslar bilan bog'langan testlar
    const dailyTestResults = student.testResults.filter((result: any) => 
      result.test && 
      result.test.type === 'kunlik_test' &&
      result.test.classScheduleId !== null // Faqat dars rejasi bilan bog'langan testlar
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
    // Faqat mavjud darslar bilan bog'langan yozma ishlar
    const weeklyWrittenResults = student.writtenWorkResults.filter((result: any) => 
      result.writtenWork && 
      result.writtenWork.classScheduleId !== null // Faqat dars rejasi bilan bog'langan yozma ishlar
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
    
    const now = new Date()
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

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

    // Kunlik ma'lumotlar (bugungi kun)
    const todayAttendances = student.attendances
      .filter(a => {
        const attDate = new Date(a.date)
        return attDate >= today && attDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
      })

    const dailyData = todayAttendances.length > 0
      ? [{
          time: 'Bugun',
          present: todayAttendances.filter(a => a.isPresent).length,
          absent: todayAttendances.filter(a => !a.isPresent).length,
          rate: todayAttendances.length > 0
            ? Math.round((todayAttendances.filter(a => a.isPresent).length / todayAttendances.length) * 100)
            : 0,
        }]
      : [{
          time: 'Bugun',
          present: 0,
          absent: 0,
          rate: 0,
        }]

    // Get attendance history (last 30 days) - legacy support
    const attendanceHistory = student.attendances
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
      .map((att, index) => ({
        date: new Date(att.date).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }),
        present: att.isPresent ? 1 : 0,
      }))

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
