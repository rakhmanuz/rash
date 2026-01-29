import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
      const dateObj = new Date(date)
      const startOfDay = new Date(dateObj)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(dateObj)
      endOfDay.setHours(23, 59, 59, 999)
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    const schedules = await prisma.classSchedule.findMany({
      where,
      include: {
        group: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    name: true,
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

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { groupId, date, times, notes } = body

    if (!groupId || !date || !times || !Array.isArray(times) || times.length === 0) {
      return NextResponse.json(
        { error: 'Guruh, sana va dars vaqtlari kerak' },
        { status: 400 }
      )
    }

    // Validate times format
    const validTimes = ['05:30', '09:00', '10:00', '12:00', '13:00', '14:30', '15:00', '18:00']
    const invalidTimes = times.filter((time: string) => !validTimes.includes(time))
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

    // Parse date and normalize to start of day
    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)

    // Check if schedule already exists for this group and date
    const existingSchedule = await prisma.classSchedule.findFirst({
      where: {
        groupId,
        date: {
          gte: new Date(dateObj),
          lt: new Date(dateObj.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    })

    if (existingSchedule) {
      // Update existing schedule
      const updated = await prisma.classSchedule.update({
        where: { id: existingSchedule.id },
        data: {
          times: JSON.stringify(times),
          notes: notes || null,
        },
        include: {
          group: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      return NextResponse.json(updated, { status: 200 })
    } else {
      // Create new schedule
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
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      return NextResponse.json(newSchedule, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
