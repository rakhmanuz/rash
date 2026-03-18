import crypto from 'crypto'
import { NextRequest } from 'next/server'

const COOKIE_NAME = 'monitor_session'
const MAX_AGE = 7 * 24 * 60 * 60 // 7 kun (soniyada)

function getSecret(): string {
  const s = process.env.MONITOR_SECRET || process.env.NEXTAUTH_SECRET
  if (!s) throw new Error('MONITOR_SECRET yoki NEXTAUTH_SECRET kerak')
  return s
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
}

export function createMonitorToken(username: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE
  const payload = JSON.stringify({ u: username, exp })
  const sig = sign(payload)
  return Buffer.from(payload).toString('base64url') + '.' + sig
}

export function verifyMonitorToken(token: string | undefined): boolean {
  if (!token) return false
  try {
    const [raw, sig] = token.split('.')
    if (!raw || !sig) return false
    const payload = Buffer.from(raw, 'base64url').toString('utf8')
    if (sign(payload) !== sig) return false
    const { exp } = JSON.parse(payload)
    return typeof exp === 'number' && exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export function checkMonitorCredentials(username: string, password: string): boolean {
  let envUser = process.env.MONITOR_LOGIN || process.env.MONITOR_USERNAME
  let envPass = process.env.MONITOR_PASSWORD
  if (!envUser || !envPass) {
    if (process.env.NODE_ENV === 'production') return false
    envUser = 'monitor'
    envPass = 'monitor123'
  }
  return username.trim() === envUser && password === envPass
}

export function getMonitorTokenFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get(COOKIE_NAME)?.value
}

export function isMonitorAuthenticated(request: NextRequest): boolean {
  return verifyMonitorToken(getMonitorTokenFromRequest(request))
}

export function getMonitorCookieAttributes() {
  return {
    name: COOKIE_NAME,
    maxAge: MAX_AGE,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  }
}

export { COOKIE_NAME }
