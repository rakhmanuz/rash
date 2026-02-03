import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { formatDateShort } from '@/lib/utils'

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

    // Faqat tanlangan sanada dars rejasi bo'lgan guruhlarni olish
    const classSchedules = await prisma.classSchedule.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        group: {
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
        },
      },
      orderBy: {
        group: {
          name: 'asc',
        },
      },
    })

    // Agar dars rejasi bo'lmasa, bo'sh ro'yxat qaytaramiz
    if (classSchedules.length === 0) {
      if (format === 'excel') {
        // Bo'sh Excel fayl yaratish
        const emptyReport: any[] = []
        const worksheet = XLSX.utils.json_to_sheet(emptyReport)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Har kunlik hisobot')
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
        return new NextResponse(excelBuffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="har-kunlik-hisobot-${formatDateShort(targetDate.toISOString().split('T')[0]).replace(/\//g, '-')}.xlsx"`,
          },
        })
      }
      return NextResponse.json({
        date: formatDateShort(targetDate.toISOString().split('T')[0]),
        totalGroups: 0,
        totalStudents: 0,
        presentCount: 0,
        absentCount: 0,
        report: [],
        message: 'Bu sanada dars rejasi mavjud emas',
      })
    }

    // Tanlangan kundagi davomat ma'lumotlarini olish (faqat classScheduleId bo'lganlar)
    const classScheduleIds = classSchedules.map(cs => cs.id)
    const attendances = await prisma.attendance.findMany({
      where: {
        classScheduleId: {
          in: classScheduleIds,
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

    // Attendance map - tez qidirish uchun (studentId-classScheduleId bo'yicha)
    const attendanceMap = new Map<string, boolean>()
    attendances.forEach(att => {
      if (att.classScheduleId) {
        const key = `${att.studentId}-${att.classScheduleId}`
        attendanceMap.set(key, att.isPresent)
      }
    })

    // Har kunlik ishlagan o'quvchilar jadvali
    const dailyReport: any[] = []
    const processedStudents = new Map<string, { group: any; student: any; classScheduleIds: string[] }>()

    // Har bir dars rejasi uchun o'quvchilarni yig'amiz
    classSchedules.forEach(classSchedule => {
      const group = classSchedule.group
      group.enrollments.forEach(enrollment => {
        const student = enrollment.student
        const studentKey = `${student.id}-${group.id}`
        
        if (!processedStudents.has(studentKey)) {
          processedStudents.set(studentKey, {
            group,
            student,
            classScheduleIds: [],
          })
        }
        
        const studentData = processedStudents.get(studentKey)!
        studentData.classScheduleIds.push(classSchedule.id)
      })
    })

    // Har bir o'quvchi uchun jadvalga qo'shamiz
    processedStudents.forEach(({ group, student, classScheduleIds }) => {
      // Bu o'quvchi uchun barcha classSchedule'larda attendance bor-yo'qligini tekshiramiz
      // Agar hech bo'lmaganda bitta classSchedule'da attendance bo'lsa, "Ha" deb ko'rsatamiz
      let isPresent = false
      for (const classScheduleId of classScheduleIds) {
        const key = `${student.id}-${classScheduleId}`
        if (attendanceMap.get(key)) {
          isPresent = true
          break
        }
      }

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

    // Dars jadvali ko'rinishida qaytarish
    const classScheduleList = classSchedules.map(cs => {
      const group = cs.group
      const enrollments = group.enrollments || []
      
      // Bu dars rejasi uchun attendance ma'lumotlari
      const classAttendances = enrollments.map(enrollment => {
        const student = enrollment.student
        const key = `${student.id}-${cs.id}`
        const isPresent = attendanceMap.get(key) || false
        
        return {
          studentId: student.id,
          studentName: student.user.name,
          username: student.user.username,
          phone: student.user.phone || '',
          isPresent,
        }
      })
      
      const presentCount = classAttendances.filter(a => a.isPresent).length
      const absentCount = classAttendances.filter(a => !a.isPresent).length
      
      return {
        id: cs.id,
        date: cs.date.toISOString(),
        times: cs.times || '',
        notes: cs.notes || '',
        group: {
          id: group.id,
          name: group.name,
          teacher: {
            name: group.teacher.user.name,
          },
        },
        totalStudents: enrollments.length,
        presentCount,
        absentCount,
        attendances: classAttendances,
      }
    })

    // JSON formatida qaytarish
    return NextResponse.json({
      date: formatDateShort(targetDate.toISOString().split('T')[0]),
      classSchedules: classScheduleList,
      totalClasses: classScheduleList.length,
      totalStudents: dailyReport.length,
      presentCount: dailyReport.filter(r => r.kelgan === 'Ha').length,
      absentCount: dailyReport.filter(r => r.kelgan === 'Yo\'q').length,
      report: dailyReport, // Eski format ham qoladi (Excel uchun)
    })
  } catch (error) {
    console.error('Error generating daily attendance report:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

