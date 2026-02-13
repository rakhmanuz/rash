import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST - Track visitor activity
export async function POST(request: NextRequest) {
  try {
    let body: { sessionId?: string; page?: string; userAgent?: string }
    try {
      const text = await request.text()
      body = text ? JSON.parse(text) : {}
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const { sessionId, page, userAgent } = body

    if (!sessionId || !page) {
      return NextResponse.json({ error: 'Session ID va page kerak' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    // Get client IP
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    // Update or create visitor activity
    await prisma.visitorActivity.upsert({
      where: { sessionId },
      update: {
        userId,
        page,
        userAgent: userAgent || null,
        ipAddress: ipAddress !== 'unknown' ? ipAddress : null,
        lastActivity: new Date(),
      },
      create: {
        sessionId,
        userId,
        page,
        userAgent: userAgent || null,
        ipAddress: ipAddress !== 'unknown' ? ipAddress : null,
        lastActivity: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking visitor:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
