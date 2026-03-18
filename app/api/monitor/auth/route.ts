import { NextRequest, NextResponse } from 'next/server'
import { isMonitorAuthenticated } from '@/lib/monitor-auth'

export async function GET(request: NextRequest) {
  if (isMonitorAuthenticated(request)) {
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Kirish talab qilinadi' }, { status: 401 })
}
