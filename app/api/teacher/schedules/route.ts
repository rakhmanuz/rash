import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { todayKeyUzbekistan, uzDayBounds } from '@/lib/uzbekistan-time'

// GET - O'qituvchi guruhlarining dars jadvalini olish (admin bilan bir xil UZ kalendar)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teacherProfile: {
          include: {
            groups: true,
          },
        },
      },
    })

    if (!user || !user.teacherProfile) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    const teacher = user.teacherProfile
    const groupIds = teacher.groups.map((g) => g.id)

    if (groupIds.length === 0) {
      return NextResponse.json([])
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: {
      groupId: string | { in: string[] }
      date?: { gte: Date; lte: Date }
    } = {
      groupId: { in: groupIds },
    }

    if (groupId && groupIds.includes(groupId)) {
      where.groupId = groupId
    }

    if (startDate && endDate) {
      const startBounds = uzDayBounds(startDate)
      const endBounds = uzDayBounds(endDate)
      where.date = { gte: startBounds.gte, lte: endBounds.lte }
    } else if (date) {
      const bounds = uzDayBounds(date)
      where.date = { gte: bounds.gte, lte: bounds.lte }
    } else {
      const today = todayKeyUzbekistan()
      const bounds = uzDayBounds(today)
      where.date = { gte: bounds.gte, lte: bounds.lte }
    }

    const schedules = await prisma.classSchedule.findMany({
      where,
      include: {
        group: {
          include: {
            subject: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    const parsedSchedules = schedules.map((schedule) => ({
      ...schedule,
      times: typeof schedule.times === 'string' ? JSON.parse(schedule.times) : schedule.times,
    }))

    const sortedSchedules = parsedSchedules.sort((a, b) => {
      const timeA = a.times[0] || '00:00'
      const timeB = b.times[0] || '00:00'
      return timeA.localeCompare(timeB)
    })

    return NextResponse.json(sortedSchedules)
  } catch (error) {
    console.error('Error fetching teacher schedules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
