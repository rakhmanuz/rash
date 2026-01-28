import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get single test
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        results: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    return NextResponse.json(test)
  } catch (error) {
    console.error('Error fetching test:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE - Delete test
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await prisma.test.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Test deleted' })
  } catch (error) {
    console.error('Error deleting test:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
