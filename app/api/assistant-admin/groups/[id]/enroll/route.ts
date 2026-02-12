import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasSectionAccess } from '@/lib/permissions'

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

    if (!user || user.role !== 'ASSISTANT_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const canEditGroups = await hasSectionAccess(user.id, user.role, 'groups', 'edit')
    if (!canEditGroups) {
      return NextResponse.json({ error: "Sizda guruhga biriktirish ruxsati yo'q" }, { status: 403 })
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
