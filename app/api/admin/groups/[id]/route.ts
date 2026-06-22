import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeLearningMode } from '@/lib/learning-mode'

async function requireAdminOrManager() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  })
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) return null
  return user
}

// GET - Guruhni olish (batafsil)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actor = await requireAdminOrManager()
    if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        subject: {
          select: { id: true, name: true },
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
              select: {
                id: true,
                studentId: true,
                level: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    phone: true,
                  },
                },
              },
            },
          },
          orderBy: {
            enrolledAt: 'desc',
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Guruh topilmadi' }, { status: 404 })
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT - Update group
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { name, description, teacherId, maxStudents, isActive, subjectId, learningMode: learningModeRaw } = body

    const group = await prisma.group.findUnique({
      where: { id: params.id },
    })

    if (!group) {
      return NextResponse.json({ error: 'Guruh topilmadi' }, { status: 404 })
    }

    // Check teacher if changed
    if (teacherId && teacherId !== group.teacherId) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
      })

      if (!teacher) {
        return NextResponse.json(
          { error: 'O\'qituvchi topilmadi' },
          { status: 404 }
        )
      }
    }

    let subjectUpdate: { subjectId: string | null } | Record<string, never> = {}
    if (subjectId !== undefined) {
      if (subjectId === null || subjectId === '') {
        subjectUpdate = { subjectId: null }
      } else {
        const sub = await prisma.subject.findFirst({
          where: { id: subjectId, isActive: true },
        })
        if (!sub) {
          return NextResponse.json({ error: 'Fan topilmadi yoki nofaol' }, { status: 400 })
        }
        subjectUpdate = { subjectId: sub.id }
      }
    }

    const learningModeUpdate =
      learningModeRaw !== undefined
        ? { learningMode: normalizeLearningMode(learningModeRaw) }
        : {}

    const updatedGroup = await prisma.group.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
        teacherId: teacherId || group.teacherId,
        maxStudents: maxStudents || group.maxStudents,
        isActive: isActive !== undefined ? isActive : group.isActive,
        ...subjectUpdate,
        ...learningModeUpdate,
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
    })

    return NextResponse.json(updatedGroup)
  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE - Delete group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const group = await prisma.group.findUnique({
      where: { id: params.id },
    })

    if (!group) {
      return NextResponse.json({ error: 'Guruh topilmadi' }, { status: 404 })
    }

    await prisma.group.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Guruh muvaffaqiyatli o\'chirildi' })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
