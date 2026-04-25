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
        debt: null,
        source: 'none',
        message: "Sheet script URL sozlanmagan. .env da SHEET_DEBT_SCRIPT_URL qo'shing.",
      })
    }

    const url = new URL(SHEET_SCRIPT_URL)
    url.searchParams.set('id', studentId)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 soniya
    let res: Response
    try {
      res = await fetch(url.toString(), { cache: 'no-store', signal: controller.signal })
    } catch (err) {
      clearTimeout(timeoutId)
      const isTimeout = err instanceof Error && err.name === 'AbortError'
      console.error('[debt-from-sheet] Fetch failed:', isTimeout ? 'Timeout' : err)
      return NextResponse.json({
        debt: null,
        source: 'error',
        studentId,
        message: isTimeout
          ? "Google Sheets ga ulanish vaqti tugadi. Keyinroq urinib ko'ring."
          : (err instanceof Error ? err.message : String(err)).slice(0, 100),
      })
    }
    clearTimeout(timeoutId)
    const bodyText = await res.text()

    if (!res.ok) {
      console.error('[debt-from-sheet] Script error:', res.status, bodyText?.slice(0, 200))
      return NextResponse.json({
        debt: null,
        source: 'error',
        studentId,
        message: `Script ${res.status}: ${bodyText?.slice(0, 100) || 'javob yo\'q'}`,
      })
    }

    let data: { debt?: number | string } = {}
    try {
      data = JSON.parse(bodyText)
    } catch {
      console.error('[debt-from-sheet] Script JSON emas:', bodyText?.slice(0, 200))
      return NextResponse.json({
        debt: null,
        source: 'error',
        studentId,
        message: "Script JSON qaytarmadi",
      })
    }

    const debt = typeof data?.debt === 'number' ? data.debt : Number(String(data?.debt || '0').replace(/\s/g, '')) || 0

    return NextResponse.json({
      debt,
      source: 'sheet',
      studentId,
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Error fetching debt from sheet:', error)
    return NextResponse.json({
      debt: null,
      source: 'error',
      message: errMsg.slice(0, 150),
    })
  }
}
