import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

// O'zbekiston vaqti (UTC+5)
const UZBEKISTAN_TIMEZONE_OFFSET = 5 * 60 * 60 * 1000 // 5 soat millisekundlarda

// Format date as kun/oy/yil (DD/MM/YYYY) - O'zbekiston vaqtida
export function formatDateShort(date: Date | string): string {
  let d: Date
  if (typeof date === 'string') {
    // Agar string formatida YYYY-MM-DD bo'lsa, UTC vaqtida parse qilamiz
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-').map(Number)
      d = new Date(Date.UTC(year, month - 1, day))
    } else {
      d = new Date(date)
    }
  } else {
    d = date
  }
  
  // O'zbekiston vaqtiga o'tkazamiz (UTC+5)
  const uzDate = new Date(d.getTime() + UZBEKISTAN_TIMEZONE_OFFSET)
  
  // UTC metodlaridan foydalanamiz (chunki biz allaqachon offset qo'shdik)
  const day = String(uzDate.getUTCDate()).padStart(2, '0')
  const month = String(uzDate.getUTCMonth() + 1).padStart(2, '0')
  const year = uzDate.getUTCFullYear()
  return `${day}/${month}/${year}`
}

// O'zbekiston vaqtida sana yaratish (YYYY-MM-DD formatidan)
export function createUzbekistanDate(year: number, month: number, day: number): Date {
  // O'zbekiston vaqtida sana yaratish uchun UTC dan 5 soat ayiramiz
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - UZBEKISTAN_TIMEZONE_OFFSET)
}

/**
 * Dars test foizi bo'yicha infinity ballar (har bir dars uchun).
 * 55-64% → 1, 65-74% → 2, 75-84% → 3, 85-94% → 4, 95-100% → 5.
 * 55% dan past bo'lsa 0.
 */
export function getInfinityForPercent(percent: number): number {
  if (percent < 55) return 0
  if (percent < 65) return 1
  if (percent < 75) return 2
  if (percent < 85) return 3
  if (percent < 95) return 4
  return 5 // 95-100
}

/**
 * Yozma ish foizi bo'yicha infinity ballar (har bir yozma ish uchun).
 * 30-34%→1, 35-39%→2, ... 95-99%→14, 100% va undan yuqori→15 (maks 15).
 * 30% dan past bo'lsa 0.
 */
export function getInfinityForWrittenWorkPercent(percent: number): number {
  if (percent < 30) return 0
  if (percent < 35) return 1
  if (percent < 40) return 2
  if (percent < 45) return 3
  if (percent < 50) return 4
  if (percent < 55) return 5
  if (percent < 60) return 6
  if (percent < 65) return 7
  if (percent < 70) return 8
  if (percent < 75) return 9
  if (percent < 80) return 10
  if (percent < 85) return 11
  if (percent < 90) return 12
  if (percent < 95) return 13
  if (percent < 100) return 14
  return 15 // 100–130+%
}
