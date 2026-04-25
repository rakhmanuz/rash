import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { appendPaymentHistory } from '@/lib/payment-history'
import { parsePaymentNotes } from '@/lib/payment-meta'

// POST - Partial payment (qisman to'lash)
export async function POST(
  request: NextRequest,
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

    const body = await request.json()
    const paidAmount = Number(body?.paidAmount)

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
    })
    if (!payment) {
      return NextResponse.json({ error: "To'lov topilmadi" }, { status: 404 })
    }

    if (payment.status === 'PAID' || payment.status === 'CANCELLED') {
      return NextResponse.json({ error: "Bu to'lovga qisman to'lash mumkin emas" }, { status: 400 })
    }

    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      return NextResponse.json({ error: "To'langan summa noto'g'ri" }, { status: 400 })
    }

    if (paidAmount > payment.amount) {
      return NextResponse.json({ error: "To'langan summa qarz summasidan katta bo'lmasligi kerak" }, { status: 400 })
    }

    if (paidAmount === payment.amount) {
      const fullyPaid = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      })
      await appendPaymentHistory(prisma, {
        studentId: payment.studentId,
        paymentId: payment.id,
        action: 'MARK_AS_PAID',
        actorId: user.id,
        actorName: user.name,
        amountBefore: payment.amount,
        amountAfter: payment.amount,
        changedAmount: payment.amount,
        details: "Qarz to'liq yopildi",
      })
      const { meta, plainNotes } = parsePaymentNotes(fullyPaid.notes)
      return NextResponse.json({
        mode: 'full',
        payment: {
          ...fullyPaid,
          notes: plainNotes,
          tuitionMeta: meta,
        },
      })
    }

    const result = await prisma.$transaction(async (tx) => {
      const paidPart = await tx.payment.create({
        data: {
          studentId: payment.studentId,
          amount: paidAmount,
          type: payment.type,
          status: 'PAID',
          dueDate: payment.dueDate,
          paidAt: new Date(),
          notes: payment.notes,
        },
      })

      const remaining = await tx.payment.update({
        where: { id: payment.id },
        data: {
          amount: payment.amount - paidAmount,
        },
      })

      await appendPaymentHistory(tx, {
        studentId: payment.studentId,
        paymentId: paidPart.id,
        action: 'PARTIAL_PAID',
        actorId: user.id,
        actorName: user.name,
        amountBefore: 0,
        amountAfter: paidPart.amount,
        changedAmount: paidPart.amount,
        details: "Qisman to'langan qism",
      })
      await appendPaymentHistory(tx, {
        studentId: payment.studentId,
        paymentId: payment.id,
        action: 'DEBT_REDUCED',
        actorId: user.id,
        actorName: user.name,
        amountBefore: payment.amount,
        amountAfter: remaining.amount,
        changedAmount: -paidAmount,
        details: `Qisman to'lov: ${paidAmount.toLocaleString()} so'm`,
      })

      return { paidPart, remaining }
    })

    const paidParsed = parsePaymentNotes(result.paidPart.notes)
    const remainingParsed = parsePaymentNotes(result.remaining.notes)
    return NextResponse.json({
      mode: 'partial',
      paidPart: {
        ...result.paidPart,
        notes: paidParsed.plainNotes,
        tuitionMeta: paidParsed.meta,
      },
      remaining: {
        ...result.remaining,
        notes: remainingParsed.plainNotes,
        tuitionMeta: remainingParsed.meta,
      },
    })
  } catch (error) {
    console.error('Error partial payment:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT - Update payment
export async function PUT(
  request: NextRequest,
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

    const body = await request.json()
    const { amount, type, status, dueDate, notes, paidAt } = body

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
    })

    if (!payment) {
      return NextResponse.json({ error: 'To\'lov topilmadi' }, { status: 404 })
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: params.id },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : payment.amount,
        type: type || payment.type,
        status: status || payment.status,
        dueDate: dueDate ? new Date(dueDate) : payment.dueDate,
        notes: notes !== undefined ? notes : payment.notes,
        paidAt: paidAt ? new Date(paidAt) : payment.paidAt,
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
      studentId: payment.studentId,
      paymentId: payment.id,
      action: 'UPDATED',
      actorId: user.id,
      actorName: user.name,
      amountBefore: payment.amount,
      amountAfter: updatedPayment.amount,
      changedAmount: updatedPayment.amount - payment.amount,
      details: `${payment.status} -> ${updatedPayment.status}`,
    })

    const { meta, plainNotes } = parsePaymentNotes(updatedPayment.notes)
    return NextResponse.json({
      ...updatedPayment,
      notes: plainNotes,
      tuitionMeta: meta,
    })
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE - Delete payment
export async function DELETE(
  request: NextRequest,
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

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
    })

    if (!payment) {
      return NextResponse.json({ error: 'To\'lov topilmadi' }, { status: 404 })
    }

    await prisma.payment.delete({
      where: { id: params.id },
    })

    await appendPaymentHistory(prisma, {
      studentId: payment.studentId,
      paymentId: payment.id,
      action: 'DELETED',
      actorId: user.id,
      actorName: user.name,
      amountBefore: payment.amount,
      amountAfter: null,
      changedAmount: -payment.amount,
      details: payment.type,
    })

    return NextResponse.json({ message: 'To\'lov muvaffaqiyatli o\'chirildi' })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
