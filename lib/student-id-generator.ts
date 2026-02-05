import { prisma } from '@/lib/prisma'

const STARTING_ID = 1070010

/**
 * Yangi o'quvchi ID'ni avtomatik generatsiya qilish
 * 1070010 dan boshlab, eng katta mavjud ID'dan keyingi raqamni qaytaradi
 */
export async function generateNextStudentId(): Promise<string> {
  try {
    // Barcha o'quvchilarni studentId bo'yicha tartiblash (raqamli ID'lar uchun)
    const students = await prisma.student.findMany({
      select: {
        studentId: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Raqamli ID'larni topish va eng kattasini aniqlash
    let maxNumericId = STARTING_ID - 1

    for (const student of students) {
      const numericId = parseInt(student.studentId, 10)
      if (!isNaN(numericId) && numericId >= STARTING_ID) {
        if (numericId > maxNumericId) {
          maxNumericId = numericId
        }
      }
    }

    // Yangi ID = eng katta ID + 1
    const nextId = maxNumericId + 1
    return nextId.toString()
  } catch (error) {
    console.error('Error generating student ID:', error)
    // Xatolik bo'lsa, eng katta ID'ni topish uchun boshqa usul
    try {
      const lastStudent = await prisma.student.findFirst({
        where: {
          studentId: {
            not: {
              contains: '-', // Raqamli bo'lmagan ID'larni o'tkazib yuborish
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      if (lastStudent) {
        const numericId = parseInt(lastStudent.studentId, 10)
        if (!isNaN(numericId) && numericId >= STARTING_ID) {
          return (numericId + 1).toString()
        }
      }
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError)
    }

    // Agar hech narsa topilmasa, boshlang'ich ID'ni qaytarish
    return STARTING_ID.toString()
  }
}

/**
 * Mavjud o'quvchilar uchun ID'ni avtomatik belgilash
 * Faqat ID'si bo'sh yoki raqamli bo'lmagan o'quvchilar uchun
 */
export async function assignStudentIdsToExisting(): Promise<{ assigned: number; skipped: number }> {
  let assigned = 0
  let skipped = 0
  let currentId = STARTING_ID

  try {
    // Barcha o'quvchilarni olish
    const students = await prisma.student.findMany({
      orderBy: {
        createdAt: 'asc', // Eski o'quvchilardan boshlab
      },
    })

    for (const student of students) {
      // Agar studentId raqamli va 1070010 dan katta bo'lsa, o'tkazib yuborish
      const numericId = parseInt(student.studentId, 10)
      if (!isNaN(numericId) && numericId >= STARTING_ID) {
        skipped++
        // Eng katta ID'ni kuzatish
        if (numericId >= currentId) {
          currentId = numericId + 1
        }
        continue
      }

      // Yangi ID belgilash
      const newId = currentId.toString()
      
      // ID mavjudligini tekshirish
      const existing = await prisma.student.findUnique({
        where: { studentId: newId },
      })

      if (existing) {
        // Agar ID mavjud bo'lsa, keyingi raqamni ishlatish
        currentId++
        continue
      }

      // ID'ni yangilash
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
