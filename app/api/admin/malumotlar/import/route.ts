import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { parseBirthDateInput } from '@/lib/birth-date'
import { malumotlarCellToYmd, strCell } from '@/lib/malumotlar-excel'

const DEFAULT_KIM = ["O'quvchi", 'Ota', 'Ona'] as const

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Excel fayl yuklanmadi' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as unknown[][]

    if (data.length < 2) {
      return NextResponse.json({ error: "Excel fayl bo'sh yoki noto'g'ri formatda" }, { status: 400 })
    }

    const rows = data.slice(1)
    const results = { success: 0, failed: 0, errors: [] as string[] }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const line = i + 2

      if (!row || row.length === 0) continue

      const studentId = strCell(row[0])
      if (!studentId) {
        if (row.some((c) => strCell(c) !== '')) {
          results.failed++
          results.errors.push(`Qator ${line}: O'quvchi ID bo'sh`)
        }
        continue
      }

      try {
        const student = await prisma.student.findUnique({
          where: { studentId },
          include: { user: true },
        })

        if (!student) {
          results.failed++
          results.errors.push(`Qator ${line}: "${studentId}" ID bilan o'quvchi topilmadi`)
          continue
        }

        const kim1 = strCell(row[2]) || DEFAULT_KIM[0]
        const tel1 = strCell(row[3])
        const kim2 = strCell(row[4]) || DEFAULT_KIM[1]
        const tel2 = strCell(row[5])
        const kim3 = strCell(row[6]) || DEFAULT_KIM[2]
        const tel3 = strCell(row[7])

        const contactsJson = JSON.stringify([
          { label: kim1, phone: tel1 },
          { label: kim2, phone: tel2 },
          { label: kim3, phone: tel3 },
        ])

        const ymd = malumotlarCellToYmd(row[8])
        const birthDate = ymd ? parseBirthDateInput(ymd) : null
        if (ymd && !birthDate) {
          results.failed++
          results.errors.push(`Qator ${line}: Tug'ilgan sana noto'g'ri (${ymd})`)
          continue
        }

        const address = strCell(row[9]) || null
        const schoolClass = strCell(row[10]) || null
        const school = strCell(row[11]) || null

        await prisma.user.update({
          where: { id: student.userId },
          data: { phone: tel1 || null },
        })

        await prisma.student.update({
          where: { id: student.id },
          data: {
            contacts: contactsJson,
            birthDate,
            address,
            schoolClass,
            school,
          },
        })

        results.success++
      } catch (e: unknown) {
        results.failed++
        const msg = e instanceof Error ? e.message : "Noma'lum xatolik"
        results.errors.push(`Qator ${line}: ${msg}`)
      }
    }

    return NextResponse.json({
      message: `Import yakunlandi: ${results.success} ta yangilandi, ${results.failed} ta xato`,
      success: results.success,
      failed: results.failed,
      errors: results.errors.slice(0, 30),
    })
  } catch (error: unknown) {
    console.error('malumotlar import:', error)
    const msg = error instanceof Error ? error.message : 'Import xatolik'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
