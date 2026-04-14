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

export async function PATCH(request: NextRequest, { params }: { params: { partId: string } }) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await request.json()
    const title = String(body?.title || '').trim()
    if (!title) return NextResponse.json({ error: 'Sarlavha bo‘sh' }, { status: 400 })
    const part = await prisma.testBankPart.update({
      where: { id: params.partId },
      data: { title },
    })
    return NextResponse.json(part)
  } catch {
    return NextResponse.json({ error: 'Topilmadi yoki xato' }, { status: 404 })
  }
}
