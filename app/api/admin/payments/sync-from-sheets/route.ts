// Google Sheets'dan to'lov holatlarini o'qib, database'ga sync qilish
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPaymentStatusFromSheets } from '@/lib/google-sheets'

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

    // Google Sheets'dan to'lov holatlarini o'qish
    const result = await getPaymentStatusFromSheets()
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Google Sheets dan o\'qishda xatolik' },
        { status: 500 }
      )
    }

    const paymentStatuses = result.data || []
    const synced: any[] = []
    const errors: any[] = []

    // Har bir o'quvchi uchun to'lov holatini yangilash
    for (const item of paymentStatuses) {
      try {
        const { studentId, status } = item

        // O'quvchini topish (studentId bo'yicha)
        const student = await prisma.student.findUnique({
          where: { studentId },
          include: { user: true },
        })

        if (!student) {
          errors.push({
            studentId,
            error: 'O\'quvchi topilmadi',
          })
          continue
        }

        // Status: manfiy = qarzdorlik, musbat = ortiqcha to'lov
        if (status < 0) {
          // Qarzdorlik - PENDING yoki OVERDUE to'lov yaratish/yangilash
          const debtAmount = Math.abs(status)

          // Mavjud PENDING yoki OVERDUE to'lovni topish
          const existingDebt = await prisma.payment.findFirst({
            where: {
              studentId: student.id,
              status: { in: ['PENDING', 'OVERDUE'] },
            },
            orderBy: { createdAt: 'desc' },
          })

          if (existingDebt) {
            // Mavjud qarzni yangilash
            await prisma.payment.update({
              where: { id: existingDebt.id },
              data: {
                amount: debtAmount,
                status: 'OVERDUE',
              },
            })
            synced.push({
              studentId,
              type: 'updated',
              amount: debtAmount,
              status: 'OVERDUE',
            })
          } else {
            // Yangi qarz yaratish
            await prisma.payment.create({
              data: {
                studentId: student.id,
                amount: debtAmount,
                type: 'TUITION',
                status: 'OVERDUE',
                notes: 'Google Sheets dan sync qilindi',
              },
            })
            synced.push({
              studentId,
              type: 'created',
              amount: debtAmount,
              status: 'OVERDUE',
            })
          }
        } else if (status > 0) {
          // Ortiqcha to'lov - PAID to'lov yaratish
          const excessAmount = status

          // Ortiqcha to'lov yaratish
          await prisma.payment.create({
            data: {
              studentId: student.id,
              amount: excessAmount,
              type: 'OTHER',
              status: 'PAID',
              paidAt: new Date(),
              notes: `Ortiqcha to'lov (Google Sheets dan sync qilindi)`,
            },
          })
          synced.push({
            studentId,
            type: 'created',
            amount: excessAmount,
            status: 'PAID',
            note: 'Ortiqcha to\'lov',
          })
        } else {
          // Status = 0, hech narsa qilmaymiz
          synced.push({
            studentId,
            type: 'skipped',
            reason: 'Status = 0',
          })
        }
      } catch (error: any) {
        errors.push({
          studentId: item.studentId,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      message: 'Google Sheets dan sync qilindi',
      synced: synced.length,
      errors: errors.length,
      details: {
        synced,
        errors,
      },
    })
  } catch (error) {
    console.error('Error syncing from Google Sheets:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
