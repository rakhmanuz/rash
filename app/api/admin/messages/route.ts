import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get all messages
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
    const recipientRole = searchParams.get('recipientRole')

    const messages = await prisma.message.findMany({
      where: {
        senderId: session.user.id,
        ...(recipientRole && { recipientRole }),
      },
      include: {
        recipient: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Send message
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { title, content, recipientRole, recipientId } = body

    if (!title || !content || !recipientRole) {
      return NextResponse.json(
        { error: 'Sarlavha, matn va qabul qiluvchi kerak' },
        { status: 400 }
      )
    }

    // If specific recipient is provided
    if (recipientId) {
      const message = await prisma.message.create({
        data: {
          senderId: session.user.id,
          recipientId,
          recipientRole,
          title,
          content,
        },
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      })

      return NextResponse.json(message, { status: 201 })
    }

    // If sending to all users with specific role
    const users = await prisma.user.findMany({
      where: {
        role: recipientRole,
        isActive: true,
      },
    })

    const messages = await Promise.all(
      users.map(user =>
        prisma.message.create({
          data: {
            senderId: session.user.id,
            recipientId: user.id,
            recipientRole,
            title,
            content,
          },
        })
      )
    )

    return NextResponse.json(
      { message: `${messages.length} ta xabar yuborildi`, count: messages.length },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
