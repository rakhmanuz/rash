import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// PUT - Update feedback template
export async function PUT(
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

    const body = await request.json()
    const { metricType, minValue, maxValue, feedbackText } = body

    const updateData: any = {}
    if (metricType !== undefined) updateData.metricType = String(metricType)
    if (minValue !== undefined) updateData.minValue = parseFloat(String(minValue))
    if (maxValue !== undefined) {
      updateData.maxValue = maxValue !== null && maxValue !== undefined 
        ? parseFloat(String(maxValue)) 
        : null
    }
    if (feedbackText !== undefined) updateData.feedbackText = String(feedbackText).trim()

    const template = await prisma.courseFeedbackTemplate.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating feedback template:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE - Delete feedback template
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

    await prisma.courseFeedbackTemplate.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting feedback template:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
