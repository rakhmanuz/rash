import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get user orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('admin') === 'true'

    // Admin can see all orders
    if (isAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      })

      if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const orders = await prisma.order.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json(orders)
    }

    // Regular users see only their orders
    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Create order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, deliveryAddress, phone, notes } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items kerak' },
        { status: 400 }
      )
    }

    // Get user's current infinity points
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { infinityPoints: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User topilmadi' },
        { status: 404 }
      )
    }

    // Validate items and calculate total infinity price
    let totalInfinityPrice = 0
    const orderItems: Array<{ productId: string; quantity: number; price: number }> = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} topilmadi` },
          { status: 404 }
        )
      }

      if (!product.isActive) {
        return NextResponse.json(
          { error: `Product ${product.name} faol emas` },
          { status: 400 }
        )
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Product ${product.name} uchun yetarli qoldiq yo'q` },
          { status: 400 }
        )
      }

      const itemTotal = (product.infinityPrice || 0) * item.quantity
      totalInfinityPrice += itemTotal

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.infinityPrice || 0, // Infinity price saqlanadi
      })
    }

    // Check if user has enough infinity points
    if (user.infinityPoints < totalInfinityPrice) {
      return NextResponse.json(
        { error: `Yetarli infinity ballar yo'q! Sizda: ∞ ${user.infinityPoints}, kerak: ∞ ${totalInfinityPrice}` },
        { status: 400 }
      )
    }

    // Create order and deduct infinity points in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          totalAmount: totalInfinityPrice, // Infinity price saqlanadi
          status: 'pending',
          deliveryAddress: deliveryAddress || null,
          phone: phone || null,
          notes: notes || null,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      // Deduct infinity points from user
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          infinityPoints: {
            decrement: totalInfinityPrice,
          },
        },
      })

      // Update product stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })
      }

      return newOrder
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
