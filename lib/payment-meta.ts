export type PaymentMeta = {
  subjectId?: string
  subjectName?: string
  monthKey?: string // YYYY-MM
  category?: 'MONTHLY_TUITION'
}

const META_PREFIX = '[PAYMETA]'

export function buildPaymentNotes(meta: PaymentMeta, rawNotes?: string | null): string {
  const payload = `${META_PREFIX}${JSON.stringify(meta)}`
  const notes = (rawNotes ?? '').trim()
  return notes ? `${payload}\n${notes}` : payload
}

export function parsePaymentNotes(notes?: string | null): {
  meta: PaymentMeta | null
  plainNotes: string | null
} {
  if (!notes) {
    return { meta: null, plainNotes: null }
  }

  const [firstLine, ...rest] = notes.split('\n')
  if (!firstLine.startsWith(META_PREFIX)) {
    return { meta: null, plainNotes: notes }
  }

  try {
    const json = firstLine.slice(META_PREFIX.length)
    const meta = JSON.parse(json) as PaymentMeta
    const plain = rest.join('\n').trim()
    return { meta, plainNotes: plain || null }
  } catch {
    return { meta: null, plainNotes: notes }
  }
}

export function normalizeMonthKey(monthKey?: string | null): string | null {
  if (!monthKey) return null
  const normalized = monthKey.trim()
  if (!/^\d{4}-\d{2}$/.test(normalized)) return null
  return normalized
}
