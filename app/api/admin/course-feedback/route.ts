import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get all feedback templates
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

    const templates = await prisma.courseFeedbackTemplate.findMany({
      orderBy: [
        { metricType: 'asc' },
        { minValue: 'asc' },
      ],
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching feedback templates:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Create feedback template
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
    const { metricType, minValue, maxValue, feedbackText } = body

    if (!metricType || minValue === undefined || !feedbackText) {
      return NextResponse.json(
        { error: 'metricType, minValue va feedbackText kerak' },
        { status: 400 }
      )
    }

    const template = await prisma.courseFeedbackTemplate.create({
      data: {
        metricType: String(metricType),
        minValue: parseFloat(String(minValue)),
        maxValue: maxValue !== null && maxValue !== undefined ? parseFloat(String(maxValue)) : null,
        feedbackText: String(feedbackText).trim(),
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating feedback template:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
