import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Date filters
    const dateFilter: any = {}
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.gte = new Date(startDate)
      if (endDate) dateFilter.createdAt.lte = new Date(endDate)
    }

    switch (reportType) {
      case 'students':
        return await getStudentsReport(dateFilter)
      case 'teachers':
        return await getTeachersReport(dateFilter)
      case 'financial':
        return await getFinancialReport(dateFilter)
      case 'attendance':
        return await getAttendanceReport(dateFilter, request)
      case 'grades':
        return await getGradesReport(dateFilter)
      case 'groups':
        return await getGroupsReport(dateFilter)
      default:
        return await getOverviewReport(dateFilter)
    }
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

async function getOverviewReport(dateFilter: any) {
  const [students, teachers, groups, payments, attendances, grades] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.group.count({ where: { isActive: true } }),
    prisma.payment.findMany({ where: dateFilter }),
    prisma.attendance.findMany({ where: dateFilter }),
    prisma.grade.findMany({ where: dateFilter }),
  ])

  const totalRevenue = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalDebt = payments
    .filter(p => p.status === 'PENDING' || p.status === 'OVERDUE')
    .reduce((sum, p) => sum + p.amount, 0)

  const studentsWithMastery = await prisma.student.findMany({
    select: { masteryLevel: true },
  })
  const averageMastery = studentsWithMastery.length > 0
    ? Math.round(studentsWithMastery.reduce((sum, s) => sum + s.masteryLevel, 0) / studentsWithMastery.length)
    : 0

  const totalAttendances = attendances.length
  const presentAttendances = attendances.filter(a => a.isPresent).length
  const attendanceRate = totalAttendances > 0
    ? Math.round((presentAttendances / totalAttendances) * 100)
    : 0

  // Monthly revenue trend (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  
  const monthlyPayments = await prisma.payment.findMany({
    where: {
      status: 'PAID',
      createdAt: { gte: sixMonthsAgo },
    },
  })

  const monthlyRevenue: { [key: string]: number } = {}
  monthlyPayments.forEach(payment => {
    const month = new Date(payment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + payment.amount
  })

  return NextResponse.json({
    totalStudents: students,
    totalTeachers: teachers,
    totalGroups: groups,
    totalRevenue,
    totalDebt,
    averageMastery,
    attendanceRate,
    monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue })),
  })
}

