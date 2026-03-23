import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DAYS_WINDOW = 30

async function requireRahbar() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.role !== 'RAHBAR') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user }
}

function pct(present: number, total: number) {
  if (total <= 0) return 0
  return Math.round((present / total) * 100)
}

function avgMastery(students: { masteryLevel: number | null }[]) {
  if (students.length === 0) return 0
  const sum = students.reduce((s, st) => s + (st.masteryLevel ?? 0), 0)
  return Math.round(sum / students.length)
}

function avgGradePercent(
  grades: { score: number; maxScore: number }[]
): { count: number; averagePercent: number } {
  if (grades.length === 0) return { count: 0, averagePercent: 0 }
  const sum = grades.reduce((s, g) => s + (g.maxScore > 0 ? (g.score / g.maxScore) * 100 : 0), 0)
  return { count: grades.length, averagePercent: Math.round(sum / grades.length) }
}

export async function GET(request: NextRequest) {
  const gate = await requireRahbar()
  if ('error' in gate) return gate.error

  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get('groupId')?.trim() || ''

  const since = new Date()
  since.setDate(since.getDate() - DAYS_WINDOW)

  if (groupId) {
    const group = await prisma.group.findFirst({
      where: { id: groupId, isActive: true },
      include: {
        teacher: {
          include: {
            user: { select: { name: true } },
          },
        },
        enrollments: {
          where: { isActive: true },
          include: {
            student: {
              include: {
                user: { select: { name: true, username: true } },
              },
            },
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Guruh topilmadi' }, { status: 404 })
    }

    const studentIds = group.enrollments.map((e) => e.studentId)

    const [attendances, grades] = await Promise.all([
      prisma.attendance.findMany({
        where: { groupId, date: { gte: since } },
        select: { isPresent: true, studentId: true, date: true },
        orderBy: { date: 'desc' },
        take: 500,
      }),
      prisma.grade.findMany({
        where: { groupId, createdAt: { gte: since } },
        include: {
          student: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    ])

    let present = 0
    for (const a of attendances) {
      if (a.isPresent) present++
    }
    const attendanceWindow = pct(present, attendances.length)

    const gStats = avgGradePercent(grades.map((g) => ({ score: g.score, maxScore: g.maxScore })))

    const students = group.enrollments.map((e) => ({
      id: e.student.id,
      studentId: e.student.studentId,
      name: e.student.user.name,
      username: e.student.user.username,
      masteryLevel: e.student.masteryLevel,
      attendanceRate: e.student.attendanceRate,
    }))

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        maxStudents: group.maxStudents,
        teacherName: group.teacher.user.name,
      },
      summary: {
        studentCount: students.length,
        avgMastery: avgMastery(group.enrollments.map((e) => e.student)),
        attendanceLast30dPercent: attendanceWindow,
        attendanceRecordsLast30d: attendances.length,
        gradesLast30d: gStats,
      },
      students,
      recentGrades: grades.slice(0, 50).map((g) => ({
        id: g.id,
        type: g.type,
        score: g.score,
        maxScore: g.maxScore,
        percent: g.maxScore > 0 ? Math.round((g.score / g.maxScore) * 100) : 0,
        studentName: g.student.user.name,
        createdAt: g.createdAt,
      })),
    })
  }

  const groups = await prisma.group.findMany({
    where: { isActive: true },
    include: {
      teacher: {
        include: {
          user: { select: { name: true } },
        },
      },
      enrollments: {
        where: { isActive: true },
        include: {
          student: { select: { masteryLevel: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  const groupIds = groups.map((g) => g.id)
  if (groupIds.length === 0) {
    return NextResponse.json({ groups: [], windowDays: DAYS_WINDOW })
  }

  const [attendances, grades] = await Promise.all([
    prisma.attendance.findMany({
      where: { groupId: { in: groupIds }, date: { gte: since } },
      select: { groupId: true, isPresent: true },
    }),
    prisma.grade.findMany({
      where: { groupId: { in: groupIds }, createdAt: { gte: since } },
      select: { groupId: true, score: true, maxScore: true },
    }),
  ])

  const attMap = new Map<string, { p: number; t: number }>()
  for (const a of attendances) {
    const cur = attMap.get(a.groupId) || { p: 0, t: 0 }
    cur.t++
    if (a.isPresent) cur.p++
    attMap.set(a.groupId, cur)
  }

  const gradeMap = new Map<string, { score: number; maxScore: number }[]>()
  for (const g of grades) {
    const list = gradeMap.get(g.groupId) || []
    list.push({ score: g.score, maxScore: g.maxScore })
    gradeMap.set(g.groupId, list)
  }

  const payload = groups.map((g) => {
    const st = g.enrollments.map((e) => e.student)
    const att = attMap.get(g.id) || { p: 0, t: 0 }
    const gList = gradeMap.get(g.id) || []
    const gAvg = avgGradePercent(gList)
    return {
      id: g.id,
      name: g.name,
      description: g.description,
      maxStudents: g.maxStudents,
      teacherName: g.teacher.user.name,
      studentCount: g.enrollments.length,
      utilizationPercent: g.maxStudents > 0 ? Math.round((g.enrollments.length / g.maxStudents) * 100) : 0,
      avgMastery: avgMastery(st),
      attendanceLast30dPercent: pct(att.p, att.t),
      attendanceRecordsLast30d: att.t,
      gradesLast30dCount: gAvg.count,
      gradesLast30dAvgPercent: gAvg.averagePercent,
    }
  })

  return NextResponse.json({ groups: payload, windowDays: DAYS_WINDOW })
}
