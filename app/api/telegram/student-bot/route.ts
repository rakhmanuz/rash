import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, setSession, updateSessionActivity, deleteSession } from '@/lib/telegram-session'

const TELEGRAM_BOT_TOKEN = '8369765741:AAH7vS3X1z-Ul391bwNYP-c5G6zgHL2j5gc'
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

/**
 * Telegram API'ga xabar yuborish
 */
async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    })
    return await response.json()
  } catch (error) {
    console.error('Telegram xabar yuborishda xatolik:', error)
    return { ok: false, error }
  }
}

/**
 * Telefon raqamni tozalash va formatlash
 */
function normalizePhone(phone: string): string {
  // Barcha belgilar va bo'shliqlarni olib tashlash
  let cleaned = phone.replace(/\D/g, '')
  
  // +998 yoki 998 bilan boshlansa, olib tashlash
  if (cleaned.startsWith('998') && cleaned.length > 9) {
    cleaned = cleaned.substring(3)
  }
  
  return cleaned
}

/**
 * Telefon raqam orqali foydalanuvchini topish (bir nechta variant bilan)
 */
async function findUserByPhone(phoneNumber: string) {
  const normalized = normalizePhone(phoneNumber)
  
  // Bir nechta variant bilan qidirish
  const searchVariants = [
    normalized, // 901234567
    `998${normalized}`, // 998901234567
    `+998${normalized}`, // +998901234567
    phoneNumber, // Original
  ]

  for (const variant of searchVariants) {
    // To'g'ri mos kelish
    let user = await prisma.user.findFirst({
      where: {
        phone: variant,
        role: 'STUDENT',
        isActive: true,
      },
      include: {
        studentProfile: true,
      },
    })

    if (user) return user

    // Contains bilan qidirish
    user = await prisma.user.findFirst({
      where: {
        phone: {
          contains: normalized,
        },
        role: 'STUDENT',
        isActive: true,
      },
      include: {
        studentProfile: true,
      },
    })

    if (user) return user
  }

  return null
}

/**
 * O'quvchi ma'lumotlarini olish
 */
