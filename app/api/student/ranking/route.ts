import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        studentProfile: {
          include: {
            enrollments: {
              where: { isActive: true },
              include: {
                group: true,
              },
            },
          },
        },
      },
    })

    if (!user || !user.studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    const student = user.studentProfile

    // Get student's active groups
    const activeGroups = student.enrollments.map(e => e.groupId)

    // Group rankings (top 5 in each group)
    const groupRankings: any[] = []
    
    for (const groupId of activeGroups) {
      const groupEnrollments = await prisma.enrollment.findMany({
        where: {
          groupId,
          isActive: true,
        },
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
            },
          },
        },
      })

      const groupStudents = groupEnrollments
        .map(e => ({
          id: e.student.id,
          name: e.student.user.name,
          username: e.student.user.username,
          masteryLevel: e.student.masteryLevel,
          studentId: e.student.studentId,
        }))
        .sort((a, b) => b.masteryLevel - a.masteryLevel)
        .slice(0, 5)
        .map((s, index) => ({
          ...s,
          rank: index + 1,
        }))

      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      })

      if (group && groupStudents.length > 0) {
        groupRankings.push({
          groupId: group.id,
          groupName: group.name,
          teacherName: group.teacher.user.name,
          students: groupStudents,
        })
      }
    }

    // Overall course rankings (top 5 across all students)
    const allStudents = await prisma.student.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        masteryLevel: 'desc',
      },
      take: 5,
    })

    const overallRankings = allStudents.map((s, index) => ({
      id: s.id,
      name: s.user.name,
      username: s.user.username,
      masteryLevel: s.masteryLevel,
      studentId: s.studentId,
      rank: index + 1,
    }))

    // Find current student's rank in overall
    const currentStudentOverallRank = overallRankings.findIndex(s => s.id === student.id) + 1
    const currentStudentOverallRanking = currentStudentOverallRank > 0
      ? currentStudentOverallRank
      : null

    // Find current student's rank in each group
    const currentStudentGroupRanks: any[] = []
    for (const groupRanking of groupRankings) {
      const studentRank = groupRanking.students.findIndex((s: any) => s.id === student.id)
      if (studentRank >= 0) {
        currentStudentGroupRanks.push({
          groupId: groupRanking.groupId,
          groupName: groupRanking.groupName,
          rank: studentRank + 1,
        })
      }
    }

    return NextResponse.json({
      groupRankings,
      overallRankings,
      currentStudent: {
        id: student.id,
        overallRank: currentStudentOverallRanking,
        groupRanks: currentStudentGroupRanks,
        masteryLevel: student.masteryLevel,
      },
    })
  } catch (error) {
    console.error('Error fetching rankings:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
