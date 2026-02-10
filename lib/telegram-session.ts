// Telegram bot session saqlash (memory-based, production'da Redis yoki DB ishlatish mumkin)

interface Session {
  chatId: number
  userId: string
  studentId: string
  phone: string
  lastActivity: Date
}

// Memory-based session storage (production'da Redis yoki database ishlatish tavsiya etiladi)
const sessions = new Map<number, Session>()

// Session cleanup (1 soatdan eski sessionlarni o'chirish)
setInterval(() => {
  const now = new Date()
  for (const [chatId, session] of sessions.entries()) {
    const hoursSinceActivity = (now.getTime() - session.lastActivity.getTime()) / (1000 * 60 * 60)
    if (hoursSinceActivity > 1) {
      sessions.delete(chatId)
    }
  }
}, 60 * 60 * 1000) // Har 1 soatda

export function getSession(chatId: number): Session | null {
  const session = sessions.get(chatId)
  if (!session) return null
  
  // Session eskirgan bo'lsa, o'chirish
  const hoursSinceActivity = (new Date().getTime() - session.lastActivity.getTime()) / (1000 * 60 * 60)
  if (hoursSinceActivity > 1) {
    sessions.delete(chatId)
    return null
  }
  
  return session
}

export function setSession(chatId: number, userId: string, studentId: string, phone: string) {
  sessions.set(chatId, {
    chatId,
    userId,
    studentId,
    phone,
    lastActivity: new Date(),
  })
}

export function updateSessionActivity(chatId: number) {
  const session = sessions.get(chatId)
  if (session) {
    session.lastActivity = new Date()
  }
}

export function deleteSession(chatId: number) {
  sessions.delete(chatId)
}
