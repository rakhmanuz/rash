import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    return NextResponse.json(updatedPayment)
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

    return NextResponse.json({ message: 'To\'lov muvaffaqiyatli o\'chirildi' })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
