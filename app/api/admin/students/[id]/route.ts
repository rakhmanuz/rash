import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// PUT - Update student
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
    const { name, username, phone, password, studentId } = body

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: { user: true },
    })

    if (!student) {
      return NextResponse.json({ error: 'O\'quvchi topilmadi' }, { status: 404 })
    }

    // Update user data
    const updateData: any = {
      name,
      username,
      phone: phone || null,
    }

    // Update password if provided
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Check if username is being changed and if it's already taken
    if (username !== student.user.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Bu login allaqachon mavjud' },
          { status: 400 }
        )
      }
    }

    // Check if studentId is being changed and if it's already taken
    if (studentId !== student.studentId) {
      const existingStudent = await prisma.student.findUnique({
        where: { studentId },
      })

      if (existingStudent) {
        return NextResponse.json(
          { error: 'Bu o\'quvchi ID allaqachon mavjud' },
          { status: 400 }
        )
      }
    }

    // Update user
    await prisma.user.update({
      where: { id: student.userId },
      data: updateData,
    })

    // Update student
    await prisma.student.update({
      where: { id: params.id },
      data: { studentId },
    })

    // Fetch updated student
    const updatedStudent = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json(updatedStudent)
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE - Delete student
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

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: { user: true },
    })

    if (!student) {
      return NextResponse.json({ error: 'O\'quvchi topilmadi' }, { status: 404 })
    }

    // Delete student first (this will cascade delete related records)
    await prisma.student.delete({
      where: { id: params.id },
    })

    // Delete user explicitly to ensure it's removed
    await prisma.user.delete({
      where: { id: student.userId },
    }).catch(() => {
      // User might already be deleted by cascade, ignore error
    })

    return NextResponse.json({ message: 'O\'quvchi muvaffaqiyatli o\'chirildi' })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH - Toggle student active status
export async function PATCH(
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
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      )
    }

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: { user: true },
    })

    if (!student) {
      return NextResponse.json({ error: 'O\'quvchi topilmadi' }, { status: 404 })
    }

    // Update user isActive status
    await prisma.user.update({
      where: { id: student.userId },
      data: { isActive },
    })

    return NextResponse.json({
      message: isActive
        ? 'O\'quvchi faollashtirildi'
        : 'O\'quvchi to\'xtatildi',
      isActive,
    })
  } catch (error) {
    console.error('Error toggling student status:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
