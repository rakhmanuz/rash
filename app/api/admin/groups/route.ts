import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canReadNatijalarData } from '@/lib/natijalar-read-auth'

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

    if (!user || !canReadNatijalarData(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const fullInclude = {
      subject: {
        select: { id: true, name: true, sortOrder: true, isActive: true },
      },
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
    } as const

    let groups
    try {
      groups = await prisma.group.findMany({
        include: fullInclude,
        orderBy: { createdAt: 'desc' },
      })
    } catch (e) {
      console.warn('[admin/groups GET] include subject failed, retrying without subject:', e)
      groups = await prisma.group.findMany({
        include: {
          teacher: fullInclude.teacher,
          enrollments: fullInclude.enrollments,
        },
        orderBy: { createdAt: 'desc' },
      })
    }

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
    const { name, description, teacherId, maxStudents, subjectId } = body

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

    let resolvedSubjectId: string | null = null
    if (subjectId) {
      const sub = await prisma.subject.findFirst({
        where: { id: subjectId, isActive: true },
      })
      if (!sub) {
        return NextResponse.json({ error: 'Fan topilmadi yoki nofaol' }, { status: 400 })
      }
      resolvedSubjectId = sub.id
    }

    const group = await prisma.group.create({
      data: {
        name,
        description: description || null,
        teacherId,
        subjectId: resolvedSubjectId,
        maxStudents: maxStudents || 20,
        isActive: true,
      },
      include: {
        subject: {
          select: { id: true, name: true, sortOrder: true, isActive: true },
        },
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
