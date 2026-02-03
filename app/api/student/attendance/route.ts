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
            enrollments: {
              include: {
                group: {
                  include: {
                    classSchedules: {
                      orderBy: {
                        date: 'asc',
                      },
                    },
                  },
                },
              },
              where: {
                isActive: true,
              },
            },
            attendances: {
              include: {
                classSchedule: true,
              },
              orderBy: {
                date: 'desc',
              },
            },
          },
        },
      },
    })

    if (!user || !user.studentProfile) {
      return NextResponse.json({
        attendances: [],
        missingClasses: [],
        enrollmentDate: null,
      })
    }

    const student = user.studentProfile

    // Get enrollment date (first active enrollment)
    const firstEnrollment = student.enrollments
      .filter(e => e.isActive)
      .sort((a, b) => new Date(a.enrolledAt).getTime() - new Date(b.enrolledAt).getTime())[0]

    if (!firstEnrollment) {
      return NextResponse.json({
        attendances: [],
        missingClasses: [],
        enrollmentDate: null,
      })
    }

    const enrollmentDate = new Date(firstEnrollment.enrolledAt)
    enrollmentDate.setHours(0, 0, 0, 0)

    // Get all active groups with class schedules
    const activeGroups = student.enrollments
      .filter(e => e.isActive)
      .map(e => ({
        id: e.group.id,
        name: e.group.name,
        classSchedules: e.group.classSchedules || [],
      }))

    // Get group names map
    const groupMap = new Map(
      activeGroups.map(g => [g.id, g.name])
    )

    if (activeGroups.length === 0) {
      return NextResponse.json({
        attendances: student.attendances.map(a => ({
          id: a.id,
          date: a.date.toISOString(),
          isPresent: a.isPresent,
          arrivalTime: a.arrivalTime?.toISOString(),
          notes: a.notes,
          group: {
            id: a.groupId,
            name: 'Noma\'lum guruh',
          },
        })),
        missingClasses: [],
        enrollmentDate: enrollmentDate.toISOString(),
      })
    }

    // O'zbekiston vaqti (UTC+5)
    const UZBEKISTAN_OFFSET = 5 * 60 * 60 * 1000
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    // Get all class schedules for active groups (only past and today)
    const allClassSchedules: Array<{ id: string; date: Date; groupId: string; groupName: string }> = []
    
    activeGroups.forEach(group => {
      group.classSchedules.forEach(classSchedule => {
        const scheduleDate = new Date(classSchedule.date)
        // Faqat enrollment date'dan keyin va bugungi kunga qadar bo'lgan darslar
        if (scheduleDate >= enrollmentDate && scheduleDate <= today) {
          allClassSchedules.push({
            id: classSchedule.id,
            date: scheduleDate,
            groupId: group.id,
            groupName: group.name,
          })
        }
      })
    })

    // Sort by date
    allClassSchedules.sort((a, b) => a.date.getTime() - b.date.getTime())

    // Get all class schedule IDs that have attendance records
    const attendedClassScheduleIds = new Set(
      student.attendances
        .filter(a => a.classScheduleId)
        .map(a => a.classScheduleId!)
    )

    // Find missing classes - faqat dars rejasi bo'lgan, lekin kelmagan darslar
    const missingClasses = allClassSchedules
      .filter(cs => !attendedClassScheduleIds.has(cs.id))
      .map(cs => {
        // O'zbekiston vaqti bo'yicha formatlash
        const uzDate = new Date(cs.date.getTime() + UZBEKISTAN_OFFSET)
        return {
          date: cs.date.toISOString(),
          dayOfWeek: uzDate.toLocaleDateString('uz-UZ', { weekday: 'long' }),
          groupName: cs.groupName,
        }
      })

    // Format attendances
    const formattedAttendances = student.attendances.map(a => ({
      id: a.id,
      date: a.date.toISOString(),
      isPresent: a.isPresent,
      arrivalTime: a.arrivalTime?.toISOString(),
      notes: a.notes,
      group: {
        id: a.groupId,
        name: groupMap.get(a.groupId) || 'Noma\'lum guruh',
      },
    }))

    return NextResponse.json({
      attendances: formattedAttendances,
      missingClasses,
      enrollmentDate: enrollmentDate.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
