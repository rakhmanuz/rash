import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const date = searchParams.get('date')

    const where: any = {}
    if (groupId) {
      where.groupId = groupId
    }
    if (date) {
      // Parse date string (YYYY-MM-DD format)
      const dateObj = new Date(date)
      dateObj.setHours(0, 0, 0, 0)
      const startOfDay = new Date(dateObj)
      const endOfDay = new Date(dateObj)
      endOfDay.setHours(23, 59, 59, 999)
      
      console.log('Filtering tests by date:', date, '->', startOfDay.toISOString(), 'to', endOfDay.toISOString())
      
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      }
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
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(tests)
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

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
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

    // Validate and parse date
    // Date should be in YYYY-MM-DD format from frontend
    const dateObj = new Date(date + 'T00:00:00.000Z') // Add time to ensure UTC
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json(
        { error: 'Noto\'g\'ri sana formati' },
        { status: 400 }
      )
    }
    
    console.log('Creating test with date:', date, '->', dateObj.toISOString())

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
