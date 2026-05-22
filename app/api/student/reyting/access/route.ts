import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeLearningMode } from '@/lib/learning-mode'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ allowed: false }, { status: 200 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, learningMode: true },
    })
    if (!user || user.role !== 'STUDENT') return NextResponse.json({ allowed: false }, { status: 200 })

    const allowed = normalizeLearningMode(user.learningMode) === 'ONLINE'
    return NextResponse.json({ allowed }, { status: 200 })
  } catch (error) {
    console.error('Error checking reyting access:', error)
    return NextResponse.json({ allowed: false }, { status: 200 })
  }
}

