import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get total unique visitor count (for infinity counter)
export async function GET() {
  try {
    // Count unique visitors (distinct sessionId)
    const uniqueVisitors = await prisma.visitorActivity.findMany({
      select: {
        sessionId: true,
      },
      distinct: ['sessionId'],
    })

    const count = uniqueVisitors.length

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error counting visitors:', error)
    return NextResponse.json({ count: 0 })
  }
}
