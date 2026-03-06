import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get current student's payments only
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        studentProfile: true,
      },
    })

    if (!user?.studentProfile) {
      return NextResponse.json({ error: 'O\'quvchi profili topilmadi' }, { status: 403 })
    }

    const payments = await prisma.payment.findMany({
      where: {
        studentId: user.studentProfile.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching student payments:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
