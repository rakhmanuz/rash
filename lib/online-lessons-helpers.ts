/** Jadval izohidan birinchi HTTP(S) havolani ajratadi (Zoom/YouTube va hokazo). */
export function extractJoinUrl(notes: string | null | undefined): string | null {
  if (!notes) return null
  const m = notes.match(/https?:\/\/[^\s]+/i)
  return m?.[0] || null
}

/** O‘quvchiga ko‘rsatiladigan matndan jonli havolani olib tashlaydi (havola faqat “Darsga kirish” orqali). */
export function redactJoinUrlFromNotes(notes: string, joinUrl: string | null): string {
  if (!joinUrl || !notes) return notes
  return notes.split(joinUrl).join('').replace(/\s{2,}/g, ' ').trim()
}
