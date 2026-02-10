import { NextRequest, NextResponse } from 'next/server'

const TELEGRAM_BOT_TOKEN = '8373277453:AAHug96FwXclNsa0QNj5XabTWw_7LUfCl98'
const TELEGRAM_CHAT_ID = '-1003712822832'

/**
 * Bot ma'lumotlarini olish
 */
async function getBotInfo() {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`)
    const data = await response.json()
    return data
  } catch (error) {
    return { ok: false, error: error }
  }
}

/**
 * Chat ma'lumotlarini olish
 */
async function getChatInfo() {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat?chat_id=${TELEGRAM_CHAT_ID}`)
    const data = await response.json()
    return data
  } catch (error) {
    return { ok: false, error: error }
  }
}

/**
 * Chat a'zolarini olish (bot a'zo ekanligini tekshirish)
 */
async function getChatMember() {
  try {
    const botInfo = await getBotInfo()
    if (!botInfo.ok || !botInfo.result) {
      return { ok: false, error: 'Bot ma\'lumotlarini olishda xatolik' }
    }
    
    const botId = botInfo.result.id
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember?chat_id=${TELEGRAM_CHAT_ID}&user_id=${botId}`)
    const data = await response.json()
    return data
  } catch (error) {
    return { ok: false, error: error }
  }
}

/**
 * Test xabar yuborish
 */
async function sendTestMessage() {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: '🧪 Test xabar - Bot ishlayapti',
      }),
    })
    const data = await response.json()
    return data
  } catch (error) {
    return { ok: false, error: error }
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('[Telegram Check] Bot sozlamalarini tekshirish boshlandi...')
    
    const [botInfo, chatInfo, chatMember, testMessage] = await Promise.all([
      getBotInfo(),
      getChatInfo(),
      getChatMember(),
      sendTestMessage(),
    ])

    const result = {
      bot_info: botInfo,
      chat_info: chatInfo,
      chat_member: chatMember,
      test_message: testMessage,
      summary: {
        bot_valid: botInfo.ok === true,
        chat_exists: chatInfo.ok === true,
        bot_is_member: chatMember.ok === true && chatMember.result?.status !== 'left' && chatMember.result?.status !== 'kicked',
        bot_is_admin: chatMember.ok === true && (chatMember.result?.status === 'administrator' || chatMember.result?.status === 'creator'),
        can_post_messages: chatMember.ok === true && chatMember.result?.can_post_messages === true,
        test_successful: testMessage.ok === true,
      },
      recommendations: [] as string[],
    }

    // Tavsiyalar
    if (!result.summary.bot_valid) {
      result.recommendations.push('❌ Bot token noto\'g\'ri yoki bot o\'chirilgan')
    }
    if (!result.summary.chat_exists) {
      result.recommendations.push('❌ Chat ID noto\'g\'ri yoki kanal topilmadi')
    }
    if (!result.summary.bot_is_member) {
      result.recommendations.push('⚠️ Bot kanalga qo\'shilmagan yoki kanaldan chiqarilgan')
    }
    if (!result.summary.bot_is_admin) {
      result.recommendations.push('⚠️ Bot kanalga admin sifatida qo\'shilmagan')
    }
    if (!result.summary.can_post_messages) {
      result.recommendations.push('⚠️ Bot\'ga "Post messages" huquqi berilmagan')
    }
    if (!result.summary.test_successful) {
      result.recommendations.push('❌ Test xabar yuborishda xatolik')
    }
    if (result.summary.test_successful) {
      result.recommendations.push('✅ Bot to\'g\'ri sozlangan va ishlayapti!')
    }

    return NextResponse.json(result, {
      status: result.summary.test_successful ? 200 : 500,
    })
  } catch (error: any) {
    console.error('[Telegram Check] Xatolik:', error)
    return NextResponse.json({
      error: error.message || 'Xatolik yuz berdi',
      details: error.toString(),
    }, { status: 500 })
  }
}
