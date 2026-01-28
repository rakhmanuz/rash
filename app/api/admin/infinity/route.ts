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

    // Barcha foydalanuvchilarni olish (infinity ballari bilan)
    const users = await prisma.user.findMany({
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
    const { userId, amount, operation } = body // operation: 'add' yoki 'subtract'

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

    // Infinity ballarini yangilash
    const currentPoints = targetUser.infinityPoints || 0
    let newPoints: number

    if (operation === 'add') {
      newPoints = currentPoints + amount
    } else {
      // subtract
      newPoints = Math.max(0, currentPoints - amount) // Manfiy bo'lmasligi uchun
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        infinityPoints: newPoints,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        infinityPoints: true,
        studentProfile: {
          select: {
            studentId: true,
          },
        },
      },
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
