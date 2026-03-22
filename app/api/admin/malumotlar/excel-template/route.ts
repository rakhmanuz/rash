import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { parseStudentContacts } from '@/lib/student-contacts'
import { dateToYmd } from '@/lib/birth-date'
import {
  MALUMOTLAR_COL_COUNT,
  MALUMOTLAR_HEADER_ROW,
  MALUMOTLAR_SHEET_NAME,
} from '@/lib/malumotlar-excel'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const prefill = request.nextUrl.searchParams.get('prefill') === '1'
    const workbook = XLSX.utils.book_new()

    let rows: (string | number | null)[][] = [Array.from(MALUMOTLAR_HEADER_ROW)]

    if (prefill) {
      const students = await prisma.student.findMany({
        include: {
          user: { select: { name: true, phone: true } },
        },
        orderBy: { studentId: 'asc' },
      })

      for (const s of students) {
        const c = parseStudentContacts(s.contacts, s.user.phone ?? null)
        rows.push([
          s.studentId,
          s.user.name,
          c[0]?.label ?? '',
          c[0]?.phone ?? '',
          c[1]?.label ?? '',
          c[1]?.phone ?? '',
          c[2]?.label ?? '',
          c[2]?.phone ?? '',
          s.birthDate ? dateToYmd(s.birthDate) : '',
          s.address ?? '',
          s.schoolClass ?? '',
          s.school ?? '',
        ])
      }
    } else {
      rows.push(
        ['STU001', 'Namuna Aliyev', "O'quvchi", '+998901112233', 'Ota', '+998904445566', 'Ona', '', '2012-03-15', 'Toshkent', '9-A', '1-son maktab'],
        ['STU002', 'Namuna Qodirova', "O'quvchi", '', 'Ota', '', 'Ona', '', '', '', '', '']
      )
    }

    const worksheet = XLSX.utils.aoa_to_sheet(rows)
    worksheet['!cols'] = Array.from({ length: MALUMOTLAR_COL_COUNT }, (_, i) => ({
      wch: i === 9 || i === 11 ? 28 : i === 0 ? 14 : 16,
    }))
    XLSX.utils.book_append_sheet(workbook, worksheet, MALUMOTLAR_SHEET_NAME)

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const filename = prefill ? "malumotlar_toldirilgan.xlsx" : "malumotlar_shablon.xlsx"

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('malumotlar excel-template:', error)
    return NextResponse.json({ error: 'Shablon yaratishda xatolik' }, { status: 500 })
  }
}
