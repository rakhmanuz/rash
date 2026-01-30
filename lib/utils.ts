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
