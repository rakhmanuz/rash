import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// PUT - Update teacher
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
    const { name, username, phone, password, teacherId, baseSalary, bonusRate } = body

    const teacher = await prisma.teacher.findUnique({
      where: { id: params.id },
      include: { user: true },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'O\'qituvchi topilmadi' }, { status: 404 })
    }

    // Update user data
    const updateData: any = {
      name,
      username,
      phone: phone || null,
    }

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Check username uniqueness
    if (username !== teacher.user.username) {
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

    // Check teacherId uniqueness
    if (teacherId !== teacher.teacherId) {
      const existingTeacher = await prisma.teacher.findUnique({
        where: { teacherId },
      })

      if (existingTeacher) {
        return NextResponse.json(
          { error: 'Bu o\'qituvchi ID allaqachon mavjud' },
          { status: 400 }
        )
      }
    }

    // Update user
    await prisma.user.update({
      where: { id: teacher.userId },
      data: updateData,
    })

    // Update teacher
    await prisma.teacher.update({
      where: { id: params.id },
      data: {
        teacherId,
        baseSalary: baseSalary || 0,
        bonusRate: bonusRate || 0,
      },
    })

    const updatedTeacher = await prisma.teacher.findUnique({
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

    return NextResponse.json(updatedTeacher)
  } catch (error) {
    console.error('Error updating teacher:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE - Delete teacher
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

    const teacher = await prisma.teacher.findUnique({
      where: { id: params.id },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'O\'qituvchi topilmadi' }, { status: 404 })
    }

    await prisma.teacher.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'O\'qituvchi muvaffaqiyatli o\'chirildi' })
  } catch (error) {
    console.error('Error deleting teacher:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
