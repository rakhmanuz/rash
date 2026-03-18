import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isMonitorAuthenticated } from '@/lib/monitor-auth'

// O'zbekiston vaqti UTC+5
const UZ_OFFSET_MS = 5 * 60 * 60 * 1000
// Dars davomiyligi (daqiqa)
const LESSON_DURATION_MINUTES = 60

function getTodayUZ() {
  const now = new Date()
  const uz = new Date(now.getTime() + UZ_OFFSET_MS)
  const y = uz.getUTCFullYear()
  const m = uz.getUTCMonth()
  const d = uz.getUTCDate()
  return { year: y, month: m, day: d, dateKey: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` }
}

function getCurrentTimeUZ() {
  const now = new Date()
  const uz = new Date(now.getTime() + UZ_OFFSET_MS)
  return { hours: uz.getUTCHours(), minutes: uz.getUTCMinutes() }
}

// Vaqt "HH:mm" daqiqaga aylantiradi (00:00 dan)
function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

// Hozirgi vaqt berilgan dars vaqtida (startTime dan LESSON_DURATION_MINUTES ichida) yoki yo'q
function isLessonNow(times: string[], nowMinutes: number): boolean {
  if (!Array.isArray(times)) return false
  for (const t of times) {
    const start = timeToMinutes(t)
    if (nowMinutes >= start && nowMinutes < start + LESSON_DURATION_MINUTES) return true
  }
  return false
}

export async function GET(request: NextRequest) {
  try {
    const monitorOk = isMonitorAuthenticated(request)
    if (!monitorOk) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Kirish talab qilinadi' }, { status: 401 })
      }
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      })
      if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
        return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 })
      }
    }

    const today = getTodayUZ()
    const nowUZ = getCurrentTimeUZ()
    const nowMinutes = nowUZ.hours * 60 + nowUZ.minutes

    const startOfDay = new Date(Date.UTC(today.year, today.month, today.day, 0, 0, 0, 0))
    const endOfDay = new Date(Date.UTC(today.year, today.month, today.day, 23, 59, 59, 999))

    const schedules = await prisma.classSchedule.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        group: {
          include: {
            teacher: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    })

    const timesParsed = schedules.map((s) => ({
      ...s,
      times: typeof s.times === 'string' ? JSON.parse(s.times) : s.times,
    }))

    const withCurrent = timesParsed.map((s) => ({
      id: s.id,
      groupId: s.groupId,
      groupName: s.group.name,
      teacherName: s.group.teacher?.user?.name ?? '',
      times: Array.isArray(s.times) ? s.times : [],
      notes: s.notes,
      isCurrent: isLessonNow(Array.isArray(s.times) ? s.times : [], nowMinutes),
    }))

    const currentLessons = withCurrent.filter((s) => s.isCurrent)
    const todaySchedule = [...withCurrent].sort((a, b) => {
      const aFirst = a.times.length ? Math.min(...a.times.map(timeToMinutes)) : 0
      const bFirst = b.times.length ? Math.min(...b.times.map(timeToMinutes)) : 0
      return aFirst - bFirst
    })

    return NextResponse.json({
      dateKey: today.dateKey,
      now: { hours: nowUZ.hours, minutes: nowUZ.minutes },
      currentLessons,
      todaySchedule,
    })
  } catch (error) {
    console.error('Monitor schedule API error:', error)
    return NextResponse.json(
      { error: 'Server xatolik' },
      { status: 500 }
    )
  }
}
