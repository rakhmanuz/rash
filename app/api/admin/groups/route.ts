import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get all groups
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

    const groups = await prisma.group.findMany({
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
        enrollments: {
          where: { isActive: true },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
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
        createdAt: 'desc',
      },
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Create new group
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
    const { name, description, teacherId, maxStudents } = body

    if (!name || !teacherId) {
      return NextResponse.json(
        { error: 'Guruh nomi va o\'qituvchi tanlanishi kerak' },
        { status: 400 }
      )
    }

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    })

    if (!teacher) {
      return NextResponse.json(
        { error: 'O\'qituvchi topilmadi' },
        { status: 404 }
      )
    }

    const group = await prisma.group.create({
      data: {
        name,
        description: description || null,
        teacherId,
        maxStudents: maxStudents || 20,
        isActive: true,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
