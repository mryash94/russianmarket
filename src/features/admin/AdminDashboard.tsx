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
  QrCode,
  Search,
  Clock,
  ShieldCheck,
  AlertTriangle,
  X,
  Eye,
  RefreshCw,
  Check,
  Ban,
  MessageCircle,
  Wallet,
} from 'lucide-react'
import {
  storeEngine,
  type Order,
  type StoreSettings,
} from '../../services/storeEngine'
import type { Product, CardCategory } from '../../types/product'
import { formatINR } from '../../lib/currency'
import { RussianMarketCard } from '../../components/RussianMarketCard'
import type { OrderStatus } from '../../types/database'
import { AdminChatInbox } from './AdminChatInbox'
import { AdminWalletManager } from './AdminWalletManager'

type AdminDashboardProps = {
  onExitAdmin: () => void
}

type AdminTab =
  | 'overview'
  | 'inbox'
  | 'wallet'
  | 'orders'
  | 'products'
  | 'qr_scanner'
  | 'customers'
  | 'settings'

export function AdminDashboard({ onExitAdmin }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [, setLoading] = useState(true)

  // Modals & Editors
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderFilter, setOrderFilter] = useState<OrderStatus | 'all'>('all')
  const [productCategoryFilter, setProductCategoryFilter] = useState<CardCategory | 'all'>('all')
  const [productSearch, setProductSearch] = useState('')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // QR Scanner State
  const [qrInput, setQrInput] = useState('')
  const [scannedOrder, setScannedOrder] = useState<Order | null>(null)
  const [qrError, setQrError] = useState<string | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)

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
    setTimeout(() => setActionSuccess(null), 3500)
  }

  // Analytics Metrics
  const totalOrders = orders.length
  const pendingOrders = orders.filter((o) => o.status === 'pending').length
  const paidOrders = orders.filter((o) => o.status === 'payment_verified').length
  const processingOrders = orders.filter((o) => o.status === 'processing').length
  const completedOrders = orders.filter((o) => o.status === 'completed').length
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length

  const verifiedRevenueMinor = orders
    .filter((o) => o.status === 'payment_verified' || o.status === 'completed')
    .reduce((sum, o) => sum + o.subtotalMinor, 0)
  const formattedRevenue = formatINR(verifiedRevenueMinor)

  // Actions
  const handleVerifyOrder = async (orderId: string) => {
    try {
      await storeEngine.verifyOrderPayment(orderId, 'Verified by Administrator in Control Room')
      notifySuccess(`Order ${orderId} payment verified! Vault assets unlocked.`)
      await reloadData()
      if (selectedOrder?.id === orderId) {
        const updated = await storeEngine.getOrderByIdOrToken(orderId)
        setSelectedOrder(updated)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Verification failed')
    }
  }

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await storeEngine.updateOrderStatus(orderId, status)
      notifySuccess(`Order status updated to ${status}`)
      await reloadData()
      if (selectedOrder?.id === orderId) {
        const updated = await storeEngine.getOrderByIdOrToken(orderId)
        setSelectedOrder(updated)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Status update failed')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to remove this product from the live catalog?')) return
    await storeEngine.deleteProduct(productId)
    notifySuccess('Product archived successfully')
    await reloadData()
  }

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const priceRupees = parseFloat(formData.get('price') as string) || 500
    const priceMinor = Math.round(priceRupees * 100)
    const discountPercent = parseInt(formData.get('discount') as string) || 0
    const salePriceMinor =
      discountPercent > 0 ? Math.round(priceMinor * (1 - discountPercent / 100)) : null

    const category = (formData.get('category') as CardCategory) || 'VISA'

    const baseProduct: Product = editingProduct
      ? {
          ...editingProduct,
          name: (formData.get('name') as string) || editingProduct.name,
          category,
          collection: category,
          categoryLabel: category,
          priceMinor,
          salePriceMinor,
          discountPercent,
          currency: 'INR',
          stockCount: parseInt(formData.get('stock') as string) || editingProduct.stockCount,
          editionNumber: parseInt(formData.get('editionNumber') as string) || editingProduct.editionNumber || 1,
          editionTotal: parseInt(formData.get('editionTotal') as string) || editingProduct.editionTotal || 50,
          availability: (formData.get('availability') as any) || 'in_stock',
          status: (formData.get('status') as any) || 'active',
        }
      : {
          id: `rm-prod-${Date.now()}`,
          sku: (formData.get('sku') as string) || `RM-${Date.now().toString(36).toUpperCase()}`,
          slug: ((formData.get('name') as string) || 'new-card')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-'),
          name: (formData.get('name') as string) || 'New Collectible',
          description: '',
          collection: category,
          category,
          categoryLabel: category,
          priceMinor,
          salePriceMinor,
          discountPercent,
          currency: 'INR',
          stockCount: parseInt(formData.get('stock') as string) || 10,
          stockLabel: 'In Stock',
          availability: (formData.get('availability') as any) || 'in_stock',
          editionNumber: parseInt(formData.get('editionNumber') as string) || 1,
          editionTotal: parseInt(formData.get('editionTotal') as string) || 50,
          artwork: 'northstar',
          artworkNumber: 1,
          artworkCaption: 'RUSSIAN MARKET MASTER',
          artworkTitle: (formData.get('name') as string) || 'MASTER CARD',
          images: ['/assets/cards/midnight-cipher.webp'],
          digitalAsset: {
            filename: `${(formData.get('name') as string || 'master-asset').toLowerCase().replace(/\s+/g, '-')}.zip`,
            sizeBytes: 65400000,
            format: 'Master Encrypted Asset (.ZIP)',
          },
          specifications: [
            { label: 'Edition Tier', value: 'Private Reserve Series' },
            { label: 'Resolution', value: '8192 × 8192 UHD Master' },
            { label: 'Security Seal', value: 'SHA-256 Verified Seal' },
          ],
          status: (formData.get('status') as any) || 'active',
          isFeatured: true,
          isPopular: false,
          tags: ['collectible', 'russian-market', category.toLowerCase()],
        }

    await storeEngine.saveProduct(baseProduct)
    setIsAddingProduct(false)
    setEditingProduct(null)
    notifySuccess('Product saved successfully!')
    await reloadData()
  }

  // QR Lookup & Redemption
  const handleScanLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qrInput.trim()) return

    setQrError(null)
    setScannedOrder(null)

    const found = await storeEngine.getOrderByIdOrToken(qrInput.trim())
    if (found) {
      setScannedOrder(found)
    } else {
      setQrError(`No order matching token or ID "${qrInput.trim()}" found.`)
    }
  }

  const handleRedeemCollectible = async () => {
    if (!scannedOrder) return
    setIsRedeeming(true)
    try {
      const res = await storeEngine.redeemOrderCollectible(scannedOrder.id, 'Senior Curator Admin')
      notifySuccess(res.message)
      setScannedOrder(res.order)
      await reloadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Redemption failed')
    } finally {
      setIsRedeeming(false)
    }
  }

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesFilter = orderFilter === 'all' || o.status === orderFilter
    const matchesSearch =
      orderSearch.trim() === '' ||
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.redemptionToken && o.redemptionToken.toLowerCase().includes(orderSearch.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = productCategoryFilter === 'all' || p.category === productCategoryFilter
    const matchesSearch =
      productSearch.trim() === '' ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Customers aggregation
  const customerMap = new Map<string, { email: string; name: string; orders: Order[]; totalSpentMinor: number }>()
  orders.forEach((o) => {
    const existing = customerMap.get(o.customerEmail) || {
      email: o.customerEmail,
      name: o.customerName || 'Valued Collector',
      orders: [],
      totalSpentMinor: 0,
    }
    existing.orders.push(o)
    if (o.status === 'payment_verified' || o.status === 'completed') {
      existing.totalSpentMinor += o.subtotalMinor
    }
    customerMap.set(o.customerEmail, existing)
  })
  const customers = Array.from(customerMap.values())

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-3 sm:p-6 md:p-8 space-y-6">
      {/* Top Admin Header Bar */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel-elevated p-4 md:p-6 rounded-3xl border border-amber-500/30 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] flex-shrink-0">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-space text-xl md:text-2xl font-bold text-white tracking-tight">
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

        <div className="flex items-center gap-2 flex-wrap">
          {actionSuccess && (
            <span className="text-xs font-mono-code text-emerald-400 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              {actionSuccess}
            </span>
          )}

          <button
            type="button"
            onClick={onExitAdmin}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all active:scale-95 shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Storefront</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(
          [
            { id: 'overview', label: 'Overview Metrics', icon: TrendingUp },
            { id: 'inbox', label: 'Support Inbox', icon: MessageCircle },
            { id: 'wallet', label: 'Wallet & UPI Audit', icon: Wallet },
            { id: 'orders', label: `Orders (${orders.length})`, icon: FileCheck },
            { id: 'products', label: `Products (${products.length})`, icon: Package },
            { id: 'qr_scanner', label: 'QR Scanner & Redeem', icon: QrCode },
            { id: 'customers', label: `Collectors (${customers.length})`, icon: Users },
            { id: 'settings', label: 'Store Governance', icon: Settings },
          ] as const
        ).map(({ id, label, icon: IconComponent }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-space text-xs font-bold tracking-wider transition-all border flex-shrink-0 ${
              activeTab === id
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'bg-white/[0.03] text-slate-400 hover:text-white border-white/[0.08] hover:bg-white/[0.06]'
            }`}
          >
            <IconComponent className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW METRICS                                  */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <div className="p-4 rounded-2xl glass-panel border border-white/[0.08] space-y-1">
              <span className="text-[10px] font-mono-code text-slate-400 uppercase tracking-wider block">
                Total Orders
              </span>
              <span className="font-space text-2xl font-bold text-white block">{totalOrders}</span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-amber-500/30 bg-amber-500/5 space-y-1">
              <span className="text-[10px] font-mono-code text-amber-400 uppercase tracking-wider block">
                Pending
              </span>
              <span className="font-space text-2xl font-bold text-amber-300 block">{pendingOrders}</span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-cyan-500/30 bg-cyan-500/5 space-y-1">
              <span className="text-[10px] font-mono-code text-cyan-400 uppercase tracking-wider block">
                Paid / Verified
              </span>
              <span className="font-space text-2xl font-bold text-cyan-300 block">{paidOrders}</span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-blue-500/30 bg-blue-500/5 space-y-1">
              <span className="text-[10px] font-mono-code text-blue-400 uppercase tracking-wider block">
                Processing
              </span>
              <span className="font-space text-2xl font-bold text-blue-300 block">{processingOrders}</span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-emerald-500/30 bg-emerald-500/5 space-y-1">
              <span className="text-[10px] font-mono-code text-emerald-400 uppercase tracking-wider block">
                Completed
              </span>
              <span className="font-space text-2xl font-bold text-emerald-300 block">{completedOrders}</span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-rose-500/30 bg-rose-500/5 space-y-1">
              <span className="text-[10px] font-mono-code text-rose-400 uppercase tracking-wider block">
                Cancelled
              </span>
              <span className="font-space text-2xl font-bold text-rose-300 block">{cancelledOrders}</span>
            </div>

            <div className="col-span-2 sm:col-span-3 lg:col-span-1 p-4 rounded-2xl glass-panel border border-emerald-500/40 bg-emerald-500/10 space-y-1">
              <span className="text-[10px] font-mono-code text-emerald-300 uppercase tracking-wider block">
                Verified Revenue
              </span>
              <span className="font-space text-xl font-bold text-emerald-400 block truncate">
                {formattedRevenue}
              </span>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="glass-panel-elevated rounded-3xl p-5 border border-white/[0.1] space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-space text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Recent System Activity</span>
              </h2>
              <button
                type="button"
                onClick={reloadData}
                className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors"
                title="Refresh Activity"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {orders.slice(0, 6).map((o) => (
                <div
                  key={o.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3 text-xs font-mono-code"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        o.status === 'payment_verified' || o.status === 'completed'
                          ? 'bg-emerald-400'
                          : o.status === 'cancelled'
                          ? 'bg-rose-400'
                          : 'bg-amber-400'
                      }`}
                    />
                    <div className="truncate">
                      <span className="font-bold text-white">Order #{o.orderNumber}</span>
                      <span className="text-slate-400 ml-2">by {o.customerEmail}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-bold text-white">{formatINR(o.subtotalMinor)}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        o.status === 'payment_verified' || o.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : o.status === 'cancelled'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: SUPPORT INBOX                                       */}
      {/* ======================================================== */}
      {activeTab === 'inbox' && <AdminChatInbox onNotify={notifySuccess} />}

      {/* ======================================================== */}
      {/* TAB: WALLET & UPI AUDIT                                  */}
      {/* ======================================================== */}
      {activeTab === 'wallet' && <AdminWalletManager onNotify={notifySuccess} />}

      {/* ======================================================== */}
      {/* TAB 2: ORDER MANAGEMENT                                  */}
      {/* ======================================================== */}
      {activeTab === 'orders' && (
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-space text-lg font-bold text-white">Order Management</h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Verify settlements, unlock digital vault deliverables, and approve collectible acquisitions.
              </p>
            </div>

            {/* Search & Status Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Order #, email, token..."
                  className="w-full glass-input pl-8 pr-3 py-1.5 rounded-xl text-xs placeholder:text-slate-500"
                />
              </div>

              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value as any)}
                className="glass-input px-3 py-1.5 rounded-xl text-xs font-mono-code"
              >
                <option value="all">All Statuses ({orders.length})</option>
                <option value="pending">Pending ({pendingOrders})</option>
                <option value="payment_verified">Paid / Verified ({paidOrders})</option>
                <option value="processing">Processing ({processingOrders})</option>
                <option value="completed">Completed ({completedOrders})</option>
                <option value="cancelled">Cancelled ({cancelledOrders})</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="glass-panel-elevated rounded-3xl border border-white/[0.1] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-code">
                <thead className="bg-white/[0.04] border-b border-white/[0.08] text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Order</th>
                    <th className="p-3.5">Collector</th>
                    <th className="p-3.5">Items</th>
                    <th className="p-3.5">Total (INR)</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Redemption</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-sans text-xs">
                        No orders match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isVerified =
                        order.status === 'payment_verified' || order.status === 'completed'

                      return (
                        <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3.5 font-bold text-white whitespace-nowrap">
                            #{order.orderNumber}
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <span className="text-white block font-sans font-medium">
                              {order.customerName || 'Valued Collector'}
                            </span>
                            <span className="text-slate-400 text-[10px] block truncate max-w-[150px]">
                              {order.customerEmail}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className="text-slate-300 block truncate max-w-[140px]">
                              {order.items.map((i) => i.productName).join(', ')}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Qty: {order.items.reduce((s, i) => s + i.quantity, 0)}
                            </span>
                          </td>

                          <td className="p-3.5 font-bold text-white whitespace-nowrap">
                            {formatINR(order.subtotalMinor)}
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                isVerified
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : order.status === 'cancelled'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            {order.isRedeemed ? (
                              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-bold border border-cyan-500/30">
                                Redeemed
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">Unredeemed</span>
                            )}
                          </td>

                          <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5 inline mr-1" />
                              View
                            </button>

                            {!isVerified && order.status !== 'cancelled' && (
                              <button
                                type="button"
                                onClick={() => handleVerifyOrder(order.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors font-bold"
                              >
                                <Check className="w-3.5 h-3.5 inline mr-1" />
                                Verify
                              </button>
                            )}

                            {order.status !== 'cancelled' && order.status !== 'completed' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                                className="px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
                                title="Cancel Order"
                              >
                                <Ban className="w-3.5 h-3.5 inline" />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PRODUCT MANAGEMENT                                */}
      {/* ======================================================== */}
      {activeTab === 'products' && (
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-space text-lg font-bold text-white">Product Catalog Management</h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Manage the 3 canonical categories (VISA, MASTERCARD, RUPAY), edition pricing in INR, and digital asset packages.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-40 sm:w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full glass-input pl-8 pr-3 py-1.5 rounded-xl text-xs placeholder:text-slate-500"
                />
              </div>

              {/* Category Filter */}
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value as any)}
                className="glass-input px-3 py-1.5 rounded-xl text-xs font-mono-code"
              >
                <option value="all">All Categories</option>
                <option value="VISA">VISA</option>
                <option value="MASTERCARD">MASTERCARD</option>
                <option value="RUPAY">RUPAY</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null)
                  setIsAddingProduct(true)
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl btn-primary text-black font-bold text-xs active:scale-95 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="glass-panel-elevated rounded-2xl border border-white/[0.1] p-4 flex flex-col justify-between space-y-3 shadow-xl"
              >
                {/* 3D Visual Preview */}
                <div className="w-full max-w-[260px] mx-auto py-1">
                  <RussianMarketCard product={p} interactive={false} />
                </div>

                <div className="space-y-2 border-t border-white/[0.08] pt-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono-code text-[9px] font-bold uppercase border ${
                        p.category === 'VISA'
                          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40'
                          : p.category === 'MASTERCARD'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-400/40'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40'
                      }`}
                    >
                      {p.category}
                    </span>

                    <span className="font-mono-code text-[10px] text-slate-400">
                      ED. #{p.editionNumber || 1} / {p.editionTotal || 50}
                    </span>
                  </div>

                  <h3 className="font-space font-bold text-sm text-white truncate" title={p.name}>
                    {p.name}
                  </h3>

                  <div className="flex items-center justify-between text-xs font-mono-code">
                    <span className="font-bold text-white">{formatINR(p.priceMinor)}</span>
                    <span
                      className={
                        p.availability === 'in_stock' ? 'text-emerald-400' : 'text-slate-500'
                      }
                    >
                      {p.availability === 'in_stock' ? 'In Stock' : 'Sold Out'}
                    </span>
                  </div>

                  {/* Product Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-1.5 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(p)
                        setIsAddingProduct(true)
                      }}
                      className="px-3 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white text-xs font-mono-code transition-colors flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p.id)}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-xs transition-colors"
                      title="Archive Product"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: QR SCANNER & DIGITAL REDEMPTION                   */}
      {/* ======================================================== */}
      {activeTab === 'qr_scanner' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="font-space text-lg font-bold text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-cyan-400" />
              <span>QR Scanner & Digital Collectible Redemption</span>
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Scan or enter order QR verification tokens to look up purchases and seal digital collectible redemption.
            </p>
          </div>

          {/* Scanner Input Box */}
          <div className="glass-panel-elevated rounded-3xl p-6 border border-white/[0.12] space-y-4 shadow-xl">
            <form onSubmit={handleScanLookup} className="space-y-3">
              <label className="block text-xs font-mono-code text-slate-300 uppercase tracking-wider">
                Enter QR Token / Order Number / Idempotency Key:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="e.g. RM-QR-XXXXX or RM-2026-XXXXXX"
                  className="flex-1 glass-input px-4 py-2.5 rounded-xl font-mono-code text-xs placeholder:text-slate-500 focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl btn-primary text-black font-bold text-xs active:scale-95 transition-all"
                >
                  Lookup Order
                </button>
              </div>
            </form>

            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-start gap-2.5 text-xs font-mono-code text-cyan-300">
              <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Cryptographic Verification Notice:</strong> QR scanning confirms legitimate token presentation. Order payment status is verified separately through our financial ledger.
              </div>
            </div>

            {qrError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-400/30 text-rose-300 text-xs font-mono-code flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{qrError}</span>
              </div>
            )}
          </div>

          {/* Scanned Order Display */}
          {scannedOrder && (
            <div className="glass-panel-elevated rounded-3xl p-6 border border-cyan-400/40 space-y-5 shadow-2xl animate-in fade-in">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <span className="font-mono-code text-[10px] text-cyan-400 uppercase tracking-widest block">
                    VERIFIED TOKEN MATCH
                  </span>
                  <h3 className="font-space text-lg font-bold text-white">
                    Order #{scannedOrder.orderNumber}
                  </h3>
                </div>

                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono-code font-bold uppercase border ${
                      scannedOrder.isRedeemed
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {scannedOrder.isRedeemed ? 'Already Redeemed' : 'Valid for Redemption'}
                  </span>
                </div>
              </div>

              {/* Order Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono-code">
                <div className="space-y-1">
                  <span className="text-slate-400 block">Collector Email:</span>
                  <span className="text-white font-bold block">{scannedOrder.customerEmail}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block">Total Settlement:</span>
                  <span className="text-white font-bold block">
                    {formatINR(scannedOrder.subtotalMinor)}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block">Payment Status:</span>
                  <span className="text-cyan-300 uppercase block font-bold">
                    {scannedOrder.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block">Redemption Token:</span>
                  <span className="text-slate-200 block truncate">
                    {scannedOrder.redemptionToken || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 border-t border-white/[0.08] pt-3">
                <span className="text-[10px] font-mono-code text-slate-400 uppercase tracking-wider block">
                  Purchased Collectible Editions:
                </span>
                {scannedOrder.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs font-mono-code"
                  >
                    <span className="text-white font-medium">{it.productName}</span>
                    <span className="text-slate-400">{formatINR(it.unitPriceMinor)}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                {scannedOrder.isRedeemed ? (
                  <div className="text-xs font-mono-code text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      Redeemed on {new Date(scannedOrder.redeemedAt || '').toLocaleString('en-IN')}{' '}
                      by {scannedOrder.redeemedBy || 'Admin'}. Duplicate redemption rejected.
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isRedeeming}
                    onClick={handleRedeemCollectible}
                    className="px-6 py-2.5 rounded-xl btn-primary text-black font-bold text-xs active:scale-95 disabled:opacity-50 transition-all shadow-lg"
                  >
                    {isRedeeming ? 'Redeeming...' : 'Confirm & Redeem Collectible'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: COLLECTORS & CUSTOMER MANAGEMENT                  */}
      {/* ======================================================== */}
      {activeTab === 'customers' && (
        <div className="max-w-7xl mx-auto space-y-4">
          <div>
            <h2 className="font-space text-lg font-bold text-white">Collector Accounts & History</h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Verified collector profiles, lifetime acquisition volume, and custodial status.
            </p>
          </div>

          <div className="glass-panel-elevated rounded-3xl border border-white/[0.1] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-code">
                <thead className="bg-white/[0.04] border-b border-white/[0.08] text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Collector Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Total Orders</th>
                    <th className="p-3.5">Lifetime Spend (INR)</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 font-sans text-xs">
                        No customer accounts registered yet.
                      </td>
                    </tr>
                  ) : (
                    customers.map((c, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="p-3.5 font-bold text-white font-sans">{c.name}</td>
                        <td className="p-3.5 text-slate-300">{c.email}</td>
                        <td className="p-3.5 font-bold text-cyan-300">{c.orders.length}</td>
                        <td className="p-3.5 font-bold text-emerald-400">
                          {formatINR(c.totalSpentMinor)}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                            Active Collector
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: STORE GOVERNANCE & SETTINGS                       */}
      {/* ======================================================== */}
      {activeTab === 'settings' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="font-space text-lg font-bold text-white">Store Governance & Policies</h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Russian Market operational parameters, currency standardization, and gateway endpoints.
            </p>
          </div>

          <div className="glass-panel-elevated rounded-3xl p-6 border border-white/[0.1] space-y-6 shadow-xl">
            {/* General Settings */}
            <div className="space-y-3">
              <h3 className="font-space font-bold text-sm text-white">General Parameters</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono-code">
                <div>
                  <label className="block text-slate-400 mb-1">STORE BRAND</label>
                  <input
                    type="text"
                    disabled
                    defaultValue={settings?.storeName || 'RUSSIAN MARKET'}
                    className="w-full glass-input px-3 py-2 rounded-xl opacity-80"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">PRIMARY CURRENCY</label>
                  <input
                    type="text"
                    disabled
                    defaultValue="INR (₹)"
                    className="w-full glass-input px-3 py-2 rounded-xl opacity-80 font-bold text-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">CONCIERGE DESK EMAIL</label>
                  <input
                    id="supportEmailInput"
                    type="email"
                    defaultValue={settings?.supportEmail || 'concierge@russianmarket.store'}
                    className="w-full glass-input px-3 py-2 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">GATEWAY STATUS</label>
                  <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>MODULAR PRODUCTION READY</span>
                  </div>
                </div>
              </div>
            </div>

            {/* UPI QR & Payment Gateway Settings */}
            <div className="space-y-3 pt-4 border-t border-white/[0.08]">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-cyan-400" />
                <h3 className="font-space font-bold text-sm text-white">UPI QR Add-Money Settings</h3>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Configure your verified merchant UPI VPA and parameters used for scannable QR generation.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono-code">
                <div>
                  <label className="block text-slate-400 mb-1">MERCHANT UPI ID (VPA) *</label>
                  <input
                    id="upiMerchantIdInput"
                    type="text"
                    defaultValue={settings?.upiMerchantId || 'russianmarket@icici'}
                    placeholder="e.g. merchant@upi"
                    className="w-full glass-input px-3 py-2 rounded-xl font-bold text-cyan-300"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">MERCHANT DISPLAY NAME *</label>
                  <input
                    id="upiMerchantNameInput"
                    type="text"
                    defaultValue={settings?.upiMerchantName || 'Russian Market Collectibles'}
                    placeholder="e.g. Russian Market"
                    className="w-full glass-input px-3 py-2 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">MINIMUM PERMITTED DEPOSIT (₹)</label>
                  <input
                    id="upiMinAmountInput"
                    type="number"
                    min="1"
                    defaultValue={settings?.upiMinAmountMinor ? settings.upiMinAmountMinor / 100 : 100}
                    className="w-full glass-input px-3 py-2 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">MAXIMUM PERMITTED DEPOSIT (₹)</label>
                  <input
                    id="upiMaxAmountInput"
                    type="number"
                    min="100"
                    defaultValue={settings?.upiMaxAmountMinor ? settings.upiMaxAmountMinor / 100 : 50000}
                    className="w-full glass-input px-3 py-2 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">PAYMENT INSTRUCTIONS</label>
                  <textarea
                    id="upiInstructionsInput"
                    rows={2}
                    defaultValue={
                      settings?.upiInstructions ||
                      'Scan with any UPI App (Google Pay, PhonePe, Paytm, BHIM, Cred). Enter your 12-digit UPI UTR number after completing payment for manual curatorial verification.'
                    }
                    className="w-full glass-input p-3 rounded-xl font-sans"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={async () => {
                  const supportEmail = (document.getElementById('supportEmailInput') as HTMLInputElement)?.value
                  const upiMerchantId = (document.getElementById('upiMerchantIdInput') as HTMLInputElement)?.value
                  const upiMerchantName = (document.getElementById('upiMerchantNameInput') as HTMLInputElement)?.value
                  const upiMinAmount = parseFloat((document.getElementById('upiMinAmountInput') as HTMLInputElement)?.value) || 100
                  const upiMaxAmount = parseFloat((document.getElementById('upiMaxAmountInput') as HTMLInputElement)?.value) || 50000
                  const upiInstructions = (document.getElementById('upiInstructionsInput') as HTMLTextAreaElement)?.value

                  await storeEngine.updateSettings({
                    supportEmail,
                    upiMerchantId,
                    upiMerchantName,
                    upiMinAmountMinor: Math.round(upiMinAmount * 100),
                    upiMaxAmountMinor: Math.round(upiMaxAmount * 100),
                    upiInstructions,
                  })
                  notifySuccess('Store governance and UPI parameters persisted successfully.')
                }}
                className="px-4 py-2 rounded-xl btn-primary text-black font-bold text-xs shadow-md"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT PRODUCT                                */}
      {/* ======================================================== */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto glass-panel-elevated rounded-3xl p-6 border border-white/[0.14] shadow-2xl">
            <button
              type="button"
              onClick={() => setIsAddingProduct(false)}
              className="absolute top-4 right-4 p-2 rounded-full glass-input text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-space text-lg font-bold text-white mb-4">
              {editingProduct ? 'Edit Collectible Edition' : 'Add New Collectible Edition'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs font-mono-code">
              <div>
                <label className="block text-slate-400 mb-1">COLLECTIBLE NAME *</label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editingProduct?.name || ''}
                  placeholder="e.g. Russian Market Sovereignty #001"
                  className="w-full glass-input px-3 py-2 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">CATEGORY (STRICTLY 3) *</label>
                  <select
                    name="category"
                    defaultValue={editingProduct?.category || 'VISA'}
                    className="w-full glass-input px-3 py-2 rounded-xl"
                  >
                    <option value="VISA">VISA</option>
                    <option value="MASTERCARD">MASTERCARD</option>
                    <option value="RUPAY">RUPAY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">SKU *</label>
                  <input
                    name="sku"
                    type="text"
                    required
                    defaultValue={editingProduct?.sku || ''}
                    placeholder="e.g. RM-SOVEREIGN-001"
                    className="w-full glass-input px-3 py-2 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">PRICE IN INR (₹) *</label>
                  <input
                    name="price"
                    type="number"
                    step="1"
                    required
                    defaultValue={
                      editingProduct ? Math.round(editingProduct.priceMinor / 100) : 1500
                    }
                    className="w-full glass-input px-3 py-2 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">DISCOUNT %</label>
                  <input
                    name="discount"
                    type="number"
                    min="0"
                    max="99"
                    defaultValue={editingProduct?.discountPercent || 0}
                    className="w-full glass-input px-3 py-2 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">EDITION NUMBER</label>
                  <input
                    name="editionNumber"
                    type="number"
                    defaultValue={editingProduct?.editionNumber || 1}
                    className="w-full glass-input px-3 py-2 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">TOTAL EDITIONS</label>
                  <input
                    name="editionTotal"
                    type="number"
                    defaultValue={editingProduct?.editionTotal || 50}
                    className="w-full glass-input px-3 py-2 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">STOCK QUANTITY</label>
                  <input
                    name="stock"
                    type="number"
                    defaultValue={editingProduct?.stockCount ?? 10}
                    className="w-full glass-input px-3 py-2 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">AVAILABILITY</label>
                  <select
                    name="availability"
                    defaultValue={editingProduct?.availability || 'in_stock'}
                    className="w-full glass-input px-3 py-2 rounded-xl"
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingProduct(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl btn-primary text-black font-bold text-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ORDER DETAILS                                     */}
      {/* ======================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto glass-panel-elevated rounded-3xl p-6 border border-white/[0.14] shadow-2xl space-y-4 text-xs font-mono-code">
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-2 rounded-full glass-input text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] text-cyan-400 uppercase tracking-widest block mb-0.5">
                ORDER AUDIT RECORD
              </span>
              <h3 className="font-space text-lg font-bold text-white">
                #{selectedOrder.orderNumber}
              </h3>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="text-white font-bold">{selectedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-200">{selectedOrder.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Settlement:</span>
                <span className="text-emerald-400 font-bold">
                  {formatINR(selectedOrder.subtotalMinor)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-cyan-300 uppercase font-bold">{selectedOrder.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Redemption Token:</span>
                <span className="text-white truncate max-w-[200px]">
                  {selectedOrder.redemptionToken || 'N/A'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider block">
                Acquired Items:
              </span>
              {selectedOrder.items.map((it, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-white block">{it.productName}</span>
                    <span className="text-[10px] text-slate-500">
                      Digital Asset: {it.digitalAssetName}
                    </span>
                  </div>
                  <span className="text-white font-bold">{formatINR(it.unitPriceMinor)}</span>
                </div>
              ))}
            </div>

            {/* Actions in Order Dialog */}
            <div className="pt-2 flex justify-between items-center border-t border-white/[0.08]">
              {selectedOrder.status === 'pending' ? (
                <button
                  type="button"
                  onClick={() => handleVerifyOrder(selectedOrder.id)}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40 text-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Verify Settlement & Unlock Assets</span>
                </button>
              ) : (
                <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Settlement Verified</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl btn-primary text-black font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
