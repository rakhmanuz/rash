import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { generateNextStudentId } from '@/lib/student-id-generator'
import { encryptPassword } from '@/lib/password-export'

// GET - Get all students
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
    const includeEnrollment = searchParams.get('includeEnrollment') === 'true'

    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        },
        enrollments: includeEnrollment
          ? {
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
            }
          : false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Format students with currentGroupId, groupName, contacts (o'zi, onasi, bobosi)
    const parseContacts = (contacts: string | null, userPhone: string | null) => {
      const labels = ["o'zi", 'onasi', "bobosi"] as const
      try {
        const arr = contacts ? JSON.parse(contacts) : []
        if (Array.isArray(arr) && arr.length > 0) {
          return labels.map(label => {
            const found = arr.find((x: any) => x?.label === label)
            return { label, phone: found?.phone || '' }
          })
        }
      } catch (_) {}
      return labels.map((label, i) => ({
        label,
        phone: i === 0 && userPhone ? userPhone : ''
      }))
    }

    type StudentRow = {
      id: string
      studentId: string | null
      user: { phone?: string | null; [key: string]: unknown }
      level: number
      totalScore: number | null
      attendanceRate: number | null
      masteryLevel: number | null
      contacts: string | null
      createdAt: Date
      enrollments: { groupId: string; group?: { id: string; name: string } | null }[]
    }
    const formattedStudents = students.map((student: StudentRow) => {
      const enrollment = includeEnrollment && student.enrollments.length > 0 
        ? student.enrollments[0] as { groupId: string; group?: { id: string; name: string } | null }
        : null
      const contactsList = parseContacts(student.contacts, student.user.phone ?? null)
      
      return {
        id: student.id,
        studentId: student.studentId,
        user: { ...student.user, contacts: contactsList },
        level: student.level,
        totalScore: student.totalScore,
        attendanceRate: student.attendanceRate,
        masteryLevel: student.masteryLevel,
        currentGroupId: enrollment?.groupId,
        currentGroupName: enrollment?.group?.name,
        createdAt: student.createdAt,
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

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, username, phone, password, studentId, phoneOzi, phoneOnasi, phoneBobosi } = body
    const p1 = phoneOzi ?? phone ?? ''
    const p2 = phoneOnasi ?? ''
    const p3 = phoneBobosi ?? ''
    const contactsJson = JSON.stringify([
      { label: "o'zi", phone: p1 },
      { label: 'onasi', phone: p2 },
      { label: "bobosi", phone: p3 },
    ])

    if (!name || !username || !password) {
      return NextResponse.json(
        { error: 'Ism, login va parol majburiy maydonlar' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu login allaqachon mavjud' },
        { status: 400 }
      )
    }

    // Avtomatik studentId generatsiya qilish (agar berilmagan bo'lsa)
    let finalStudentId = studentId
    if (!finalStudentId || finalStudentId.trim() === '') {
      finalStudentId = await generateNextStudentId()
    } else {
      // Agar studentId berilgan bo'lsa, uning mavjudligini tekshirish
      const existingStudent = await prisma.student.findUnique({
        where: { studentId: finalStudentId },
      })

      if (existingStudent) {
        return NextResponse.json(
          { error: 'Bu o\'quvchi ID allaqachon mavjud' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    const passwordExport = encryptPassword(password)

    // Create user and student
    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        phone: p1 || null,
        password: hashedPassword,
        passwordExport,
        role: 'STUDENT',
        isActive: true,
        studentProfile: {
          create: {
            studentId: finalStudentId,
            level: 1,
            totalScore: 0,
            attendanceRate: 0,
            masteryLevel: 0,
            contacts: contactsJson,
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

    return NextResponse.json(newUser.studentProfile, { status: 201 })
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
