import { dateKeyUzbekistan, uzDayStartUtc } from '@/lib/uzbekistan-time'

/** Dars rejasi sanasi — O'zbekiston kuni (testlar bilan bir xil) */
export function parseScheduleDateUtc(date: string): Date {
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return uzDayStartUtc(date)
  }
  return uzDayStartUtc(dateKeyUzbekistan(new Date(date)))
}
