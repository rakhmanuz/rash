import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessAdminExcelTools } from '@/lib/admin-api-access'
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

    if (!user || !(await canAccessAdminExcelTools(user.id, user.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const workbook = XLSX.utils.book_new()

    const worksheetData = [
      ['Guruh nomi', 'Sana (DD/MM/YYYY)', 'Vaqtlar (vergul bilan ajratilgan)', 'Izohlar (ixtiyoriy)'],
      ['Matematika 1', '01/02/2026', '08:00, 10:00, 14:00', 'Birinchi dars'],
      ['Fizika 1', '02/02/2026', '09:00, 13:00', ''],
      ['Ingliz tili', '03/02/2026', '05:30, 15:00, 18:00', 'Guruh darslari'],
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    worksheet['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 40 }, { wch: 30 }]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dars Rejasi')

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="dars_rejasi_shablon.xlsx"',
      },
    })
  } catch (error) {
    console.error('Error generating Excel template:', error)
    return NextResponse.json({ error: 'Shablon yaratishda xatolik' }, { status: 500 })
  }
}
