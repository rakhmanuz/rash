import { createHmac, timingSafeEqual } from 'crypto'
import { jwtVerify } from 'jose'

const SIGNATURE_HEADER_CANDIDATES = [
  'x-evalbee-signature',
  'x-signature',
  'x-webhook-signature',
  'evalbee-signature',
  'x-hub-signature-256',
]

function secretConfigured(): boolean {
  const s = process.env.EVALBEE_HS256_SECRET
  return Boolean(s && s.length >= 8)
}

function jwtSecretBytes(): Uint8Array {
  const s = process.env.EVALBEE_HS256_SECRET || ''
  if (process.env.EVALBEE_SECRET_IS_BASE64 === '1' || process.env.EVALBEE_SECRET_IS_BASE64 === 'true') {
    return new Uint8Array(Buffer.from(s.trim(), 'base64'))
  }
  return new TextEncoder().encode(s)
}

function hmacKey(): string | Buffer {
  const s = process.env.EVALBEE_HS256_SECRET || ''
  if (process.env.EVALBEE_SECRET_IS_BASE64 === '1' || process.env.EVALBEE_SECRET_IS_BASE64 === 'true') {
    return Buffer.from(s.trim(), 'base64')
  }
  return s
}

function tryVerifyHmac(rawBody: string, sigHeader: string): boolean {
  const key = hmacKey()
  const expectedHex = createHmac('sha256', key).update(rawBody, 'utf8').digest('hex')
  const expectedB64 = createHmac('sha256', key).update(rawBody, 'utf8').digest('base64')

  let token = sigHeader.trim()
  const lower = token.toLowerCase()
  if (lower.startsWith('sha256=')) token = token.slice(7).trim()
  if (lower.startsWith('v0=')) token = token.slice(3).trim()

  const hexNorm = token.replace(/^0x/i, '').toLowerCase()
  if (/^[0-9a-f]{64}$/i.test(hexNorm)) {
    try {
      const a = Buffer.from(expectedHex, 'hex')
      const b = Buffer.from(hexNorm, 'hex')
      return a.length === b.length && timingSafeEqual(a, b)
    } catch {
      return false
    }
  }

  try {
    const got = Buffer.from(token, 'base64')
    const exp = Buffer.from(expectedB64, 'base64')
    if (got.length === exp.length && got.length > 0) return timingSafeEqual(got, exp)
  } catch {
    /* ignore */
  }

  try {
    const got = Buffer.from(token, 'base64')
    const exp = createHmac('sha256', key).update(rawBody, 'utf8').digest()
    if (got.length === exp.length && got.length > 0) return timingSafeEqual(got, exp)
  } catch {
    /* ignore */
  }

  return false
}

function findSignatureHeader(headers: Headers): string | null {
  for (const name of SIGNATURE_HEADER_CANDIDATES) {
    const v = headers.get(name)
    if (v) return v
  }
  for (const [k, v] of headers.entries()) {
    if (k.toLowerCase().includes('signature') && v) return v
  }
  return null
}

export type EvalbeeAuthResult =
  | { ok: true; method: 'jwt' | 'hmac' }
  | { ok: false; reason: string }

/**
 * Evalbee “Sync API” sozlamalari: HS256 kalit bilan JWT (Bearer) yoki xom tanlov uchun HMAC-SHA256.
 * Evalbee hujjatida aniq sarlavha ko‘rsatilgan bo‘lsa, `SIGNATURE_HEADER_CANDIDATES` ga qo‘shing.
 */
export async function verifyEvalbeeRequest(headers: Headers, rawBody: string): Promise<EvalbeeAuthResult> {
  if (!secretConfigured()) {
    return { ok: false, reason: 'EVALBEE_HS256_SECRET serverda sozlanmagan' }
  }

  const auth = headers.get('authorization')

  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7).trim()
    if (token) {
      try {
        await jwtVerify(token, jwtSecretBytes(), { algorithms: ['HS256'] })
        return { ok: true, method: 'jwt' }
      } catch {
        /* HMAC ga o‘tadi */
      }
    }
  }

  const sig = findSignatureHeader(headers)
  if (sig && rawBody.length >= 0) {
    if (tryVerifyHmac(rawBody, sig)) return { ok: true, method: 'hmac' }
  }

  if (auth?.startsWith('Bearer ')) {
    return { ok: false, reason: 'JWT yoki HMAC imzosi noto‘g‘ri' }
  }
  if (sig) {
    return { ok: false, reason: 'HMAC imzosi noto‘g‘ri' }
  }
  return { ok: false, reason: 'Authorization: Bearer (JWT) yoki imzo sarlavhasi kerak' }
}

export function isEvalbeeConfigured(): boolean {
  return secretConfigured()
}
