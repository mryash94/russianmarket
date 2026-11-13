import { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard,
  Package,
  FileCheck,
  Users,
  Settings,
  TrendingUp,
  CheckCircle2,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'
import {
  storeEngine,
  type Order,
  type StoreSettings,
} from '../../services/storeEngine'
import type { Product, CollectibleCollection } from '../../types/product'
import type { OrderStatus } from '../../types/database'

type AdminDashboardProps = {
  onExitAdmin: () => void
}

type AdminTab = 'overview' | 'products' | 'orders' | 'customers' | 'settings'

export function AdminDashboard({ onExitAdmin }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [, setLoading] = useState(true)

  // Modals / Editors
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderFilter, setOrderFilter] = useState<OrderStatus | 'all'>('all')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const reloadData = useCallback(async () => {
    setLoading(true)
    const [o, p, s] = await Promise.all([
      storeEngine.getOrders(),
      storeEngine.getProducts(),
      storeEngine.getSettings(),
    ])
    setOrders(o)
    setProducts(p)
    setSettings(s)
    setLoading(false)
  }, [])

  useEffect(() => {
    void reloadData()
    const unsubscribe = storeEngine.subscribe(() => {
      void reloadData()
    })
    return () => unsubscribe()
  }, [reloadData])

  const notifySuccess = (msg: string) => {
    setActionSuccess(msg)
    setTimeout(() => setActionSuccess(null), 3000)
  }

  // Analytics Metrics
  const totalOrders = orders.length
  const pendingOrders = orders.filter((o) => o.status === 'pending').length
  const verifiedOrders = orders.filter(
    (o) => o.status === 'payment_verified' || o.status === 'completed',
  ).length
  const verifiedRevenueMinor = orders
    .filter((o) => o.status === 'payment_verified' || o.status === 'completed')
    .reduce((sum, o) => sum + o.subtotalMinor, 0)
  const formattedRevenue = `$${(verifiedRevenueMinor / 100).toFixed(2)}`

  // Verify Payment Action (Unlocks customer digital assets!)
  const handleVerifyOrder = async (orderId: string) => {
    try {
      await storeEngine.verifyOrderPayment(orderId, 'Verified by Administrator in Control Room')
      notifySuccess(`Order ${orderId} payment verified! Vault assets unlocked.`)
      reloadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Verification failed')
    }
  }

  // Update Status
  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await storeEngine.updateOrderStatus(orderId, status)
      notifySuccess(`Order status updated to ${status}`)
      reloadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Status update failed')
    }
  }

  // Delete product
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to archive this product?')) return
    await storeEngine.deleteProduct(productId)
    notifySuccess('Product archived')
    reloadData()
  }

  // Save product (edit or new)
  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const priceDollars = parseFloat(formData.get('price') as string) || 500
    const priceMinor = Math.round(priceDollars * 100)
    const discountPercent = parseInt(formData.get('discount') as string) || 0
    const salePriceMinor =
      discountPercent > 0 ? Math.round(priceMinor * (1 - discountPercent / 100)) : null

    const baseProduct: Product = editingProduct || {
      id: `rm-prod-${Date.now()}`,
      sku: (formData.get('sku') as string) || `RM-${Date.now().toString(36).toUpperCase()}`,
      slug: ((formData.get('name') as string) || 'new-card')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-'),
      name: (formData.get('name') as string) || 'New Collectible',
      description: (formData.get('description') as string) || '',
      collection: (formData.get('collection') as CollectibleCollection) || 'Midnight Edition',
      category: (formData.get('collection') as string) || 'Midnight Edition',
      categoryLabel: (formData.get('collection') as string) || 'Midnight Edition',
      priceMinor,
      salePriceMinor,
      discountPercent,
      currency: 'USD',
      stockCount: parseInt(formData.get('stock') as string) || 10,
      stockLabel: 'In Stock',
      availability: 'in_stock',
      editionNumber: 1,
      editionTotal: 50,
      artwork: 'northstar',
      artworkNumber: 1,
      artworkCaption: 'RUSSIAN MARKET MASTER',
      artworkTitle: (formData.get('name') as string) || 'MASTER CARD',
      images: ['/assets/cards/midnight-cipher.webp'],
      digitalAsset: {
        filename: (formData.get('assetName') as string) || 'master-asset.zip',
        sizeBytes: 65400000,
        format: 'Master TIFF + 4K ProRes',
      },
      specifications: [
        { label: 'Edition Tier', value: 'Private Reserve Series' },
        { label: 'Asset Resolution', value: '8192 × 8192 UHD Master' },
        { label: 'Hash Verification', value: 'SHA-256 Verified Seal' },
      ],
      status: (formData.get('status') as any) || 'active',
      isFeatured: formData.get('isFeatured') === 'on',
      isPopular: formData.get('isPopular') === 'on',
      tags: ['collectible', 'russian-market'],
    }

    await storeEngine.saveProduct(baseProduct)
    setIsAddingProduct(false)
    setEditingProduct(null)
    notifySuccess('Product saved successfully!')
    reloadData()
  }

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesFilter = orderFilter === 'all' || o.status === orderFilter
    const matchesSearch =
      orderSearch.trim() === '' ||
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(orderSearch.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-8 space-y-6">
      {/* Top Admin Header Bar */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel-glow p-4 md:p-6 rounded-3xl border border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-cinzel text-xl md:text-2xl font-bold text-white tracking-wide">
                RUSSIAN MARKET CONTROL ROOM
              </h1>
              <span className="px-2.5 py-0.5 rounded-full font-mono-code text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                ADMIN SECURE
              </span>
            </div>
            <p className="text-xs font-mono-code text-slate-400 mt-0.5">
              Haute Collectible Operations • Order Verification • Sovereign Catalog Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {actionSuccess && (
            <span className="text-xs font-mono-code text-emerald-400 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              {actionSuccess}
            </span>
          )}

          <button
            type="button"
            onClick={onExitAdmin}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Storefront</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto pb-1">
        {(
          [
            { id: 'overview', label: 'Overview Metrics', icon: TrendingUp },
            { id: 'orders', label: `Orders (${pendingOrders} Pending)`, icon: FileCheck },
            { id: 'products', label: `Products (${products.length})`, icon: Package },
            { id: 'customers', label: 'Collectors', icon: Users },
            { id: 'settings', label: 'Store & SunPay Config', icon: Settings },
          ] as const
        ).map(({ id, label, icon: IconComponent }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-space text-xs font-bold tracking-wider transition-all border ${
              activeTab === id
                ? 'bg-amber-500/15 text-amber-300 border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-white/5 text-slate-400 hover:text-white border-white/5'
            }`}
          >
            <IconComponent className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel rounded-3xl p-5 border border-white/10 space-y-2">
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-400">
                VERIFIED REVENUE
              </span>
              <div className="font-space text-2xl font-bold text-emerald-400">
                {formattedRevenue} <span className="text-xs font-mono-code">USD</span>
              </div>
              <span className="text-[11px] font-mono-code text-slate-400 block">
                {verifiedOrders} settled orders
              </span>
            </div>

            <div className="glass-panel rounded-3xl p-5 border border-white/10 space-y-2">
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-400">
                PENDING VERIFICATION
              </span>
              <div className="font-space text-2xl font-bold text-amber-400">{pendingOrders}</div>
              <span className="text-[11px] font-mono-code text-slate-400 block">
                Awaiting gateway/admin clearance
              </span>
            </div>

            <div className="glass-panel rounded-3xl p-5 border border-white/10 space-y-2">
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-400">
                TOTAL ORDERS
              </span>
              <div className="font-space text-2xl font-bold text-white">{totalOrders}</div>
              <span className="text-[11px] font-mono-code text-slate-400 block">
                All lifecycle states
              </span>
            </div>

            <div className="glass-panel rounded-3xl p-5 border border-white/10 space-y-2">
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-400">
                COLLECTIBLE INVENTORY
              </span>
              <div className="font-space text-2xl font-bold text-cyan-300">{products.length}</div>
              <span className="text-[11px] font-mono-code text-slate-400 block">
                Active catalog editions
              </span>
            </div>
          </div>

          {/* Quick Pending Orders Table */}
          <div className="glass-panel rounded-3xl p-5 md:p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-cinzel text-lg font-bold text-white">
                Orders Awaiting Settlement Verification
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className="text-xs font-mono-code text-cyan-400 hover:underline"
              >
                View All Orders →
              </button>
            </div>

            {orders.filter((o) => o.status === 'pending').length === 0 ? (
              <p className="text-xs text-slate-400 font-mono-code py-6 text-center">
                All orders are settled. No pending orders.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono-code text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-[10px]">
                      <th className="py-2">ORDER #</th>
                      <th className="py-2">CUSTOMER</th>
                      <th className="py-2">AMOUNT</th>
                      <th className="py-2">METHOD</th>
                      <th className="py-2 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders
                      .filter((o) => o.status === 'pending')
                      .map((o) => (
                        <tr key={o.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 font-bold text-white">{o.orderNumber}</td>
                          <td className="py-3 text-slate-300">{o.customerEmail}</td>
                          <td className="py-3 text-cyan-300 font-bold">
                            ${(o.subtotalMinor / 100).toFixed(2)}
                          </td>
                          <td className="py-3 text-slate-400 uppercase">{o.paymentMethod}</td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleVerifyOrder(o.id)}
                              className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold hover:bg-emerald-500/30 active:scale-95 transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            >
                              Verify Payment & Unlock Vault
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Orders Management */}
      {activeTab === 'orders' && (
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-cinzel text-xl font-bold text-white">Order Management</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search Order # or Email..."
                className="glass-input px-3 py-1.5 rounded-xl text-xs"
              />
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value as any)}
                className="glass-input px-3 py-1.5 rounded-xl text-xs bg-slate-900"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="payment_verified">Payment Verified</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-5 border border-white/10 overflow-x-auto">
            <table className="w-full text-left font-mono-code text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-[10px]">
                  <th className="py-2.5">ORDER ID</th>
                  <th className="py-2.5">DATE</th>
                  <th className="py-2.5">CUSTOMER</th>
                  <th className="py-2.5">ITEMS</th>
                  <th className="py-2.5">TOTAL</th>
                  <th className="py-2.5">STATUS</th>
                  <th className="py-2.5 text-right">CONTROLS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-bold text-white">{o.orderNumber}</td>
                    <td className="py-3 text-slate-400">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-slate-300 truncate max-w-[150px]">
                      {o.customerEmail}
                    </td>
                    <td className="py-3 text-slate-400">{o.items.length} card(s)</td>
                    <td className="py-3 text-cyan-300 font-bold">
                      ${(o.subtotalMinor / 100).toFixed(2)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          o.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300'
                            : o.status === 'payment_verified' || o.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-1.5 whitespace-nowrap">
                      {o.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleVerifyOrder(o.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold hover:bg-emerald-500/30"
                        >
                          Verify & Unlock
                        </button>
                      )}
                      {o.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(o.id, 'cancelled')}
                          className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[10px]"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Products Management */}
      {activeTab === 'products' && (
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-cinzel text-xl font-bold text-white">Product Inventory</h2>
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null)
                setIsAddingProduct(true)
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl btn-cyan text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Collectible</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="glass-panel rounded-3xl p-4 border border-white/10 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono-code">
                    <span className="text-cyan-400 font-bold">{p.sku}</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-300 text-[10px]">
                      {p.collection}
                    </span>
                  </div>
                  <h3 className="font-space font-bold text-base text-white mt-1">{p.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 font-sans">{p.description}</p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono-code text-slate-400 block">PRICE</span>
                    <span className="font-space font-bold text-base text-white">
                      ${(p.priceMinor / 100).toFixed(2)} USD
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(p)
                        setIsAddingProduct(true)
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                      title="Edit Product"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                      title="Archive Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Customers */}
      {activeTab === 'customers' && (
        <div className="max-w-7xl mx-auto space-y-4">
          <h2 className="font-cinzel text-xl font-bold text-white">Collector Accounts</h2>
          <div className="glass-panel rounded-3xl p-5 border border-white/10">
            <p className="text-xs text-slate-300 font-sans mb-4">
              All registered collector profiles and lifetime order volumes.
            </p>
            <div className="space-y-3 font-mono-code text-xs">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">collector@russianmarket.store</span>
                  <span className="text-[10px] text-slate-400">Authenticated Member • Sovereign Tier</span>
                </div>
                <div className="text-right">
                  <span className="text-cyan-300 font-bold block">{orders.length} Orders</span>
                  <span className="text-[10px] text-emerald-400">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Store Settings & SunPay Config */}
      {activeTab === 'settings' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <h2 className="font-cinzel text-xl font-bold text-white">Store Governance & SunPay Gateway</h2>

          {/* SunPay Gateway Architecture Configuration */}
          <div className="glass-panel-glow rounded-3xl p-6 border border-cyan-500/30 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="font-cinzel text-lg font-bold text-white">
                SunPay Gateway Modular Parameters
              </h3>
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Configure your SunPay API endpoint, merchant ID, and HMAC webhook secret. When left blank, the application operates in modular preparation mode.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono-code">
              <div>
                <label className="block text-slate-400 mb-1">SUNPAY MERCHANT ID</label>
                <input
                  type="text"
                  placeholder="SUN_MERCHANT_LIVE_XXXX"
                  defaultValue={settings?.sunpayMerchantId || ''}
                  className="w-full glass-input px-3 py-2 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">SUNPAY API ENDPOINT</label>
                <input
                  type="text"
                  defaultValue={settings?.sunpayApiEndpoint || 'https://api.sunpay.gateway/v1'}
                  className="w-full glass-input px-3 py-2 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => notifySuccess('SunPay gateway configuration updated')}
                className="px-4 py-2 rounded-xl btn-cyan text-xs font-bold"
              >
                Save Gateway Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in">
          <div className="relative w-full max-w-xl glass-panel-glow rounded-3xl p-6 border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-cinzel text-lg font-bold text-white mb-4">
              {editingProduct ? 'Edit Collectible Edition' : 'Add New Collectible Edition'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs font-mono-code">
              <div>
                <label className="block text-slate-400 mb-1">PRODUCT TITLE</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingProduct?.name || ''}
                  placeholder="e.g. Midnight Sovereign Core"
                  className="w-full glass-input px-3 py-2 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">SKU</label>
                  <input
                    type="text"
                    name="sku"
                    required
                    defaultValue={editingProduct?.sku || ''}
                    placeholder="RM-MND-009"
                    className="w-full glass-input px-3 py-2 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">COLLECTION</label>
                  <select
                    name="collection"
                    defaultValue={editingProduct?.collection || 'Midnight Edition'}
                    className="w-full glass-input px-3 py-2 rounded-xl bg-slate-900 text-white"
                  >
                    <option value="Midnight Edition">Midnight Edition</option>
                    <option value="Royal Blue Edition">Royal Blue Edition</option>
                    <option value="Crimson Edition">Crimson Edition</option>
                    <option value="Titanium Edition">Titanium Edition</option>
                    <option value="Gold Edition">Gold Edition</option>
                    <option value="Limited Edition">Limited Edition</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">PRICE (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    required
                    defaultValue={editingProduct ? (editingProduct.priceMinor / 100).toFixed(2) : '480'}
                    className="w-full glass-input px-3 py-2 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">DISCOUNT %</label>
                  <input
                    type="number"
                    name="discount"
                    defaultValue={editingProduct?.discountPercent || 0}
                    className="w-full glass-input px-3 py-2 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">STOCK COUNT</label>
                  <input
                    type="number"
                    name="stock"
                    defaultValue={editingProduct?.stockCount || 10}
                    className="w-full glass-input px-3 py-2 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">DESCRIPTION</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingProduct?.description || ''}
                  className="w-full glass-input px-3 py-2 rounded-xl font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">DIGITAL ASSET FILENAME</label>
                <input
                  type="text"
                  name="assetName"
                  defaultValue={editingProduct?.digitalAsset.filename || 'RM-Master-Asset.zip'}
                  className="w-full glass-input px-3 py-2 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddingProduct(false)}
                  className="px-4 py-2 rounded-xl glass-input text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl btn-cyan text-xs font-bold">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
