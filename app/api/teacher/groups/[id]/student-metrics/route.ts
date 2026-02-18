import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Guruh o'quvchilarining bir oylik o'rtacha ko'rsatkichlari:
 * - Davomat (Attendance)
 * - Vazifa (Assignment completion)
 * - O'zlashtirish (Class assimilation - darsdagi o'zlashtirish)
 * - Qobilyat (Ability - haftalik yozmaish)
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

    // Oy oralig'ini aniqlash
    const now = new Date()
    const year = monthParam ? parseInt(monthParam.split('-')[0], 10) : now.getFullYear()
    const month = monthParam ? parseInt(monthParam.split('-')[1], 10) - 1 : now.getMonth()
    const monthStart = new Date(year, month, 1, 0, 0, 0, 0)
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)

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
                        assignments: {
                          where: {
                            groupId: params.id,
                            createdAt: { gte: monthStart, lte: monthEnd },
                          },
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
    const scheduleIds = new Set(classSchedulesInMonth.map((s) => s.id))
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

      // 2. Vazifa - oydagi vazifalar topshirish foizi
      const monthAssignments = student.assignments.filter(
        (a) =>
          new Date(a.createdAt) >= monthStart && new Date(a.createdAt) <= monthEnd
      )
      const completedAssignments = monthAssignments.filter((a) => a.isCompleted).length
      const vazifaAvg =
        monthAssignments.length > 0
          ? Math.round((completedAssignments / monthAssignments.length) * 1000) / 10
          : null

      // 3. O'zlashtirish - darsdagi o'zlashtirish baholari o'rtachasi
      const ozlashtirishGrades = student.grades.filter(
        (g) =>
          (g.type === "darsdagi_o'zlashtirish" || g.type === 'darsdagi_ozlashtirish') &&
          new Date(g.createdAt) >= monthStart &&
          new Date(g.createdAt) <= monthEnd
      )
      const ozlashtirishAvg =
        ozlashtirishGrades.length > 0
          ? Math.round(
              (ozlashtirishGrades.reduce((s, g) => s + (g.score / g.maxScore) * 100, 0) /
                ozlashtirishGrades.length) *
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
