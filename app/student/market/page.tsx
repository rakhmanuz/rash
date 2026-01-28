'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { ShoppingCart, Search, Package, Plus, Minus, X } from 'lucide-react'

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

export default function MarketPage() {
  const { data: session } = useSession()
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
    fetchProducts()
    fetchInfinityPoints()
  }, [])

  const fetchInfinityPoints = async () => {
    try {
      const res = await fetch('/api/user/infinity')
      if (res.ok) {
        const data = await res.json()
        setInfinityPoints(data.infinityPoints || 0)
      }
    } catch (error) {
      console.error('Error fetching infinity points:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/market/products?isActive=true')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
      alert('Xatolik yuz berdi')
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
        alert('Yetarli qoldiq yo\'q!')
        return
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
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
      alert('Yetarli qoldiq yo\'q!')
      return
    }
    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const getTotalInfinityPrice = () => {
    return cart.reduce((total, item) => total + (item.product.infinityPrice || 0) * item.quantity, 0)
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) {
      alert('Savatcha bo\'sh!')
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
        fetchProducts()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description &&
        product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Market</h1>
            <p className="text-gray-400">O'quv markazi kitoblari va materiallari</p>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Savatcha</span>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Yuklanmoqda...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-lg border border-gray-700">
            <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Mahsulotlar topilmadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const cartItem = cart.find((item) => item.product.id === product.id)
              return (
                <div
                  key={product.id}
                  className="bg-slate-800 rounded-lg border border-gray-700 p-6 hover:border-green-500 transition-colors"
                >
                  {product.image && (
                    <div className="w-full h-48 bg-slate-700 rounded-lg mb-4 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-400 capitalize">{product.category}</p>
                    </div>
                    {product.description && (
                      <p className="text-gray-300 text-sm line-clamp-2">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                            ∞
                          </span>
                          <p className="text-2xl font-bold text-green-500">
                            {product.infinityPrice || 0}
                          </p>
                        </div>
                        <p className="text-sm text-gray-400">Qoldiq: {product.stock} ta</p>
                      </div>
                    </div>
                    {cartItem ? (
                      <div className="flex items-center space-x-2 pt-2 border-t border-gray-700">
                        <button
                          onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                          className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="flex-1 text-center text-white font-semibold">
                          {cartItem.quantity} ta
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                          disabled={cartItem.quantity >= product.stock}
                          className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                        className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>{product.stock === 0 ? 'Qolmagan' : 'Savatchaga qo\'shish'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Cart Modal */}
        {showCart && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-lg border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">Savatcha</h2>
                  <button
                    onClick={() => setShowCart(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Savatcha bo'sh</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-4">
                      {cart.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center space-x-4 p-4 bg-slate-700 rounded-lg"
                        >
                          <div className="flex-1">
                            <h3 className="text-white font-semibold">{item.product.name}</h3>
                            <p className="text-gray-400 text-sm flex items-center space-x-1">
                              <span className="text-green-400">∞</span>
                              <span>{(item.product.infinityPrice || 0)} x {item.quantity}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold flex items-center space-x-1">
                              <span className="text-green-400">∞</span>
                              <span>{((item.product.infinityPrice || 0) * item.quantity)}</span>
                            </p>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-red-400 hover:text-red-300 text-sm mt-1"
                            >
                              O'chirish
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-700 pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xl font-bold text-white">Jami:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                            ∞
                          </span>
                          <span className="text-2xl font-bold text-green-500">
                            {getTotalInfinityPrice()}
                          </span>
                        </div>
                      </div>
                      {getTotalInfinityPrice() > infinityPoints && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg text-sm">
                          Yetarli infinity ballar yo'q! Sizda: ∞ {infinityPoints}, kerak: ∞ {getTotalInfinityPrice()}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setShowCart(false)
                          setShowCheckout(true)
                        }}
                        className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                      >
                        Buyurtma berish
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-lg border border-gray-700 w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">Buyurtma berish</h2>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleCheckout} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Yetkazib berish manzili
                    </label>
                    <textarea
                      value={checkoutData.deliveryAddress}
                      onChange={(e) =>
                        setCheckoutData({ ...checkoutData, deliveryAddress: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Manzilni kiriting..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Telefon raqami
                    </label>
                    <input
                      type="tel"
                      value={checkoutData.phone}
                      onChange={(e) =>
                        setCheckoutData({ ...checkoutData, phone: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="+998 90 123 45 67"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Qo'shimcha izoh
                    </label>
                    <textarea
                      value={checkoutData.notes}
                      onChange={(e) =>
                        setCheckoutData({ ...checkoutData, notes: e.target.value })
                      }
                      rows={2}
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Qo'shimcha ma'lumot..."
                    />
                  </div>
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-semibold text-white">Jami:</span>
                      <span className="text-xl font-bold text-green-500">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                            ∞
                          </span>
                          <span>{getTotalInfinityPrice()}</span>
                        </div>
                      </span>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowCheckout(false)}
                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        Bekor qilish
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                      >
                        Tasdiqlash
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
