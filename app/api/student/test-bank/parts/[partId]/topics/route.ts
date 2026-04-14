import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

export async function GET(_req: Request, { params }: { params: { partId: string } }) {
  try {
    if (!(await requireStudent())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const part = await prisma.testBankPart.findUnique({
      where: { id: params.partId },
      include: {
        topics: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: { _count: { select: { questions: true } } },
        },
      },
    })
    if (!part) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })
    return NextResponse.json(part)
  } catch (e) {
    console.error('student topics GET', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
