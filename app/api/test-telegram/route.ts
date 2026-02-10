import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramNotification } from '@/lib/telegram'

export async function GET(request: NextRequest) {
  try {
    // Test xabar yuborish
    await sendTelegramNotification({
      username: 'test_user',
      name: 'Test Foydalanuvchi',
      role: 'ADMIN',
      loginTime: new Date(),
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Test xabar yuborildi. Telegram kanalni tekshiring.' 
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
