'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { Minus, Package, Plus, Search, ShoppingCart, X } from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { OnlinePageHeader } from '@/components/student-online/online-ui'
interface Product {
  id: string
  name: string
  description: string | null
  category: string
  price: number
  infinityPrice: number
  image: string | null
  stock: number
  isActive: boolean
}

interface CartItem {
  product: Product
  quantity: number
}

export function OnlineMarketPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [infinityPoints, setInfinityPoints] = useState(0)
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutData, setCheckoutData] = useState({
    deliveryAddress: '',
    phone: '',
    notes: '',
  })

  useEffect(() => {
    void fetchProducts()
    void fetchInfinityPoints()
  }, [])

  const fetchInfinityPoints = async () => {
    try {
      const res = await fetch('/api/user/infinity', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setInfinityPoints(data.infinityPoints || 0)
      }
    } catch {
      /* ignore */
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/market/products?isActive=true')
      const data = await response.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      alert('Bu mahsulotdan qolmagan!')
      return
    }
    const existingItem = cart.find((item) => item.product.id === product.id)
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert("Yetarli qoldiq yo'q!")
        return
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      )
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId)
      return
    }
    const cartItem = cart.find((item) => item.product.id === productId)
    if (cartItem && quantity > cartItem.product.stock) {
      alert("Yetarli qoldiq yo'q!")
      return
    }
    setCart(
      cart.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    )
  }

  const getTotalInfinityPrice = () =>
    cart.reduce((total, item) => total + (item.product.infinityPrice || 0) * item.quantity, 0)

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) {
      alert("Savatcha bo'sh!")
      return
    }
    try {
      const response = await fetch('/api/market/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          deliveryAddress: checkoutData.deliveryAddress,
          phone: checkoutData.phone,
          notes: checkoutData.notes,
        }),
      })
      if (response.ok) {
        alert('Buyurtma muvaffaqiyatli yaratildi!')
        setCart([])
        setShowCheckout(false)
        setShowCart(false)
        setCheckoutData({ deliveryAddress: '', phone: '', notes: '' })
        void fetchProducts()
        void fetchInfinityPoints()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch {
      alert('Xatolik yuz berdi')
    }
  }

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const q = searchTerm.toLowerCase()
        return (
          product.name.toLowerCase().includes(q) ||
          (product.description?.toLowerCase().includes(q) ?? false)
        )
      }),
    [products, searchTerm]
  )

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <DashboardLayout role="STUDENT">
      <div className="online-shell online-page-bg mx-auto max-w-6xl space-y-4 pb-8 pt-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <OnlinePageHeader
            title="Market"
            subtitle="O'quv markazi kitoblari va materiallari"
          />
          <div className="flex shrink-0 items-center gap-3 sm:pt-5">
            <div className="online-card hidden items-center gap-2 px-4 py-2.5 sm:flex">
              <span className="text-lg font-black text-green-600">∞</span>
              <span className="text-sm font-semibold text-gray-700">{infinityPoints}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowCart(true)}
              className="relative inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-green-700"
            >
              <ShoppingCart className="h-5 w-5" />
              Savatcha
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-green-400 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="online-skeleton h-64" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="online-card flex flex-col items-center py-12 text-center">
            <Package className="mb-3 h-12 w-12 text-gray-300" />
            <p className="font-medium text-gray-700">Mahsulotlar topilmadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => {
              const cartItem = cart.find((item) => item.product.id === product.id)
              return (
                <article
                  key={product.id}
                  className="online-card online-card-lift flex flex-col overflow-hidden p-3"
                >
                  <div className="relative mb-3 aspect-[3/4] w-full overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-100">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 25vw"
                        unoptimized={
                          product.image.startsWith('blob:') || product.image.startsWith('data:')
                        }
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-10 w-10 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <h3 className="line-clamp-2 text-sm font-bold text-gray-900">{product.name}</h3>
                  <p className="mt-0.5 text-xs capitalize text-gray-500">{product.category}</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-base font-black text-green-600">∞</span>
                    <span className="text-lg font-bold text-green-600">{product.infinityPrice || 0}</span>
                  </div>
                  <p className="text-xs text-gray-400">Qoldiq: {product.stock} ta</p>
                  <div className="mt-3 flex-1" />
                  {cartItem ? (
                    <div className="flex items-center gap-1.5 border-t border-gray-100 pt-3">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                        className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="flex-1 text-center text-sm font-semibold text-gray-800">
                        {cartItem.quantity} ta
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                        disabled={cartItem.quantity >= product.stock}
                        className="rounded-lg bg-green-50 p-2 text-green-600 transition hover:bg-green-100 disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        className="rounded-lg bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {product.stock === 0 ? 'Qolmagan' : "Savatchaga qo'shish"}
                    </button>
                  )}
                </article>
              )
            })}
          </div>
        )}

        {showCart && (
          <Modal onClose={() => setShowCart(false)} title="Savatcha">
            {cart.length === 0 ? (
              <div className="py-10 text-center">
                <Package className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <p className="text-gray-500">Savatcha bo&apos;sh</p>
              </div>
            ) : (
              <>
                <ul className="max-h-[50vh] space-y-3 overflow-y-auto">
                  {cart.map((item) => (
                    <li
                      key={item.product.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-3"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{item.product.name}</p>
                        <p className="text-sm text-gray-500">
                          ∞ {(item.product.infinityPrice || 0) * item.quantity}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        O&apos;chirish
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-bold text-gray-900">Jami:</span>
                    <span className="text-xl font-bold text-green-600">∞ {getTotalInfinityPrice()}</span>
                  </div>
                  {getTotalInfinityPrice() > infinityPoints && (
                    <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      Yetarli infinity ballar yo&apos;q! Sizda: ∞ {infinityPoints}, kerak: ∞{' '}
                      {getTotalInfinityPrice()}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowCart(false)
                      setShowCheckout(true)
                    }}
                    className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Buyurtma berish
                  </button>
                </div>
              </>
            )}
          </Modal>
        )}

        {showCheckout && (
          <Modal onClose={() => setShowCheckout(false)} title="Buyurtma berish">
            <form onSubmit={handleCheckout} className="space-y-4">
              <Field label="Yetkazib berish manzili">
                <textarea
                  value={checkoutData.deliveryAddress}
                  onChange={(e) =>
                    setCheckoutData({ ...checkoutData, deliveryAddress: e.target.value })
                  }
                  rows={3}
                  className={inputClass}
                  placeholder="Manzilni kiriting..."
                />
              </Field>
              <Field label="Telefon raqami">
                <input
                  type="tel"
                  value={checkoutData.phone}
                  onChange={(e) => setCheckoutData({ ...checkoutData, phone: e.target.value })}
                  className={inputClass}
                  placeholder="+998 90 123 45 67"
                />
              </Field>
              <Field label="Qo'shimcha izoh">
                <textarea
                  value={checkoutData.notes}
                  onChange={(e) => setCheckoutData({ ...checkoutData, notes: e.target.value })}
                  rows={2}
                  className={inputClass}
                  placeholder="Qo'shimcha ma'lumot..."
                />
              </Field>
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="font-semibold text-gray-900">Jami:</span>
                <span className="text-xl font-bold text-green-600">∞ {getTotalInfinityPrice()}</span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Tasdiqlash
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  )
}

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="online-card max-h-[90vh] w-full max-w-md overflow-y-auto p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
