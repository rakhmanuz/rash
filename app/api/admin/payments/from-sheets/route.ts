// Google Sheets'dan to'lovlarni o'qish
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAllPaymentsFromSheets, getPaymentStatsFromSheets } from '@/lib/google-sheets'

// GET - Google Sheets'dan to'lovlarni o'qish
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'payments' yoki 'stats'

    if (type === 'stats') {
      // Statistikalar
      const result = await getPaymentStatsFromSheets()
      
      if (result.success) {
        return NextResponse.json(result.data)
      } else {
        return NextResponse.json(
          { error: result.error || 'Google Sheets dan statistika o\'qishda xatolik' },
          { status: 500 }
        )
      }
    } else {
      // Barcha to'lovlar
      const result = await getAllPaymentsFromSheets()
      
      if (result.success) {
        return NextResponse.json({
          payments: result.data,
          headers: result.headers,
        })
      } else {
        return NextResponse.json(
          { error: result.error || 'Google Sheets dan to\'lovlarni o\'qishda xatolik' },
          { status: 500 }
        )
      }
    }
  } catch (error) {
    console.error('Error reading from Google Sheets:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
