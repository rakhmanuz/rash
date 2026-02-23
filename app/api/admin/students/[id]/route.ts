import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
