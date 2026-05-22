import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { encryptPassword } from '@/lib/password-export'
import { parseBirthDateInput } from '@/lib/birth-date'
import { normalizeLearningMode } from '@/lib/learning-mode'
import { logActivityForUser } from '@/lib/activity-log'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: studentId } = await params

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            phone: true,
            createdAt: true,
          },
        },
        enrollments: {
          where: { isActive: true },
          include: {
            group: {
              select: {
                id: true,
                name: true,
                subject: { select: { id: true, name: true } },
              },
            },
          },
        },
        grades: {
          orderBy: { createdAt: 'desc' },
          include: {
            group: { select: { id: true, name: true } },
            teacher: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
        testResults: {
          orderBy: { createdAt: 'desc' },
          include: {
            test: {
              select: {
                id: true,
                title: true,
                type: true,
                totalQuestions: true,
                date: true,
                group: { select: { name: true } },
              },
            },
          },
        },
        writtenWorkResults: {
          orderBy: { createdAt: 'desc' },
          include: {
            writtenWork: {
              select: {
                id: true,
                title: true,
                totalQuestions: true,
                date: true,
                timeGiven: true,
                group: { select: { name: true } },
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'O\'quvchi topilmadi' }, { status: 404 })
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error('Error fetching student details:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT - Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: studentId } = await params
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    })
    if (!student) {
      return NextResponse.json({ error: 'O\'quvchi topilmadi' }, { status: 404 })
    }

    const body = await request.json()
    const { name, username, phone, phoneOzi, phoneOnasi, phoneBobosi, password, birthDate, address, schoolClass, school, learningMode } = body
    const p1 = phoneOzi ?? phone ?? ''
    const p2 = phoneOnasi ?? ''
    const p3 = phoneBobosi ?? ''
    const legacy = ["o'zi", 'onasi', "bobosi"] as const
    let labels: [string, string, string] = [...legacy]
    try {
      const prev = student.contacts ? JSON.parse(student.contacts) : []
      if (Array.isArray(prev) && prev.length === 3 && prev.every((x: any) => x && typeof x === 'object')) {
        labels = [
          String(prev[0]?.label || legacy[0]),
          String(prev[1]?.label || legacy[1]),
          String(prev[2]?.label || legacy[2]),
        ]
      }
    } catch (_) {}
    const contactsJson = JSON.stringify([
      { label: labels[0], phone: p1 },
      { label: labels[1], phone: p2 },
      { label: labels[2], phone: p3 },
    ])

    if (!name || !username) {
      return NextResponse.json(
        { error: 'Ism va login majburiy' },
        { status: 400 }
      )
    }

    if (username !== student.user.username) {
      const existing = await prisma.user.findUnique({ where: { username } })
      if (existing) {
        return NextResponse.json({ error: 'Bu login allaqachon mavjud' }, { status: 400 })
      }
    }

    const userUpdate: { name: string; username: string; phone: string | null; learningMode?: 'ONLINE' | 'OFFLINE'; password?: string; passwordExport?: string | null } = {
      name,
      username,
      phone: p1 || null,
    }
    if (learningMode !== undefined) {
      userUpdate.learningMode = normalizeLearningMode(learningMode)
    }
    if (password && password.trim() !== '') {
      userUpdate.password = await bcrypt.hash(password, 10)
      userUpdate.passwordExport = encryptPassword(password)
    }

    await prisma.user.update({
      where: { id: student.userId },
      data: userUpdate,
    })
    const birthDateVal =
      birthDate === undefined
        ? undefined
        : birthDate === null || birthDate === ''
          ? null
          : parseBirthDateInput(birthDate)

    await prisma.student.update({
      where: { id: studentId },
      data: {
        contacts: contactsJson,
        ...(birthDateVal !== undefined && { birthDate: birthDateVal }),
        ...(address !== undefined && { address: address === null || address === '' ? null : String(address) }),
        ...(schoolClass !== undefined && {
          schoolClass: schoolClass === null || schoolClass === '' ? null : String(schoolClass),
        }),
        ...(school !== undefined && { school: school === null || school === '' ? null : String(school) }),
      },
    })

    const updated = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { id: true, name: true, username: true, phone: true } } },
    })

    await logActivityForUser(prisma, currentUser, {
      action: 'UPDATE',
      category: 'student',
      summary: `O'quvchi yangilandi: ${name} (@${username})`,
      entityType: 'student',
      entityId: studentId,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH: Ma'lumotlar yoki faollik (isActive)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: studentId } = await params
    const body = await request.json().catch(() => ({}))

    const hasMalumotlarKeys =
      'contactSlots' in body ||
      'birthDate' in body ||
      'address' in body ||
      'schoolClass' in body ||
      'school' in body ||
      'learningMode' in body

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    })
    if (!student) {
      return NextResponse.json({ error: "O'quvchi topilmadi" }, { status: 404 })
    }

    if (hasMalumotlarKeys) {
      const { contactSlots, birthDate, address, schoolClass, school, learningMode } = body as {
        contactSlots?: { label?: string; phone?: string }[]
        birthDate?: string | null
        address?: string | null
        schoolClass?: string | null
        school?: string | null
        learningMode?: string | null
      }

      const defaultLabels = ["O'quvchi", 'Ota', 'Ona']

      let contactsJson: string | undefined
      if (Array.isArray(contactSlots)) {
        const slots = [0, 1, 2].map((i) => {
          const slot = contactSlots[i]
          const labelRaw =
            slot?.label != null && String(slot.label).trim() !== ''
              ? String(slot.label).trim()
              : defaultLabels[i]
          const phone = slot?.phone != null ? String(slot.phone).trim() : ''
          return { label: labelRaw, phone }
        })
        contactsJson = JSON.stringify(slots)
      }

      const birthDateVal =
        birthDate === undefined
          ? undefined
          : birthDate === null || birthDate === ''
            ? null
            : parseBirthDateInput(birthDate)

      const userPhoneUpdate =
        contactsJson !== undefined
          ? (() => {
              try {
                const arr = JSON.parse(contactsJson)
                const first = arr[0]?.phone?.trim()
                return first !== undefined ? first || null : undefined
              } catch {
                return undefined
              }
            })()
          : undefined

      if (contactsJson !== undefined) {
        await prisma.user.update({
          where: { id: student.userId },
          data: {
            phone: userPhoneUpdate !== undefined ? userPhoneUpdate : undefined,
            ...(learningMode !== undefined && { learningMode: normalizeLearningMode(learningMode) }),
          },
        })
      } else if (learningMode !== undefined) {
        await prisma.user.update({
          where: { id: student.userId },
          data: { learningMode: normalizeLearningMode(learningMode) },
        })
      }

      await prisma.student.update({
        where: { id: studentId },
        data: {
          ...(contactsJson !== undefined && { contacts: contactsJson }),
          ...(birthDateVal !== undefined && { birthDate: birthDateVal }),
          ...(address !== undefined && { address: address === null || address === '' ? null : String(address) }),
          ...(schoolClass !== undefined && {
            schoolClass: schoolClass === null || schoolClass === '' ? null : String(schoolClass),
          }),
          ...(school !== undefined && { school: school === null || school === '' ? null : String(school) }),
        },
      })

      const updated = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: { select: { id: true, name: true, username: true, phone: true } } },
      })
      return NextResponse.json(updated)
    }

    const isActive = body.isActive
    await prisma.user.update({
      where: { id: student.userId },
      data: { isActive: typeof isActive === 'boolean' ? isActive : !student.user.isActive },
    })
    return NextResponse.json({ message: 'Holat yangilandi' })
  } catch (error) {
    console.error('Error in PATCH student:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE - Delete student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: studentId } = await params
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    })
    if (!student) {
      return NextResponse.json({ error: 'O\'quvchi topilmadi' }, { status: 404 })
    }

    await logActivityForUser(prisma, currentUser, {
      action: 'DELETE',
      category: 'student',
      summary: `O'quvchi o'chirildi: ${student.user.name} (@${student.user.username})`,
      entityType: 'student',
      entityId: studentId,
    })

    await prisma.user.delete({ where: { id: student.userId } })
    return NextResponse.json({ message: 'O\'quvchi o\'chirildi' })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
