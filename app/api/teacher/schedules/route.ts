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

    // Get today's date and future dates
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Get schedules for next 30 days
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + 30)

    const schedules = await prisma.classSchedule.findMany({
      where: {
        groupId: { in: groupIds },
        date: {
          gte: today,
          lte: futureDate,
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

    // Get the nearest schedule (today or next)
    const now = new Date()
    const nearestSchedules = parsedSchedules
      .filter(s => {
        const scheduleDate = new Date(s.date)
        scheduleDate.setHours(0, 0, 0, 0)
        const todayDate = new Date(now)
        todayDate.setHours(0, 0, 0, 0)
        
        // Include today and future dates
        return scheduleDate >= todayDate
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        if (dateA !== dateB) {
          return dateA - dateB
        }
        // If same date, sort by first time
        const timeA = a.times[0] || '00:00'
        const timeB = b.times[0] || '00:00'
        return timeA.localeCompare(timeB)
      })
      .slice(0, 10) // Get next 10 schedules

    return NextResponse.json(nearestSchedules)
  } catch (error) {
    console.error('Error fetching teacher schedules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
