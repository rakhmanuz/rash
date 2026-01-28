import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Enroll student to group
export async function POST(
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
    const { studentId } = body

    if (!studentId) {
      return NextResponse.json(
        { error: 'O\'quvchi ID kerak' },
        { status: 400 }
      )
    }

    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        enrollments: {
          where: { isActive: true },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Guruh topilmadi' }, { status: 404 })
    }

    // Check if group is full
    if (group.enrollments.length >= group.maxStudents) {
      return NextResponse.json(
        { error: 'Guruh to\'ldi' },
        { status: 400 }
      )
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    })

    if (!student) {
      return NextResponse.json(
        { error: 'O\'quvchi topilmadi' },
        { status: 404 }
      )
    }

    // Check if student is already enrolled in ANY active group
    const activeEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        isActive: true,
      },
    })

    if (activeEnrollment) {
      // If student is in a different group, deactivate that enrollment first
      if (activeEnrollment.groupId !== params.id) {
        await prisma.enrollment.update({
          where: { id: activeEnrollment.id },
          data: { isActive: false },
        })
      } else {
        // Student is already in this group
        return NextResponse.json(
          { error: 'O\'quvchi allaqachon bu guruhga biriktirilgan' },
          { status: 400 }
        )
      }
    }

    // Check if enrollment exists (even if inactive)
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_groupId: {
          studentId,
          groupId: params.id,
        },
      },
    })

    if (existingEnrollment) {
      // Reactivate existing enrollment
      await prisma.enrollment.update({
        where: { id: existingEnrollment.id },
        data: { isActive: true },
      })
      return NextResponse.json({ message: 'O\'quvchi guruhga qayta biriktirildi' })
    }

    // Create new enrollment
    await prisma.enrollment.create({
      data: {
        studentId,
        groupId: params.id,
        isActive: true,
      },
    })

    return NextResponse.json({ message: 'O\'quvchi guruhga muvaffaqiyatli biriktirildi' }, { status: 201 })
  } catch (error) {
    console.error('Error enrolling student:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE - Unenroll student from group
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

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { error: 'O\'quvchi ID kerak' },
        { status: 400 }
      )
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_groupId: {
          studentId,
          groupId: params.id,
        },
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'O\'quvchi bu guruhga biriktirilmagan' },
        { status: 404 }
      )
    }

    // Deactivate enrollment instead of deleting
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { isActive: false },
    })

    // Also deactivate any other active enrollments for this student (safety check)
    await prisma.enrollment.updateMany({
      where: {
        studentId: enrollment.studentId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })

    return NextResponse.json({ message: 'O\'quvchi guruhdan chiqarildi' })
  } catch (error) {
    console.error('Error unenrolling student:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
