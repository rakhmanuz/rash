import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { scanOmrImage } from '@/lib/omrScan'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const answerKey = formData.get('answerKey')
    if (!(file instanceof Blob) || typeof answerKey !== 'string') {
      return NextResponse.json({ error: 'file va answerKey kerak' }, { status: 400 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    if (buf.length < 500 || buf.length > 12 * 1024 * 1024) {
      return NextResponse.json({ error: 'Rasm hajmi noto‘g‘ri (max ~12 MB)' }, { status: 400 })
    }

    const result = await scanOmrImage(buf, answerKey)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 })
    }
    return NextResponse.json(result)
  } catch (e) {
    console.error('omr-scan', e)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