async function getStudentData(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: {
        select: {
          name: true,
          phone: true,
          infinityPoints: true,
        },
      },
      enrollments: {
        where: { isActive: true },
        include: {
          group: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      attendances: {
        orderBy: { date: 'desc' },
        include: {
          classSchedule: {
            include: {
              group: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      testResults: {
        orderBy: { createdAt: 'desc' },
        include: {
          test: {
            include: {
              group: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      writtenWorkResults: {
        orderBy: { createdAt: 'desc' },
        include: {
          writtenWork: {
            include: {
              group: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      assignments: {
        where: { isCompleted: false },
        take: 5,
        orderBy: { dueDate: 'asc' },
      },
      payments: {
        where: {
          status: { in: ['PENDING', 'OVERDUE'] },
        },
        take: 5,
      },
    },
  })

  if (!student) return null

  const studentGroupIds = student.enrollments.map((e: any) => e.groupId)

  // 1. Davomat darajasi
  const totalAttendances = student.attendances.filter((a: any) => studentGroupIds.includes(a.groupId)).length
  const presentAttendances = student.attendances.filter((a: any) => a.isPresent && studentGroupIds.includes(a.groupId)).length
  const attendanceRate = totalAttendances > 0
    ? Math.round((presentAttendances / totalAttendances) * 100)
    : 0

  // 2. Uydagi topshiriq (uyga_vazifa testlar)
  const homeworkTests = student.testResults.filter((r: any) => r.test?.type === 'uyga_vazifa' && studentGroupIds.includes(r.test.groupId))
  let homeworkCorrect = 0
  let homeworkTotal = 0
  homeworkTests.forEach((r: any) => {
    homeworkCorrect += r.correctAnswers || 0
    homeworkTotal += r.test?.totalQuestions || 0
  })
  const assignmentRate = homeworkTotal > 0 ? Math.round((homeworkCorrect / homeworkTotal) * 100) : 0

  // 3. O'zlashtirish darajasi (kunlik_test)
  const dailyTests = student.testResults.filter((r: any) => r.test?.type === 'kunlik_test' && studentGroupIds.includes(r.test.groupId))
  let dailyCorrect = 0
  let dailyTotal = 0
  dailyTests.forEach((r: any) => {
    dailyCorrect += r.correctAnswers || 0
    dailyTotal += r.test?.totalQuestions || 0
  })
  const classMastery = dailyTotal > 0 ? Math.round((dailyCorrect / dailyTotal) * 100) : 0

  // 4. O'quvchi qobilyati (eng so'nggi yozma ish)
  const writtenFiltered = student.writtenWorkResults
    .filter((r: any) => r.writtenWork && studentGroupIds.includes(r.writtenWork.groupId))
    .sort((a: any, b: any) => {
      const dateA = a.writtenWork?.date ? new Date(a.writtenWork.date).getTime() : 0
      const dateB = b.writtenWork?.date ? new Date(b.writtenWork.date).getTime() : 0
      return dateB - dateA
    })
  const weeklyWrittenRate = writtenFiltered.length > 0 ? Math.round(writtenFiltered[0].masteryLevel || 0) : 0

  return {
    ...student,
    attendanceRate,
    assignmentRate,
    classMastery,
    weeklyWrittenRate,
  }
}

/**
 * O'quvchi ma'lumotlarini formatlash
 */
function formatStudentInfo(student: any): string {
  const user = student.user
  const group = student.enrollments[0]?.group
  const teacher = group?.teacher?.user?.name || 'Noma\'lum'

  let message = `👤 <b>${user.name}</b>\n\n`

  // Saytdagi 4 ta ko'rsatkich (Daraja va Umumiy ball olib tashlangan)
  message += `📊 <b>Asosiy ko'rsatkichlar:</b>\n`
  message += `📅 Davomat darajasi: ${student.attendanceRate}%\n`
  message += `📖 Uydagi topshiriq: ${student.assignmentRate}%\n`
  message += `⭐ O'zlashtirish darajasi: ${student.classMastery}%\n`
  message += `⚡ O'quvchi qobilyati: ${student.weeklyWrittenRate}%\n\n`

  // Guruh ma'lumotlari
  if (group) {
    message += `📚 <b>Guruh:</b> ${group.name}\n`
    message += `👨‍🏫 O'qituvchi: ${teacher}\n\n`
  }

  // Yaqin testlar
  if (student.testResults.length > 0) {
    message += `📝 <b>Yaqin testlar:</b>\n`
    student.testResults.slice(0, 5).forEach((result: any, index: number) => {
      const percentage = result.test?.totalQuestions
        ? Math.round((result.correctAnswers / result.test.totalQuestions) * 100)
        : 0
      message += `${index + 1}. ${result.test?.title || 'Test'}: ${result.correctAnswers}/${result.test?.totalQuestions || 0} (${percentage}%)\n`
    })
    message += `\n`
  }

  // Yozma ishlar
  if (student.writtenWorkResults.length > 0) {
    message += `✍️ <b>Yozma ishlar:</b>\n`
    student.writtenWorkResults.slice(0, 5).forEach((result: any, index: number) => {
      const percentage = Math.round(result.masteryLevel || 0)
      message += `${index + 1}. ${result.writtenWork?.title || 'Yozma ish'}: ${percentage}%\n`
    })
    message += `\n`
  }

  // Vazifalar
  if (student.assignments.length > 0) {
    message += `📋 <b>Vazifalar (${student.assignments.length}):</b>\n`
    student.assignments.forEach((assignment: any, index: number) => {
      message += `${index + 1}. ${assignment.title}\n`
    })
    message += `\n`
  }

  // Qarzlar
  if (student.payments.length > 0) {
    const totalDebt = student.payments.reduce((sum: number, p: any) => sum + p.amount, 0)
    message += `💰 <b>Qarz:</b> ${totalDebt.toLocaleString()} so'm\n`
  }

  return message
}

/**
 * Asosiy keyboard yaratish (inline keyboard emas, oddiy keyboard)
 */
function createMainKeyboard() {
  return {
    keyboard: [
      [
        { text: '📊 Statistika' },
        { text: '📝 Testlar' },
      ],
      [
        { text: '📅 Davomat' },
        { text: '✍️ Yozma ishlar' },
      ],
      [
        { text: '📋 Vazifalar' },
        { text: '💰 To\'lovlar' },
      ],
      [
        { text: '🔄 Yangilash' },
        { text: '🏠 Bosh sahifa' },
      ],
    ],
    resize_keyboard: true,
  }
}

/**
 * Telefon raqam so'rash keyboard
 */
function createPhoneKeyboard() {
  return {
    keyboard: [
      [
        {
          text: '📱 Telefon raqamni yuborish',
          request_contact: true,
        },
      ],
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Webhook validation
    if (body.update_id === undefined) {
      return NextResponse.json({ ok: true })
    }

    const message = body.message
    const callbackQuery = body.callback_query

    // Callback query (inline keyboard tugmasi bosilganda)
    if (callbackQuery) {
      const chatId = callbackQuery.message.chat.id
      const data = callbackQuery.data
      const userId = callbackQuery.from.id

      // Callback query'ni javob qaytarish
      await fetch(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
        }),
      })

      // Bu yerda callback query'larni qayta ishlash mumkin
      // Hozircha oddiy keyboard ishlatamiz
      
      return NextResponse.json({ ok: true })
    }

    // Message (xabar yuborilganda)
    if (!message) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id
    const text = message.text
    const contact = message.contact

    // /start buyrug'i
    if (text === '/start') {
      const welcomeMessage = `👋 <b>Salom!</b>\n\n` +
        `Bu bot orqali o'z ma'lumotlaringizni ko'rishingiz mumkin.\n\n` +
        `Iltimos, telefon raqamingizni yuboring:`

      await sendMessage(chatId, welcomeMessage, createPhoneKeyboard())
      return NextResponse.json({ ok: true })
    }

    // Telefon raqam yuborilganda
    if (contact) {
      const phoneNumber = contact.phone_number
      const normalizedPhone = normalizePhone(phoneNumber)

      console.log('[Telegram Bot] Telefon raqam:', phoneNumber, 'Normalized:', normalizedPhone)

      // Foydalanuvchini telefon raqam orqali topish
      const user = await findUserByPhone(phoneNumber)

      if (!user || !user.studentProfile) {
        await sendMessage(
          chatId,
          `❌ Telefon raqamingiz tizimda topilmadi.\n\n` +
          `Iltimos, admin bilan bog'laning yoki saytda ro'yxatdan o'ting.\n\n` +
          `Telefon raqam: ${phoneNumber}`
        )
        return NextResponse.json({ ok: true })
      }

      // O'quvchi ma'lumotlarini olish
      const studentData = await getStudentData(user.studentProfile.id)
      
      if (!studentData) {
        await sendMessage(chatId, '❌ Ma\'lumotlar topilmadi.')
        return NextResponse.json({ ok: true })
      }

      // Ma'lumotlarni ko'rsatish
      const infoMessage = formatStudentInfo(studentData)
      await sendMessage(chatId, infoMessage, createMainKeyboard())

      // Session saqlash (keyingi safar telefon raqam so'ramaslik uchun)
      setSession(chatId, user.id, user.studentProfile.id, phoneNumber)

      return NextResponse.json({ ok: true })
    }

    // Tugmalar orqali xabarlar
    if (text) {
      // Session'ni tekshirish
      const session = getSession(chatId)
      
      if (!session) {
        // Session yo'q bo'lsa, telefon raqam so'rash
        await sendMessage(
          chatId,
          `Iltimos, /start buyrug'ini bosing va telefon raqamingizni yuboring.`,
          createPhoneKeyboard()
        )
        return NextResponse.json({ ok: true })
      }

      // Session activity'ni yangilash
      updateSessionActivity(chatId)

      // O'quvchi ma'lumotlarini olish
      const studentData = await getStudentData(session.studentId)
      
      if (!studentData) {
        await sendMessage(chatId, '❌ Ma\'lumotlar topilmadi.')
        deleteSession(chatId)
        return NextResponse.json({ ok: true })
      }

      if (text === '📊 Statistika' || text === '🔄 Yangilash' || text === '🏠 Bosh sahifa') {
        // Asosiy ma'lumotlarni ko'rsatish
        const infoMessage = formatStudentInfo(studentData)
        await sendMessage(chatId, infoMessage, createMainKeyboard())
      } else if (text === '📝 Testlar') {
        // Testlar ro'yxati
        if (studentData.testResults.length === 0) {
          await sendMessage(
            chatId,
            `📝 <b>Testlar</b>\n\n` +
            `Hozircha test natijalari yo'q.`,
            createMainKeyboard()
          )
        } else {
          let message = `📝 <b>Testlar</b>\n\n`
          studentData.testResults.forEach((result: any, index: number) => {
            const percentage = Math.round((result.correctAnswers / result.test.totalQuestions) * 100)
            const date = new Date(result.createdAt).toLocaleDateString('uz-UZ')
            message += `${index + 1}. ${result.test.title || 'Test'}\n`
            message += `   📊 ${result.correctAnswers}/${result.test.totalQuestions} (${percentage}%)\n`
            message += `   📅 ${date}\n\n`
          })
          await sendMessage(chatId, message, createMainKeyboard())
        }
      } else if (text === '📅 Davomat') {
        // Davomat ma'lumotlari
        if (studentData.attendances.length === 0) {
          await sendMessage(
            chatId,
            `📅 <b>Davomat</b>\n\n` +
            `Hozircha davomat ma'lumotlari yo'q.`,
            createMainKeyboard()
          )
        } else {
          let message = `📅 <b>Davomat</b>\n\n`
          message += `📊 Umumiy davomat: ${studentData.attendanceRate}%\n\n`
          message += `📋 <b>Yaqin davomatlar:</b>\n`
          studentData.attendances.slice(0, 10).forEach((attendance: any, index: number) => {
            const date = new Date(attendance.date).toLocaleDateString('uz-UZ')
            const status = attendance.isPresent ? '✅ Keldi' : '❌ Kelmadi'
            message += `${index + 1}. ${date}: ${status}\n`
          })
          await sendMessage(chatId, message, createMainKeyboard())
        }
      } else if (text === '✍️ Yozma ishlar') {
        // Yozma ishlar
        if (studentData.writtenWorkResults.length === 0) {
          await sendMessage(
            chatId,
            `✍️ <b>Yozma ishlar</b>\n\n` +
            `Hozircha yozma ish natijalari yo'q.`,
            createMainKeyboard()
          )
        } else {
          let message = `✍️ <b>Yozma ishlar</b>\n\n`
          studentData.writtenWorkResults.forEach((result: any, index: number) => {
            const percentage = Math.round(result.masteryLevel || 0)
            const date = new Date(result.createdAt).toLocaleDateString('uz-UZ')
            message += `${index + 1}. ${result.writtenWork.title || 'Yozma ish'}\n`
            message += `   📊 ${result.correctAnswers || 0}/${result.writtenWork.totalQuestions || 0} (${percentage}%)\n`
            message += `   📅 ${date}\n\n`
          })
          await sendMessage(chatId, message, createMainKeyboard())
        }
      } else if (text === '📋 Vazifalar') {
        // Vazifalar
        if (studentData.assignments.length === 0) {
          await sendMessage(
            chatId,
            `📋 <b>Vazifalar</b>\n\n` +
            `Hozircha vazifalar yo'q.`,
            createMainKeyboard()
          )
        } else {
          let message = `📋 <b>Vazifalar</b>\n\n`
          studentData.assignments.forEach((assignment: any, index: number) => {
            const dueDate = assignment.dueDate 
              ? new Date(assignment.dueDate).toLocaleDateString('uz-UZ')
              : 'Muddat yo\'q'
            const status = assignment.isCompleted ? '✅' : '⏳'
            message += `${status} ${index + 1}. ${assignment.title}\n`
            message += `   📅 Muddat: ${dueDate}\n`
            if (assignment.score !== null) {
              message += `   📊 Ball: ${assignment.score}/${assignment.maxScore}\n`
            }
            message += `\n`
          })
          await sendMessage(chatId, message, createMainKeyboard())
        }
      } else if (text === '💰 To\'lovlar') {
        // To'lovlar
        if (studentData.payments.length === 0) {
          await sendMessage(
            chatId,
            `💰 <b>To'lovlar</b>\n\n` +
            `Qarzlar yo'q.`,
            createMainKeyboard()
          )
        } else {
          const totalDebt = studentData.payments.reduce((sum: number, p: any) => sum + p.amount, 0)
          let message = `💰 <b>To'lovlar</b>\n\n`
          message += `📊 Jami qarz: ${totalDebt.toLocaleString()} so'm\n\n`
          message += `📋 <b>Qarzlar ro'yxati:</b>\n`
          studentData.payments.forEach((payment: any, index: number) => {
            const dueDate = payment.dueDate 
              ? new Date(payment.dueDate).toLocaleDateString('uz-UZ')
              : 'Muddat yo\'q'
            message += `${index + 1}. ${payment.amount.toLocaleString()} so'm\n`
            message += `   📅 Muddat: ${dueDate}\n`
            message += `   📊 Holat: ${payment.status}\n\n`
          })
          await sendMessage(chatId, message, createMainKeyboard())
        }
      } else {
        await sendMessage(
          chatId,
          `Iltimos, /start buyrug'ini bosing yoki telefon raqamingizni yuboring.`,
          createPhoneKeyboard()
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Telegram Bot] Xatolik:', error)
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 })
  }
}

// GET - Webhook tekshirish uchun
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Telegram Student Bot Webhook',
    status: 'active'
  })
}
