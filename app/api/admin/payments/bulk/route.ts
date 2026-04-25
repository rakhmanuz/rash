import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildPaymentNotes, normalizeMonthKey } from '@/lib/payment-meta'

type BulkRow = {
  studentId: string
  subjectName: string
  monthKey: string
  monthlyFee: number
  paidAmount: number
  dueDate?: string | null
  notes?: string | null
}

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

    const body = await request.json()
    const rows = (body?.rows || []) as BulkRow[]
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Jadvaldan kamida 1 ta qator kiriting" }, { status: 400 })
    }

    const errors: string[] = []
    let createdCount = 0

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i]
      const rowNo = i + 1
      const normalizedMonth = normalizeMonthKey(row.monthKey)

      if (!row.studentId || !row.subjectName || !normalizedMonth) {
        errors.push(`${rowNo}-qator: studentId, subjectName yoki monthKey noto'g'ri`)
        continue
      }

      const monthlyFee = Number(row.monthlyFee)
      const paidAmount = Number(row.paidAmount)
      if (!Number.isFinite(monthlyFee) || monthlyFee <= 0) {
        errors.push(`${rowNo}-qator: monthlyFee noto'g'ri`)
        continue
      }
      if (!Number.isFinite(paidAmount) || paidAmount < 0 || paidAmount > monthlyFee) {
        errors.push(`${rowNo}-qator: paidAmount 0 va monthlyFee oralig'ida bo'lishi kerak`)
        continue
      }

      const student = await prisma.student.findUnique({ where: { studentId: row.studentId.trim() } })
      if (!student) {
        errors.push(`${rowNo}-qator: o'quvchi topilmadi (${row.studentId})`)
        continue
      }

      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: student.id,
          isActive: true,
          group: {
            subject: {
              name: row.subjectName.trim(),
            },
          },
        },
        include: {
          group: {
            include: { subject: true },
          },
        },
      })

      if (!enrollment?.group?.subject) {
        errors.push(`${rowNo}-qator: fan topilmadi yoki o'quvchi shu fanga biriktirilmagan (${row.subjectName})`)
        continue
      }
      const subject = enrollment.group.subject

      await prisma.$transaction(async (tx) => {
        if (paidAmount > 0) {
          await tx.payment.create({
            data: {
              studentId: student.id,
              amount: paidAmount,
              type: 'TUITION',
              status: 'PAID',
              paidAt: new Date(),
              dueDate: row.dueDate ? new Date(row.dueDate) : null,
              notes: buildPaymentNotes(
                {
                  category: 'MONTHLY_TUITION',
                  monthKey: normalizedMonth,
                  subjectId: subject.id,
                  subjectName: subject.name,
                },
                row.notes || null
              ),
            },
          })
          createdCount += 1
        }

        const remaining = Math.max(0, monthlyFee - paidAmount)
        if (remaining > 0) {
          await tx.payment.create({
            data: {
              studentId: student.id,
              amount: remaining,
              type: 'TUITION',
              status: 'PENDING',
              dueDate: row.dueDate ? new Date(row.dueDate) : null,
              notes: buildPaymentNotes(
                {
                  category: 'MONTHLY_TUITION',
                  monthKey: normalizedMonth,
                  subjectId: subject.id,
                  subjectName: subject.name,
                },
                row.notes || null
              ),
            },
          })
          createdCount += 1
        }
      })
    }

    return NextResponse.json({
      createdCount,
      errorCount: errors.length,
      errors,
    })
  } catch (error) {
    console.error('Error in bulk payment create:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
