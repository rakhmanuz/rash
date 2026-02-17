import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Login muvaffaqiyatidan keyin chaqiriladi, kirish tarixini yozadi
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || null

    await prisma.authLog.create({
      data: {
        userId: session.user.id,
        username: (session.user as any).username || session.user.email || session.user.name || '—',
        name: session.user.name || '—',
        role: (session.user as any).role || 'UNKNOWN',
        ipAddress: ipAddress !== 'unknown' ? ipAddress : null,
        userAgent,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging login:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
