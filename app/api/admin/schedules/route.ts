import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canReadAdminSchedules, canMutateAdminSchedules } from '@/lib/admin-api-access'
import { CLASS_SCHEDULE_VALID_TIMES, isValidClassScheduleTime } from '@/lib/class-schedule-times'
import { parseScheduleDateUtc } from '@/lib/schedule-date'
import { uzDayBounds } from '@/lib/uzbekistan-time'
import { logActivityForUser } from '@/lib/activity-log'

const VALID_TIMES = CLASS_SCHEDULE_VALID_TIMES

function normalizeDateList(body: { date?: unknown; dates?: unknown }): string[] {
  const raw: string[] = []
  if (Array.isArray(body.dates)) {
    for (const d of body.dates) {
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) raw.push(d)
    }
  } else if (typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    raw.push(body.date)
  }
  return [...new Set(raw)]
}

// GET - Barcha dars rejalarini olish
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !(await canReadAdminSchedules(user.id, user.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}
    if (groupId) {
      where.groupId = groupId
    }
    
    // Sana formatlashni soddalashtirish - faqat date string (YYYY-MM-DD) ni qabul qilish
    // Database'da sana UTC formatida saqlanadi, shuning uchun UTC metodlaridan foydalanamiz
    if (startDate && endDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      const startBounds = uzDayBounds(startDate)
      const endBounds = uzDayBounds(endDate)
      where.date = { gte: startBounds.gte, lte: endBounds.lte }
    } else if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const bounds = uzDayBounds(date)
      where.date = { gte: bounds.gte, lte: bounds.lte }
    }

    const schedules = await prisma.classSchedule.findMany({
      where,
      include: {
        group: {
          include: {
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Yangi dars rejasi qo'shish
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !(await canMutateAdminSchedules(user.id, user.role, 'create'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { groupId, times, notes } = body
    const dateList = normalizeDateList(body)

    if (!groupId || dateList.length === 0 || !times || !Array.isArray(times) || times.length === 0) {
      return NextResponse.json(
        { error: 'Guruh, kamida bitta sana va dars vaqtlari kerak' },
        { status: 400 }
      )
    }

    const invalidTimes = times.filter((time: string) => !isValidClassScheduleTime(time))
    if (invalidTimes.length > 0) {
      return NextResponse.json(
        { error: `Noto'g'ri dars vaqti: ${invalidTimes.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    })

    if (!group) {
      return NextResponse.json({ error: 'Guruh topilmadi' }, { status: 404 })
    }

    const created = []
    for (const dateStr of dateList) {
      const dateObj = parseScheduleDateUtc(dateStr)
      const newSchedule = await prisma.classSchedule.create({
        data: {
          groupId,
          date: dateObj,
          times: JSON.stringify(times),
          notes: notes || null,
        },
        include: {
          group: {
            include: {
              teacher: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      })
      created.push(newSchedule)
    }

    const dateLabel =
      dateList.length === 1
        ? dateList[0]
        : `${dateList[0]} … ${dateList[dateList.length - 1]} (${dateList.length} kun)`
    await logActivityForUser(prisma, user, {
      action: 'CREATE',
      category: 'schedule',
      summary: `Dars rejasi: ${group.name} — ${dateLabel}, ${times.join(', ')}`,
      entityType: 'group',
      entityId: groupId,
      metadata: { dates: dateList, times, count: created.length },
    })

    return NextResponse.json(
      {
        schedules: created,
        count: created.length,
        schedule: created[0],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating schedule:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // Log full error for debugging
    console.error('Full error details:', {
      message: errorMessage,
      stack: errorStack,
      error: error
    })
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: errorMessage,
        // Only include stack in development
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    )
  }
}
