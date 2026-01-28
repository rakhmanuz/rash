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
      include: {
        teacherProfile: {
          include: {
            groups: {
              where: { id: params.id },
              include: {
                enrollments: {
                  where: { isActive: true },
                  include: {
                    student: {
                      include: {
                        user: {
                          select: {
                            id: true,
                            name: true,
                            username: true,
                            phone: true,
                          },
                        },
                        attendances: {
                          orderBy: { date: 'desc' },
                          take: 30,
                        },
                        assignments: {
                          where: { groupId: params.id },
                          orderBy: { createdAt: 'desc' },
                        },
                        grades: {
                          orderBy: { createdAt: 'desc' },
                          take: 10,
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
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      )
    }

    const group = user.teacherProfile.groups.find(g => g.id === params.id)

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error fetching teacher group:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
