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
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get all statistics
    const [students, teachers, groups, payments, attendances, grades] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.group.count({ where: { isActive: true } }),
      prisma.payment.findMany(),
      prisma.attendance.findMany(),
      prisma.grade.findMany(),
    ])

    // Calculate revenue
    const totalRevenue = payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0)

    // Calculate debt
    const totalDebt = payments
      .filter(p => p.status === 'PENDING' || p.status === 'OVERDUE')
      .reduce((sum, p) => sum + p.amount, 0)

    // Calculate average mastery
    const studentsWithMastery = await prisma.student.findMany({
      select: { masteryLevel: true },
    })
    const averageMastery = studentsWithMastery.length > 0
      ? Math.round(
          studentsWithMastery.reduce((sum, s) => sum + s.masteryLevel, 0) / 
          studentsWithMastery.length
        )
      : 0

    // Helper function to calculate attendance percentage based on arrival time
    // Dars 15:00 da boshlanadi, 3 soat davom etadi (18:00 gacha)
    const calculateAttendancePercentage = (attendance: any): number => {
      if (!attendance.isPresent) {
        return 0 // Kelmagan = 0%
      }

      if (!attendance.arrivalTime) {
        // Eski ma'lumotlar uchun (arrivalTime yo'q bo'lsa) - faqat bor/yo'q
        return 100 // Bor = 100%
      }

      const arrivalTime = new Date(attendance.arrivalTime)
      const classDate = new Date(attendance.date)
      
      // Dars boshlanish vaqti: 15:00
      const classStartTime = new Date(classDate)
      classStartTime.setHours(15, 0, 0, 0)
      
      // Dars tugash vaqti: 18:00 (3 soatdan keyin)
      const classEndTime = new Date(classDate)
      classEndTime.setHours(18, 0, 0, 0)

      // Agar 15:00 dan oldin kelsa = 100%
      if (arrivalTime <= classStartTime) {
        return 100
      }

      // Agar 18:00 dan keyin kelsa = 0%
      if (arrivalTime >= classEndTime) {
        return 0
      }

      // 15:00-18:00 orasida kelsa: qolgan vaqt / 3 soat * 100%
      const remainingTime = classEndTime.getTime() - arrivalTime.getTime()
      const totalClassTime = 3 * 60 * 60 * 1000 // 3 soat millisekundlarda
      const percentage = (remainingTime / totalClassTime) * 100
      
      return Math.max(0, Math.min(100, Math.round(percentage)))
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
