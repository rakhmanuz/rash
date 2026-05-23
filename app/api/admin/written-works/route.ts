import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canReadAdminTests, canMutateAdminTests } from '@/lib/admin-api-access'
import { parseScheduleDateUtc, scheduleDateKey } from '@/lib/schedule-date'
import { uzDayBounds } from '@/lib/uzbekistan-time'

// GET - Get all written works
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !(await canReadAdminTests(user.id, user.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const date = searchParams.get('date')

    const where: any = {}
    if (groupId) {
      where.groupId = groupId
    }
    const where: { groupId?: string; date?: { gte: Date; lte: Date } } = {}
    if (groupId) where.groupId = groupId
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const bounds = uzDayBounds(date)
      where.date = { gte: bounds.gte, lte: bounds.lte }
    }

    const writtenWorks = await prisma.writtenWork.findMany({
      where,
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        classSchedule: {
          select: {
            id: true,
            date: true,
            times: true,
          },
        },
        results: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { date: 'desc' }],
    })

    let filteredWorks = writtenWorks
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      filteredWorks = writtenWorks.filter((work) => {
        const workDateStr = scheduleDateKey(work.date)
        if (work.classSchedule) {
          return workDateStr === date || scheduleDateKey(work.classSchedule.date) === date
        }
        return workDateStr === date
      })
    }

    return NextResponse.json(filteredWorks)
  } catch (error) {
    console.error('Error fetching written works:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Create written work
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !(await canMutateAdminTests(user.id, user.role, 'create'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { groupId, date, totalQuestions, timeGiven, title, description, classScheduleId } = body

    if (!groupId || !date || !totalQuestions || !timeGiven) {
      return NextResponse.json(
        { error: 'GroupId, date, totalQuestions va timeGiven kerak' },
        { status: 400 }
      )
    }

    // Validate classScheduleId if provided
    if (classScheduleId) {
      const schedule = await prisma.classSchedule.findUnique({
        where: { id: classScheduleId },
      })
      if (!schedule) {
        return NextResponse.json(
          { error: 'Dars rejasi topilmadi' },
          { status: 404 }
        )
      }
      if (schedule.groupId !== groupId) {
        return NextResponse.json(
          { error: 'Dars rejasi tanlangan guruhga tegishli emas' },
          { status: 400 }
        )
      }
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
      return NextResponse.json({ error: 'Noto\'g\'ri sana formati' }, { status: 400 })
    }
    const dateObj = parseScheduleDateUtc(String(date))

    const writtenWork = await prisma.writtenWork.create({
      data: {
        groupId,
        date: dateObj,
        totalQuestions: parseInt(totalQuestions),
        timeGiven: parseInt(timeGiven),
        title: title || null,
        description: description || null,
        classScheduleId: classScheduleId || null,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(writtenWork, { status: 201 })
  } catch (error: any) {
    console.error('Error creating written work:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    })
    return NextResponse.json(
      { 
        error: error?.message || 'Server error',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}
