import { dateToYmd } from '@/lib/birth-date'

export const MALUMOTLAR_SHEET_NAME = 'Malumotlar'

/** Shablon ustunlari (tartibni o'zgartirmang) */
export const MALUMOTLAR_HEADER_ROW = [
  "O'quvchi ID",
  'Ism',
  '1-kim',
  '1-telefon',
  '2-kim',
  '2-telefon',
  '3-kim',
  '3-telefon',
  "Tug'ilgan sana",
  'Manzil',
  'Sinf',
  'Maktab',
] as const

export const MALUMOTLAR_COL_COUNT = MALUMOTLAR_HEADER_ROW.length

/** Excel/CSV katakdan sana → YYYY-MM-DD */
export function malumotlarCellToYmd(val: unknown): string | null {
  if (val == null || val === '') return null
  if (val instanceof Date) return dateToYmd(val)
  if (typeof val === 'number' && Number.isFinite(val)) {
    const ms = (val - 25569) * 86400 * 1000
    const d = new Date(ms)
    if (!Number.isNaN(d.getTime())) return dateToYmd(d)
  }
  const s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const m = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(s)
  if (m) {
    const dd = m[1].padStart(2, '0')
    const mm = m[2].padStart(2, '0')
    return `${m[3]}-${mm}-${dd}`
  }
  return null
}

export function strCell(v: unknown): string {
  if (v == null || v === '') return ''
  return String(v).trim()
}
