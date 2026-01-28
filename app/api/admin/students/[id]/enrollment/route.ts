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

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: params.id,
        isActive: true,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!enrollment) {
      return NextResponse.json({ groupId: null })
    }

    return NextResponse.json({
      groupId: enrollment.group.id,
      groupName: enrollment.group.name,
    })
  } catch (error) {
    console.error('Error fetching enrollment:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
