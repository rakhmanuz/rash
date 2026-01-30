import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    const groupIds = user.teacherProfile.groups.map(g => g.id)

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const type = searchParams.get('type')

    const where: any = {
      groupId: {
        in: groupIds,
      },
    }

    if (date) {
      // Parse date string (YYYY-MM-DD format)
      const dateObj = new Date(date)
      dateObj.setHours(0, 0, 0, 0)
      const startOfDay = new Date(dateObj)
      const endOfDay = new Date(dateObj)
      endOfDay.setHours(23, 59, 59, 999)
      
      console.log('Filtering teacher tests by date:', date, '->', startOfDay.toISOString(), 'to', endOfDay.toISOString())
      
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      }
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
