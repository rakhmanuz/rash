/**
 * Server ishga tushganda Telegram'ga sinov xabari yuborish
 */

const https = require('https')
const { URL } = require('url')

const TELEGRAM_BOT_TOKEN = '8373277453:AAHug96FwXclNsa0QNj5XabTWw_7LUfCl98'
const TELEGRAM_CHAT_ID = '-1003712822832' // Kanal ID -100 bilan boshlanadi
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

function sendStartupNotification() {
  return new Promise((resolve, reject) => {
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

      const url = new URL(TELEGRAM_API_URL)
      const postData = JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      })

      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      }

      const req = https.request(options, (res) => {
        let responseData = ''

        res.on('data', (chunk) => {
          responseData += chunk
        })

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('[Startup] ✅ Telegram xabar muvaffaqiyatli yuborildi')
            resolve(true)
          } else {
            let errorData = {}
            try {
              errorData = JSON.parse(responseData)
            } catch {
              errorData = { raw: responseData }
            }
            console.error('[Startup] Telegram xabar yuborishda xatolik:', {
              status: res.statusCode,
              error: errorData,
            })
            resolve(false)
          }
        })
      })

      req.on('error', (error) => {
        console.error('[Startup] Telegram xabar yuborishda xatolik:', error)
        resolve(false)
      })

      req.write(postData)
      req.end()
    } catch (error) {
      console.error('[Startup] Telegram xabar yuborishda xatolik:', error)
      resolve(false)
    }
  })
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
