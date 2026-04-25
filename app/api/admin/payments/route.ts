import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { appendPaymentHistory } from '@/lib/payment-history'
import { buildPaymentNotes, normalizeMonthKey, parsePaymentNotes } from '@/lib/payment-meta'

// GET - Get all payments
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const studentId = searchParams.get('studentId')

    const payments = await prisma.payment.findMany({
      where: {
        ...(status && { status }),
        ...(studentId && { studentId }),
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formatted = payments.map((payment) => {
      const { meta, plainNotes } = parsePaymentNotes(payment.notes)
      return {
        ...payment,
        notes: plainNotes,
        tuitionMeta: meta,
      }
    })

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Create new payment
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

    const body = await request.json()
    const { studentId, amount, type, dueDate, notes, subjectId, monthKey, monthlyFee, paidAmount } = body

    if (!studentId || !type) {
      return NextResponse.json(
        { error: 'O\'quvchi, summa va to\'lov turi kerak' },
        { status: 400 }
      )
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    })

    if (!student) {
      return NextResponse.json(
        { error: 'O\'quvchi topilmadi' },
        { status: 404 }
      )
    }

    if (type === 'TUITION' && (subjectId || monthKey || monthlyFee !== undefined || paidAmount !== undefined)) {
      const normalizedMonth = normalizeMonthKey(monthKey)
      const monthFeeNum = Number(monthlyFee ?? amount ?? 0)
      const paidNum = Number(paidAmount ?? 0)

      if (!subjectId || !normalizedMonth || !Number.isFinite(monthFeeNum) || monthFeeNum <= 0) {
        return NextResponse.json(
          { error: 'Fan, oy va oylik summa to\'g\'ri kiritilishi kerak' },
          { status: 400 }
        )
      }

      if (!Number.isFinite(paidNum) || paidNum < 0 || paidNum > monthFeeNum) {
        return NextResponse.json(
          { error: 'To\'langan summa 0 va oylik to\'lov oralig\'ida bo\'lishi kerak' },
          { status: 400 }
        )
      }

      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId,
          isActive: true,
          group: { subjectId },
        },
        include: {
          group: {
            include: { subject: true },
          },
        },
      })

      if (!enrollment?.group?.subject) {
        return NextResponse.json({ error: 'O\'quvchi ushbu fanga biriktirilmagan' }, { status: 400 })
      }
      const subject = enrollment.group.subject

      const created = await prisma.$transaction(async (tx) => {
        const paidPayment =
          paidNum > 0
            ? await tx.payment.create({
                data: {
                  studentId,
                  amount: paidNum,
                  type: 'TUITION',
                  status: 'PAID',
                  dueDate: dueDate ? new Date(dueDate) : null,
                  paidAt: new Date(),
                  notes: buildPaymentNotes(
                    {
                      category: 'MONTHLY_TUITION',
                      monthKey: normalizedMonth,
                      subjectId,
                      subjectName: subject.name,
                    },
                    notes
                  ),
                },
              })
            : null

        const remaining = Math.max(0, monthFeeNum - paidNum)
        const debtPayment =
          remaining > 0
            ? await tx.payment.create({
                data: {
                  studentId,
                  amount: remaining,
                  type: 'TUITION',
                  status: 'PENDING',
                  dueDate: dueDate ? new Date(dueDate) : null,
                  notes: buildPaymentNotes(
                    {
                      category: 'MONTHLY_TUITION',
                      monthKey: normalizedMonth,
                      subjectId,
                      subjectName: subject.name,
                    },
                    notes
                  ),
                },
              })
            : null

        if (paidPayment) {
          await appendPaymentHistory(tx, {
            studentId,
            paymentId: paidPayment.id,
            action: 'CREATE_PAID',
            actorId: user.id,
            actorName: user.name,
            amountBefore: 0,
            amountAfter: paidPayment.amount,
            changedAmount: paidPayment.amount,
            details: `${normalizedMonth} | ${subject.name}`,
          })
        }
        if (debtPayment) {
          await appendPaymentHistory(tx, {
            studentId,
            paymentId: debtPayment.id,
            action: 'CREATE_PENDING',
            actorId: user.id,
            actorName: user.name,
            amountBefore: 0,
            amountAfter: debtPayment.amount,
            changedAmount: debtPayment.amount,
            details: `${normalizedMonth} | ${subject.name}`,
          })
        }

        return { paidPayment, debtPayment }
      })

      return NextResponse.json(created, { status: 201 })
    }

    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Summa to\'g\'ri kiritilishi kerak' }, { status: 400 })
    }

    const payment = await prisma.payment.create({
      data: {
        studentId,
        amount: numericAmount,
        type,
        status: 'PENDING',
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    })

    await appendPaymentHistory(prisma, {
      studentId,
      paymentId: payment.id,
      action: 'CREATE_PENDING',
      actorId: user.id,
      actorName: user.name,
      amountBefore: 0,
      amountAfter: payment.amount,
      changedAmount: payment.amount,
      details: type,
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
