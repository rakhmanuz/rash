// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = '8373277453:AAHug96FwXclNsa0QNj5XabTWw_7LUfCl98'
const TELEGRAM_CHAT_ID = '3712822832'
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

interface LoginNotificationData {
  username: string
  name: string
  role: string
  loginTime: Date
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

    const message = `🔐 Yangi kirish\n\n` +
      `👤 Foydalanuvchi: ${data.name}\n` +
      `📝 Login: ${data.username}\n` +
      `🎭 Role: ${roleName}\n` +
      `🕐 Vaqt: ${loginTime}\n` +
      `\n✅ Bu akkauntga kirildi`

    const response = await fetch(TELEGRAM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: parseInt(TELEGRAM_CHAT_ID),
        text: message,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Telegram xabar yuborishda xatolik:', errorData)
      // Xatolik bo'lsa ham login jarayonini to'xtatmaymiz
    }
  } catch (error) {
    console.error('Telegram xabar yuborishda xatolik:', error)
    // Xatolik bo'lsa ham login jarayonini to'xtatmaymiz
  }
}
