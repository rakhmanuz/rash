import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyEvalbeeRequest, isEvalbeeConfigured } from '@/lib/evalbeeVerify'

export const runtime = 'nodejs'
export const maxDuration = 60

function clientIp(req: NextRequest): string | null {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() ?? null
  return req.headers.get('x-real-ip')
}

/**
 * Evalbee Settings → Sync API URL:
 *   POST https://sizning-domen.uz/api/integrations/evalbee
 * HS256 kalit: serverda EVALBEE_HS256_SECRET (Evalbee UI dagi bilan bir xil).
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    integration: 'evalbee',
    configured: isEvalbeeConfigured(),
    postPath: '/api/integrations/evalbee',
    hint: 'Evalbee URL maydoniga to‘liq POST manzilni yozing (sayt ildiziga emas).',
  })
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const auth = await verifyEvalbeeRequest(req.headers, raw)

  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.reason }, { status: 401 })
  }

  let payload: unknown = {}
  if (raw.trim()) {
    try {
      payload = JSON.parse(raw) as unknown
    } catch {
      return NextResponse.json({ ok: false, error: 'JSON parse xatosi' }, { status: 400 })
    }
  }

  const payloadJson =
    typeof payload === 'string' ? JSON.stringify({ message: payload }) : JSON.stringify(payload)

  try {
    await prisma.evalbeeSyncLog.create({
      data: {
        payloadJson,
        authMethod: auth.method,
        ipAddress: clientIp(req),
      },
    })
  } catch (e) {
    console.error('evalbee log', e)
    return NextResponse.json({ ok: false, error: 'Ma‘lumot bazasiga yozishda xato' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    received: true,
    logged: true,
  })
}
