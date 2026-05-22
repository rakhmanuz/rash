import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeLearningMode } from '@/lib/learning-mode'
import { redactJoinUrlFromNotes } from '@/lib/online-lessons-helpers'
import { parseScheduleTimes } from '@/lib/class-schedule-week'
import { uzDayBounds, weekBoundsUzbekistan } from '@/lib/uzbekistan-time'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        learningMode: true,
        studentProfile: {
          select: {
            enrollments: {
              where: { isActive: true },
              select: {
                groupId: true,
                group: {
                  select: {
                    id: true,
                    name: true,
                    subject: { select: { name: true } },
                    teacher: {
                      select: {
                        user: { select: { name: true } },
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

    if (!user?.studentProfile) {
      return NextResponse.json({ groups: [], schedules: [] })
    }

    if (user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (normalizeLearningMode(user.learningMode) !== 'OFFLINE') {
      return NextResponse.json({ error: "Faqat offline o'quvchilar uchun" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filterGroupId = searchParams.get('groupId')
    const enrollments = user.studentProfile.enrollments
    const groupIds = enrollments.map((e) => e.groupId)

    if (groupIds.length === 0) {
      return NextResponse.json({ groups: [], schedules: [] })
    }

    if (filterGroupId && !groupIds.includes(filterGroupId)) {
      return NextResponse.json({ error: 'Siz bu guruhga yozilmagansiz' }, { status: 403 })
    }

    const defaultWeek = weekBoundsUzbekistan()
    const startDateStr = searchParams.get('startDate') || defaultWeek.startDateStr
    const endDateStr = searchParams.get('endDate') || defaultWeek.endDateStr
    const startBounds = uzDayBounds(startDateStr)
    const endBounds = uzDayBounds(endDateStr)

    const targetGroupIds = filterGroupId ? [filterGroupId] : groupIds

    const rows = await prisma.classSchedule.findMany({
      where: {
        groupId: { in: targetGroupIds },
        date: { gte: startBounds.gte, lte: endBounds.lte },
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        groupId: true,
        date: true,
        times: true,
        notes: true,
        group: {
          select: {
            name: true,
            subject: { select: { name: true } },
            teacher: {
              select: {
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    })

    const seenGroup = new Set<string>()
    const groups = enrollments
      .filter((e) => !filterGroupId || e.groupId === filterGroupId)
      .filter((e) => {
        if (seenGroup.has(e.groupId)) return false
        seenGroup.add(e.groupId)
        return true
      })
      .map((e) => ({
        id: e.group.id,
        name: e.group.name,
        subjectName: e.group.subject?.name ?? null,
      }))

    const schedules = rows.map((schedule) => ({
      id: schedule.id,
      groupId: schedule.groupId,
      groupName: schedule.group.name,
      subjectName: schedule.group.subject?.name ?? 'Fan',
      teacherName: schedule.group.teacher.user.name,
      date: schedule.date.toISOString(),
      times: parseScheduleTimes(schedule.times),
      notes: redactJoinUrlFromNotes(schedule.notes || '', null),
    }))

    return NextResponse.json({ groups, schedules })
  } catch (error) {
    console.error('Error fetching offline lessons:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
