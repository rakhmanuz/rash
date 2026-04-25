import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPaymentPlans, upsertPaymentPlan } from '@/lib/payment-plan'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const monthKey = searchParams.get('monthKey')
    if (!studentId || !monthKey) {
      return NextResponse.json({ error: 'studentId va monthKey kerak' }, { status: 400 })
    }

    const rows = await getPaymentPlans(prisma, studentId, monthKey)
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error getting payment plans:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
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
    const { studentId, monthKey, dueDate, entries } = body as {
      studentId?: string
      monthKey?: string
      dueDate?: string
      entries?: Array<{ subjectId: string; subjectName: string; plannedAmount: number }>
    }

    if (!studentId || !monthKey || !Array.isArray(entries)) {
      return NextResponse.json({ error: "studentId, monthKey va entries majburiy" }, { status: 400 })
    }

    for (const entry of entries) {
      if (!entry?.subjectId || !Number.isFinite(Number(entry?.plannedAmount))) continue
      await upsertPaymentPlan(prisma, {
        studentId,
        subjectId: entry.subjectId,
        subjectName: entry.subjectName || 'Fan',
        monthKey,
        plannedAmount: Number(entry.plannedAmount),
        dueDate: dueDate || null,
        updatedById: user.id,
        updatedByName: user.name,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error saving payment plans:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
