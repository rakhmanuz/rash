import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAttendancePercentage } from '@/lib/attendance'

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
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Og'ir findMany o'rniga aggregate – xotira va CPU tejash
    const [
      students,
      teachers,
      groups,
      paidSum,
      debtSum,
      avgMastery,
      attendances,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.group.count({ where: { isActive: true } }),
      prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      prisma.payment.aggregate({
        where: { status: { in: ['PENDING', 'OVERDUE'] } },
        _sum: { amount: true },
      }),
      prisma.student.aggregate({ _avg: { masteryLevel: true } }),
      prisma.attendance.findMany({ select: { isPresent: true, arrivalTime: true, lateMinutes: true, date: true } }),
    ])

    const totalRevenue = paidSum._sum.amount ?? 0
    const totalDebt = debtSum._sum.amount ?? 0
    const averageMastery = Math.round(avgMastery._avg.masteryLevel ?? 0)

    const calculateAttendancePercentage = (attendance: any): number => {
      if (!attendance.isPresent) return 0
      if (attendance.lateMinutes != null) return getAttendancePercentage(true, attendance.lateMinutes)
      if (!attendance.arrivalTime) return 100
      const arrivalTime = new Date(attendance.arrivalTime)
      const classDate = new Date(attendance.date)
      const classStartTime = new Date(classDate)
      classStartTime.setHours(15, 0, 0, 0)
      const classEndTime = new Date(classDate)
      classEndTime.setHours(18, 0, 0, 0)
      if (arrivalTime <= classStartTime) return 100
      if (arrivalTime >= classEndTime) return 0
      const remainingTime = classEndTime.getTime() - arrivalTime.getTime()
      const totalClassTime = 3 * 60 * 60 * 1000
      return Math.max(0, Math.min(100, Math.round((remainingTime / totalClassTime) * 100)))
    }

    // Calculate attendance rate based on arrival time
    const totalAttendances = attendances.length
    const attendanceRate = totalAttendances > 0
      ? Math.round(attendances.reduce((sum, att) => sum + calculateAttendancePercentage(att), 0) / totalAttendances)
      : 0

    return NextResponse.json({
      totalStudents: students,
      totalTeachers: teachers,
      totalGroups: groups,
      totalRevenue,
      totalDebt,
      averageMastery,
      attendanceRate,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
