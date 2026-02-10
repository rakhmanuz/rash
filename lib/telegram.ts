// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = '8373277453:AAHug96FwXclNsa0QNj5XabTWw_7LUfCl98'
const TELEGRAM_CHAT_ID = '-1003712822832' // Kanal ID -100 bilan boshlanadi
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

interface LoginNotificationData {
  username: string
  name: string
  role: string
  loginTime: Date
  ipAddress?: string
}

// Telegram Web App Types
interface TelegramWebApp {
  ready: () => void
  expand: () => void
  close: () => void
  themeParams: {
    bg_color?: string
    text_color?: string
    button_color?: string
    button_text_color?: string
  }
  BackButton: {
    onClick: (callback: () => void) => void
    show: () => void
    hide: () => void
  }
  onEvent: (event: string, callback: () => void) => void
  offEvent: (event: string, callback: () => void) => void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

/**
 * Telegram Web App mavjudligini tekshirish
 */
export function isTelegramWebApp(): boolean {
  if (typeof window === 'undefined') return false
  return typeof window.Telegram !== 'undefined' && 
         typeof window.Telegram.WebApp !== 'undefined'
}

/**
 * Telegram Web App hook
 */
export function useTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null
  if (!isTelegramWebApp()) return null
  return window.Telegram!.WebApp
}

/**
 * Telegram bot orqali xabar yuborish
 */
export async function sendTelegramNotification(data: LoginNotificationData): Promise<void> {
  try {
    console.log('[Telegram] Xabar yuborish boshlandi:', { username: data.username, name: data.name })
    
    const loginTime = new Date(data.loginTime).toLocaleString('uz-UZ', {
      timeZone: 'Asia/Tashkent',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    const roleNames: { [key: string]: string } = {
      ADMIN: 'Admin',
      MANAGER: 'Manager',
      TEACHER: 'O\'qituvchi',
      STUDENT: 'O\'quvchi',
      ASSISTANT_ADMIN: 'Yordamchi Admin',
    }

    const roleName = roleNames[data.role] || data.role

    let message = `🔐 Yangi kirish\n\n` +
      `👤 Foydalanuvchi: ${data.name}\n` +
      `📝 Login: ${data.username}\n` +
      `🎭 Role: ${roleName}\n` +
      `🕐 Vaqt: ${loginTime}\n`
    
    if (data.ipAddress) {
      message += `🌐 IP: ${data.ipAddress}\n`
    }
    
    message += `\n✅ Bu akkauntga kirildi`

    console.log('[Telegram] API URL:', TELEGRAM_API_URL)
    console.log('[Telegram] Chat ID:', TELEGRAM_CHAT_ID)
    console.log('[Telegram] Xabar:', message)

    const response = await fetch(TELEGRAM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID, // String yoki number bo'lishi mumkin
        text: message,
      }),
    })

    const responseText = await response.text()
    console.log('[Telegram] Response status:', response.status)
    console.log('[Telegram] Response body:', responseText)

    if (!response.ok) {
      let errorData: any = {}
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { raw: responseText }
      }
      
      // Xatolik turlarini aniqlash
      let errorMessage = `Telegram API xatolik: ${response.status}`
      if (errorData.error_code === 400) {
        if (errorData.description?.includes('chat not found')) {
          errorMessage = 'Chat topilmadi - Chat ID noto\'g\'ri yoki bot kanalga qo\'shilmagan'
        } else if (errorData.description?.includes('chat_id')) {
          errorMessage = 'Chat ID noto\'g\'ri format'
        }
      } else if (errorData.error_code === 403) {
        if (errorData.description?.includes('bot was blocked')) {
          errorMessage = 'Bot bloklangan yoki kanaldan chiqarilgan'
        } else if (errorData.description?.includes('not enough rights')) {
          errorMessage = 'Bot\'ga "Post messages" huquqi berilmagan'
        } else if (errorData.description?.includes('not a member')) {
          errorMessage = 'Bot kanalga qo\'shilmagan'
        }
      } else if (errorData.error_code === 401) {
        errorMessage = 'Bot token noto\'g\'ri yoki bot o\'chirilgan'
      }
      
      console.error('[Telegram] Xatolik:', {
        status: response.status,
        statusText: response.statusText,
        error_code: errorData.error_code,
        description: errorData.description,
        error: errorData,
        message: errorMessage,
      })
      throw new Error(errorMessage)
    }

    console.log('[Telegram] Xabar muvaffaqiyatli yuborildi')
  } catch (error) {
    console.error('[Telegram] Xabar yuborishda xatolik:', error)
    // Xatolik bo'lsa ham login jarayonini to'xtatmaymiz
    throw error // Re-throw qilamiz, lekin authorize funksiyasida catch qilinadi
  }
}
