/**
 * Server ishga tushganda Telegram'ga sinov xabari yuborish
 */

const TELEGRAM_BOT_TOKEN = '8373277453:AAHug96FwXclNsa0QNj5XabTWw_7LUfCl98'
const TELEGRAM_CHAT_ID = '3712822832'
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

async function sendStartupNotification() {
  try {
    const now = new Date().toLocaleString('uz-UZ', {
      timeZone: 'Asia/Tashkent',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    const message = `🚀 Server ishga tushdi\n\n` +
      `✅ Bot ishlayapti\n` +
      `🕐 Vaqt: ${now}\n` +
      `🌐 URL: https://rash.uz\n` +
      `\n📊 Server muvaffaqiyatli yuklandi va ishga tushdi!`

    console.log('[Startup] Telegram xabar yuborilmoqda...')

    const response = await fetch(TELEGRAM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      }),
    })

    const responseText = await response.text()
    
    if (!response.ok) {
      let errorData = {}
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { raw: responseText }
      }
      console.error('[Startup] Telegram xabar yuborishda xatolik:', {
        status: response.status,
        error: errorData,
      })
      return false
    }

    console.log('[Startup] ✅ Telegram xabar muvaffaqiyatli yuborildi')
    return true
  } catch (error) {
    console.error('[Startup] Telegram xabar yuborishda xatolik:', error)
    return false
  }
}

// Agar to'g'ridan-to'g'ri ishga tushirilsa
if (require.main === module) {
  sendStartupNotification()
    .then((success) => {
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error('Xatolik:', error)
      process.exit(1)
    })
}

module.exports = { sendStartupNotification }
