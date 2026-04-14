import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) return null
  return user
}

export async function GET(_req: NextRequest, { params }: { params: { partId: string } }) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const part = await prisma.testBankPart.findUnique({
      where: { id: params.partId },
      include: {
        topics: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: { _count: { select: { questions: true } } },
        },
      },
    })
    if (!part) return NextResponse.json({ error: 'Qism topilmadi' }, { status: 404 })
    return NextResponse.json(part)
  } catch (e) {
    console.error('admin topics GET', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { partId: string } }) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const part = await prisma.testBankPart.findUnique({ where: { id: params.partId } })
    if (!part) return NextResponse.json({ error: 'Qism topilmadi' }, { status: 404 })
    const body = await request.json()
    const title = String(body?.title || '').trim()
    if (!title) return NextResponse.json({ error: 'Mavzu nomi kerak' }, { status: 400 })
    const maxSort = await prisma.testBankTopic.aggregate({
      where: { partId: params.partId },
      _max: { sortOrder: true },
    })
    const topic = await prisma.testBankTopic.create({
      data: {
        partId: params.partId,
        title,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    })
    return NextResponse.json(topic, { status: 201 })
  } catch (e) {
    console.error('admin topics POST', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
