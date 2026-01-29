import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - O'qituvchi guruhlarining eng yaqin dars jadvalini olish
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
    const groupIds = teacher.groups.map(g => g.id)

    if (groupIds.length === 0) {
      return NextResponse.json([])
    }

    // Get today's date only
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // End of today
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)

    const schedules = await prisma.classSchedule.findMany({
      where: {
        groupId: { in: groupIds },
        date: {
          gte: today,
          lte: endOfToday,
        },
      },
      include: {
        group: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Parse times from JSON string
    const parsedSchedules = schedules.map(schedule => ({
      ...schedule,
      times: typeof schedule.times === 'string' ? JSON.parse(schedule.times) : schedule.times,
    }))

    // Sort by time (earliest first)
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
