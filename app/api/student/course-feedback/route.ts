import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get feedback for student based on their stats
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const attendanceRate = parseFloat(searchParams.get('attendanceRate') || '0')
    const assignmentRate = parseFloat(searchParams.get('assignmentRate') || '0')
    const mastery = parseFloat(searchParams.get('mastery') || '0')
    const ability = parseFloat(searchParams.get('ability') || '0')

    // Get all templates
    const templates = await prisma.courseFeedbackTemplate.findMany({
      orderBy: [
        { metricType: 'asc' },
        { minValue: 'asc' },
      ],
    })

    // Generate feedbacks based on student stats
    const feedbacks: string[] = []

    // Attendance feedback
    const attendanceTemplates = templates.filter(t => t.metricType === 'attendance')
    const attendanceFeedback = attendanceTemplates.find(t => {
      if (t.maxValue !== null) {
        return attendanceRate >= t.minValue && attendanceRate <= t.maxValue
      }
      return attendanceRate >= t.minValue
    })
    if (attendanceFeedback) {
      feedbacks.push(attendanceFeedback.feedbackText)
    }

    // Assignment feedback
    const assignmentTemplates = templates.filter(t => t.metricType === 'assignment')
    const assignmentFeedback = assignmentTemplates.find(t => {
      if (t.maxValue !== null) {
        return assignmentRate >= t.minValue && assignmentRate <= t.maxValue
      }
      return assignmentRate >= t.minValue
    })
    if (assignmentFeedback) {
      feedbacks.push(assignmentFeedback.feedbackText)
    }

    // Mastery feedback
    const masteryTemplates = templates.filter(t => t.metricType === 'mastery')
    const masteryFeedback = masteryTemplates.find(t => {
      if (t.maxValue !== null) {
        return mastery >= t.minValue && mastery <= t.maxValue
      }
      return mastery >= t.minValue
    })
    if (masteryFeedback) {
      feedbacks.push(masteryFeedback.feedbackText)
    }

    // Ability feedback
    const abilityTemplates = templates.filter(t => t.metricType === 'ability')
    const abilityFeedback = abilityTemplates.find(t => {
      if (t.maxValue !== null) {
        return ability >= t.minValue && ability <= t.maxValue
      }
      return ability >= t.minValue
    })
    if (abilityFeedback) {
      feedbacks.push(abilityFeedback.feedbackText)
    }

    return NextResponse.json({ feedbacks })
  } catch (error) {
    console.error('Error generating feedback:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
