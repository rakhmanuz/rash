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
                    schedules: true,
                  },
                },
              },
              where: {
                isActive: true,
              },
            },
            attendances: {
              include: {
                group: true,
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

    // Get all active groups
    const activeGroups = student.enrollments
      .filter(e => e.isActive)
      .map(e => e.group)

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

    // Get all schedules for active groups
    const allSchedules = activeGroups.flatMap(g => g.schedules)

    // Generate expected class dates from enrollment date to today
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const expectedClasses: Array<{ date: Date; groupId: string; groupName: string }> = []

    // For each group, generate expected class dates based on schedules
    activeGroups.forEach(group => {
      const groupSchedules = group.schedules
      
      if (groupSchedules.length === 0) {
        // If no schedule, assume classes every day (Monday-Friday) at 15:00
        let currentDate = new Date(enrollmentDate)
        while (currentDate <= today) {
          const dayOfWeek = currentDate.getDay()
          // Monday = 1, Friday = 5
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            expectedClasses.push({
              date: new Date(currentDate),
              groupId: group.id,
              groupName: group.name,
            })
          }
          currentDate.setDate(currentDate.getDate() + 1)
        }
      } else {
        // Use actual schedules
        let currentDate = new Date(enrollmentDate)
        while (currentDate <= today) {
          const dayOfWeek = currentDate.getDay()
          
          groupSchedules.forEach(schedule => {
            if (schedule.dayOfWeek === dayOfWeek) {
              expectedClasses.push({
                date: new Date(currentDate),
                groupId: group.id,
                groupName: group.name,
              })
            }
          })
          
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }
    })

    // Sort expected classes by date
    expectedClasses.sort((a, b) => a.date.getTime() - b.date.getTime())

    // Get all attendance dates
    const attendanceDates = new Set(
      student.attendances.map(a => {
        const date = new Date(a.date)
        date.setHours(0, 0, 0, 0)
        return `${date.toISOString().split('T')[0]}-${a.groupId}`
      })
    )

    // Find missing classes (expected but not attended)
    const missingClasses = expectedClasses
      .filter(ec => {
        const dateKey = `${ec.date.toISOString().split('T')[0]}-${ec.groupId}`
        return !attendanceDates.has(dateKey)
      })
      .map(ec => ({
        date: ec.date.toISOString(),
        dayOfWeek: ec.date.toLocaleDateString('uz-UZ', { weekday: 'long' }),
        groupName: ec.groupName,
      }))

    // Format attendances
    const formattedAttendances = student.attendances.map(a => ({
      id: a.id,
      date: a.date.toISOString(),
      isPresent: a.isPresent,
      arrivalTime: a.arrivalTime?.toISOString(),
      notes: a.notes,
      group: {
        id: a.groupId,
        name: a.group?.name || 'Noma\'lum guruh',
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
