import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
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

    const body = await request.json()
    const { score, isCompleted } = body

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Topshiriq topilmadi' },
        { status: 404 }
      )
    }

    const updated = await prisma.assignment.update({
      where: { id: params.id },
      data: {
        score: score !== undefined ? score : assignment.score,
        isCompleted: isCompleted !== undefined ? isCompleted : assignment.isCompleted,
        submittedAt: isCompleted ? new Date() : assignment.submittedAt,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