async function getStudentsReport(dateFilter: any) {
  const students = await prisma.student.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          phone: true,
          createdAt: true,
        },
      },
      enrollments: {
        where: { isActive: true },
        include: {
          group: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      payments: {
        where: dateFilter,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const studentsByGroup: { [key: string]: number } = {}
  students.forEach(student => {
    student.enrollments.forEach(enrollment => {
      const groupName = enrollment.group.name
      studentsByGroup[groupName] = (studentsByGroup[groupName] || 0) + 1
    })
  })

  const levelDistribution: { [key: string]: number } = {}
  students.forEach(student => {
    const level = Math.floor(student.level / 5) * 5 // Group by 5 levels
    const levelKey = `Level ${level}-${level + 4}`
    levelDistribution[levelKey] = (levelDistribution[levelKey] || 0) + 1
  })

  return NextResponse.json({
    students,
    studentsByGroup: Object.entries(studentsByGroup).map(([group, count]) => ({ group, count })),
    levelDistribution: Object.entries(levelDistribution).map(([level, count]) => ({ level, count })),
    total: students.length,
  })
}

async function getTeachersReport(dateFilter: any) {
  const teachers = await prisma.teacher.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          phone: true,
        },
      },
      groups: {
        where: { isActive: true },
        include: {
          enrollments: {
            where: { isActive: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const teachersWithStats = teachers.map(teacher => {
    const totalStudents = teacher.groups.reduce((sum, group) => sum + group.enrollments.length, 0)
    const totalGroups = teacher.groups.length
    const monthlySalary = teacher.baseSalary + (teacher.baseSalary * teacher.bonusRate / 100)

    return {
      ...teacher,
      totalStudents,
      totalGroups,
      monthlySalary,
    }
  })

  return NextResponse.json({
    teachers: teachersWithStats,
    total: teachers.length,
  })
}

async function getFinancialReport(dateFilter: any) {
  const payments = await prisma.payment.findMany({
    where: dateFilter,
    include: {
      student: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const totalRevenue = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalDebt = payments
    .filter(p => p.status === 'PENDING' || p.status === 'OVERDUE')
    .reduce((sum, p) => sum + p.amount, 0)

  const paymentsByType: { [key: string]: number } = {}
  payments.filter(p => p.status === 'PAID').forEach(payment => {
    paymentsByType[payment.type] = (paymentsByType[payment.type] || 0) + payment.amount
  })

  const paymentsByStatus: { [key: string]: number } = {}
  payments.forEach(payment => {
    paymentsByStatus[payment.status] = (paymentsByStatus[payment.status] || 0) + payment.amount
  })

  // Daily revenue (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const recentPayments = payments.filter(
    p => p.status === 'PAID' && new Date(p.createdAt) >= thirtyDaysAgo
  )

  const dailyRevenue: { [key: string]: number } = {}
  recentPayments.forEach(payment => {
    const date = new Date(payment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    dailyRevenue[date] = (dailyRevenue[date] || 0) + payment.amount
  })

  return NextResponse.json({
    payments,
    totalRevenue,
    totalDebt,
    paymentsByType: Object.entries(paymentsByType).map(([type, amount]) => ({ type, amount })),
    paymentsByStatus: Object.entries(paymentsByStatus).map(([status, amount]) => ({ status, amount })),
    dailyRevenue: Object.entries(dailyRevenue).map(([date, revenue]) => ({ date, revenue })),
  })
}

async function getAttendanceReport(dateFilter: any, request?: NextRequest) {
  let selectedDate: string | null = null
  if (request) {
    const { searchParams } = new URL(request.url)
    selectedDate = searchParams.get('selectedDate')
  }
  
  const attendances = await prisma.attendance.findMany({
    where: dateFilter,
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
    orderBy: {
      date: 'desc',
    },
  })

  // Get groups for attendance
  const groupIds = [...new Set(attendances.map(a => a.groupId))]
  const groups = await prisma.group.findMany({
    where: { id: { in: groupIds } },
    select: { id: true, name: true },
  })
  const groupMap = new Map(groups.map(g => [g.id, g.name]))

  const totalAttendances = attendances.length
  const presentAttendances = attendances.filter(a => a.isPresent).length
  const absentAttendances = totalAttendances - presentAttendances
  const attendanceRate = totalAttendances > 0
    ? Math.round((presentAttendances / totalAttendances) * 100)
    : 0

  // Attendance by group
  const attendancesByGroup: { [key: string]: { present: number; absent: number } } = {}
  attendances.forEach(attendance => {
    const groupName = groupMap.get(attendance.groupId) || attendance.groupId
    if (!attendancesByGroup[groupName]) {
      attendancesByGroup[groupName] = { present: 0, absent: 0 }
    }
    if (attendance.isPresent) {
      attendancesByGroup[groupName].present++
    } else {
      attendancesByGroup[groupName].absent++
    }
  })

  // Daily attendance (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const recentAttendances = attendances.filter(
    a => new Date(a.date) >= thirtyDaysAgo
  )

  const dailyAttendance: { [key: string]: { present: number; absent: number } } = {}
  recentAttendances.forEach(attendance => {
    const date = new Date(attendance.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!dailyAttendance[date]) {
      dailyAttendance[date] = { present: 0, absent: 0 }
    }
    if (attendance.isPresent) {
      dailyAttendance[date].present++
    } else {
      dailyAttendance[date].absent++
    }
  })

  // Get attendance details for selected date
  let attendanceDetails: any[] = []
  if (selectedDate) {
    const selectedDateObj = new Date(selectedDate)
    selectedDateObj.setHours(0, 0, 0, 0)
    const nextDay = new Date(selectedDateObj)
    nextDay.setDate(nextDay.getDate() + 1)

    attendanceDetails = attendances
      .filter(a => {
        const attendanceDate = new Date(a.date)
        attendanceDate.setHours(0, 0, 0, 0)
        return attendanceDate >= selectedDateObj && attendanceDate < nextDay
      })
      .map(a => ({
        id: a.id,
        studentName: a.student.user.name,
        studentUsername: a.student.user.username,
        groupName: groupMap.get(a.groupId) || 'Noma\'lum guruh',
        isPresent: a.isPresent,
        date: a.date,
        notes: a.notes,
      }))
      .sort((a, b) => {
        // Sort by group name first, then by student name
        if (a.groupName !== b.groupName) {
          return a.groupName.localeCompare(b.groupName)
        }
        return a.studentName.localeCompare(b.studentName)
      })
  }

  return NextResponse.json({
    attendances,
    totalAttendances,
    presentAttendances,
    absentAttendances,
    attendanceRate,
    attendancesByGroup: Object.entries(attendancesByGroup).map(([groupName, stats]) => ({ groupName, ...stats })),
    dailyAttendance: Object.entries(dailyAttendance).map(([date, stats]) => ({ date, ...stats })),
    attendanceDetails, // Details for selected date
  })
}

async function getGradesReport(dateFilter: any) {
  const grades = await prisma.grade.findMany({
    where: dateFilter,
    include: {
      student: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      teacher: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const totalGrades = grades.length
  const averageScore = totalGrades > 0
    ? Math.round(grades.reduce((sum, g) => sum + (g.score / g.maxScore * 100), 0) / totalGrades)
    : 0

  const gradesByType: { [key: string]: { count: number; average: number } } = {}
  grades.forEach(grade => {
    if (!gradesByType[grade.type]) {
      gradesByType[grade.type] = { count: 0, average: 0 }
    }
    gradesByType[grade.type].count++
    gradesByType[grade.type].average += (grade.score / grade.maxScore * 100)
  })

  Object.keys(gradesByType).forEach(type => {
    gradesByType[type].average = Math.round(gradesByType[type].average / gradesByType[type].count)
  })

  // Grades by group
  const gradesByGroup: { [key: string]: { count: number; average: number } } = {}
  grades.forEach(grade => {
    const groupName = grade.group.name
    if (!gradesByGroup[groupName]) {
      gradesByGroup[groupName] = { count: 0, average: 0 }
    }
    gradesByGroup[groupName].count++
    gradesByGroup[groupName].average += (grade.score / grade.maxScore * 100)
  })

  Object.keys(gradesByGroup).forEach(groupName => {
    gradesByGroup[groupName].average = Math.round(gradesByGroup[groupName].average / gradesByGroup[groupName].count)
  })

  return NextResponse.json({
    grades,
    totalGrades,
    averageScore,
    gradesByType: Object.entries(gradesByType).map(([type, stats]) => ({ type, ...stats })),
    gradesByGroup: Object.entries(gradesByGroup).map(([group, stats]) => ({ group, ...stats })),
  })
}

async function getGroupsReport(dateFilter: any) {
  const groups = await prisma.group.findMany({
    where: {
      isActive: true,
      ...dateFilter,
    },
    include: {
      teacher: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      enrollments: {
        where: { isActive: true },
        include: {
          student: {
            include: {
              user: {
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
    orderBy: {
      createdAt: 'desc',
    },
  })

  const groupsWithStats = groups.map(group => {
    const totalStudents = group.enrollments.length
    const capacity = group.maxStudents
    const utilizationRate = Math.round((totalStudents / capacity) * 100)

    return {
      ...group,
      totalStudents,
      capacity,
      utilizationRate,
    }
  })

  return NextResponse.json({
    groups: groupsWithStats,
    total: groups.length,
  })
}
