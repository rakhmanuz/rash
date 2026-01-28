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
        teacherProfile: {
          include: {
            groups: {
              include: {
                enrollments: true,
              },
            },
            grades: true,
          },
        },
      },
    })

    if (!user || !user.teacherProfile) {
      return NextResponse.json({
        totalGroups: 0,
        totalStudents: 0,
        pendingGrading: 0,
        monthlySalary: 0,
        bonus: 0,
        totalEarnings: 0,
      })
    }

    const teacher = user.teacherProfile

    // Calculate total students across all groups
    const totalStudents = teacher.groups.reduce(
      (sum, group) => sum + group.enrollments.filter(e => e.isActive).length,
      0
    )

    // Get all students in teacher's groups for statistics
    const allEnrollments = teacher.groups.flatMap(g => g.enrollments.filter(e => e.isActive))
    const studentIds = allEnrollments.map(e => e.studentId)

    // Calculate average mastery level and 4 main metrics
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      include: {
        attendances: {
          where: {
            groupId: { in: teacher.groups.map(g => g.id) },
          },
        },
        assignments: true,
        grades: {
          where: {
            groupId: { in: teacher.groups.map(g => g.id) },
          },
        },
      },
    })

    const averageMastery = students.length > 0
      ? students.reduce((sum, s) => sum + s.masteryLevel, 0) / students.length
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

    // 1. Calculate attendance rate (Davomat) - based on arrival time
    const allAttendances = students.flatMap(s => s.attendances)
    const totalAttendances = allAttendances.length
    const attendanceRate = totalAttendances > 0
      ? allAttendances.reduce((sum, att) => sum + calculateAttendancePercentage(att), 0) / totalAttendances
      : 0

    // 2. Calculate darsdagi o'zlashtirish (Class mastery)
    const allGrades = students.flatMap(s => s.grades)
    const classMasteryGrades = allGrades.filter(g => 
      g.type === "darsdagi_o'zlashtirish" || g.type === "darsdagi_ozlashtirish"
    )
    const classMastery = classMasteryGrades.length > 0
      ? classMasteryGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / 
        classMasteryGrades.length
      : 0

    // 3. Calculate vazifa topshirish (Assignment submission rate)
    const totalAssignments = students.reduce((sum, s) => sum + s.assignments.length, 0)
    const completedAssignments = students.reduce(
      (sum, s) => sum + s.assignments.filter(a => a.isCompleted).length,
      0
    )
    const assignmentRate = totalAssignments > 0
      ? (completedAssignments / totalAssignments) * 100
      : 0

    // 4. Calculate haftalik yozmaish (Weekly written work)
    const weeklyWrittenGrades = allGrades.filter(g => 
      g.type === "haftalik_yozmaish" || g.type === "haftalik_yozma_ish"
    )
    const weeklyWrittenRate = weeklyWrittenGrades.length > 0
      ? weeklyWrittenGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / 
        weeklyWrittenGrades.length
      : 0

    // Get recent grades for chart (last 10)
    const recentGrades = await prisma.grade.findMany({
      where: {
        teacherId: teacher.id,
      },
      include: {
        student: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Group grades by date for chart
    const gradesByDate = recentGrades.reduce((acc: any, grade) => {
      const date = new Date(grade.createdAt).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' })
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push((grade.score / grade.maxScore) * 100)
      return acc
    }, {})

    const recentGradesChart = Object.entries(gradesByDate).map(([date, scores]: [string, any]) => ({
      date,
      average: Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length),
    })).reverse()

    // Group stats for bar chart
    const groupStats = teacher.groups.map(group => ({
      name: group.name.length > 10 ? group.name.substring(0, 10) + '...' : group.name,
      students: group.enrollments.filter(e => e.isActive).length,
    }))

    // Group stats with 4 main metrics
    const groupStatsDetailed = await Promise.all(
      teacher.groups.map(async (group) => {
        const groupEnrollments = group.enrollments.filter(e => e.isActive)
        const groupStudentIds = groupEnrollments.map(e => e.studentId)
        const groupStudents = await prisma.student.findMany({
          where: { id: { in: groupStudentIds } },
          include: {
            attendances: {
              where: { groupId: group.id },
            },
            assignments: {
              where: { groupId: group.id },
            },
            grades: {
              where: { groupId: group.id },
            },
          },
        })

        // Calculate 4 metrics for this group
        const groupAllAttendances = groupStudents.flatMap(s => s.attendances)
        const groupTotalAttendances = groupAllAttendances.length
        const groupAttendanceRate = groupTotalAttendances > 0
          ? groupAllAttendances.reduce((sum, att) => sum + calculateAttendancePercentage(att), 0) / groupTotalAttendances
          : 0

        const groupAllGrades = groupStudents.flatMap(s => s.grades)
        const groupClassMasteryGrades = groupAllGrades.filter(g => 
          g.type === "darsdagi_o'zlashtirish" || g.type === "darsdagi_ozlashtirish"
        )
        const groupClassMastery = groupClassMasteryGrades.length > 0
          ? groupClassMasteryGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / 
            groupClassMasteryGrades.length
          : 0

        const groupTotalAssignments = groupStudents.reduce((sum, s) => sum + s.assignments.length, 0)
        const groupCompletedAssignments = groupStudents.reduce(
          (sum, s) => sum + s.assignments.filter(a => a.isCompleted).length,
          0
        )
        const groupAssignmentRate = groupTotalAssignments > 0
          ? (groupCompletedAssignments / groupTotalAssignments) * 100
          : 0

        const groupWeeklyWrittenGrades = groupAllGrades.filter(g => 
          g.type === "haftalik_yozmaish" || g.type === "haftalik_yozma_ish"
        )
        const groupWeeklyWrittenRate = groupWeeklyWrittenGrades.length > 0
          ? groupWeeklyWrittenGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / 
            groupWeeklyWrittenGrades.length
          : 0

        return {
          id: group.id,
          name: group.name,
          students: groupEnrollments.length,
          attendanceRate: Math.round(groupAttendanceRate),
          classMastery: Math.round(groupClassMastery),
          assignmentRate: Math.round(groupAssignmentRate),
          weeklyWrittenRate: Math.round(groupWeeklyWrittenRate),
        }
      })
    )

    return NextResponse.json({
      totalGroups: teacher.groups.length,
      totalStudents,
      pendingGrading: 0, // Will be calculated based on assignments
      monthlySalary: teacher.baseSalary || 0,
      bonus: (teacher.totalEarnings || 0) * ((teacher.bonusRate || 0) / 100),
      totalEarnings: teacher.totalEarnings || 0,
      bonusRate: teacher.bonusRate || 0,
      averageMastery,
      attendanceRate: Math.round(attendanceRate),
      // 4 ta asosiy ko'rsatkich
      classMastery: Math.round(classMastery),
      assignmentRate: Math.round(assignmentRate),
      weeklyWrittenRate: Math.round(weeklyWrittenRate),
      recentGrades: recentGradesChart,
      groupStats,
      groupStatsDetailed, // Detailed stats with 4 metrics per group
    })
  } catch (error) {
    console.error('Error fetching teacher stats:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
