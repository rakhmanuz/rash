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

export async function GET(_req: Request, { params }: { params: { topicId: string } }) {
  try {
    if (!(await requireStudent())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const topic = await prisma.testBankTopic.findUnique({
      where: { id: params.topicId },
      include: {
        part: { select: { id: true, title: true, sortOrder: true } },
        questions: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: { id: true, imageUrl: true, sortOrder: true },
        },
      },
    })
    if (!topic) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })
    return NextResponse.json(topic)
  } catch (e) {
    console.error('student topic GET', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
