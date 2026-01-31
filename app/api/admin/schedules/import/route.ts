import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

// Valid dars vaqtlari
const VALID_TIMES = ['05:30', '06:00', '07:00', '08:00', '09:00', '10:00', '12:00', '13:00', '14:00', '14:30', '15:00', '16:00', '17:00', '18:00', '19:00']

export async function POST(request: NextRequest) {
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

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Excel fayl yuklanmadi' },
        { status: 400 }
      )
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    if (data.length < 2) {
      return NextResponse.json(
        { error: 'Excel fayl bo\'sh yoki noto\'g\'ri formatda' },
        { status: 400 }
      )
    }

    // Skip header row
    const rows = data.slice(1)

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      
      // Skip empty rows
      if (!row || row.length === 0 || !row[0]) {
        continue
      }

      try {
        const groupName = String(row[0] || '').trim()
        const dateStr = String(row[1] || '').trim()
        const timesStr = String(row[2] || '').trim()
        const notes = row[3] ? String(row[3]).trim() : ''

        // Validation
        if (!groupName || !dateStr || !timesStr) {
          results.failed++
          results.errors.push(`Qator ${i + 2}: Guruh nomi, sana va vaqtlar to'ldirilishi kerak`)
          continue
        }

        // Find group
        const group = await prisma.group.findFirst({
          where: {
            name: groupName,
            isActive: true,
          },
        })

        if (!group) {
          results.failed++
          results.errors.push(`Qator ${i + 2}: Guruh "${groupName}" topilmadi`)
          continue
        }

        // Parse date (DD/MM/YYYY yoki YYYY-MM-DD formatida bo'lishi mumkin)
        let dateObj: Date
        if (dateStr.includes('/')) {
          // DD/MM/YYYY formatida
          const [day, month, year] = dateStr.split('/').map(Number)
          dateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
        } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // YYYY-MM-DD formatida
          const [year, month, day] = dateStr.split('-').map(Number)
          dateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
        } else {
          results.failed++
          results.errors.push(`Qator ${i + 2}: Sana noto'g'ri formatda (DD/MM/YYYY yoki YYYY-MM-DD)`)
          continue
        }

        // Parse times (vergul bilan ajratilgan)
        const times = timesStr.split(',').map(t => t.trim()).filter(t => t)
        
        if (times.length === 0) {
          results.failed++
          results.errors.push(`Qator ${i + 2}: Vaqtlar to'ldirilishi kerak`)
          continue
        }

        // Validate times
        const invalidTimes = times.filter(time => !VALID_TIMES.includes(time))
        if (invalidTimes.length > 0) {
          results.failed++
          results.errors.push(`Qator ${i + 2}: Noto'g'ri vaqtlar: ${invalidTimes.join(', ')}`)
          continue
        }

        // Create schedule
        await prisma.classSchedule.create({
          data: {
            groupId: group.id,
            date: dateObj,
            times: JSON.stringify(times),
            notes: notes || null,
          },
        })

        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push(`Qator ${i + 2}: ${error.message || 'Xatolik'}`)
      }
    }

    return NextResponse.json({
      message: `Import yakunlandi: ${results.success} ta muvaffaqiyatli, ${results.failed} ta xatolik`,
      success: results.success,
      failed: results.failed,
      errors: results.errors.slice(0, 20), // Limit to first 20 errors
    })
  } catch (error: any) {
    console.error('Error importing schedules:', error)
    return NextResponse.json(
      { error: error.message || 'Import qilishda xatolik' },
      { status: 500 }
    )
  }
}
