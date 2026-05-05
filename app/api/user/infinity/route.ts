import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    let subjectInfinityBreakdown: Array<{ subjectId: string; subjectName: string; infinityPoints: number }> = []
    if (user.studentProfile?.id) {
      const enrolledSubjects = new Map<string, string>()
      for (const enr of user.studentProfile.enrollments) {
        const sub = enr.group.subject
        if (sub?.id) enrolledSubjects.set(sub.id, sub.name)
      }

      if (enrolledSubjects.size > 0) {
        const [testResults, writtenWorkResults] = await Promise.all([
          prisma.testResult.findMany({
            where: { studentId: user.studentProfile.id },
            select: {
              infinityAwarded: true,
              test: { select: { group: { select: { subjectId: true } } } },
            },
          }),
          prisma.writtenWorkResult.findMany({
            where: { studentId: user.studentProfile.id },
            select: {
              infinityAwarded: true,
              writtenWork: { select: { group: { select: { subjectId: true } } } },
            },
          }),
        ])

        const bySubject = new Map<string, number>()
        for (const sid of enrolledSubjects.keys()) bySubject.set(sid, 0)
        for (const r of testResults) {
          const sid = r.test.group.subjectId
          if (!sid || !bySubject.has(sid)) continue
          bySubject.set(sid, (bySubject.get(sid) ?? 0) + (r.infinityAwarded ?? 0))
        }
        for (const r of writtenWorkResults) {
          const sid = r.writtenWork.group.subjectId
          if (!sid || !bySubject.has(sid)) continue
          bySubject.set(sid, (bySubject.get(sid) ?? 0) + (r.infinityAwarded ?? 0))
        }

        subjectInfinityBreakdown = [...enrolledSubjects.entries()].map(([subjectId, subjectName]) => ({
          subjectId,
          subjectName,
          infinityPoints: bySubject.get(subjectId) ?? 0,
        }))
      }
    }

    const totalInfinity = user.infinityPoints || 0
    const subjectInfinityTotal = subjectInfinityBreakdown.reduce((sum, row) => sum + (row.infinityPoints || 0), 0)
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
