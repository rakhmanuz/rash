import { NextRequest, NextResponse } from 'next/server'

const TELEGRAM_BOT_TOKEN = '8373277453:AAHug96FwXclNsa0QNj5XabTWw_7LUfCl98'
const TELEGRAM_CHAT_ID = '3712822832'
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

export async function GET(request: NextRequest) {
  try {
    const message = `🧪 Test xabar\n\n` +
      `✅ Bot ishlayapti\n` +
      `🕐 Vaqt: ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}\n` +
      `\n📊 Agar bu xabarni ko'rsangiz, bot to'g'ri sozlangan!`

    console.log('[Test] Telegram xabar yuborilmoqda...')
    console.log('[Test] Bot Token:', TELEGRAM_BOT_TOKEN.substring(0, 10) + '...')
    console.log('[Test] Chat ID:', TELEGRAM_CHAT_ID)
    console.log('[Test] API URL:', TELEGRAM_API_URL)

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
    console.log('[Test] Response status:', response.status)
    console.log('[Test] Response body:', responseText)

    if (!response.ok) {
      let errorData: any = {}
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { raw: responseText }
      }

      // Telegram API xatoliklarini tushuntirish
      let errorMessage = 'Xatolik yuz berdi'
      if (errorData.error_code === 400) {
        errorMessage = 'Chat ID noto\'g\'ri yoki bot kanalga qo\'shilmagan'
      } else if (errorData.error_code === 403) {
        errorMessage = 'Bot kanalga admin sifatida qo\'shilmagan yoki "Post messages" huquqi yo\'q'
      } else if (errorData.error_code === 401) {
        errorMessage = 'Bot token noto\'g\'ri'
      }

      return NextResponse.json({ 
        success: false, 
        error: errorMessage,
        error_code: errorData.error_code,
        description: errorData.description,
        details: errorData
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test xabar yuborildi. Telegram kanalni tekshiring.',
      response: JSON.parse(responseText)
    })
  } catch (error: any) {
    console.error('Test xabar yuborishda xatolik:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Xatolik yuz berdi',
      details: error.toString()
    }, { status: 500 })
  }
}
