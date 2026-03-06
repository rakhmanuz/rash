import crypto from 'crypto'

const ALG = 'aes-256-cbc'
const IV_LEN = 16
const KEY_LEN = 32

function getKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET || process.env.PASSWORD_EXPORT_SECRET || 'default-dev-key-change-in-production'
  if (secret.length >= KEY_LEN) {
    return Buffer.from(secret.slice(0, KEY_LEN), 'utf8')
  }
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptPassword(plain: string): string {
  if (!plain) return ''
  const key = getKey()
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALG, key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return iv.toString('base64') + ':' + enc.toString('base64')
}

export function decryptPassword(encrypted: string | null | undefined): string {
  if (!encrypted || !encrypted.includes(':')) return ''
  try {
    const [ivB64, dataB64] = encrypted.split(':')
    const iv = Buffer.from(ivB64, 'base64')
    const data = Buffer.from(dataB64, 'base64')
    const key = getKey()
    const decipher = crypto.createDecipheriv(ALG, key, iv)
    return decipher.update(data) + decipher.final('utf8')
  } catch {
    return ''
  }
}
