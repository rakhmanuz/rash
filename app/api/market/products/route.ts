import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get all products (for students and teachers)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive') !== 'false'

    const where: any = {}
    if (category) {
      where.category = category
    }
    if (isActive) {
      where.isActive = true
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Create product (admin only)
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
    const { name, description, category, price, infinityPrice, image, stock } = body

    if (!name || stock === undefined) {
      return NextResponse.json(
        { error: 'Name va stock kerak' },
        { status: 400 }
      )
    }

    if (infinityPrice === undefined || infinityPrice === '' || infinityPrice === null) {
      return NextResponse.json(
        { error: 'Infinity price kerak' },
        { status: 400 }
      )
    }

    // Parse infinityPrice to integer
    const parsedInfinityPrice = parseInt(String(infinityPrice), 10)
    if (isNaN(parsedInfinityPrice) || parsedInfinityPrice < 0) {
      return NextResponse.json(
        { error: 'Infinity price to\'g\'ri son bo\'lishi kerak' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        category: category ? String(category) : 'boshqa',
        price: parseFloat(String(price || 0)),
        infinityPrice: parsedInfinityPrice,
        image: image ? String(image).trim() : null,
        stock: parseInt(String(stock), 10) || 0,
        isActive: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error('Error creating product:', error)
    // Return more detailed error message
    const errorMessage = error?.message || 'Server error'
    return NextResponse.json(
      { error: errorMessage, details: error?.code },
      { status: 500 }
    )
  }
}
