import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET - Bitta yordamchi adminni olish
export async function GET(
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

    const assistantAdmin = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        assistantAdminProfile: true,
      },
    })

    if (!assistantAdmin || assistantAdmin.role !== 'ASSISTANT_ADMIN') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...assistantAdmin,
      password: undefined,
    })
  } catch (error) {
    console.error('Error fetching assistant admin:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT - Yordamchi adminni yangilash
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
    const { username, name, password, phone, permissions, isActive } = body

    // User mavjudligini tekshirish
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: { assistantAdminProfile: true },
    })

    if (!existingUser || existingUser.role !== 'ASSISTANT_ADMIN') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Username takrorlanmasligini tekshirish (agar o'zgartirilayotgan bo'lsa)
    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username },
      })

      if (usernameExists) {
        return NextResponse.json(
          { error: 'Bu username allaqachon mavjud' },
          { status: 400 }
        )
      }
    }

    // Update data
    const updateData: any = {}
    if (username) updateData.username = username
    if (name) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (isActive !== undefined) updateData.isActive = isActive
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // User yangilash
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    })

    // Permissions yangilash yoki yaratish
    let assistantAdminProfile = existingUser.assistantAdminProfile
    if (permissions) {
      if (assistantAdminProfile) {
        // Mavjud profile'ni yangilash
        assistantAdminProfile = await prisma.assistantAdmin.update({
          where: { userId: params.id },
          data: {
            permissions: JSON.stringify(permissions),
          },
        })
      } else {
        // Yangi profile yaratish
        assistantAdminProfile = await prisma.assistantAdmin.create({
          data: {
            userId: params.id,
            permissions: JSON.stringify(permissions),
          },
        })
      }
    }

    // User bilan birga qaytarish
    const userWithProfile = {
      ...updatedUser,
      assistantAdminProfile,
    }

    return NextResponse.json({
      message: 'Yordamchi admin muvaffaqiyatli yangilandi',
      user: {
        ...userWithProfile,
        password: undefined,
      },
    })
  } catch (error) {
    console.error('Error updating assistant admin:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE - Yordamchi adminni o'chirish
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

    // User mavjudligini tekshirish
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existingUser || existingUser.role !== 'ASSISTANT_ADMIN') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // User o'chirish (Cascade delete AssistantAdmin profillni ham o'chiradi)
    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: 'Yordamchi admin muvaffaqiyatli o\'chirildi',
    })
  } catch (error) {
    console.error('Error deleting assistant admin:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
