import { prisma } from '@/lib/prisma'

/** Yangi o'quvchi raqamli IDlari: 5 xona, 10000–99999 */
export const STUDENT_NUMERIC_ID_MIN = 10000
export const STUDENT_NUMERIC_ID_MAX = 99999

/** Qo'lda / import: aynan 5 ta raqam, 10000 dan 99999 gacha */
export function isValidFiveDigitStudentId(id: string): boolean {
  const t = id.trim()
  return /^[1-9]\d{4}$/.test(t)
}

/**
 * Yangi o'quvchi ID'ni avtomatik generatsiya qilish.
 * Avvalo mavjud 5 xonali IDlar oralig'ida (10000–99999) keyingi bo'sh raqamni qidiradi.
 * Agar 99999 gacha to'lsa, eng katta raqamli ID + 1 (ixtiyoriy uzunlik).
 */
export async function generateNextStudentId(): Promise<string> {
  try {
    const students = await prisma.student.findMany({
      select: { studentId: true },
    })

    let max5 = STUDENT_NUMERIC_ID_MIN - 1
    for (const { studentId } of students) {
      if (/^[1-9]\d{4}$/.test(studentId)) {
        const n = parseInt(studentId, 10)
        if (!Number.isNaN(n) && n > max5) max5 = n
      }
    }

    if (max5 < STUDENT_NUMERIC_ID_MIN) {
      return String(STUDENT_NUMERIC_ID_MIN)
    }
    if (max5 < STUDENT_NUMERIC_ID_MAX) {
      return String(max5 + 1)
    }

    let maxNumeric = 0
    for (const { studentId } of students) {
      const n = parseInt(studentId, 10)
      if (!Number.isNaN(n) && n > maxNumeric) maxNumeric = n
    }
    return String(maxNumeric + 1)
  } catch (error) {
    console.error('Error generating student ID:', error)
    return String(STUDENT_NUMERIC_ID_MIN)
  }
}

/**
 * Mavjud o'quvchilar uchun ID'ni avtomatik belgilash
 * Faqat ID'si bo'sh yoki raqamli bo'lmagan o'quvchilar uchun
 */
export async function assignStudentIdsToExisting(): Promise<{ assigned: number; skipped: number }> {
  let assigned = 0
  let skipped = 0
  let currentId = STUDENT_NUMERIC_ID_MIN

  try {
    const students = await prisma.student.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    })

    for (const student of students) {
      const numericId = parseInt(student.studentId, 10)
      if (!isNaN(numericId) && numericId >= STUDENT_NUMERIC_ID_MIN) {
        skipped++
        if (numericId >= currentId) {
          currentId = numericId + 1
        }
        continue
      }

      const newId = currentId.toString()

      const existing = await prisma.student.findUnique({
        where: { studentId: newId },
      })

      if (existing) {
        currentId++
        continue
      }

      await prisma.student.update({
        where: { id: student.id },
        data: { studentId: newId },
      })

      assigned++
      currentId++
    }

    return { assigned, skipped }
  } catch (error) {
    console.error('Error assigning student IDs:', error)
    throw error
  }
}
