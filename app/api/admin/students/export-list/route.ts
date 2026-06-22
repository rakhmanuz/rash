import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET() {
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

    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ createdAt: 'asc' }, { studentId: 'asc' }],
    })

    const rows: (string | number)[][] = [
      ["O'quvchi ID", 'Ism familiya'],
      ...students.map((s) => [s.studentId ?? '-', s.user?.name ?? '-']),
    ]

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(rows)
    worksheet['!cols'] = [{ wch: 16 }, { wch: 32 }]
    XLSX.utils.book_append_sheet(workbook, worksheet, "O'quvchilar")

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const filename = "barcha_oquvchilar_royxati.xlsx"

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting student list:', error)
    return NextResponse.json({ error: 'Eksport qilishda xatolik' }, { status: 500 })
  }
}
