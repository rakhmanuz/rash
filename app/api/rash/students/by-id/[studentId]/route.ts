import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasSectionAccess } from '@/lib/permissions'

// GET - O'quvchini studentId (RASH-001) bo'yicha qidirish
export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    const rashRoles = ['ADMIN', 'MANAGER', 'ASSISTANT_ADMIN']
    if (!user || !rashRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const canViewPayments = await hasSectionAccess(user.id, user.role, 'payments', 'view')
    if (!canViewPayments) {
      return NextResponse.json({ error: "Sizda to'lov bo'limini ko'rish ruxsati yo'q" }, { status: 403 })
    }

    const studentIdStr = decodeURIComponent(params.studentId).trim()
    if (!studentIdStr) {
      return NextResponse.json(
        { error: "O'quvchi ID kiriting" },
        { status: 400 }
      )
    }

    const student = await prisma.student.findUnique({
      where: { studentId: studentIdStr },
      include: {
        user: {
          select: {
            name: true,
            username: true,
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
      },
    })

    if (!student) {
      return NextResponse.json(
        { error: "O'quvchi topilmadi" },
        { status: 404 }
      )
    }

    const groupName =
      student.enrollments.length > 0
        ? (student.enrollments[0] as any).group?.name || ''
        : ''

    return NextResponse.json({
      id: student.id,
      studentId: student.studentId,
      name: student.user.name,
      groupName,
    })
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
