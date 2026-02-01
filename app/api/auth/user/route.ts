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
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        image: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Database'dan to'g'ridan-to'g'ri role'ni o'qish va formatlash
    let userRole = 'STUDENT'
    if (user.role) {
      userRole = user.role.toUpperCase().trim()
    }
    
    // Agar role bo'sh yoki noto'g'ri bo'lsa, STUDENT qilib qo'yish
    if (!userRole || (userRole !== 'ADMIN' && userRole !== 'MANAGER' && userRole !== 'TEACHER' && userRole !== 'STUDENT')) {
      userRole = 'STUDENT'
    }

    return NextResponse.json({
      ...user,
      role: userRole,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
