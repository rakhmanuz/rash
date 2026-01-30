import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
      const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0))
      const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999))
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      }
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

    return NextResponse.json(writtenWorks)
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

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { groupId, date, maxScore, title, description } = body

    if (!groupId || !date || !maxScore) {
      return NextResponse.json(
        { error: 'GroupId, date va maxScore kerak' },
        { status: 400 }
      )
    }

    const writtenWork = await prisma.writtenWork.create({
      data: {
        groupId,
        date: new Date(date),
        maxScore: parseFloat(maxScore),
        title: title || null,
        description: description || null,
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
    return NextResponse.json(
      { error: error?.message || 'Server error' },
      { status: 500 }
    )
  }
}
