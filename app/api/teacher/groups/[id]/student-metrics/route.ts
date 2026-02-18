import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Guruh o'quvchilarining bir oylik o'rtacha ko'rsatkichlari:
 * - Davomat (Attendance) - darslarda qatnashish
 * - Vazifa (Uyda topshiriq) - Test type uyga_vazifa + TestResult
 * - O'zlashtirish (Kunlik testlar) - Test type kunlik_test + TestResult
 * - Qobilyat (Ability) - haftalik yozmaish, WrittenWorkResult
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get('month') // Format: YYYY-MM

    // Oy oralig'ini aniqlash - O'zbekiston vaqti (UTC+5) bo'yicha
    const UZBEKISTAN_OFFSET = 5 * 60 * 60 * 1000
    const now = new Date()
    const year = monthParam ? parseInt(monthParam.split('-')[0], 10) : now.getFullYear()
    const month = monthParam ? parseInt(monthParam.split('-')[1], 10) - 1 : now.getMonth()
    // Oy boshi va oxiri O'zbekiston vaqtida (DB da shu formatda saqlanadi)
    const monthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0) - UZBEKISTAN_OFFSET)
    const monthEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999) - UZBEKISTAN_OFFSET)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teacherProfile: {
          include: {
            groups: {
              where: { id: params.id },
              include: {
                enrollments: {
                  where: { isActive: true },
                  include: {
                    student: {
                      include: {
                        user: { select: { name: true, username: true } },
                        attendances: {
                          where: {
                            groupId: params.id,
                            date: { gte: monthStart, lte: monthEnd },
                          },
                          include: { classSchedule: true },
                        },
                        grades: {
                          where: {
                            groupId: params.id,
                            createdAt: { gte: monthStart, lte: monthEnd },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user?.teacherProfile) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const group = user.teacherProfile.groups.find((g) => g.id === params.id)
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found or access denied' },
        { status: 404 }
      )
    }

    // Oydagi darslar soni (ClassSchedule bo'yicha)
    const classSchedulesInMonth = await prisma.classSchedule.findMany({
      where: {
        groupId: params.id,
        date: { gte: monthStart, lte: monthEnd },
      },
      orderBy: { date: 'asc' },
    })

    const totalLessonsInMonth = classSchedulesInMonth.length
    const scheduleMap = new Map(classSchedulesInMonth.map((s) => [s.id, s]))

    // Davomat foizini hisoblash (classSchedule bo'yicha)
    const calculateAttendancePercentage = (attendance: any, classSchedule: any): number => {
      if (!attendance.isPresent) return 0
      if (!attendance.arrivalTime || !classSchedule) return 100

      const arrivalTime = new Date(attendance.arrivalTime)
      const classDate = new Date(classSchedule.date)
      const scheduleTimes =
        typeof classSchedule.times === 'string'
          ? JSON.parse(classSchedule.times)
          : classSchedule.times

      if (!Array.isArray(scheduleTimes) || scheduleTimes.length === 0) return 100

      const [hours, minutes] = scheduleTimes[0].split(':').map(Number)
      const classStartTime = new Date(classDate)
      classStartTime.setHours(hours, minutes, 0, 0)
      const classEndTime = new Date(classStartTime)
      classEndTime.setHours(classEndTime.getHours() + 3)

      if (arrivalTime <= classStartTime) return 100
      if (arrivalTime >= classEndTime) return 0

      const remainingTime = classEndTime.getTime() - arrivalTime.getTime()
      const totalClassTime = 3 * 60 * 60 * 1000
      return Math.max(0, Math.min(100, Math.round((remainingTime / totalClassTime) * 100)))
    }

    // O'quvchilar bo'yicha hisoblash
    const WrittenWorkResultsInMonth = await prisma.writtenWorkResult.findMany({
      where: {
        writtenWork: {
          groupId: params.id,
          date: { gte: monthStart, lte: monthEnd },
        },
      },
      include: { writtenWork: true },
    })

    const writtenWorkByStudent = new Map<string, number[]>()
    for (const wr of WrittenWorkResultsInMonth) {
      const list = writtenWorkByStudent.get(wr.studentId) || []
      list.push(wr.masteryLevel) // 0-100% formatda
      writtenWorkByStudent.set(wr.studentId, list)
    }

    // Vazifa (uyga_vazifa) va O'zlashtirish (kunlik_test) - TestResult orqali
    const testResultsInMonth = await prisma.testResult.findMany({
      where: {
        test: {
          groupId: params.id,
          date: { gte: monthStart, lte: monthEnd },
        },
      },
      include: { test: true },
    })

    const vazifaByStudent = new Map<string, number[]>() // uyga_vazifa: correctAnswers/totalQuestions*100
    const ozlashtirishByStudent = new Map<string, number[]>() // kunlik_test

    for (const tr of testResultsInMonth) {
      const pct =
        tr.test.totalQuestions > 0
          ? (tr.correctAnswers / tr.test.totalQuestions) * 100
          : 0
      if (tr.test.type === 'uyga_vazifa') {
        const list = vazifaByStudent.get(tr.studentId) || []
        list.push(pct)
        vazifaByStudent.set(tr.studentId, list)
      } else if (tr.test.type === 'kunlik_test') {
        const list = ozlashtirishByStudent.get(tr.studentId) || []
        list.push(pct)
        ozlashtirishByStudent.set(tr.studentId, list)
      }
    }

    const students = group.enrollments.map((e) => e.student)

    const studentMetrics = students.map((student) => {
      // 1. Davomat - oydagi darslar bo'yicha o'rtacha
      let davomatSum = 0
      let davomatCount = 0

      if (totalLessonsInMonth > 0) {
        for (const schedule of classSchedulesInMonth) {
          const att = student.attendances.find(
            (a) =>
              a.classScheduleId === schedule.id ||
              (Math.abs(new Date(a.date).getTime() - new Date(schedule.date).getTime()) <
                24 * 60 * 60 * 1000 &&
                !a.classScheduleId)
          )
          const scheduleForCalc = scheduleMap.get(schedule.id) || schedule
          davomatSum += att
            ? calculateAttendancePercentage(att, scheduleForCalc)
            : 0 // Kelmagan = 0%
        }
      }
      const davomatAvg =
        totalLessonsInMonth > 0
          ? Math.round((davomatSum / totalLessonsInMonth) * 10) / 10
          : null

      // 2. Vazifa - uyda topshiriq (uyga_vazifa Test natijalari)
      const vazifaScores = vazifaByStudent.get(student.id) || []
      const vazifaAvg =
        vazifaScores.length > 0
          ? Math.round(
              (vazifaScores.reduce((a, b) => a + b, 0) / vazifaScores.length) * 10
            ) / 10
          : null

      // 3. O'zlashtirish - kunlik testlar (kunlik_test Test natijalari)
      const ozlashtirishScores = ozlashtirishByStudent.get(student.id) || []
      const ozlashtirishAvg =
        ozlashtirishScores.length > 0
          ? Math.round(
              (ozlashtirishScores.reduce((a, b) => a + b, 0) /
                ozlashtirishScores.length) *
                10
            ) / 10
          : null

      // 4. Qobilyat - haftalik yozmaish yoki WrittenWorkResult (yozma ish)
      const qobilyatGrades = student.grades.filter(
        (g) =>
          (g.type === 'haftalik_yozmaish' || g.type === 'haftalik_yozma_ish') &&
          new Date(g.createdAt) >= monthStart &&
          new Date(g.createdAt) <= monthEnd
      )
      const writtenWorkScores = writtenWorkByStudent.get(student.id) || []

      let qobilyatSum = 0
      let qobilyatCount = 0
      for (const g of qobilyatGrades) {
        qobilyatSum += (g.score / g.maxScore) * 100
        qobilyatCount++
      }
      for (const pct of writtenWorkScores) {
        qobilyatSum += pct
        qobilyatCount++
      }
      const qobilyatAvg =
        qobilyatCount > 0
          ? Math.round((qobilyatSum / qobilyatCount) * 10) / 10
          : null

      return {
        id: student.id,
        name: student.user.name || student.user.username || 'Noma\'lum',
        davomat: davomatAvg,
        vazifa: vazifaAvg,
        ozlashtirish: ozlashtirishAvg,
        qobilyat: qobilyatAvg,
      }
    })

    return NextResponse.json({
      groupId: group.id,
      groupName: group.name,
      month: `${year}-${String(month + 1).padStart(2, '0')}`,
      totalLessonsInMonth,
      students: studentMetrics.sort((a, b) => a.name.localeCompare(b.name)),
    })
  } catch (error) {
    console.error('Error fetching group student metrics:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
