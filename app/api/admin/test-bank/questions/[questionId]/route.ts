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

export async function PATCH(request: NextRequest, { params }: { params: { questionId: string } }) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await request.json()
    const data: { imageUrl?: string; correctAnswer?: string; hint?: string | null } = {}
    if (body.imageUrl !== undefined) {
      const imageUrl = String(body.imageUrl || '').trim()
      if (!imageUrl.startsWith('/uploads/')) {
        return NextResponse.json({ error: 'Rasm URL noto‘g‘ri' }, { status: 400 })
      }
      data.imageUrl = imageUrl
    }
    if (body.correctAnswer !== undefined) {
      const correctAnswer = String(body.correctAnswer || '').trim()
      if (!correctAnswer) return NextResponse.json({ error: 'To‘g‘ri javob bo‘sh' }, { status: 400 })
      data.correctAnswer = correctAnswer
    }
    if (body.hint !== undefined) {
      data.hint = body.hint == null || body.hint === '' ? null : String(body.hint).trim() || null
    }
    const q = await prisma.testBankOpenQuestion.update({
      where: { id: params.questionId },
      data,
    })
    return NextResponse.json(q)
  } catch {
    return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { questionId: string } }) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await prisma.testBankOpenQuestion.delete({ where: { id: params.questionId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })
  }
}
