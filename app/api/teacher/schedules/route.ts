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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {
      groupId: { in: groupIds },
    }

    // If groupId is specified, filter by it
    if (groupId && groupIds.includes(groupId)) {
      where.groupId = groupId
    }

    // Sana formatlashni soddalashtirish - faqat date string (YYYY-MM-DD) ni qabul qilish
    // Database'da sana UTC formatida saqlanadi, shuning uchun UTC metodlaridan foydalanamiz
    if (startDate && endDate) {
      // Hafta davomidagi dars rejalarini olish
      let startDateObj: Date
      let endDateObj: Date
      
      if (startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = startDate.split('-').map(Number)
        // UTC formatida sana yaratish (kun boshlanishi)
        startDateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
      } else {
        startDateObj = new Date(startDate)
        startDateObj.setUTCHours(0, 0, 0, 0)
      }
      
      if (endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = endDate.split('-').map(Number)
        // UTC formatida sana yaratish (kun tugashi)
        endDateObj = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
      } else {
        endDateObj = new Date(endDate)
        endDateObj.setUTCHours(23, 59, 59, 999)
      }
      
      where.date = {
        gte: startDateObj,
        lte: endDateObj,
      }
    } else if (date) {
      // Bitta sana uchun
      let dateObj: Date
      if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = date.split('-').map(Number)
        // UTC formatida sana yaratish
        dateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
      } else {
        dateObj = new Date(date)
        dateObj.setUTCHours(0, 0, 0, 0)
      }
      // Kun boshlanishi va tugashi
      const startOfDay = new Date(dateObj)
      startOfDay.setUTCHours(0, 0, 0, 0)
      const endOfDay = new Date(dateObj)
      endOfDay.setUTCHours(23, 59, 59, 999)
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      }
    } else {
      // If no date specified, get today's date only
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      const endOfToday = new Date(today)
      endOfToday.setUTCHours(23, 59, 59, 999)
      where.date = {
        gte: today,
        lte: endOfToday,
      }
    }

    const schedules = await prisma.classSchedule.findMany({
      where,
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
