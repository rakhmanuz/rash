import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDateShort } from '@/lib/utils'
import * as XLSX from 'xlsx'

const typeLabels: Record<string, string> = {
  TUITION: "O'qish haqi",
  MATERIALS: 'Materiallar',
  EXAM: 'Imtihon',
  OTHER: 'Boshqa',
}

const statusLabels: Record<string, string> = {
  PAID: "To'langan",
  PENDING: 'Kutilmoqda',
  OVERDUE: "Muddati o'tgan",
  CANCELLED: 'Bekor qilingan',
}

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

    const payments = await prisma.payment.findMany({
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
      orderBy: { createdAt: 'desc' },
    })

    const rows: (string | number)[][] = [
      [
        "O'quvchi ID",
        'Ism',
        'Login',
        'Summa (so\'m)',
        'Turi',
        'Holat',
        'Muddat',
        "To'langan sana",
        'Izoh',
        'Yaratilgan',
      ],
      ...payments.map((p) => [
        p.student.studentId,
        p.student.user.name ?? '',
        p.student.user.username ?? '',
        p.amount,
        typeLabels[p.type] ?? p.type,
        statusLabels[p.status] ?? p.status,
        p.dueDate ? formatDateShort(p.dueDate.toISOString()) : '',
        p.paidAt ? formatDateShort(p.paidAt.toISOString()) : '',
        p.notes ?? '',
        formatDateShort(p.createdAt.toISOString()),
      ]),
    ]

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(rows)
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 22 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 24 },
      { wch: 12 },
    ]
    XLSX.utils.book_append_sheet(workbook, worksheet, "To'lovlar")

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const filename = "tolovlar.xlsx"

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting payments:', error)
    return NextResponse.json(
      { error: "Eksport qilishda xatolik" },
      { status: 500 }
    )
  }
}
