import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAssistantAdminPermissions } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = await getAssistantAdminPermissions(session.user.id)

    if (!permissions) {
      return NextResponse.json({ error: 'Not an assistant admin' }, { status: 403 })
    }

    return NextResponse.json(permissions)
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
