import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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
      include: {
        studentProfile: {
          include: {
            grades: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
      },
    })

    if (!user || !user.studentProfile) {
      return NextResponse.json([])
    }

    // Get all group IDs from grades
    const groupIds = [...new Set(user.studentProfile.grades.map(g => g.groupId))]
    
    // Fetch groups separately
    const groups = await prisma.group.findMany({
      where: { id: { in: groupIds } },
      select: { id: true, name: true },
    })
    
    const groupMap = new Map(groups.map(g => [g.id, g]))

    const grades = user.studentProfile.grades.map(grade => ({
      id: grade.id,
      score: grade.score,
      maxScore: grade.maxScore,
      type: grade.type,
      notes: grade.notes,
      createdAt: grade.createdAt,
      group: groupMap.get(grade.groupId) || { id: grade.groupId, name: 'Noma\'lum guruh' },
    }))

    return NextResponse.json(grades)
  } catch (error) {
    console.error('Error fetching student grades:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
