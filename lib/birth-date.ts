/** Tug'ilgan sana: API va forma uchun YYYY-MM-DD */

export function parseBirthDateInput(v: unknown): Date | null {
  if (v === undefined || v === null || v === '') return null
  const s = String(v).trim()
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const y = parseInt(m[1], 10)
  const mo = parseInt(m[2], 10) - 1
  const d = parseInt(m[3], 10)
  const dt = new Date(y, mo, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null
  return dt
}

export function dateToYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Jadvalda: DD.MM.YYYY */
export function formatBirthDateUz(d: Date | string | null | undefined): string | null {
  if (d == null) return null
  const date = typeof d === 'string' ? parseBirthDateInput(d) : d
  if (!date) return null
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}
