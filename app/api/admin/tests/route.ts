import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canReadAdminTests, canMutateAdminTests } from '@/lib/admin-api-access'
import { uzDayBounds } from '@/lib/uzbekistan-time'
import { parseScheduleDateUtc, scheduleDateKey } from '@/lib/schedule-date'

// GET - Get all tests
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
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const bounds = uzDayBounds(date)
      where.date = { gte: bounds.gte, lte: bounds.lte }
    }

    const tests = await prisma.test.findMany({
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

    let filteredTests = tests
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      filteredTests = tests.filter((test) => {
        const testDateStr = scheduleDateKey(test.date)
        if (test.classSchedule) {
          return testDateStr === date || scheduleDateKey(test.classSchedule.date) === date
        }
        return testDateStr === date
      })
    }

    return NextResponse.json(filteredTests)
  } catch (error) {
    console.error('Error fetching tests:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Create test
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
    const { groupId, date, totalQuestions, type, title, description, classScheduleId } = body

    if (!groupId || !date || !totalQuestions || !type) {
      return NextResponse.json(
        { error: 'GroupId, date, totalQuestions va type kerak' },
        { status: 400 }
      )
    }

    if (type !== 'kunlik_test' && type !== 'uyga_vazifa') {
      return NextResponse.json(
        { error: 'Type "kunlik_test" yoki "uyga_vazifa" bo\'lishi kerak' },
        { status: 400 }
      )
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
      return NextResponse.json({ error: 'Noto\'g\'ri sana formati' }, { status: 400 })
    }
    const dateObj = parseScheduleDateUtc(String(date))

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
      // Ensure the schedule belongs to the same group
      if (schedule.groupId !== groupId) {
        return NextResponse.json(
          { error: 'Dars rejasi tanlangan guruhga tegishli emas' },
          { status: 400 }
        )
      }
    }

    const test = await prisma.test.create({
      data: {
        groupId,
        date: dateObj,
        totalQuestions: parseInt(totalQuestions),
        type,
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

    return NextResponse.json(test, { status: 201 })
  } catch (error: any) {
    console.error('Error creating test:', error)
    return NextResponse.json(
      { error: error?.message || 'Server error' },
      { status: 500 }
    )
  }
}
