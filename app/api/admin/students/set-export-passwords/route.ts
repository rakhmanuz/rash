import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { encryptPassword } from '@/lib/password-export'

function randomPassword(length = 8): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789'
  let s = ''
  const bytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) s += chars[bytes[i] % chars.length]
  return s
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const students = await prisma.student.findMany({
      include: {
        user: {
          select: { id: true, passwordExport: true },
        },
      },
    })

    let updated = 0
    for (const s of students) {
      if (s.user.passwordExport != null && s.user.passwordExport !== '') continue
      const newPassword = randomPassword(8)
      const hashed = await bcrypt.hash(newPassword, 10)
      const passwordExport = encryptPassword(newPassword)
      await prisma.user.update({
        where: { id: s.user.id },
        data: { password: hashed, passwordExport },
      })
      updated++
    }

    return NextResponse.json({
      message: `${updated} ta o'quvchiga yangi parol belgilandi. Endi "Login va parollar (Excel)" orqali yuklab oling.`,
      updated,
    })
  } catch (error) {
    console.error('Error setting export passwords:', error)
    return NextResponse.json(
      { error: 'Parollarni belgilashda xatolik' },
      { status: 500 }
    )
  }
}
