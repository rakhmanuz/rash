import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const { name, description, teacherId, maxStudents, isActive } = body

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

    const updatedGroup = await prisma.group.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
        teacherId: teacherId || group.teacherId,
        maxStudents: maxStudents || group.maxStudents,
        isActive: isActive !== undefined ? isActive : group.isActive,
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
