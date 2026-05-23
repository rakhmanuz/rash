import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { scheduleDateKey } from '@/lib/schedule-date'
import { uzDayBounds } from '@/lib/uzbekistan-time'

// GET - Get tests for teacher's groups
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
            groups: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })

    if (!user || !user.teacherProfile) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    const groupIds = user.teacherProfile.groups.map((g) => g.id)

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const type = searchParams.get('type')

    const where: {
      groupId: { in: string[] }
      date?: { gte: Date; lte: Date }
      type?: string
    } = {
      groupId: { in: groupIds },
    }

    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const bounds = uzDayBounds(date)
      where.date = { gte: bounds.gte, lte: bounds.lte }
    }

    if (type) {
      where.type = type
    }

    const tests = await prisma.test.findMany({
      where,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            subject: { select: { id: true, name: true } },
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
      orderBy: {
        date: 'desc',
      },
    })

    let filteredTests = tests
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      filteredTests = tests.filter((test) => {
        const testDateStr = scheduleDateKey(test.date)
        if (test.classSchedule) {
          const scheduleDateStr = scheduleDateKey(test.classSchedule.date)
          return testDateStr === date || scheduleDateStr === date
        }
        return testDateStr === date
      })
    }

    return NextResponse.json(filteredTests)
  } catch (error) {
    console.error('Error fetching teacher tests:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
