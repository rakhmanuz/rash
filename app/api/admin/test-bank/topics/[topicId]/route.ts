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

export async function GET(_req: NextRequest, { params }: { params: { topicId: string } }) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const topic = await prisma.testBankTopic.findUnique({
      where: { id: params.topicId },
      include: {
        part: { select: { id: true, title: true, sortOrder: true } },
        questions: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      },
    })
    if (!topic) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })
    return NextResponse.json(topic)
  } catch (e) {
    console.error('admin topic GET', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { topicId: string } }) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await request.json()
    const title = String(body?.title || '').trim()
    if (!title) return NextResponse.json({ error: 'Nom bo‘sh' }, { status: 400 })
    const topic = await prisma.testBankTopic.update({
      where: { id: params.topicId },
      data: { title },
    })
    return NextResponse.json(topic)
  } catch {
    return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { topicId: string } }) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await prisma.testBankTopic.delete({ where: { id: params.topicId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })
  }
}
