import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendTelegramNotification } from '@/lib/telegram'

/**
 * IP manzilni olish
 */
function getClientIP(request: NextRequest): string {
  // X-Forwarded-For header'dan IP olish (proxy/load balancer orqali)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded.split(',')
    return ips[0].trim()
  }
  
  // X-Real-IP header'dan IP olish
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }
  
  // Request IP'dan olish
  const ip = request.ip || request.headers.get('x-vercel-forwarded-for')
  if (ip) {
    return ip
  }
  
  return 'Noma\'lum'
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ipAddress = getClientIP(request)
    
    // Telegram'ga xabar yuborish
    await sendTelegramNotification({
      username: session.user.username || 'Noma\'lum',
      name: session.user.name || 'Noma\'lum',
      role: session.user.role || 'Noma\'lum',
      loginTime: new Date(),
      ipAddress: ipAddress,
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Xabar yuborildi' 
    })
  } catch (error: any) {
    console.error('Login notification xatolik:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Xatolik yuz berdi'
    }, { status: 500 })
  }
}
