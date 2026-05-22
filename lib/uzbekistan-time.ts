/** O'zbekiston (Toshkent) — UTC+5, butun loyiha bo'yicha bitta kalendar kun */

export const UZBEKISTAN_OFFSET_MS = 5 * 60 * 60 * 1000

/** `YYYY-MM-DD` — shu kun boshlanishi DB da (testlar bilan bir xil) */
export function uzDayStartUtc(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - UZBEKISTAN_OFFSET_MS)
}

export function uzDayBounds(dateStr: string): { gte: Date; lte: Date } {
  const gte = uzDayStartUtc(dateStr)
  const lte = new Date(gte.getTime() + 24 * 60 * 60 * 1000 - 1)
  return { gte, lte }
}

/** Sanani O'zbekiston kalendari bo'yicha `YYYY-MM-DD` */
export function dateKeyUzbekistan(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  const uz = new Date(d.getTime() + UZBEKISTAN_OFFSET_MS)
  return `${uz.getUTCFullYear()}-${String(uz.getUTCMonth() + 1).padStart(2, '0')}-${String(uz.getUTCDate()).padStart(2, '0')}`
}

export function todayKeyUzbekistan(): string {
  return dateKeyUzbekistan(new Date())
}

/** Hafta: Yakshanba — Shanba (local UZ kalendar) */
export function weekBoundsUzbekistan(anchor: Date = new Date()) {
  const uz = new Date(anchor.getTime() + UZBEKISTAN_OFFSET_MS)
  const day = uz.getUTCDay()
  const weekStartUz = new Date(uz)
  weekStartUz.setUTCDate(uz.getUTCDate() - day)
  weekStartUz.setUTCHours(0, 0, 0, 0)
  const weekStart = new Date(weekStartUz.getTime() - UZBEKISTAN_OFFSET_MS)
  const weekEndUz = new Date(weekStartUz)
  weekEndUz.setUTCDate(weekStartUz.getUTCDate() + 6)
  const weekEnd = new Date(weekEndUz.getTime() - UZBEKISTAN_OFFSET_MS)
  return {
    weekStart,
    weekEnd,
    startDateStr: dateKeyUzbekistan(weekStart),
    endDateStr: dateKeyUzbekistan(weekEnd),
  }
}
