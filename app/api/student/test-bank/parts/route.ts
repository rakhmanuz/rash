import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureSixTestBankParts } from '@/lib/testBankSeed'

async function requireStudent() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { studentProfile: true },
  })
  if (!user || user.role !== 'STUDENT' || !user.studentProfile) return null
  return user
}

export async function GET() {
  try {
    if (!(await requireStudent())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await ensureSixTestBankParts()
    const parts = await prisma.testBankPart.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { topics: true } } },
    })
    return NextResponse.json(parts)
  } catch (e) {
    console.error('student test-bank parts GET', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
