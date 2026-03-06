import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const SHEET_SCRIPT_URL = process.env.SHEET_DEBT_SCRIPT_URL

/**
 * GET - O'quvchining qarzdorligini Google Sheets (Apps Script) orqali olish.
 * Sessiyadagi studentId (login) yuboriladi, script S ustunidagi (yoki sozlangan ustun) qiymatni qaytaradi.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { studentProfile: true },
    })
    if (!user?.studentProfile) {
      return NextResponse.json({ error: "O'quvchi profili topilmadi" }, { status: 403 })
    }

    const studentId = user.studentProfile.studentId
    if (!SHEET_SCRIPT_URL?.trim()) {
      return NextResponse.json({
        debt: 0,
        source: 'none',
        message: "Sheet script URL sozlanmagan. .env da SHEET_DEBT_SCRIPT_URL qo'shing.",
      })
    }

    const url = new URL(SHEET_SCRIPT_URL)
    url.searchParams.set('id', studentId)
    const res = await fetch(url.toString(), { cache: 'no-store' })
    if (!res.ok) {
      console.error('[debt-from-sheet] Script error:', res.status, await res.text())
      return NextResponse.json({ debt: 0, source: 'error' })
    }

    const data = await res.json().catch(() => ({}))
    const debt = typeof data?.debt === 'number' ? data.debt : Number(String(data?.debt || '0').replace(/\s/g, '')) || 0

    return NextResponse.json({
      debt,
      source: 'sheet',
      studentId,
    })
  } catch (error) {
    console.error('Error fetching debt from sheet:', error)
    return NextResponse.json({ debt: 0, source: 'error' })
  }
}
