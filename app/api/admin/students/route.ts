import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { encryptPassword } from '@/lib/password-export'
import { dateToYmd, parseBirthDateInput } from '@/lib/birth-date'
import { parseStudentContacts } from '@/lib/student-contacts'
import { isValidFiveDigitStudentId } from '@/lib/student-id-generator'
import { normalizeLearningMode } from '@/lib/learning-mode'

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
    const mode = searchParams.get('mode')
    const userModeWhere =
      mode === 'online'
        ? { learningMode: 'ONLINE' as const }
        : mode === 'offline'
          ? { learningMode: 'OFFLINE' as const }
          : null

    const userSelect = {
      id: true,
      name: true,
      username: true,
      phone: true,
      isActive: true,
      createdAt: true,
      learningMode: true,
    } as const

    const orderBy = [{ createdAt: 'desc' as const }, { id: 'desc' as const }]

    let students: unknown[]
    if (!includeEnrollment) {
      students = (await prisma.student.findMany({
        where: userModeWhere ? { user: userModeWhere } : undefined,
        include: {
          user: { select: userSelect },
          enrollments: false,
        },
        orderBy,
      })) as unknown[]
    } else {
      try {
        students = (await prisma.student.findMany({
          where: userModeWhere ? { user: userModeWhere } : undefined,
          include: {
            user: { select: userSelect },
            enrollments: {
              where: { isActive: true },
              select: {
                id: true,
                groupId: true,
                enrolledAt: true,
                group: {
                  select: {
                    id: true,
                    name: true,
                    subject: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
          orderBy,
        })) as unknown[]
      } catch (loadErr) {
        // Eski DB / generate qilinmagan client: Subject yoki bog'lanish yo'q bo'lsa ham o'quvchilar qaytishi kerak
        console.warn(
          '[admin/students GET] enrollments+subject include failed, retrying without subject:',
          loadErr
        )
        students = (await prisma.student.findMany({
          where: userModeWhere ? { user: userModeWhere } : undefined,
          include: {
            user: { select: userSelect },
            enrollments: {
              where: { isActive: true },
              select: {
                id: true,
                groupId: true,
                enrolledAt: true,
                group: { select: { id: true, name: true } },
              },
            },
          },
          orderBy,
        })) as unknown[]
      }
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
      birthDate: Date | null
      address: string | null
      schoolClass: string | null
      school: string | null
      createdAt: Date
      enrollments: {
        groupId: string
        enrolledAt?: Date
        group?: {
          id: string
          name: string
          subject?: { id: string; name: string } | null
        } | null
      }[]
    }
    const formattedStudents = (students as StudentRow[]).map((student) => {
      const rawEnrollments = Array.isArray(student.enrollments) ? student.enrollments : []
      const activeSorted =
        includeEnrollment && rawEnrollments.length > 0
          ? [...rawEnrollments].sort((a, b) => {
              const an = a.group?.name || ''
              const bn = b.group?.name || ''
              return an.localeCompare(bn, 'uz')
            })
          : []
      const primary = activeSorted[0] ?? null
      const contactsList = parseStudentContacts(student.contacts, student.user.phone ?? null)

      return {
        id: student.id,
        studentId: student.studentId,
        user: {
          ...student.user,
          contacts: contactsList,
          learningMode: normalizeLearningMode((student.user as { learningMode?: string | null }).learningMode),
        },
        level: student.level,
        totalScore: student.totalScore,
        attendanceRate: student.attendanceRate,
        masteryLevel: student.masteryLevel,
        birthDate: student.birthDate ? dateToYmd(student.birthDate) : null,
        address: student.address,
        schoolClass: student.schoolClass,
        school: student.school,
        currentGroupId: primary?.groupId,
        currentGroupName: primary?.group?.name,
        enrollments: includeEnrollment
          ? activeSorted.map((e) => ({
              groupId: e.groupId,
              groupName: e.group?.name ?? '',
              subjectId: e.group?.subject?.id ?? null,
              subjectName: e.group?.subject?.name ?? null,
              enrolledAt: e.enrolledAt?.toISOString?.() ?? null,
            }))
          : [],
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
    const { name, username, phone, password, studentId, phoneOzi, phoneOnasi, phoneBobosi, birthDate, address, schoolClass, school, learningMode } = body
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

    const trimmedStudentId = studentId != null ? String(studentId).trim() : ''
    if (!trimmedStudentId) {
      return NextResponse.json(
        { error: 'O\'quvchi ID majburiy' },
        { status: 400 }
      )
    }

    if (!isValidFiveDigitStudentId(trimmedStudentId)) {
      return NextResponse.json(
        { error: 'O\'quvchi ID aynan 5 ta raqam bo\'lishi kerak (10000 dan 99999 gacha)' },
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

    const existingStudentById = await prisma.student.findUnique({
      where: { studentId: trimmedStudentId },
    })

    if (existingStudentById) {
      return NextResponse.json(
        { error: 'Bu o\'quvchi ID allaqachon mavjud' },
        { status: 400 }
      )
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
        learningMode: normalizeLearningMode(learningMode),
        isActive: true,
        studentProfile: {
          create: {
            studentId: trimmedStudentId,
            level: 1,
            totalScore: 0,
            attendanceRate: 0,
            masteryLevel: 0,
            contacts: contactsJson,
            birthDate: parseBirthDateInput(birthDate),
            address: address != null && String(address).trim() !== '' ? String(address).trim() : null,
            schoolClass: schoolClass != null && String(schoolClass).trim() !== '' ? String(schoolClass).trim() : null,
            school: school != null && String(school).trim() !== '' ? String(school).trim() : null,
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
