import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decryptPassword } from '@/lib/password-export'
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
            username: true,
            phone: true,
            passwordExport: true,
          },
        },
        enrollments: {
          where: { isActive: true },
          take: 1,
          orderBy: { enrolledAt: 'desc' },
          select: {
            group: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const parseFirstPhone = (contacts: string | null, userPhone: string | null): string => {
      try {
        const arr = contacts ? JSON.parse(contacts) : []
        if (Array.isArray(arr) && arr.length > 0) {
          const withPhone = arr.find((x: { phone?: string }) => x?.phone)
          if (withPhone?.phone) return withPhone.phone
        }
      } catch (_) {}
      return userPhone || ''
    }

    const rows: (string | number)[][] = [
      ['O\'quvchi ID', 'Ism', 'Login', 'Telefon', 'Guruh', 'Parol'],
      ...students.map((s) => {
        const groupName = s.enrollments[0]?.group?.name ?? ''
        const phone = parseFirstPhone(s.contacts, s.user.phone ?? null)
        const password = s.user.passwordExport
          ? decryptPassword(s.user.passwordExport)
          : ''
        return [
          s.studentId,
          s.user.name,
          s.user.username,
          phone,
          groupName,
          password || '-',
        ]
      }),
    ]

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(rows)
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 22 },
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
    ]
    XLSX.utils.book_append_sheet(workbook, worksheet, "Login va parollar")

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const filename = "o'quvchilar_login_parollar.xlsx"

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting student logins:', error)
    return NextResponse.json(
      { error: 'Eksport qilishda xatolik' },
      { status: 500 }
    )
  }
}
