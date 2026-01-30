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

// Format date as kun/oy/yil (DD/MM/YYYY)
// Timezone muammosini oldini olish uchun UTC metodlaridan foydalanamiz
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
  
  // UTC metodlaridan foydalanamiz, timezone muammosini oldini olish uchun
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year = d.getUTCFullYear()
  return `${day}/${month}/${year}`
}
