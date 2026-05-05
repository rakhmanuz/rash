import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { extractJoinUrl, redactJoinUrlFromNotes } from '@/lib/online-lessons-helpers'

function parseTimes(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((v) => String(v)).filter(Boolean)
  } catch {
    return []
  }
}

export async function GET() {
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
                group: {
                  include: {
                    subject: { select: { name: true } },
                    classSchedules: {
                      orderBy: { date: 'asc' },
                      take: 30,
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user?.studentProfile) {
      return NextResponse.json([])
    }

    const now = new Date()
    const fromDate = new Date(now)
    fromDate.setDate(fromDate.getDate() - 1)

    const lessons = user.studentProfile.enrollments
      .flatMap((enrollment) =>
        enrollment.group.classSchedules.map((schedule) => {
          const joinUrl = extractJoinUrl(schedule.notes)
          return {
            id: schedule.id,
            groupId: enrollment.group.id,
            groupName: enrollment.group.name,
            subjectName: enrollment.group.subject?.name || 'Fan',
            date: schedule.date,
            times: parseTimes(schedule.times),
            notes: redactJoinUrlFromNotes(schedule.notes || '', joinUrl),
            canJoin: Boolean(joinUrl),
          }
        })
      )
      .filter((lesson) => new Date(lesson.date) >= fromDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json(lessons)
  } catch (error) {
    console.error('Error fetching online lessons:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

