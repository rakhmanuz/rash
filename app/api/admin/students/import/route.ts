import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import * as XLSX from 'xlsx'
import { generateNextStudentId } from '@/lib/student-id-generator'

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

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Excel fayl yuklanmadi' },
        { status: 400 }
      )
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    if (data.length < 2) {
      return NextResponse.json(
        { error: 'Excel fayl bo\'sh yoki noto\'g\'ri formatda' },
        { status: 400 }
      )
    }

    // Skip header row
    const rows = data.slice(1)

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      
      // Skip empty rows
      if (!row || row.length === 0 || !row[0]) {
        continue
      }

      try {
        const name = String(row[0] || '').trim()
        const username = String(row[1] || '').trim()
        const phone = row[2] ? String(row[2]).trim() : ''
        const password = String(row[3] || '').trim()
        const studentId = row[4] ? String(row[4]).trim() : ''
        const groupName = row[5] ? String(row[5]).trim() : ''

        // Validation
        if (!name || !username || !password) {
          results.failed++
          results.errors.push(`Qator ${i + 2}: Ism, login va parol majburiy maydonlar`)
          continue
        }

        // Avtomatik studentId generatsiya qilish (agar berilmagan bo'lsa)
        let finalStudentId = studentId
        if (!finalStudentId || finalStudentId.trim() === '') {
          finalStudentId = await generateNextStudentId()
        }

        // Check if username already exists (only active users)
        const existingUser = await prisma.user.findUnique({
          where: { username },
        })

        if (existingUser && existingUser.isActive) {
          results.failed++
          results.errors.push(`Qator ${i + 2}: Login "${username}" allaqachon mavjud`)
          continue
        }

        // Check if studentId already exists (only active students)
        const existingStudent = await prisma.student.findUnique({
          where: { studentId: finalStudentId },
          include: { user: true },
        })

        if (existingStudent && existingStudent.user.isActive) {
          results.failed++
          results.errors.push(`Qator ${i + 2}: O'quvchi ID "${finalStudentId}" allaqachon mavjud`)
          continue
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user and student
        const newUser = await prisma.user.create({
          data: {
            name,
            username,
            phone: phone || null,
            password: hashedPassword,
            role: 'STUDENT',
            isActive: true,
            studentProfile: {
              create: {
                studentId: finalStudentId,
                level: 1,
                totalScore: 0,
                attendanceRate: 0,
                masteryLevel: 0,
              },
            },
          },
          include: {
            studentProfile: true,
          },
        })

        // If group name is provided, enroll student to group
        if (groupName && newUser.studentProfile) {
          try {
            // Find group by name
            const group = await prisma.group.findFirst({
              where: {
                name: groupName,
                isActive: true,
              },
            })

            if (group) {
              // Check if group is full
              const enrollmentCount = await prisma.enrollment.count({
                where: {
                  groupId: group.id,
                  isActive: true,
                },
              })

              if (enrollmentCount >= group.maxStudents) {
                results.errors.push(`Qator ${i + 2}: Guruh "${groupName}" to'ldi, o'quvchi yaratildi lekin guruhga biriktirilmadi`)
              } else {
                // Check if student is already enrolled in another active group
                const activeEnrollment = await prisma.enrollment.findFirst({
                  where: {
                    studentId: newUser.studentProfile.id,
                    isActive: true,
                  },
                })

                if (activeEnrollment) {
                  // Deactivate old enrollment
                  await prisma.enrollment.update({
                    where: { id: activeEnrollment.id },
                    data: { isActive: false },
                  })
                }

                // Check if enrollment exists (even if inactive)
                const existingEnrollment = await prisma.enrollment.findUnique({
                  where: {
                    studentId_groupId: {
                      studentId: newUser.studentProfile.id,
                      groupId: group.id,
                    },
                  },
                })

                if (existingEnrollment) {
                  // Reactivate existing enrollment
                  await prisma.enrollment.update({
                    where: { id: existingEnrollment.id },
                    data: { isActive: true },
                  })
                } else {
                  // Create new enrollment
                  await prisma.enrollment.create({
                    data: {
                      studentId: newUser.studentProfile.id,
                      groupId: group.id,
                      isActive: true,
                    },
                  })
                }
              }
            } else {
              results.errors.push(`Qator ${i + 2}: Guruh "${groupName}" topilmadi, o'quvchi yaratildi lekin guruhga biriktirilmadi`)
            }
          } catch (groupError: any) {
            results.errors.push(`Qator ${i + 2}: Guruhga biriktirishda xatolik: ${groupError.message || "Noma'lum xatolik"}`)
          }
        }

        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push(`Qator ${i + 2}: ${error.message || 'Xatolik'}`)
      }
    }

    return NextResponse.json({
      message: `Import yakunlandi: ${results.success} ta muvaffaqiyatli, ${results.failed} ta xatolik`,
      success: results.success,
      failed: results.failed,
      errors: results.errors.slice(0, 20), // Limit to first 20 errors
    })
  } catch (error: any) {
    console.error('Error importing students:', error)
    return NextResponse.json(
      { error: error.message || 'Import qilishda xatolik' },
      { status: 500 }
    )
  }
}
