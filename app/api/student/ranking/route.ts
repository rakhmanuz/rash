import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeLearningMode, prismaStudentWhereForSameLearningMode } from '@/lib/learning-mode'

async function isStudentAllowed(userId: string): Promise<boolean> {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: {
      id: true,
      enrollments: { where: { isActive: true }, select: { groupId: true } },
    },
  })
  if (!student) return false

  const [direct, byGroup] = await Promise.all([
    prisma.reytingAllowedStudent.findUnique({ where: { studentId: student.id }, select: { id: true } }),
    prisma.reytingAllowedGroup.findFirst({
      where: { groupId: { in: student.enrollments.map((e) => e.groupId) } },
      select: { id: true },
    }),
  ])

  return Boolean(direct || byGroup)
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestedMode = searchParams.get('mode')
    const normalizedRequestedMode =
      requestedMode === 'ONLINE' || requestedMode === 'OFFLINE' ? requestedMode : null

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
    if (
      normalizedRequestedMode &&
      (user.learningMode || 'OFFLINE') !== normalizedRequestedMode
    ) {
      return NextResponse.json({ error: 'Forbidden for this mode' }, { status: 403 })
    }

    const mode = normalizeLearningMode(user.learningMode)
    if (mode !== 'ONLINE') {
      const allowed = await isStudentAllowed(session.user.id)
      if (!allowed) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const student = user.studentProfile
    const sameModeStudent = prismaStudentWhereForSameLearningMode(mode)

    // Get student's active groups
    const activeGroups = student.enrollments.map(e => e.groupId)

    // Guruh bo'yicha: faqat shu oqim (online yoki offline) o'quvchilari ichida reyting
    const groupRankings: any[] = []
    const currentStudentGroupRanks: Array<{ groupId: string; groupName: string; rank: number }> = []

    for (const groupId of activeGroups) {
      const groupEnrollments = await prisma.enrollment.findMany({
        where: {
          groupId,
          isActive: true,
          student: sameModeStudent,
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

      const groupRows = groupEnrollments.map((e) => ({
        id: e.student.id,
        name: e.student.user.name,
        username: e.student.user.username,
        masteryLevel: e.student.masteryLevel,
        studentId: e.student.studentId,
      }))

      const sortedFull = [...groupRows].sort(
        (a, b) => b.masteryLevel - a.masteryLevel || a.id.localeCompare(b.id)
      )
      const myRankInGroup = sortedFull.findIndex((s) => s.id === student.id)

      const groupStudents = sortedFull.slice(0, 5).map((s, index) => ({
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

      if (group && myRankInGroup >= 0) {
        currentStudentGroupRanks.push({
          groupId: group.id,
          groupName: group.name,
          rank: myRankInGroup + 1,
        })
      }

      if (group && groupStudents.length > 0) {
        groupRankings.push({
          groupId: group.id,
          groupName: group.name,
          teacherName: group.teacher.user.name,
          students: groupStudents,
        })
      }
    }

    // Umumiy TOP: faqat shu oqimdagi barcha o'quvchilar orasidan
    const allStudents = await prisma.student.findMany({
      where: sameModeStudent,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: [{ masteryLevel: 'desc' }, { id: 'asc' }],
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

    const allPeersOrdered = await prisma.student.findMany({
      where: sameModeStudent,
      select: { id: true },
      orderBy: [{ masteryLevel: 'desc' }, { id: 'asc' }],
    })
    const overallIdx = allPeersOrdered.findIndex((p) => p.id === student.id)
    const currentStudentOverallRanking = overallIdx >= 0 ? overallIdx + 1 : null

    return NextResponse.json({
      pool: mode,
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
