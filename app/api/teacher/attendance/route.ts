import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get attendance for a specific group and date
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const date = searchParams.get('date')

    if (!groupId || !date) {
      return NextResponse.json(
        { error: 'Group ID and date are required' },
        { status: 400 }
      )
    }

    // Verify teacher has access to this group
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teacherProfile: {
          include: {
            groups: {
              where: { id: groupId },
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

    if (user.teacherProfile.groups.length === 0) {
      return NextResponse.json(
        { error: 'Group not found or access denied' },
        { status: 403 }
      )
    }

    // Get all students in the group
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        enrollments: {
          where: { isActive: true },
          include: {
            student: true,
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Get attendance records for the date
    const attendanceDate = new Date(date)
    const startOfDay = new Date(attendanceDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(attendanceDate)
    endOfDay.setHours(23, 59, 59, 999)

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId: {
          in: group.enrollments.map(e => e.studentId),
        },
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })

    return NextResponse.json(attendanceRecords)
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

// POST - Save attendance
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { groupId, date, attendance } = body

    if (!groupId || !date || !Array.isArray(attendance)) {
      return NextResponse.json(
        { error: 'Group ID, date, and attendance array are required' },
        { status: 400 }
      )
    }

    // Verify teacher has access to this group
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teacherProfile: {
          include: {
            groups: {
              where: { id: groupId },
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

    if (user.teacherProfile.groups.length === 0) {
      return NextResponse.json(
        { error: 'Group not found or access denied' },
        { status: 403 }
      )
    }

    const attendanceDate = new Date(date)
    const startOfDay = new Date(attendanceDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(attendanceDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Save or update attendance records
    const results = await Promise.all(
      attendance.map(async (record: { studentId: string; isPresent: boolean; arrivalTime?: string }) => {
        // Check if attendance record already exists
        const existing = await prisma.attendance.findFirst({
          where: {
            studentId: record.studentId,
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        })

        // Calculate arrival time: if present and no arrivalTime provided, use current time
        // Dars 15:00 da boshlanadi
        const classStartTime = new Date(attendanceDate)
        classStartTime.setHours(15, 0, 0, 0)
        
        let arrivalTime: Date | null = null
        if (record.isPresent) {
          if (record.arrivalTime) {
            arrivalTime = new Date(record.arrivalTime)
          } else if (existing?.arrivalTime) {
            // Keep existing arrival time if updating
            arrivalTime = existing.arrivalTime
          } else {
            // New attendance: use current time
            arrivalTime = new Date()
            // If current time is before class start (15:00), set to class start time
            if (arrivalTime < classStartTime) {
              arrivalTime = classStartTime
            }
          }
        }

        if (existing) {
          // Update existing record
          return prisma.attendance.update({
            where: { id: existing.id },
            data: { 
              isPresent: record.isPresent,
              arrivalTime: arrivalTime,
            },
          })
        } else {
          // Create new record
          return prisma.attendance.create({
            data: {
              studentId: record.studentId,
              groupId: groupId,
              date: startOfDay,
              isPresent: record.isPresent,
              arrivalTime: arrivalTime,
            },
          })
        }
      })
    )

    return NextResponse.json({ 
      message: 'Attendance saved successfully',
      count: results.length 
    })
  } catch (error) {
    console.error('Error saving attendance:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
