import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

function sanitizeFilename(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, '').trim() || 'guruh'
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        enrollments: {
          where: { isActive: true },
          orderBy: { enrolledAt: 'asc' },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
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

    const rows: (string | number)[][] = [
      ['T/r', 'Ismi', 'ID'],
      ...group.enrollments.map((enrollment, index) => [
        index + 1,
        enrollment.student.user?.name || '-',
        enrollment.student.studentId || '-',
      ]),
    ]

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(rows)
    worksheet['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Oquvchilar')

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const safeName = sanitizeFilename(group.name)

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${safeName}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error exporting group students:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
