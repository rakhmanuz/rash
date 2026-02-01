'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Search, Package, DollarSign, ShoppingCart, ShoppingBag } from 'lucide-react'

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
  createdAt: string
}

interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  product: Product
}

interface Order {
  id: string
  userId: string
  totalAmount: number
  status: string
  deliveryAddress: string | null
  phone: string | null
  notes: string | null
  createdAt: string
  user: {
    id: string
    name: string
    username: string
  }
  items: OrderItem[]
}

export default function MarketPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [orderSearchTerm, setOrderSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    infinityPrice: '',
    image: '',
    stock: '',
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts()
    } else {
      fetchOrders()
    }
  }, [activeTab])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/market/products')
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const data = await response.json()
      // Ensure data is always an array
      if (Array.isArray(data)) {
        setProducts(data)
      } else {
        console.error('Invalid data format:', data)
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
      alert('Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true)
      const response = await fetch('/api/market/orders?admin=true')
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setOrders(data)
      } else {
        console.error('Invalid data format:', data)
        setOrders([])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
      alert('Xatolik yuz berdi')
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!formData.infinityPrice || formData.infinityPrice === '') {
        alert('Infinity price kerak!')
        return
      }
      const response = await fetch('/api/market/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          infinityPrice: formData.infinityPrice || 0,
          image: formData.image || null,
          stock: formData.stock,
          category: 'boshqa', // Default category
          description: null,
          price: 0,
        }),
      })

      if (response.ok) {
        alert('Mahsulot muvaffaqiyatli qo\'shildi!')
        setShowAddModal(false)
        setFormData({ name: '', infinityPrice: '', image: '', stock: '' })
        setImagePreview(null)
        fetchProducts()
      } else {
        const error = await response.json()
        console.error('Error response:', error)
        alert(error.error || error.details || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error adding product:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    try {
      if (!formData.infinityPrice || formData.infinityPrice === '') {
        alert('Infinity price kerak!')
        return
      }
      const response = await fetch(`/api/market/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          infinityPrice: formData.infinityPrice || 0,
          image: formData.image || null,
          stock: formData.stock,
        }),
      })

      if (response.ok) {
        alert('Mahsulot muvaffaqiyatli yangilandi!')
        setShowEditModal(false)
        setSelectedProduct(null)
        setFormData({ name: '', infinityPrice: '', image: '', stock: '' })
        setImagePreview(null)
        fetchProducts()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Mahsulotni o\'chirishni tasdiqlaysizmi?')) return

    try {
      const response = await fetch(`/api/market/products/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Mahsulot muvaffaqiyatli o\'chirildi!')
        fetchProducts()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleToggleStatus = async (product: Product) => {
    try {
      const response = await fetch(`/api/market/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive }),
      })

      if (response.ok) {
        fetchProducts()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Faqat rasm fayllari qabul qilinadi')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Fayl hajmi 5MB dan katta bo\'lmasligi kerak')
      return
    }

    setUploadingImage(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload file
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Yuklashda xatolik')
      }

      const data = await response.json()
      setFormData({ ...formData, image: data.url })
      alert('Rasm muvaffaqiyatli yuklandi!')
    } catch (error: any) {
      console.error('Error uploading image:', error)
      alert(error.message || 'Rasm yuklashda xatolik yuz berdi')
      setImagePreview(null)
    } finally {
      setUploadingImage(false)
    }
  }

  const openEditModal = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      infinityPrice: ((product as any).infinityPrice || 0).toString(),
      image: product.image || '',
      stock: product.stock.toString(),
    })
    setImagePreview(product.image || null)
    setShowEditModal(true)
  }

  const filteredProducts = Array.isArray(products) 
    ? products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : []

  const filteredOrders = Array.isArray(orders)
    ? orders.filter((order) =>
        order.user.name.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        order.user.username.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        order.status.toLowerCase().includes(orderSearchTerm.toLowerCase())
      )
    : []

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Market Boshqaruvi</h1>
          <p className="text-sm sm:text-base text-gray-400">Mahsulotlar va buyurtmalarni boshqaring</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 sm:space-x-4 border-b border-gray-700 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'products'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Mahsulotlar</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'orders'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-1 sm:space-x-2">
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Buyurtmalar</span>
            </div>
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
            <div className="flex items-center justify-end">
              <button
                onClick={() => {
                  setFormData({ name: '', infinityPrice: '', image: '', stock: '' })
                  setImagePreview(null)
                  setShowAddModal(true)
                }}
                className="flex items-center space-x-2 px-3 sm:px-6 py-2 sm:py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm sm:text-base"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="whitespace-nowrap">Yangi Mahsulot</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Qidirish (nomi)..."
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`bg-slate-800 rounded-lg border ${
                  product.isActive ? 'border-gray-700' : 'border-gray-600 opacity-60'
                } p-4 sm:p-6 hover:border-green-500 transition-colors`}
              >
                {product.image && (
                  <div className="w-full h-40 sm:h-48 bg-slate-700 rounded-lg mb-3 sm:mb-4 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 line-clamp-2">{product.name}</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-green-500 flex items-center space-x-1">
                        <span className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                          ∞
                        </span>
                        <span>{(product.infinityPrice || 0).toLocaleString()}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400">Qoldiq: {product.stock} ta</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 pt-2 border-t border-gray-700">
                    <button
                      onClick={() => openEditModal(product)}
                      className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-xs sm:text-sm"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                      <span className="hidden sm:inline">Tahrirlash</span>
                      <span className="sm:hidden">Tahrir</span>
                    </button>
                    <button
                      onClick={() => handleToggleStatus(product)}
                      className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                        product.isActive
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {product.isActive ? 'Deaktiv' : 'Aktiv'}
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-xs sm:text-sm"
                      title="O'chirish"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Qidirish (foydalanuvchi, ID, status)..."
                value={orderSearchTerm}
                onChange={(e) => setOrderSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Orders List */}
            {ordersLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                <p className="mt-4 text-gray-400">Yuklanmoqda...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-slate-800 rounded-lg border border-gray-700">
                <ShoppingBag className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Buyurtmalar topilmadi</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-800 rounded-lg border border-gray-700 p-4 sm:p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 gap-3">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-white">
                            Buyurtma #{order.id.slice(0, 8)}
                          </h3>
                          <span
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium text-white w-fit ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status === 'pending' && 'Kutilmoqda'}
                            {order.status === 'completed' && 'Yakunlangan'}
                            {order.status === 'cancelled' && 'Bekor qilingan'}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-400">
                          Foydalanuvchi: <span className="text-white">{order.user.name}</span> (
                          {order.user.username})
                        </p>
                        <p className="text-xs sm:text-sm text-gray-400">
                          Sana: {new Date(order.createdAt).toLocaleString('uz-UZ')}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xl sm:text-2xl font-bold text-green-500 flex items-center space-x-1">
                          <span className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                            ∞
                          </span>
                          <span>{order.totalAmount.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-700 pt-3 sm:pt-4 mt-3 sm:mt-4">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">Mahsulotlar:</h4>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-700 rounded-lg p-2 sm:p-3 gap-2"
                          >
                            <div className="flex-1">
                              <p className="text-sm sm:text-base text-white font-medium line-clamp-2">{item.product.name}</p>
                              <p className="text-xs sm:text-sm text-gray-400">
                                Miqdor: {item.quantity} ta
                              </p>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-sm sm:text-base text-green-400 font-semibold flex items-center space-x-1">
                                <span className="text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                                  ∞
                                </span>
                                <span>{(item.price * item.quantity).toLocaleString()}</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {(order.deliveryAddress || order.phone || order.notes) && (
                      <div className="border-t border-gray-700 pt-4 mt-4">
                        {order.deliveryAddress && (
                          <p className="text-sm text-gray-400 mb-1">
                            <span className="text-gray-300">Manzil:</span> {order.deliveryAddress}
                          </p>
                        )}
                        {order.phone && (
                          <p className="text-sm text-gray-400 mb-1">
                            <span className="text-gray-300">Telefon:</span> {order.phone}
                          </p>
                        )}
                        {order.notes && (
                          <p className="text-sm text-gray-400">
                            <span className="text-gray-300">Izoh:</span> {order.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-slate-800 rounded-lg border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Yangi Mahsulot</h2>
              <form onSubmit={handleAddProduct} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nomi *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Infinity Price (ballar) *
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                      ∞
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.infinityPrice}
                      onChange={(e) => setFormData({ ...formData, infinityPrice: e.target.value })}
                      className="flex-1 px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Infinity ballar"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rasm</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {uploadingImage && (
                    <p className="mt-2 text-sm text-gray-400">Yuklanmoqda...</p>
                  )}
                  {imagePreview && (
                    <div className="mt-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border border-gray-600"
                      />
                    </div>
                  )}
                  {formData.image && !imagePreview && (
                    <div className="mt-4">
                      <img
                        src={formData.image}
                        alt="Current"
                        className="w-full h-48 object-cover rounded-lg border border-gray-600"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Qoldiq *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    Qo'shish
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setImagePreview(null)
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Bekor qilish
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-slate-800 rounded-lg border border-gray-700 w-full max-w-md p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Mahsulotni Tahrirlash</h2>
              <form onSubmit={handleEditProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nomi *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Infinity Price (ballar) *
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                      ∞
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.infinityPrice}
                      onChange={(e) => setFormData({ ...formData, infinityPrice: e.target.value })}
                      className="flex-1 px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Infinity ballar"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rasm</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {uploadingImage && (
                    <p className="mt-2 text-sm text-gray-400">Yuklanmoqda...</p>
                  )}
                  {imagePreview && (
                    <div className="mt-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border border-gray-600"
                      />
                    </div>
                  )}
                  {formData.image && !imagePreview && (
                    <div className="mt-4">
                      <img
                        src={formData.image}
                        alt="Current"
                        className="w-full h-48 object-cover rounded-lg border border-gray-600"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Qoldiq *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    Yangilash
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedProduct(null)
                      setImagePreview(null)
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Bekor qilish
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
