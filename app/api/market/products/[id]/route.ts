import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT - Update product (admin only)
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
    const { name, description, category, price, infinityPrice, image, stock, isActive } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = String(name).trim()
    if (description !== undefined) updateData.description = description ? String(description).trim() : null
    if (category !== undefined) updateData.category = String(category)
    if (price !== undefined) updateData.price = parseFloat(String(price))
    if (infinityPrice !== undefined) {
      const parsedInfinityPrice = parseInt(String(infinityPrice), 10)
      if (!isNaN(parsedInfinityPrice) && parsedInfinityPrice >= 0) {
        updateData.infinityPrice = parsedInfinityPrice
      }
    }
    if (image !== undefined) updateData.image = image ? String(image).trim() : null
    if (stock !== undefined) updateData.stock = parseInt(String(stock), 10) || 0
    if (isActive !== undefined) updateData.isActive = isActive

    const product = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE - Delete product (admin only)
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

    await prisma.product.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Product deleted' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
