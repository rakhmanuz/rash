import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { studentProfile: true },
    })

    if (!user?.studentProfile) {
      return NextResponse.json(
        { error: 'O‘quvchi profili topilmadi' },
        { status: 403 }
      )
    }

    const awards = await prisma.studentStipendAward.findMany({
      where: { studentId: user.studentProfile.id },
      orderBy: [{ examDate: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        program: true,
        examTitle: true,
        examDate: true,
        awardLabel: true,
        scorePercent: true,
        notes: true,
        createdAt: true,
      },
    })

    return NextResponse.json(awards)
  } catch (error) {
    console.error('Error fetching student stipendiya:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
