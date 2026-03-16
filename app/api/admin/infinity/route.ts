import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Barcha foydalanuvchilar va ularning infinity ballari
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
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')

    // Guruh bo'yicha filtrlash: faqat shu guruhga biriktirilgan o'quvchilar
    const whereClause = groupId
      ? {
          studentProfile: {
            enrollments: {
              some: {
                groupId,
                isActive: true,
              },
            },
          },
        }
      : undefined

    // Barcha foydalanuvchilarni olish (infinity ballari bilan)
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        phone: true,
        infinityPoints: true,
        isActive: true,
        studentProfile: {
          select: {
            studentId: true,
          },
        },
        teacherProfile: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        infinityPoints: 'desc',
      },
    })

    console.log('Fetched users count:', users.length)
    console.log('Sample user:', users[0])

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching infinity points:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

// POST - Infinity ballarini qo'shish yoki ayirish
export async function POST(request: NextRequest) {
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
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, amount, operation, reason } = body // operation: 'add' yoki 'subtract', reason: sabab (ixtiyoriy)

    if (!userId || amount === undefined || !operation) {
      return NextResponse.json(
        { error: 'User ID, amount, and operation are required' },
        { status: 400 }
      )
    }

    if (operation !== 'add' && operation !== 'subtract') {
      return NextResponse.json(
        { error: 'Operation must be "add" or "subtract"' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Foydalanuvchini topish
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const currentPoints = targetUser.infinityPoints || 0
    let newPoints: number
    let historyAmount: number
    const source = operation === 'add' ? 'ADMIN_ADD' : 'ADMIN_SUBTRACT'

    if (operation === 'add') {
      newPoints = currentPoints + amount
      historyAmount = amount
    } else {
      newPoints = Math.max(0, currentPoints - amount)
      historyAmount = -amount
    }

    const description = (reason && String(reason).trim()) || (operation === 'add' ? `Admin: +${amount} ∞ qo'shildi` : `Admin: −${amount} ∞ ayirildi`)

    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: { infinityPoints: newPoints },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          infinityPoints: true,
          studentProfile: { select: { studentId: true } },
        },
      })
      await tx.infinityHistory.create({
        data: {
          userId,
          amount: historyAmount,
          balanceAfter: newPoints,
          source,
          description,
        },
      })
      return u
    })

    return NextResponse.json({
      message: `Infinity ballar ${operation === 'add' ? 'qo\'shildi' : 'ayirildi'}`,
      user: updatedUser,
      previousPoints: currentPoints,
      newPoints: newPoints,
    })
  } catch (error) {
    console.error('Error updating infinity points:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
