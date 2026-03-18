import { NextRequest, NextResponse } from 'next/server'
import {
  checkMonitorCredentials,
  createMonitorToken,
  getMonitorCookieAttributes,
  COOKIE_NAME,
} from '@/lib/monitor-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const username = (body.username || '').toString().trim()
    const password = (body.password || '').toString()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Login va parol kiriting' },
        { status: 400 }
      )
    }

    if (!checkMonitorCredentials(username, password)) {
      return NextResponse.json(
        { error: 'Login yoki parol noto\'g\'ri' },
        { status: 401 }
      )
    }

    const token = createMonitorToken(username)
    const attrs = getMonitorCookieAttributes()
    const res = NextResponse.json({ ok: true })
    res.cookies.set({
      ...attrs,
      name: COOKIE_NAME,
      value: token,
    })
    return res
  } catch (error) {
    console.error('Monitor login error:', error)
    return NextResponse.json(
      { error: 'Xatolik' },
      { status: 500 }
    )
  }
}
