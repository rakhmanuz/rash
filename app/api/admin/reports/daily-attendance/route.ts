import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

// Har kunlik ishlagan o'quvchilar jadvali - barcha guruhlar uchun
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
    const date = searchParams.get('date')
    const format = searchParams.get('format') || 'json' // json yoki excel

    // Agar sana berilmagan bo'lsa, bugungi kun
    const targetDate = date ? new Date(date) : new Date()
    const UZBEKISTAN_OFFSET = 5 * 60 * 60 * 1000 // 5 soat millisekundlarda
    
    // O'zbekiston vaqtida kun boshlanishi va tugashi
    const dateObj = new Date(targetDate)
    const uzDate = new Date(dateObj.getTime() + UZBEKISTAN_OFFSET)
    const startOfDay = new Date(Date.UTC(uzDate.getUTCFullYear(), uzDate.getUTCMonth(), uzDate.getUTCDate(), 0, 0, 0, 0) - UZBEKISTAN_OFFSET)
    const endOfDay = new Date(Date.UTC(uzDate.getUTCFullYear(), uzDate.getUTCMonth(), uzDate.getUTCDate(), 23, 59, 59, 999) - UZBEKISTAN_OFFSET)

    // Barcha guruhlarni olish
    const groups = await prisma.group.findMany({
      where: { isActive: true },
      include: {
        teacher: {
          include: {
            user: {
              select: {
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
                    name: true,
                    username: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Tanlangan kundagi davomat ma'lumotlarini olish
    const attendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                username: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    // Attendance map - tez qidirish uchun
    const attendanceMap = new Map<string, boolean>()
    attendances.forEach(att => {
      const key = `${att.studentId}-${att.groupId}`
      attendanceMap.set(key, att.isPresent)
    })

    // Har kunlik ishlagan o'quvchilar jadvali
    const dailyReport: any[] = []

    groups.forEach(group => {
      group.enrollments.forEach(enrollment => {
        const student = enrollment.student
        const key = `${student.id}-${group.id}`
        const isPresent = attendanceMap.get(key) || false

        dailyReport.push({
          guruh: group.name,
          oqituvchi: group.teacher.user.name,
          oquvchi_ismi: student.user.name,
          login: student.user.username,
          telefon: student.user.phone || '',
          student_id: student.studentId,
          kelgan: isPresent ? 'Ha' : 'Yo\'q',
          sana: formatDateShort(targetDate.toISOString()),
        })
      })
    })

    // Guruh va o'quvchi nomi bo'yicha tartiblash
    dailyReport.sort((a, b) => {
      if (a.guruh !== b.guruh) {
        return a.guruh.localeCompare(b.guruh)
      }
      return a.oquvchi_ismi.localeCompare(b.oquvchi_ismi)
    })

    // Excel formatida qaytarish
    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(dailyReport)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Har kunlik hisobot')

      // Excel fayl yaratish
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="har-kunlik-hisobot-${formatDateShort(targetDate.toISOString().split('T')[0]).replace(/\//g, '-')}.xlsx"`,
        },
      })
    }

    // JSON formatida qaytarish
    return NextResponse.json({
      date: formatDateShort(targetDate.toISOString().split('T')[0]),
      totalGroups: groups.length,
      totalStudents: dailyReport.length,
      presentCount: dailyReport.filter(r => r.kelgan === 'Ha').length,
      absentCount: dailyReport.filter(r => r.kelgan === 'Yo\'q').length,
      report: dailyReport,
    })
  } catch (error) {
    console.error('Error generating daily attendance report:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

