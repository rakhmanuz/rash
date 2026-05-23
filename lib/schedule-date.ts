import { dateKeyUzbekistan, uzDayStartUtc } from '@/lib/uzbekistan-time'

/** ISO yoki Date → O'zbekiston kalendari `YYYY-MM-DD` (split('T') ishlatilmasin) */
export function scheduleDateKey(date: string | Date): string {
  return dateKeyUzbekistan(date)
}

/** Dars rejasi sanasi — O'zbekiston kuni (testlar bilan bir xil) */
export function parseScheduleDateUtc(date: string): Date {
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return uzDayStartUtc(date)
  }
  return uzDayStartUtc(dateKeyUzbekistan(new Date(date)))
}
