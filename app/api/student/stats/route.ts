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
                    group: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                    classSchedule: true,
                  },
                },
              },
            },
            writtenWorkResults: {
              include: {
                writtenWork: {
                  include: {
                    group: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
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
    // Davomat faqat bugungi/kechagi kun uchun hisoblanadi
    const attendanceRate = totalAttendances > 0
      ? Math.round(
          relevantAttendances
            .map(att => calculateAttendancePercentage(att, att.classSchedule))
            .reduce((sum, p) => sum + p, 0) / totalAttendances
        )
      : 0

    // Barcha davomatlar (o'quvchi kelgan darslar) - test va vazifa hisoblash uchun
    const allAttendancesWithSchedule = allAttendances.filter(att => 
      att.isPresent && 
      att.classScheduleId && 
      studentGroupIds.includes(att.groupId)
    )
    
    // O'quvchi kelgan darslar uchun classScheduleId'larni olish
    const attendedScheduleIds = new Set(
      allAttendancesWithSchedule
        .map(att => att.classScheduleId)
        .filter(id => id !== null)
    )

    // Calculate uyga vazifa (homework) - test natijalari type = "uyga_vazifa"
    // Faqat o'quvchi darsga kelgan darslar uchun vazifa natijalarini hisoblaymiz
    // Agar o'quvchi darsga kelgan bo'lsa, lekin o'sha dars uchun vazifa natijasi yo'q bo'lsa, oldingi natijalarni ishlatamiz
    const homeworkTests = student.testResults.filter((result: any) => {
      if (!result.test || result.test.type !== 'uyga_vazifa') return false
      if (!studentGroupIds.includes(result.test.groupId)) return false
      
      // Agar test classScheduleId ga ega bo'lsa, faqat o'quvchi kelgan darslar uchun
      if (result.test.classScheduleId) {
        return attendedScheduleIds.has(result.test.classScheduleId)
      }
      
      // Agar test classScheduleId ga ega bo'lmasa, barcha testlarni qabul qilamiz
      return true
    })
    
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
    // Faqat o'quvchi darsga kelgan darslar uchun test natijalarini hisoblaymiz
    // Agar o'quvchi darsga kelgan bo'lsa, lekin o'sha dars uchun test natijasi yo'q bo'lsa, oldingi natijalarni ishlatamiz
    
    // Faqat o'quvchi kelgan darslar uchun test natijalarini hisoblaymiz
    const dailyTestResults = student.testResults.filter((result: any) => {
      if (!result.test || result.test.type !== 'kunlik_test') return false
      if (!studentGroupIds.includes(result.test.groupId)) return false
      
      // Agar test classScheduleId ga ega bo'lsa, faqat o'quvchi kelgan darslar uchun
      if (result.test.classScheduleId) {
        return attendedScheduleIds.has(result.test.classScheduleId)
      }
      
      // Agar test classScheduleId ga ega bo'lmasa, barcha testlarni qabul qilamiz
      return true
    })
    
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

    // Calculate o'quvchi qobilyati (student ability) - yozma ish natijalari orqali
    // O'quvchi qobilyati eng so'nggi yozma ish natijasiga asoslanadi (keyingi baholashgacha o'zgarmaydi)
    // Barcha vaqt uchun yozma ish natijalarini hisoblaymiz (davomatga bog'liq emas)
    const allWrittenWorkResults = student.writtenWorkResults
      .filter((result: any) => {
        // Faqat to'liq ma'lumotga ega natijalarni olish
        return result.writtenWork && 
               result.masteryLevel !== null && 
               result.masteryLevel !== undefined &&
               studentGroupIds.includes(result.writtenWork.groupId) // Faqat o'quvchining guruhlaridagi yozma ishlar
      })
      .sort((a: any, b: any) => {
        // Eng so'nggi natija kiritilgan sanasiga qarab tartiblash (createdAt)
        // Bu to'g'ri, chunki o'quvchi qobilyati keyingi baholashgacha o'zgarmaydi
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        // Agar createdAt bir xil bo'lsa, yozma ish sanasiga qarab tartiblash
        if (dateA === dateB) {
          const workDateA = a.writtenWork?.date ? new Date(a.writtenWork.date).getTime() : 0
          const workDateB = b.writtenWork?.date ? new Date(b.writtenWork.date).getTime() : 0
          return workDateB - workDateA
        }
        return dateB - dateA // Eng so'nggisini birinchi o'ringa qo'yish
      })
    
    // Eng so'nggi yozma ish natijasini olish (o'quvchi qobilyati keyingi baholashgacha o'zgarmaydi)
    const weeklyWrittenRate = allWrittenWorkResults.length > 0
      ? Math.round(allWrittenWorkResults[0].masteryLevel || 0)
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

    // Yillik test natijalari - har oy uchun
    const yearlyTestResults = student.testResults
      .filter((result: any) => {
        if (!result.test || !result.test.date) return false
        const testDate = new Date(result.test.date)
        return testDate >= enrollmentDate
      })
      .reduce((acc: any, result: any) => {
        if (!result.test || !result.test.date) return acc
        const testDate = new Date(result.test.date)
        const monthKey = `${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}`
        if (!acc[monthKey]) {
          acc[monthKey] = {
            dailyTests: { correct: 0, total: 0 },
            homeworks: { correct: 0, total: 0 },
            writtenWorks: { total: 0, sum: 0, count: 0 }
          }
        }
        
        if (result.test.type === 'kunlik_test') {
          acc[monthKey].dailyTests.correct += result.correctAnswers || 0
          acc[monthKey].dailyTests.total += result.test.totalQuestions || 0
        } else if (result.test.type === 'uyga_vazifa') {
          acc[monthKey].homeworks.correct += result.correctAnswers || 0
          acc[monthKey].homeworks.total += result.test.totalQuestions || 0
        }
        
        return acc
      }, {})

    // Yillik yozma ish natijalari
    const yearlyWrittenResults = student.writtenWorkResults
      .filter((result: any) => {
        if (!result.writtenWork || !result.writtenWork.date) return false
        const workDate = new Date(result.writtenWork.date)
        return workDate >= enrollmentDate
      })
      .reduce((acc: any, result: any) => {
        if (!result.writtenWork || !result.writtenWork.date) return acc
        const workDate = new Date(result.writtenWork.date)
        const monthKey = `${workDate.getFullYear()}-${String(workDate.getMonth() + 1).padStart(2, '0')}`
        if (!acc[monthKey]) {
          acc[monthKey] = { total: 0, sum: 0, count: 0 }
        }
        acc[monthKey].sum += (result.masteryLevel || 0)
        acc[monthKey].count++
        return acc
      }, {})

    // Yillik ma'lumotlarni birlashtirish
    const allYearlyMonths = new Set([
      ...Object.keys(yearlyAttendances),
      ...Object.keys(yearlyTestResults),
      ...Object.keys(yearlyWrittenResults)
    ])

    const yearlyData = Array.from(allYearlyMonths)
      .sort()
      .map((monthKey) => {
        const attendance = yearlyAttendances[monthKey] || { present: 0, total: 0 }
        const tests = yearlyTestResults[monthKey] || {
          dailyTests: { correct: 0, total: 0 },
          homeworks: { correct: 0, total: 0 }
        }
        const written = yearlyWrittenResults[monthKey] || { sum: 0, count: 0 }
        
        return {
          month: new Date(monthKey + '-01').toLocaleDateString('uz-UZ', { month: 'short', year: 'numeric' }),
          present: attendance.present,
          absent: attendance.total - attendance.present,
          rate: attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0,
          classMastery: tests.dailyTests.total > 0 
            ? Math.round((tests.dailyTests.correct / tests.dailyTests.total) * 100) 
            : 0,
          assignmentRate: tests.homeworks.total > 0 
            ? Math.round((tests.homeworks.correct / tests.homeworks.total) * 100) 
            : 0,
          weeklyWrittenRate: written.count > 0 
            ? Math.round(written.sum / written.count) 
            : 0,
        }
      })

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

    // Oylik test natijalari - har kun uchun
    const monthlyTestResults = student.testResults
      .filter((result: any) => {
        if (!result.test || !result.test.date) return false
        const testDate = new Date(result.test.date)
        return testDate >= oneMonthAgo
      })
      .reduce((acc: any, result: any) => {
        if (!result.test || !result.test.date) return acc
        const testDate = new Date(result.test.date)
        const dayKey = testDate.toISOString().split('T')[0]
        if (!acc[dayKey]) {
          acc[dayKey] = {
            dailyTests: { correct: 0, total: 0 },
            homeworks: { correct: 0, total: 0 }
          }
        }
        
        if (result.test.type === 'kunlik_test') {
          acc[dayKey].dailyTests.correct += result.correctAnswers || 0
          acc[dayKey].dailyTests.total += result.test.totalQuestions || 0
        } else if (result.test.type === 'uyga_vazifa') {
          acc[dayKey].homeworks.correct += result.correctAnswers || 0
          acc[dayKey].homeworks.total += result.test.totalQuestions || 0
        }
        
        return acc
      }, {})

    // Oylik yozma ish natijalari
    const monthlyWrittenResults = student.writtenWorkResults
      .filter((result: any) => {
        if (!result.writtenWork || !result.writtenWork.date) return false
        const workDate = new Date(result.writtenWork.date)
        return workDate >= oneMonthAgo
      })
      .reduce((acc: any, result: any) => {
        if (!result.writtenWork || !result.writtenWork.date) return acc
        const workDate = new Date(result.writtenWork.date)
        const dayKey = workDate.toISOString().split('T')[0]
        if (!acc[dayKey]) {
          acc[dayKey] = { sum: 0, count: 0 }
        }
        acc[dayKey].sum += (result.masteryLevel || 0)
        acc[dayKey].count++
        return acc
      }, {})

    // Oylik ma'lumotlarni birlashtirish
    const allMonthlyDays = new Set([
      ...Object.keys(monthlyAttendances),
      ...Object.keys(monthlyTestResults),
      ...Object.keys(monthlyWrittenResults)
    ])

    const monthlyData = Array.from(allMonthlyDays)
      .sort()
      .map((dayKey) => {
        const attendance = monthlyAttendances[dayKey] || { present: 0, total: 0 }
        const tests = monthlyTestResults[dayKey] || {
          dailyTests: { correct: 0, total: 0 },
          homeworks: { correct: 0, total: 0 }
        }
        const written = monthlyWrittenResults[dayKey] || { sum: 0, count: 0 }
        
        return {
          day: new Date(dayKey).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }),
          present: attendance.present,
          absent: attendance.total - attendance.present,
          rate: attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0,
          classMastery: tests.dailyTests.total > 0 
            ? Math.round((tests.dailyTests.correct / tests.dailyTests.total) * 100) 
            : 0,
          assignmentRate: tests.homeworks.total > 0 
            ? Math.round((tests.homeworks.correct / tests.homeworks.total) * 100) 
            : 0,
          weeklyWrittenRate: written.count > 0 
            ? Math.round(written.sum / written.count) 
            : 0,
        }
      })

    // Kunlik ma'lumotlar (bugungi kun) - use todayAttendances which is already defined above
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

    // Oxirgi 10 ta natija (test, yozma ish, vazifa)
    const allResults: any[] = []
    
    // Test natijalari
    student.testResults.forEach((result: any) => {
      if (result.test) {
        const percentage = result.test.totalQuestions > 0
          ? Math.round((result.correctAnswers / result.test.totalQuestions) * 100)
          : 0
        
        allResults.push({
          id: result.id,
          type: 'test',
          typeLabel: result.test.type === 'kunlik_test' ? 'Kunlik test' : 'Uyga vazifa',
          date: result.test.date,
          createdAt: result.createdAt,
          correctAnswers: result.correctAnswers,
          totalQuestions: result.test.totalQuestions,
          percentage,
          groupName: result.test.group?.name || '',
          classSchedule: result.test.classSchedule,
          title: result.test.title || null,
        })
      }
    })
    
    // Yozma ish natijalari
    student.writtenWorkResults.forEach((result: any) => {
      if (result.writtenWork) {
        allResults.push({
          id: result.id,
          type: 'written-work',
          typeLabel: 'Yozma ish',
          date: result.writtenWork.date,
          createdAt: result.createdAt,
          correctAnswers: result.correctAnswers,
          totalQuestions: result.writtenWork.totalQuestions,
          percentage: Math.round(result.masteryLevel || 0),
          groupName: result.writtenWork.group?.name || '',
          classSchedule: result.writtenWork.classSchedule,
          title: result.writtenWork.title || null,
          remainingTime: result.remainingTime,
          timeGiven: result.writtenWork.timeGiven,
        })
      }
    })
    
    // Eng so'nggi 10 ta natija (createdAt bo'yicha tartiblash)
    const recentResults = allResults
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA // Eng so'nggisini birinchi
      })
      .slice(0, 10) // Faqat 10 ta

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
      recentResults, // Oxirgi 10 ta natija
    })
  } catch (error) {
    console.error('Error fetching student stats:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
