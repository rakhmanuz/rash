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

export async function POST(request: NextRequest, { params }: { params: { topicId: string } }) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const topic = await prisma.testBankTopic.findUnique({ where: { id: params.topicId } })
    if (!topic) return NextResponse.json({ error: 'Mavzu topilmadi' }, { status: 404 })
    const body = await request.json()
    const imageUrl = String(body?.imageUrl || '').trim()
    const correctAnswer = String(body?.correctAnswer || '').trim()
    const hint =
      body?.hint == null || body.hint === '' ? null : String(body.hint).trim() || null
    if (!imageUrl.startsWith('/uploads/')) {
      return NextResponse.json({ error: 'Rasm URL noto‘g‘ri (avval yuklang)' }, { status: 400 })
    }
    if (!correctAnswer) {
      return NextResponse.json({ error: 'To‘g‘ri javob matni kerak' }, { status: 400 })
    }
    const maxSort = await prisma.testBankOpenQuestion.aggregate({
      where: { topicId: params.topicId },
      _max: { sortOrder: true },
    })
    const q = await prisma.testBankOpenQuestion.create({
      data: {
        topicId: params.topicId,
        imageUrl,
        correctAnswer,
        hint,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    })
    return NextResponse.json(q, { status: 201 })
  } catch (e) {
    console.error('admin question POST', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
