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
        teacherProfile: {
          include: {
            groups: {
              include: {
                enrollments: {
                  include: {
                    student: {
                      include: {
                        user: {
                          select: {
                            id: true,
                            name: true,
                            username: true,
                          },
                        },
                        assignments: {
                          include: {
                          },
                        },
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

    if (!user || !user.teacherProfile) {
      return NextResponse.json([])
    }

    // Get all assignments from teacher's groups
    const assignments = user.teacherProfile.groups.flatMap((group) =>
      group.enrollments.flatMap((enrollment) =>
        (enrollment.student.assignments || [])
          .filter((assignment) => assignment.groupId === group.id)
          .map((assignment) => ({
            ...assignment,
            student: {
              id: enrollment.student.id,
              user: {
                name: enrollment.student.user.name,
                username: enrollment.student.user.username,
              },
              studentId: enrollment.student.studentId,
            },
            group: {
              id: group.id,
              name: group.name,
            },
          }))
      )
    )

    return NextResponse.json(assignments || [])
  } catch (error) {
    console.error('Error fetching teacher assignments:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
