import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teacherProfile: true,
      },
    })

    if (!user || !user.teacherProfile) {
      return NextResponse.json({
        baseSalary: 0,
        bonusRate: 0,
        totalEarnings: 0,
        monthlySalary: 0,
        bonus: 0,
        history: [],
      })
    }

    const teacher = user.teacherProfile

    // Generate salary history (last 6 months)
    const history = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      history.push({
        month: date.toLocaleDateString('uz-UZ', { month: 'short', year: 'numeric' }),
        baseSalary: teacher.baseSalary || 0,
        bonus: (teacher.totalEarnings || 0) * ((teacher.bonusRate || 0) / 100),
        total: (teacher.baseSalary || 0) + (teacher.totalEarnings || 0) * ((teacher.bonusRate || 0) / 100),
      })
    }

    return NextResponse.json({
      baseSalary: teacher.baseSalary || 0,
      bonusRate: teacher.bonusRate || 0,
      totalEarnings: teacher.totalEarnings || 0,
      monthlySalary: teacher.baseSalary || 0,
      bonus: (teacher.totalEarnings || 0) * ((teacher.bonusRate || 0) / 100),
      history,
    })
  } catch (error) {
    console.error('Error fetching teacher salary:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
