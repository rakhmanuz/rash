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
    const classScheduleId = searchParams.get('classScheduleId')

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

    // Check if class schedule exists and belongs to this group
    // If classScheduleId is provided, use it; otherwise, find by date
    let classSchedule
    if (classScheduleId) {
      classSchedule = await prisma.classSchedule.findFirst({
        where: {
          id: classScheduleId,
          groupId: groupId,
        },
      })
    } else {
      // Fallback: find by date (for backward compatibility)
      const attendanceDate = new Date(date)
      const startOfDay = new Date(attendanceDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(attendanceDate)
      endOfDay.setHours(23, 59, 59, 999)
      
      classSchedule = await prisma.classSchedule.findFirst({
        where: {
          groupId: groupId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      })
    }

    if (!classSchedule) {
      return NextResponse.json(
        { error: 'Bu dars rejasi topilmadi yoki bu guruhga tegishli emas.' },
        { status: 400 }
      )
    }

    // Build where clause for attendance records
    const attendanceWhere: any = {
      studentId: {
        in: group.enrollments.map(e => e.studentId),
      },
    }

    if (classScheduleId) {
      attendanceWhere.classScheduleId = classScheduleId
    } else {
      // Fallback: filter by date range
      const attendanceDate = new Date(date)
      const startOfDay = new Date(attendanceDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(attendanceDate)
      endOfDay.setHours(23, 59, 59, 999)
      
      attendanceWhere.date = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: attendanceWhere,
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
    const { groupId, date, attendance, classScheduleId } = body

    if (!groupId || !date || !Array.isArray(attendance) || !classScheduleId) {
      return NextResponse.json(
        { error: 'Group ID, date, classScheduleId, and attendance array are required' },
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

    // Check if class schedule exists for this date
    const classSchedule = await prisma.classSchedule.findFirst({
      where: {
        groupId: groupId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })

    if (!classSchedule) {
      return NextResponse.json(
        { error: 'Bu sana uchun dars rejasi topilmadi. Faqat dars rejasida kiritilgan sanalar uchun davomat olish mumkin.' },
        { status: 400 }
      )
    }

    // Save or update attendance records
    const results = await Promise.all(
      attendance.map(async (record: { studentId: string; isPresent: boolean; arrivalTime?: string }) => {
        // Check if attendance record already exists for this class schedule
        const existing = await prisma.attendance.findFirst({
          where: {
            studentId: record.studentId,
            classScheduleId: classScheduleId,
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
              classScheduleId: classScheduleId,
            },
          })
        } else {
          // Create new record
          return prisma.attendance.create({
            data: {
              studentId: record.studentId,
              groupId: groupId,
              classScheduleId: classScheduleId,
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
