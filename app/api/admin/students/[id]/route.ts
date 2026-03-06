import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { encryptPassword } from '@/lib/password-export'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: studentId } = await params

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            phone: true,
            createdAt: true,
          },
        },
        enrollments: {
          where: { isActive: true },
          include: {
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        grades: {
          orderBy: { createdAt: 'desc' },
          include: {
            group: { select: { id: true, name: true } },
            teacher: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
        testResults: {
          orderBy: { createdAt: 'desc' },
          include: {
            test: {
              select: {
                id: true,
                title: true,
                type: true,
                totalQuestions: true,
                date: true,
                group: { select: { name: true } },
              },
            },
          },
        },
        writtenWorkResults: {
          orderBy: { createdAt: 'desc' },
          include: {
            writtenWork: {
              select: {
                id: true,
                title: true,
                totalQuestions: true,
                date: true,
                timeGiven: true,
                group: { select: { name: true } },
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'O\'quvchi topilmadi' }, { status: 404 })
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error('Error fetching student details:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT - Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: studentId } = await params
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    })
    if (!student) {
      return NextResponse.json({ error: 'O\'quvchi topilmadi' }, { status: 404 })
    }

    const body = await request.json()
    const { name, username, phone, phoneOzi, phoneOnasi, phoneBobosi, password } = body
    const p1 = phoneOzi ?? phone ?? ''
    const p2 = phoneOnasi ?? ''
    const p3 = phoneBobosi ?? ''
    const contactsJson = JSON.stringify([
      { label: "o'zi", phone: p1 },
      { label: 'onasi', phone: p2 },
      { label: "bobosi", phone: p3 },
    ])

    if (!name || !username) {
      return NextResponse.json(
        { error: 'Ism va login majburiy' },
        { status: 400 }
      )
    }

    if (username !== student.user.username) {
      const existing = await prisma.user.findUnique({ where: { username } })
      if (existing) {
        return NextResponse.json({ error: 'Bu login allaqachon mavjud' }, { status: 400 })
      }
    }

    const userUpdate: { name: string; username: string; phone: string | null; password?: string; passwordExport?: string | null } = {
      name,
      username,
      phone: p1 || null,
    }
    if (password && password.trim() !== '') {
      userUpdate.password = await bcrypt.hash(password, 10)
      userUpdate.passwordExport = encryptPassword(password)
    }

    await prisma.user.update({
      where: { id: student.userId },
      data: userUpdate,
    })
    await prisma.student.update({
      where: { id: studentId },
      data: { contacts: contactsJson },
    })

    const updated = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { id: true, name: true, username: true, phone: true } } },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH - Toggle student active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: studentId } = await params
    const body = await request.json().catch(() => ({}))
    const isActive = body.isActive

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    })
    if (!student) {
      return NextResponse.json({ error: 'O\'quvchi topilmadi' }, { status: 404 })
    }

    await prisma.user.update({
      where: { id: student.userId },
      data: { isActive: typeof isActive === 'boolean' ? isActive : !student.user.isActive },
    })
    return NextResponse.json({ message: 'Holat yangilandi' })
  } catch (error) {
    console.error('Error toggling student status:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE - Delete student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: studentId } = await params
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    })
    if (!student) {
      return NextResponse.json({ error: 'O\'quvchi topilmadi' }, { status: 404 })
    }

    await prisma.user.delete({ where: { id: student.userId } })
    return NextResponse.json({ message: 'O\'quvchi o\'chirildi' })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
