import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canReadNatijalarData } from '@/lib/natijalar-read-auth'

function utcDayRange(dateStr: string): { start: Date; end: Date } {
  const [y, m, d] = dateStr.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0))
  const end = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999))
  return { start, end }
}

function formatYmd(d: Date): string {
  const y = d.getUTCFullYear()
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

function weekdayUz(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const noon = new Date(Date.UTC(y, m - 1, d, 7, 0, 0, 0))
  return noon.toLocaleDateString('uz-UZ', { weekday: 'long', timeZone: 'Asia/Tashkent' })
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || !canReadNatijalarData(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const date = searchParams.get('date')
    const light = searchParams.get('light') === '1'

    if (!groupId) {
      return NextResponse.json({ error: 'groupId majburiy' }, { status: 400 })
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, name: true },
    })
    if (!group) {
      return NextResponse.json({ error: 'Guruh topilmadi' }, { status: 404 })
    }

    const enrolledCount = await prisma.enrollment.count({
      where: { groupId, isActive: true },
    })

    if (!date) {
      if (light) {
        return NextResponse.json({
          group,
          enrolledCount,
          mode: 'meta' as const,
        })
      }

      const schedules = await prisma.classSchedule.findMany({
        where: { groupId },
        orderBy: { date: 'desc' },
        take: 400,
        select: { id: true, date: true, times: true, notes: true },
      })

      const scheduleDates = schedules.map((s) => {
        let timesArr: string[] = []
        try {
          const parsed = typeof s.times === 'string' ? JSON.parse(s.times) : s.times
          timesArr = Array.isArray(parsed) ? parsed.map(String) : []
        } catch {
          timesArr = []
        }
        const ymd = formatYmd(s.date)
        const weekday = weekdayUz(ymd)
        return {
          scheduleId: s.id,
          date: ymd,
          times: timesArr,
          timesLabel: timesArr.length ? timesArr.join(', ') : '—',
          notes: s.notes ?? null,
          weekday,
        }
      })

      return NextResponse.json({
        group,
        enrolledCount,
        mode: 'pick-date' as const,
        scheduleDates,
      })
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'date YYYY-MM-DD formatida bo‘lishi kerak' }, { status: 400 })
    }

    const { start: dayStart, end: dayEnd } = utcDayRange(date)

    const schedules = await prisma.classSchedule.findMany({
      where: {
        groupId,
        date: { gte: dayStart, lte: dayEnd },
      },
      select: { id: true, date: true, times: true, notes: true },
    })

    const scheduleIds = schedules.map((s) => s.id)

    const LESSON_DURATION = 180
    const pctFromAttendance = (isPresent: boolean, lateMinutes: number | null): number => {
      if (!isPresent) return 0
      const late = lateMinutes ?? 0
      return Math.round(
        Math.max(0, Math.min(100, ((LESSON_DURATION - late) / LESSON_DURATION) * 100))
      )
    }

    /** Faqat shu kun: rejadagi slot yoki (reja yo‘q bo‘lsa) sanasi mos keladigan yozuvlar */
    const workWhere =
      scheduleIds.length > 0
        ? {
            groupId,
            OR: [
              { classScheduleId: { in: scheduleIds } },
              {
                AND: [{ classScheduleId: null }, { date: { gte: dayStart, lte: dayEnd } }],
              },
            ],
          }
        : { groupId, date: { gte: dayStart, lte: dayEnd } }

    const scheduleBlocks = schedules.map((s) => {
      let timesArr: string[] = []
      try {
        const parsed = typeof s.times === 'string' ? JSON.parse(s.times) : s.times
        timesArr = Array.isArray(parsed) ? parsed.map(String) : []
      } catch {
        timesArr = []
      }
      return {
        id: s.id,
        times: timesArr,
        timesLabel: timesArr.length ? timesArr.join(', ') : '—',
        notes: s.notes ?? null,
      }
    })

    const tests = await prisma.test.findMany({
      where: workWhere,
      include: {
        _count: { select: { results: true } },
        results: {
          select: {
            studentId: true,
            correctAnswers: true,
            infinityAwarded: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const writtenWorks = await prisma.writtenWork.findMany({
      where: workWhere,
      include: {
        _count: { select: { results: true } },
        results: {
          select: {
            studentId: true,
            correctAnswers: true,
            score: true,
            masteryLevel: true,
            infinityAwarded: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    tests.sort((a, b) => {
      const o = (t: string) => (t === 'kunlik_test' ? 0 : t === 'uyga_vazifa' ? 1 : 2)
      const d = o(a.type) - o(b.type)
      if (d !== 0) return d
      return a.createdAt.getTime() - b.createdAt.getTime()
    })

    const attendances = await prisma.attendance.findMany({
      where:
        scheduleIds.length > 0
          ? { groupId, classScheduleId: { in: scheduleIds } }
          : { groupId, date: { gte: dayStart, lte: dayEnd } },
      select: {
        studentId: true,
        classScheduleId: true,
        isPresent: true,
        lateMinutes: true,
      },
    })

    const enrollments = await prisma.enrollment.findMany({
      where: { groupId, isActive: true },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, username: true } },
          },
        },
      },
    })

    const students = enrollments
      .map((e) => ({
        studentId: e.student.id,
        userName: e.student.user?.name || e.student.user?.username || 'Noma’lum',
        username: e.student.user?.username ?? null,
      }))
      .sort((a, b) => a.userName.localeCompare(b.userName, 'uz'))

    const getStudentDayAttendance = (
      studentId: string
    ): { isAbsent: boolean; attendancePercent: number | null } => {
      if (scheduleIds.length > 0) {
        let sum = 0
        let n = 0
        let explicitAbsent = false
        for (const sid of scheduleIds) {
          const a = attendances.find((x) => x.studentId === studentId && x.classScheduleId === sid)
          if (!a) continue
          n += 1
          if (!a.isPresent) explicitAbsent = true
          sum += pctFromAttendance(a.isPresent, a.lateMinutes)
        }
        return {
          isAbsent: explicitAbsent,
          attendancePercent: n > 0 ? Math.round(sum / n) : null,
        }
      }
      const rows = attendances.filter((x) => x.studentId === studentId)
      if (rows.length === 0) {
        return { isAbsent: false, attendancePercent: null }
      }
      const explicitAbsent = rows.some((x) => !x.isPresent)
      const sum = rows.reduce((s, x) => s + pctFromAttendance(x.isPresent, x.lateMinutes), 0)
      return {
        isAbsent: explicitAbsent,
        attendancePercent: Math.round(sum / rows.length),
      }
    }

    type ActivityRow = {
      id: string
      category: 'kunlik_test' | 'uyga_vazifa' | 'yozma_ish'
      label: string
      title: string | null
      totalQuestions: number
      resultsEntered: number
      enrolledCount: number
      classScheduleId: string | null
      extra?: string
    }

    const activities: ActivityRow[] = []

    for (const t of tests) {
      const cat = t.type === 'uyga_vazifa' ? 'uyga_vazifa' : 'kunlik_test'
      const label = t.type === 'uyga_vazifa' ? 'Uyga vazifa' : 'Kunlik test'
      activities.push({
        id: t.id,
        category: cat,
        label,
        title: t.title,
        totalQuestions: t.totalQuestions,
        resultsEntered: t._count.results,
        enrolledCount,
        classScheduleId: t.classScheduleId,
        extra: t.description ?? undefined,
      })
    }

    for (const w of writtenWorks) {
      activities.push({
        id: w.id,
        category: 'yozma_ish',
        label: 'Yozma ish',
        title: w.title,
        totalQuestions: w.totalQuestions,
        resultsEntered: w._count.results,
        enrolledCount,
        classScheduleId: w.classScheduleId,
        extra: w.timeGiven ? `${w.timeGiven} daqiqa` : undefined,
      })
    }

    const studentRows = students.map((stu) => {
      const { isAbsent, attendancePercent } = getStudentDayAttendance(stu.studentId)

      let dayInfinityTotal = 0
      const cells: {
        activityId: string
        category: ActivityRow['category']
        label: string
        title: string | null
        hasResult: boolean
        display: string
      }[] = []

      for (const t of tests) {
        const r = t.results.find((x) => x.studentId === stu.studentId)
        if (r) dayInfinityTotal += r.infinityAwarded ?? 0
        const pct =
          t.totalQuestions > 0 && r
            ? Math.round((r.correctAnswers / t.totalQuestions) * 100)
            : null
        const typeLabel = t.type === 'uyga_vazifa' ? 'Uyga vazifa' : 'Kunlik test'
        cells.push({
          activityId: t.id,
          category: t.type === 'uyga_vazifa' ? 'uyga_vazifa' : 'kunlik_test',
          label: typeLabel,
          title: t.title,
          hasResult: !!r,
          display: r
            ? `${r.correctAnswers}/${t.totalQuestions}${pct != null ? ` (${pct}%)` : ''}`
            : '—',
        })
      }

      for (const w of writtenWorks) {
        const r = w.results.find((x) => x.studentId === stu.studentId)
        if (r) dayInfinityTotal += r.infinityAwarded ?? 0
        const display = r
          ? `${r.correctAnswers}/${w.totalQuestions} (${Math.round(r.masteryLevel)}%)`
          : '—'
        cells.push({
          activityId: w.id,
          category: 'yozma_ish',
          label: 'Yozma ish',
          title: w.title,
          hasResult: !!r,
          display,
        })
      }

      return {
        ...stu,
        cells,
        isAbsent,
        attendancePercent,
        dayInfinityTotal,
      }
    })

    const weekday = weekdayUz(date)

    return NextResponse.json({
      group,
      enrolledCount,
      mode: 'detail' as const,
      date,
      weekday,
      scheduleBlocks,
      activities,
      studentRows,
    })
  } catch (e) {
    console.error('results-summary:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
