import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: params.id,
        isActive: true,
      },
      orderBy: { enrolledAt: 'asc' },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            subject: { select: { id: true, name: true } },
          },
        },
      },
    })

    const list = enrollments.map((e) => ({
      groupId: e.group.id,
      groupName: e.group.name,
      subjectId: e.group.subject?.id ?? null,
      subjectName: e.group.subject?.name ?? null,
      enrolledAt: e.enrolledAt.toISOString(),
    }))

    const first = list[0]
    return NextResponse.json({
      enrollments: list,
      groupId: first?.groupId ?? null,
      groupName: first?.groupName ?? null,
    })
  } catch (error) {
    console.error('Error fetching enrollment:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
