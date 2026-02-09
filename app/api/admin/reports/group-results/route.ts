import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

// O'zbekiston vaqti (UTC+5)
const UZBEKISTAN_OFFSET = 5 * 60 * 60 * 1000 // 5 soat millisekundlarda

// Format date to DD.MM.YYYY (O'zbekiston vaqti bo'yicha)
function formatDate(date: Date): string {
  // O'zbekiston vaqtiga o'tkazish
  const uzDate = new Date(date.getTime() + UZBEKISTAN_OFFSET)
  const day = String(uzDate.getUTCDate()).padStart(2, '0')
  const month = String(uzDate.getUTCMonth() + 1).padStart(2, '0')
  const year = uzDate.getUTCFullYear()
  return `${day}.${month}.${year}`
}

// Get date only (without time) for comparison - O'zbekiston vaqti bo'yicha
// Returns date string in format "YYYY-MM-DD" based on Uzbekistan timezone
function getDateOnly(date: Date): string {
  // O'zbekiston vaqtiga o'tkazish
  const uzDate = new Date(date.getTime() + UZBEKISTAN_OFFSET)
  // Kun boshlanishi (00:00:00) UTC formatida
  const year = uzDate.getUTCFullYear()
  const month = String(uzDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(uzDate.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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
    const groupId = searchParams.get('groupId')

    if (!groupId) {
      return NextResponse.json({ error: 'Guruh ID kerak' }, { status: 400 })
    }

    // Get group with students
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        enrollments: {
          where: { isActive: true },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Guruh topilmadi' }, { status: 404 })
    }

    const studentIds = group.enrollments.map(e => e.studentId)

    // Get all dates from attendance, tests, written works, and assignments
    const [attendances, tests, writtenWorks, assignments] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          groupId,
          studentId: { in: studentIds },
        },
        select: { date: true },
      }),
      prisma.test.findMany({
        where: { groupId },
        select: { date: true },
      }),
      prisma.writtenWork.findMany({
        where: { groupId },
        select: { date: true },
      }),
      prisma.assignment.findMany({
        where: {
          groupId,
          studentId: { in: studentIds },
        },
        select: { 
          studentId: true,
          createdAt: true, 
          dueDate: true,
          submittedAt: true,
          score: true,
          maxScore: true,
        },
      }),
    ])

    // Collect all unique dates
    const dateSet = new Set<string>()
    
    attendances.forEach(a => {
      const dateKey = getDateOnly(a.date)
      dateSet.add(dateKey)
    })
    
    tests.forEach(t => {
      const dateKey = getDateOnly(t.date)
      dateSet.add(dateKey)
    })
    
    writtenWorks.forEach(w => {
      const dateKey = getDateOnly(w.date)
      dateSet.add(dateKey)
    })
    
    assignments.forEach(a => {
      // Use submittedAt if available, otherwise dueDate, otherwise createdAt
      let dateKey: string | null = null
      if (a.submittedAt) {
        dateKey = getDateOnly(a.submittedAt)
      } else if (a.dueDate) {
        dateKey = getDateOnly(a.dueDate)
      } else if (a.createdAt) {
        dateKey = getDateOnly(a.createdAt)
      }
      if (dateKey) {
        dateSet.add(dateKey)
      }
    })

    // Sort dates (already in "YYYY-MM-DD" format)
    const dates = Array.from(dateSet)
      .sort((a, b) => a.localeCompare(b))

    if (dates.length === 0) {
      return NextResponse.json({ error: 'Bu guruhda ma\'lumotlar topilmadi' }, { status: 404 })
    }

    // Get all data for these dates
    const [allAttendances, allTests, allWrittenWorks, allTestResults, allWrittenWorkResults, allAssignments] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          groupId,
          studentId: { in: studentIds },
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  name: true,
                  username: true,
                },
              },
            },
          },
        },
      }),
      prisma.test.findMany({
        where: { groupId },
        include: {
          results: {
            where: {
              studentId: { in: studentIds },
            },
          },
        },
      }),
      prisma.writtenWork.findMany({
        where: { groupId },
        include: {
          results: {
            where: {
              studentId: { in: studentIds },
            },
          },
        },
      }),
      prisma.testResult.findMany({
        where: {
          studentId: { in: studentIds },
          test: {
            groupId,
          },
        },
        include: {
          test: true,
          student: true,
        },
      }),
      prisma.writtenWorkResult.findMany({
        where: {
          studentId: { in: studentIds },
          writtenWork: {
            groupId,
          },
        },
        include: {
          writtenWork: true,
          student: true,
        },
      }),
      prisma.assignment.findMany({
        where: {
          groupId,
          studentId: { in: studentIds },
        },
        select: {
          studentId: true,
          createdAt: true,
          dueDate: true,
          submittedAt: true,
          score: true,
          maxScore: true,
        },
      }),
    ])

    // Create maps for quick lookup
    const attendanceMap = new Map<string, boolean>()
    allAttendances.forEach(a => {
      const dateKey = getDateOnly(a.date)
      const key = `${a.studentId}-${dateKey}`
      attendanceMap.set(key, a.isPresent)
    })

    // Separate kunlik_test and uyga_vazifa
    const kunlikTestMap = new Map<string, { correct: number; total: number }>()
    const uygaVazifaMap = new Map<string, { correct: number; total: number }>()
    
    allTestResults.forEach(tr => {
      const dateKey = getDateOnly(tr.test.date)
      const key = `${tr.studentId}-${dateKey}`
      const testData = {
        correct: tr.correctAnswers,
        total: tr.test.totalQuestions,
      }
      
      // Test type'ga qarab ajratish
      if (tr.test.type === 'uyga_vazifa') {
        uygaVazifaMap.set(key, testData)
      } else {
        // Default: kunlik_test
        kunlikTestMap.set(key, testData)
      }
    })

    const writtenWorkMap = new Map<string, { correct: number; total: number; percentage: number }>()
    allWrittenWorkResults.forEach(wr => {
      const dateKey = getDateOnly(wr.writtenWork.date)
      const key = `${wr.studentId}-${dateKey}`
      writtenWorkMap.set(key, {
        correct: wr.correctAnswers || 0,
        total: wr.writtenWork.totalQuestions || 0,
        percentage: wr.masteryLevel || 0,
      })
    })

    // For assignments, we'll use submittedAt if available, otherwise dueDate, otherwise createdAt
    const assignmentMap = new Map<string, { score: number; maxScore: number }>()
    allAssignments.forEach(a => {
      let dateKey: string | null = null
      if (a.submittedAt) {
        dateKey = getDateOnly(a.submittedAt)
      } else if (a.dueDate) {
        dateKey = getDateOnly(a.dueDate)
      } else if (a.createdAt) {
        dateKey = getDateOnly(a.createdAt)
      }
      
      if (dateKey && a.score !== null && a.maxScore) {
        const key = `${a.studentId}-${dateKey}`
        assignmentMap.set(key, {
          score: a.score,
          maxScore: a.maxScore,
        })
      }
    })

    // Build Excel data
    const excelData: any[][] = []

    // Row 1: Date headers (merged cells will be handled by Excel)
    const headerRow1: any[] = ['', '', '', ''] // Empty for №, Ism, id, login columns
    dates.forEach(dateStr => {
      // Each date takes 4 columns: Davomat, Kunlik test, Vazifa, Yozma ish
      // Put date in first column, rest will be merged
      // dateStr is in format "YYYY-MM-DD", convert to DD.MM.YYYY
      const [year, month, day] = dateStr.split('-')
      headerRow1.push(`${day}.${month}.${year}`, '', '', '')
    })
    excelData.push(headerRow1)

    // Row 2: Column headers
    const headerRow2: any[] = ['№', 'Ism', 'id', 'login']
    dates.forEach(() => {
      headerRow2.push('Davomat', 'Kunlik test', 'Vazifa', 'Yozma ish')
    })
    excelData.push(headerRow2)

    // Data rows
    group.enrollments.forEach((enrollment, index) => {
      const student = enrollment.student
      const row: any[] = [
        index + 1, // №
        student.user.name, // Ism
        student.studentId, // id
        student.user.username, // login
      ]

      dates.forEach(date => {
        const dateKey = date
        const studentId = student.id

        // Attendance
        const attKey = `${studentId}-${dateKey}`
        const isPresent = attendanceMap.get(attKey)
        row.push(isPresent === true ? 'keldi' : isPresent === false ? 'kelmadi' : '')

        // Kunlik test
        const kunlikTestKey = `${studentId}-${dateKey}`
        const kunlikTestResult = kunlikTestMap.get(kunlikTestKey)
        row.push(kunlikTestResult ? `${kunlikTestResult.correct}/${kunlikTestResult.total}` : '')

        // Vazifa (uyga_vazifa test yoki assignment)
        const vazifaKey = `${studentId}-${dateKey}`
        const uygaVazifaResult = uygaVazifaMap.get(vazifaKey)
        const assignResult = assignmentMap.get(vazifaKey)
        
        // Agar uyga_vazifa test bo'lsa, uni ko'rsat, aks holda assignment'ni ko'rsat
        if (uygaVazifaResult) {
          row.push(`${uygaVazifaResult.correct}/${uygaVazifaResult.total}`)
        } else if (assignResult) {
          row.push(`${assignResult.score}/${assignResult.maxScore}`)
        } else {
          row.push('')
        }

        // Written Work (Yozma ish)
        const writtenKey = `${studentId}-${dateKey}`
        const writtenResult = writtenWorkMap.get(writtenKey)
        row.push(writtenResult ? `${writtenResult.correct}/${writtenResult.total} (${Math.round(writtenResult.percentage)}%)` : '')
      })

      excelData.push(row)
    })

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(excelData)

    // Set column widths
    const colWidths = [{ wch: 5 }, { wch: 20 }, { wch: 15 }, { wch: 15 }]
    dates.forEach(() => {
      colWidths.push({ wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 })
    })
    worksheet['!cols'] = colWidths

    // Merge cells for date headers in row 1
    const merges: XLSX.Range[] = []
    dates.forEach((date, idx) => {
      const startCol = 4 + idx * 4 // Start from column E (index 4)
      const endCol = startCol + 3 // End at column H (index 7) for first date
      merges.push({
        s: { r: 0, c: startCol },
        e: { r: 0, c: endCol },
      })
    })
    worksheet['!merges'] = merges

    // Style header rows (bold)
    const headerStyle = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' } }
    
    // Apply styles to row 1 and 2
    for (let col = 0; col < excelData[0].length; col++) {
      const cell1 = XLSX.utils.encode_cell({ r: 0, c: col })
      const cell2 = XLSX.utils.encode_cell({ r: 1, c: col })
      
      if (!worksheet[cell1]) worksheet[cell1] = { t: 's', v: '' }
      if (!worksheet[cell2]) worksheet[cell2] = { t: 's', v: '' }
      
      worksheet[cell1].s = headerStyle
      worksheet[cell2].s = headerStyle
    }

    // Create workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Natijalar')

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="guruh-natijalari-${group.name.replace(/\s+/g, '-')}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error generating group results:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
