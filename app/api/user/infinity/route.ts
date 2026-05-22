import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStudentSubjectInfinityBreakdown } from '@/lib/subject-infinity'

// GET - Joriy foydalanuvchining infinity ballari
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
      select: {
        id: true,
        name: true,
        username: true,
        infinityPoints: true,
        studentProfile: {
          select: {
            id: true,
            enrollments: {
              where: { isActive: true },
              select: {
                group: {
                  select: {
                    subject: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const totalInfinity = user.infinityPoints || 0

    const enrolledSubjects = new Map<string, string>()
    for (const enr of user.studentProfile?.enrollments ?? []) {
      const sub = enr.group.subject
      if (sub?.id) enrolledSubjects.set(sub.id, sub.name)
    }

    const subjectInfinityBreakdown =
      user.studentProfile?.id && enrolledSubjects.size > 0
        ? await getStudentSubjectInfinityBreakdown(prisma, {
            userId: user.id,
            studentId: user.studentProfile.id,
            enrolledSubjects,
            totalWallet: totalInfinity,
          })
        : []
    const subjectInfinityTotal = subjectInfinityBreakdown.reduce(
      (sum, row) => sum + (row.infinityPoints || 0),
      0
    )
    const otherInfinityPoints = Math.max(0, totalInfinity - subjectInfinityTotal)

    return NextResponse.json({
      infinityPoints: totalInfinity,
      name: user.name,
      username: user.username,
      subjectInfinityBreakdown,
      subjectInfinityTotal,
      otherInfinityPoints,
    })
  } catch (error) {
    console.error('Error fetching user infinity points:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
