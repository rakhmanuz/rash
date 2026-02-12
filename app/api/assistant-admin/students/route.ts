import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { generateNextStudentId } from '@/lib/student-id-generator'
import { hasSectionAccess } from '@/lib/permissions'

function sanitizePhone(raw: string): string {
  return raw.replace(/[^\d+]/g, '').trim()
}

function normalizeAndValidateContacts(contacts: any) {
  if (!Array.isArray(contacts) || contacts.length !== 3) {
    return { error: '3 ta telefon bloki to‘ldirilishi kerak' }
  }

  const normalizedContacts = contacts.map((c: any) => ({
    label: String(c?.label || '').trim(),
    phone: sanitizePhone(String(c?.phone || '')),
  }))

  const validPhones = normalizedContacts.filter((c: any) => c.phone)
  if (validPhones.length < 2) {
    return { error: 'Kamida 2 ta telefon raqam kiritilishi shart' }
  }

  for (const contact of validPhones) {
    if (!contact.label) {
      return { error: 'Har bir telefon uchun kimligi (ota/ona/bobo...) kiritilishi kerak' }
    }
  }

  return { normalizedContacts, validPhones }
}

function safeParseContacts(raw: string | null | undefined) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// GET - Get all students (limited info for assistant admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || user.role !== 'ASSISTANT_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const canViewStudents = await hasSectionAccess(user.id, user.role, 'students', 'view')
    if (!canViewStudents) {
      return NextResponse.json({ error: "Sizda o'quvchilarni ko'rish ruxsati yo'q" }, { status: 403 })
    }

    const students = await prisma.student.findMany({
      take: 5, // Faqat oxirgi 5 ta o'quvchi
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            phone: true,
          },
        },
        enrollments: {
          where: { isActive: true },
          select: {
            id: true,
            groupId: true,
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Format students with currentGroupId and groupName
    const formattedStudents = students.map((student) => {
      const enrollment = student.enrollments.length > 0 ? student.enrollments[0] : null
      
      return {
        id: student.id,
        studentId: student.studentId,
        contacts: safeParseContacts(student.contacts),
        createdAt: student.createdAt,
        user: student.user,
        currentGroupId: enrollment?.groupId,
        currentGroupName: enrollment?.group?.name,
      }
    })

    return NextResponse.json(formattedStudents)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Create new student
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || user.role !== 'ASSISTANT_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const canCreateStudents = await hasSectionAccess(user.id, user.role, 'students', 'create')
    if (!canCreateStudents) {
      return NextResponse.json({ error: "Sizda o'quvchi qo'shish ruxsati yo'q" }, { status: 403 })
    }

    const body = await request.json()
    const { fullName, contacts } = body

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json(
        { error: 'Ism familya majburiy maydon' },
        { status: 400 }
      )
    }

    const validation = normalizeAndValidateContacts(contacts)
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { normalizedContacts, validPhones } = validation

    // Create user and student
    const finalStudentId = await generateNextStudentId()
    const generatedUsername = finalStudentId
    const generatedPassword = Math.random().toString(36).slice(-8)

    const hashedPassword = await bcrypt.hash(generatedPassword, 10)

    const newUser = await prisma.user.create({
      data: {
        name: fullName.trim(),
        username: generatedUsername,
        phone: validPhones[0]?.phone || null,
        password: hashedPassword,
        role: 'STUDENT',
        isActive: true,
        studentProfile: {
          create: {
            studentId: finalStudentId,
            contacts: JSON.stringify(normalizedContacts),
            level: 1,
            totalScore: 0,
            attendanceRate: 0,
            masteryLevel: 0,
          },
        },
      },
      include: {
        studentProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(
      {
        student: newUser.studentProfile,
        credentials: {
          username: generatedUsername,
          password: generatedPassword,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT - Update existing student (name + contacts)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || user.role !== 'ASSISTANT_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const canEditStudents = await hasSectionAccess(user.id, user.role, 'students', 'edit')
    if (!canEditStudents) {
      return NextResponse.json({ error: "Sizda o'quvchini tahrirlash ruxsati yo'q" }, { status: 403 })
    }

    const body = await request.json()
    const { studentId, fullName, contacts } = body || {}

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID majburiy' }, { status: 400 })
    }
    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json({ error: 'Ism familya majburiy maydon' }, { status: 400 })
    }

    const validation = normalizeAndValidateContacts(contacts)
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { normalizedContacts, validPhones } = validation

    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    })

    if (!existingStudent) {
      return NextResponse.json({ error: 'O\'quvchi topilmadi' }, { status: 404 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: existingStudent.userId },
      data: {
        name: fullName.trim(),
        phone: validPhones[0]?.phone || null,
      },
    })

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        contacts: JSON.stringify(normalizedContacts),
      },
      include: {
        enrollments: {
          where: { isActive: true },
          select: {
            groupId: true,
            group: {
              select: { name: true },
            },
          },
        },
      },
    })

    const enrollment = updatedStudent.enrollments[0]
    return NextResponse.json({
      id: updatedStudent.id,
      studentId: updatedStudent.studentId,
      contacts: safeParseContacts(updatedStudent.contacts),
      createdAt: updatedStudent.createdAt,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        phone: updatedUser.phone,
      },
      currentGroupId: enrollment?.groupId,
      currentGroupName: enrollment?.group?.name,
    })
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
