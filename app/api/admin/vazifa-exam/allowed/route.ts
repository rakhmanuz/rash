import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function canManage(role: string | undefined) {
  return role === 'ADMIN' || role === 'MANAGER'
}

/** Navbatga o‘quvchi qo‘shish */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || !canManage(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const ids = Array.isArray(body?.studentIds) ? body.studentIds : []
    const clean = [...new Set(ids.filter((x: unknown) => typeof x === 'string' && x.length > 0))] as string[]
    if (clean.length === 0) {
      return NextResponse.json({ error: 'studentIds kerak' }, { status: 400 })
    }

    const students = await prisma.student.findMany({
      where: { id: { in: clean } },
      select: { id: true },
    })
    const okIds = students.map((s) => s.id)
    if (okIds.length === 0) {
      return NextResponse.json({ added: 0, message: 'Hech qanday o‘quvchi topilmadi' })
    }

    await prisma.$transaction(
      okIds.map((studentId) =>
        prisma.vazifaExamAllowedStudent.upsert({
          where: { studentId },
          create: { studentId },
          update: {},
        })
      )
    )

    return NextResponse.json({ added: okIds.length })
  } catch (e) {
    console.error('admin vazifa-exam/allowed POST', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

/** Navbatdan olib tashlash yoki tozalash */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || !canManage(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const clearAll = body?.clearAll === true
    if (clearAll) {
      await prisma.vazifaExamAllowedStudent.deleteMany({})
      return NextResponse.json({ cleared: true })
    }

    const ids = Array.isArray(body?.studentIds) ? body.studentIds : []
    const clean = [...new Set(ids.filter((x: unknown) => typeof x === 'string' && x.length > 0))] as string[]
    if (clean.length === 0) {
      return NextResponse.json({ error: 'studentIds yoki clearAll kerak' }, { status: 400 })
    }

    await prisma.vazifaExamAllowedStudent.deleteMany({
      where: { studentId: { in: clean } },
    })

    return NextResponse.json({ removed: clean.length })
  } catch (e) {
    console.error('admin vazifa-exam/allowed DELETE', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
