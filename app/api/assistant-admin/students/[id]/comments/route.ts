import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasSectionAccess } from '@/lib/permissions'

// GET - O'quvchiga tegishli barcha fikrlar (vaqt bo'yicha eski → yangi)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    if (!user || user.role !== 'ASSISTANT_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const canView = await hasSectionAccess(user.id, user.role, 'studentComments', 'view')
    if (!canView) {
      return NextResponse.json({ error: "Sizda o'quvchi fikrlari bo'limini ko'rish ruxsati yo'q" }, { status: 403 })
    }

    const { id: studentId } = await params
    if (!studentId) {
      return NextResponse.json({ error: 'O\'quvchi ID kerak' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true },
    })
    if (!student) {
      return NextResponse.json({ error: 'O\'quvchi topilmadi' }, { status: 404 })
    }

    const comments = await prisma.studentComment.findMany({
      where: { studentId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const formatted = comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      author: c.author,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching student comments:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - O'quvchiga yangi fikr qo'shish
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    if (!user || user.role !== 'ASSISTANT_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const canView = await hasSectionAccess(user.id, user.role, 'studentComments', 'view')
    if (!canView) {
      return NextResponse.json({ error: "Sizda o'quvchi fikrlari bo'limini ko'rish ruxsati yo'q" }, { status: 403 })
    }

    const { id: studentId } = await params
    if (!studentId) {
      return NextResponse.json({ error: 'O\'quvchi ID kerak' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true },
    })
    if (!student) {
      return NextResponse.json({ error: 'O\'quvchi topilmadi' }, { status: 404 })
    }

    const body = await request.json()
    const content = typeof body?.content === 'string' ? body.content.trim() : ''
    if (!content) {
      return NextResponse.json({ error: 'Fikr matni bo\'sh bo\'lmasligi kerak' }, { status: 400 })
    }

    const comment = await prisma.studentComment.create({
      data: {
        studentId,
        authorId: user.id,
        content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: comment.author,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating student comment:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
