import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPaymentHistoryByStudent } from '@/lib/payment-history'

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
    const studentId = searchParams.get('studentId')
    if (!studentId) {
      return NextResponse.json({ error: "studentId majburiy" }, { status: 400 })
    }

    const rows = await getPaymentHistoryByStudent(prisma, studentId)
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching payment history:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
