/**
 * Dars davomiyligi 3 soat = 180 daqiqa.
 * Kechikkan daqiqa kiritiladi: 0 = vaqtida (100%), 60 = 1 soat kechikkan → (180-60)/180 ≈ 66%.
 */
export const LESSON_DURATION_MINUTES = 180

/**
 * Bor/yo'q va kechikkan daqiqadan davomat foizini hisoblaydi.
 * @param isPresent - o'quvchi keldi mi
 * @param lateMinutes - kechikkan daqiqa (faqat bor bo'lsa; null/undefined = vaqtida = 100%)
 */
export function getAttendancePercentage(
  isPresent: boolean,
  lateMinutes: number | null | undefined
): number {
  if (!isPresent) return 0
  const late = lateMinutes ?? 0
  const effective = Math.max(0, LESSON_DURATION_MINUTES - late)
  const pct = (effective / LESSON_DURATION_MINUTES) * 100
  return Math.round(Math.max(0, Math.min(100, pct)))
}
