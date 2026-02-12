import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasSectionAccess } from '@/lib/permissions'

// POST - To'lov kiritish (DB + Google Sheets Apps Script)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    const rashRoles = ['ADMIN', 'MANAGER', 'ASSISTANT_ADMIN']
    if (!user || !rashRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const canCreatePayment = await hasSectionAccess(user.id, user.role, 'payments', 'create')
    if (!canCreatePayment) {
      return NextResponse.json({ error: "Sizda to'lov kiritish ruxsati yo'q" }, { status: 403 })
    }

    const body = await request.json()
    const { studentId, amount } = body

    if (!studentId || !amount) {
      return NextResponse.json(
        { error: "O'quvchi va summa kiriting" },
        { status: 400 }
      )
    }

    const amountNum = parseFloat(String(amount))
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Summa noto\'g\'ri' },
        { status: 400 }
      )
    }

    // studentId = Student ning internal id (Prisma)
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true } },
        enrollments: {
          where: { isActive: true },
          include: { group: { select: { name: true } } },
        },
      },
    })

    if (!student) {
      return NextResponse.json(
        { error: "O'quvchi topilmadi" },
        { status: 404 }
      )
    }

    const groupName =
      student.enrollments.length > 0
        ? (student.enrollments[0] as any).group?.name || ''
        : ''

    // 1. Database'ga to'lov yozish
    const payment = await prisma.payment.create({
      data: {
        studentId: student.id,
        amount: amountNum,
        type: 'TUITION',
        status: 'PAID',
        paidAt: new Date(),
      },
    })

    // 2. Google Apps Script orqali Sheets'ga yozish
    const appsScriptUrl = process.env.RASH_GOOGLE_APPS_SCRIPT_URL
    if (appsScriptUrl) {
      try {
        await fetch(appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: student.studentId,
            name: student.user.name,
            groupName,
            amount: amountNum,
            date: new Date().toISOString(),
          }),
        })
      } catch (sheetsError) {
        console.error('Google Sheets yozishda xatolik:', sheetsError)
        // DB'da saqlangan, faqat Sheets xatolik - davom etamiz
      }
    }

    return NextResponse.json(
      {
        success: true,
        payment: {
          id: payment.id,
          amount: payment.amount,
          paidAt: payment.paidAt,
        },
        student: {
          studentId: student.studentId,
          name: student.user.name,
          groupName,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating rash payment:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
