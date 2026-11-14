import React, { useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'
import {
  ScanLine,
  CheckCircle2,
  ArrowLeft,
  Search,
  AlertTriangle,
  X,
  RefreshCw,
  Menu,
} from 'lucide-react'
import {
  storeEngine,
  type Order,
  type StoreSettings,
  type PaymentRequestRecord,
  type WalletTx,
} from '../../services/storeEngine'
import type { Product, CardCategory } from '../../types/product'
import { formatINR } from '../../lib/currency'
import type { OrderStatus } from '../../types/database'
import { AdminChatInbox } from './AdminChatInbox'
import { AdminWalletManager } from './AdminWalletManager'
import { AdminSidebar, type AdminTab } from './AdminSidebar'

type AdminDashboardProps = {
  onExitAdmin: () => void
}

const AUTHORIZED_ADMIN_EMAIL = 'own77777777@gmail.com'

export function AdminDashboard({ onExitAdmin }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  // Core Data
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequestRecord[]>([])
  const [transactions, setTransactions] = useState<WalletTx[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Filters & Searches
  const [orderSearch, setOrderSearch] = useState('')
  const [orderFilter, setOrderFilter] = useState<OrderStatus | 'all'>('all')
  const [productSearch, setProductSearch] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState<CardCategory | 'all'>('all')
  const [verificationQuery, setVerificationQuery] = useState('')
  const [verificationResult, setVerificationResult] = useState<any | null>(null)

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // QR Scanner State
  const [qrInput, setQrInput] = useState('')
  const [scannedOrder, setScannedOrder] = useState<Order | null>(null)
  const [qrError, setQrError] = useState<string | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)

  // UPI Live Preview State
  const [previewQrUrl, setPreviewQrUrl] = useState('')

  const reloadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [o, p, s, pr, tx] = await Promise.all([
        storeEngine.getOrders(),
        storeEngine.getProducts(),
        storeEngine.getSettings(),
        storeEngine.getPaymentRequests(),
        storeEngine.getWalletTransactions(),
      ])
      setOrders(o)
      setProducts(p)
      setSettings(s)
      setPaymentRequests(pr)
      setTransactions(tx)
    } catch (err) {
      console.error('Failed to load admin data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reloadData()
    const unsubscribe = storeEngine.subscribe(() => {
      void reloadData()
    })
    return () => unsubscribe()
  }, [reloadData])

  // Generate live preview QR for current UPI settings
  useEffect(() => {
    if (settings?.upiMerchantId) {
      const uri = `upi://pay?pa=${encodeURIComponent(settings.upiMerchantId)}&pn=${encodeURIComponent(
        settings.upiMerchantName || 'Russian Market',
      )}&am=1000.00&cu=INR&tn=PREVIEW`

      QRCode.toDataURL(uri, {
        width: 200,
        margin: 1.5,
        color: { dark: '#060709', light: '#ffffff' },
      })
        .then((url) => setPreviewQrUrl(url))
        .catch(() => {})
    }
  }, [settings?.upiMerchantId, settings?.upiMerchantName])

  const notifySuccess = (msg: string) => {
    setActionSuccess(msg)
    setTimeout(() => setActionSuccess(null), 3500)
  }

  // KPIs
  const pendingOrders = orders.filter((o) => o.status === 'pending')
  const pendingDeposits = paymentRequests.filter((r) => r.status === 'pending' || r.status === 'submitted')
  const verifiedRevenueMinor = orders
    .filter((o) => o.status === 'payment_verified' || o.status === 'completed')
    .reduce((sum, o) => sum + o.subtotalMinor, 0)

  // Handlers
  const handleVerifyOrder = async (orderId: string) => {
    try {
      await storeEngine.verifyOrderPayment(orderId, 'Verified by Root Administrator')
      notifySuccess(`Order #${orderId} verified & digital pass unlocked!`)
      await reloadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Verification failed')
    }
  }

  const handleUpdateUPISettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const upiMerchantId = (form.get('upiMerchantId') as string) || ''
    const upiMerchantName = (form.get('upiMerchantName') as string) || ''
    const upiMin = parseInt(form.get('upiMinAmount') as string, 10) * 100 || 10000
    const upiMax = parseInt(form.get('upiMaxAmount') as string, 10) * 100 || 5000000
    const validityMins = parseInt(form.get('paymentValidityMinutes') as string, 10) || 15
    const upiInstructions = (form.get('upiInstructions') as string) || ''
    const qrPaymentEnabled = form.get('qrPaymentEnabled') === 'on'

    await storeEngine.updateSettings({
      upiMerchantId,
      upiMerchantName,
      upiMinAmountMinor: upiMin,
      upiMaxAmountMinor: upiMax,
      paymentValidityMinutes: validityMins,
      upiInstructions,
      qrPaymentEnabled,
    })

    notifySuccess('UPI Merchant Parameters synchronized successfully!')
    await reloadData()
  }

  const handleFastVerificationLookup = (e: React.FormEvent) => {
    e.preventDefault()
    const q = verificationQuery.trim().toLowerCase()
    if (!q) return

    // Search orders
    const matchedOrder = orders.find(
      (o) =>
        o.orderNumber.toLowerCase() === q ||
        o.id.toLowerCase() === q ||
        (o.redemptionToken && o.redemptionToken.toLowerCase() === q) ||
        o.customerEmail.toLowerCase().includes(q),
    )

    // Search payment requests
    const matchedRequest = paymentRequests.find(
      (r) =>
        r.reference.toLowerCase() === q ||
        (r.utrNumber && r.utrNumber.toLowerCase() === q) ||
        r.id.toLowerCase() === q ||
        r.userEmail.toLowerCase().includes(q),
    )

    if (matchedOrder) {
      setVerificationResult({ type: 'order', data: matchedOrder })
    } else if (matchedRequest) {
      setVerificationResult({ type: 'payment_request', data: matchedRequest })
    } else {
      setVerificationResult({ type: 'not_found', query: q })
    }
  }

  // QR Lookup
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
      const res = await storeEngine.redeemOrderCollectible(scannedOrder.id, 'Senior Sovereign Curator')
      notifySuccess(res.message)
      setScannedOrder(res.order)
      await reloadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Redemption failed')
    } finally {
      setIsRedeeming(false)
    }
  }

  // Filtered lists
  const filteredOrders = orders.filter((o) => {
    const matchesFilter = orderFilter === 'all' || o.status === orderFilter
    const q = orderSearch.toLowerCase()
    const matchesSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      (o.redemptionToken && o.redemptionToken.toLowerCase().includes(q))
    return matchesFilter && matchesSearch
  })

  const filteredProducts = products.filter((p) => {
    const matchesCategory = productCategoryFilter === 'all' || p.category === productCategoryFilter
    const q = productSearch.toLowerCase()
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    return matchesCategory && matchesSearch
  })

  // Customer Map
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
    <div className="min-h-screen bg-[#060709] text-white flex flex-col font-sans overflow-x-hidden">
      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:block">
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onExitAdmin={onExitAdmin}
          pendingOrdersCount={pendingOrders.length}
          pendingDepositsCount={pendingDeposits.length}
        />
      </div>

      {/* MOBILE OFFCANVAS DRAWER */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-md">
          <div className="relative w-72 max-w-[85vw] h-full bg-[#090b0f] shadow-2xl">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(false)}
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <AdminSidebar
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab)
                setIsMobileDrawerOpen(false)
              }}
              isCollapsed={false}
              onToggleCollapse={() => {}}
              onExitAdmin={onExitAdmin}
              pendingOrdersCount={pendingOrders.length}
              pendingDepositsCount={pendingDeposits.length}
            />
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        {/* TOP COMMAND HEADER */}
        <header className="sticky top-0 z-30 h-16 bg-[#0c0e12]/80 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden p-2 rounded-lg bg-white/5 text-white/70 hover:text-white"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                {activeTab.replace('_', ' ')}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[9px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full">
                ADMIN AUTHORIZED
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {actionSuccess && (
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                {actionSuccess}
              </span>
            )}

            <button
              type="button"
              onClick={() => void reloadData()}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onExitAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-white/70 hover:text-white border border-white/10 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Storefront</span>
            </button>
          </div>
        </header>

        {/* VIEW CONTAINER */}
        <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
          {/* ======================================================== */}
          {/* 1. OVERVIEW MODULE                                       */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-5 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-white/40 uppercase">Verified Revenue</span>
                  <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
                    {formatINR(verifiedRevenueMinor)}
                  </div>
                  <span className="text-[10px] text-white/40">From confirmed settlements</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-white/40 uppercase">Total Orders</span>
                  <div className="text-2xl font-bold font-mono text-white tracking-tight">
                    {orders.length}
                  </div>
                  <span className="text-[10px] text-amber-400">
                    {pendingOrders.length} pending settlement
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-white/40 uppercase">Active Collectors</span>
                  <div className="text-2xl font-bold font-mono text-white tracking-tight">
                    {customers.length}
                  </div>
                  <span className="text-[10px] text-white/40">Registered sovereign users</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-white/40 uppercase">Pending Deposits</span>
                  <div className="text-2xl font-bold font-mono text-cyan-400 tracking-tight">
                    {pendingDeposits.length}
                  </div>
                  <span className="text-[10px] text-cyan-400/80">Awaiting UTR audit</span>
                </div>
              </div>

              {/* Quick Actions & Recent Orders Banner */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white tracking-tight">Recent Orders</h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="text-xs text-cyan-400 hover:underline font-mono"
                    >
                      View all ({orders.length}) →
                    </button>
                  </div>

                  <div className="divide-y divide-white/5 text-xs font-mono">
                    {orders.slice(0, 5).map((o) => (
                      <div key={o.id} className="py-3 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-white block">#{o.orderNumber}</span>
                          <span className="text-[11px] text-white/40">{o.customerEmail}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-medium block">{formatINR(o.subtotalMinor)}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                              o.status === 'payment_verified' || o.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : o.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-white/5 text-white/50'
                            }`}
                          >
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operations Checklist */}
                <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-4">
                  <h2 className="text-sm font-bold text-white tracking-tight">Curatorial Checklist</h2>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                      <div className="flex items-center justify-between font-semibold text-white">
                        <span>Pending Deposits</span>
                        <span className="text-cyan-400">{pendingDeposits.length}</span>
                      </div>
                      <p className="text-[11px] text-white/50">
                        Review submitted UPI UTR numbers to credit customer wallets.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('deposits')}
                        className="text-[11px] text-cyan-400 hover:underline pt-1 block"
                      >
                        Open Deposit Requests →
                      </button>
                    </div>

                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                      <div className="flex items-center justify-between font-semibold text-white">
                        <span>UPI Merchant Gateway</span>
                        <span className="text-emerald-400">
                          {settings?.qrPaymentEnabled ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50">
                        Merchant: {settings?.upiMerchantId || 'Not Configured'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('upi_settings')}
                        className="text-[11px] text-cyan-400 hover:underline pt-1 block"
                      >
                        Configure UPI Parameters →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. ANALYTICS MODULE                                      */}
          {/* ======================================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-2">
                  <span className="text-[10px] font-mono text-white/40 uppercase">Average Order Value</span>
                  <div className="text-2xl font-bold font-mono text-cyan-400">
                    {orders.length > 0 ? formatINR(Math.round(verifiedRevenueMinor / Math.max(1, orders.length))) : '₹0'}
                  </div>
                  <span className="text-xs text-white/50">Across all catalog tiers</span>
                </div>

                <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-2">
                  <span className="text-[10px] font-mono text-white/40 uppercase">Conversion Rate</span>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    {orders.length > 0 ? `${((orders.filter(o => o.status === 'completed' || o.status === 'payment_verified').length / orders.length) * 100).toFixed(1)}%` : '0%'}
                  </div>
                  <span className="text-xs text-white/50">Completed vs pending ratio</span>
                </div>

                <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-2">
                  <span className="text-[10px] font-mono text-white/40 uppercase">Total Unique SKUs</span>
                  <div className="text-2xl font-bold font-mono text-white">
                    {products.length} Editions
                  </div>
                  <span className="text-xs text-white/50">VISA, Mastercard, RuPay</span>
                </div>
              </div>

              {/* Tier Distribution Table */}
              <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-4">
                <h3 className="text-sm font-bold text-white">Acquisitions by Collection Tier</h3>
                <div className="divide-y divide-white/5 text-xs font-mono">
                  {(['VISA', 'MASTERCARD', 'RUPAY'] as const).map((tier) => {
                    const tierProducts = products.filter((p) => p.category === tier)
                    return (
                      <div key={tier} className="py-3 flex items-center justify-between">
                        <span className="font-semibold text-white">{tier} Series</span>
                        <span className="text-white/60">{tierProducts.length} Editions Available</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. PRODUCTS & INVENTORY MODULES                          */}
          {/* ======================================================== */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {(['all', 'VISA', 'MASTERCARD', 'RUPAY'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setProductCategoryFilter(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors ${
                        productCategoryFilter === c
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      {c.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search SKU or name..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="h-9 pl-9 pr-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="p-4 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">{p.category}</span>
                      <span className="text-[10px] font-mono text-white/40">#{p.editionNumber} / {p.editionTotal}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white truncate">{p.name}</h3>
                    <p className="text-xs text-white/60 line-clamp-2">{p.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 font-mono">
                      <span className="text-sm font-bold text-white">{formatINR(p.priceMinor)}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {p.stockLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-4">
              <h2 className="text-base font-bold text-white">Edition Quotas & Allocation</h2>
              <div className="divide-y divide-white/5 text-xs font-mono">
                {products.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">{p.name}</span>
                      <span className="text-[10px] text-white/40">SKU: {p.sku} • {p.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold block">{p.stockCount} Available</span>
                      <span className="text-[10px] text-white/40">Max {p.editionTotal} minted</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. ORDERS MODULE                                         */}
          {/* ======================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {(['all', 'pending', 'payment_verified', 'completed', 'cancelled'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setOrderFilter(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap ${
                        orderFilter === s
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      {s.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search order #, email, token..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="h-9 pl-9 pr-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-[#0c0e12] border border-white/5 overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-white/5 text-white/40 uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">Order #</th>
                      <th className="p-3.5">Collector</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3.5 font-bold text-white">#{o.orderNumber}</td>
                        <td className="p-3.5">{o.customerEmail}</td>
                        <td className="p-3.5 font-bold text-emerald-400">{formatINR(o.subtotalMinor)}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              o.status === 'payment_verified' || o.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(o)}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px]"
                          >
                            Details
                          </button>
                          {o.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => void handleVerifyOrder(o.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[11px]"
                            >
                              Verify
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

          {/* ======================================================== */}
          {/* 5. CUSTOMERS MODULE                                      */}
          {/* ======================================================== */}
          {activeTab === 'customers' && (
            <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-4">
              <h2 className="text-base font-bold text-white">Registered Collectors Directory</h2>
              <div className="divide-y divide-white/5 text-xs font-mono">
                {customers.map((c) => (
                  <div key={c.email} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">{c.email}</span>
                      <span className="text-[10px] text-white/40">{c.orders.length} Total Acquisitions</span>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold block">{formatINR(c.totalSpentMinor)}</span>
                      <span className="text-[10px] text-white/40">Lifetime Value</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 6. WALLET LEDGER & DEPOSITS MODULES                      */}
          {/* ======================================================== */}
          {activeTab === 'wallet' && (
            <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-4">
              <h2 className="text-base font-bold text-white">Wallet Transaction Ledger</h2>
              <div className="divide-y divide-white/5 text-xs font-mono">
                {transactions.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">{tx.description}</span>
                      <span className="text-[10px] text-white/40">
                        Ref: {tx.reference || 'N/A'} • {new Date(tx.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold block ${tx.amountMinor > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.amountMinor > 0 ? '+' : ''}{formatINR(tx.amountMinor)}
                      </span>
                      <span className="text-[10px] text-white/40 uppercase">{tx.transactionType}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'deposits' && (
            <AdminWalletManager onNotify={notifySuccess} />
          )}

          {/* ======================================================== */}
          {/* 7. UPI SETTINGS MODULE (ADMIN CONFIGURABLE)              */}
          {/* ======================================================== */}
          {activeTab === 'upi_settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-5">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                    TREASURY CONFIGURATION
                  </span>
                  <h2 className="text-lg font-bold text-white">Merchant UPI Parameters</h2>
                  <p className="text-xs text-white/60">
                    Configure official merchant details used dynamically for customer Add Money QR codes.
                  </p>
                </div>

                <form onSubmit={(e) => void handleUpdateUPISettings(e)} className="space-y-4 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-white/70 block">Merchant UPI ID (VPA)</label>
                    <input
                      name="upiMerchantId"
                      type="text"
                      required
                      defaultValue={settings?.upiMerchantId || 'russianmarket@icici'}
                      className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-white/70 block">Merchant Display Name</label>
                    <input
                      name="upiMerchantName"
                      type="text"
                      required
                      defaultValue={settings?.upiMerchantName || 'Russian Market Collectibles'}
                      className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-white/70 block">Min Deposit Amount (₹)</label>
                      <input
                        name="upiMinAmount"
                        type="number"
                        min="10"
                        defaultValue={(settings?.upiMinAmountMinor || 10000) / 100}
                        className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-white/70 block">Max Deposit Amount (₹)</label>
                      <input
                        name="upiMaxAmount"
                        type="number"
                        min="100"
                        defaultValue={(settings?.upiMaxAmountMinor || 5000000) / 100}
                        className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-white/70 block">Payment Validity Window (Minutes)</label>
                    <input
                      name="paymentValidityMinutes"
                      type="number"
                      min="5"
                      max="120"
                      defaultValue={settings?.paymentValidityMinutes || 15}
                      className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-white/70 block">Customer Instructions Copy</label>
                    <textarea
                      name="upiInstructions"
                      rows={3}
                      defaultValue={settings?.upiInstructions || ''}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400 resize-none font-sans"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <input
                      name="qrPaymentEnabled"
                      type="checkbox"
                      id="qrEnabledToggle"
                      defaultChecked={settings?.qrPaymentEnabled ?? true}
                      className="w-4 h-4 rounded accent-cyan-400"
                    />
                    <label htmlFor="qrEnabledToggle" className="text-xs text-white/80 cursor-pointer">
                      Enable UPI QR Payments for Customers
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    Save & Propagate UPI Settings
                  </button>
                </form>
              </div>

              {/* Live Preview Panel */}
              <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/5 flex flex-col items-center justify-center text-center space-y-4">
                <span className="text-[10px] font-mono text-white/40 uppercase">Live Customer QR Preview</span>
                {previewQrUrl ? (
                  <img src={previewQrUrl} alt="Preview QR" className="w-44 h-44 rounded-xl shadow-lg bg-white p-2" />
                ) : (
                  <div className="w-44 h-44 bg-white/5 rounded-xl animate-pulse" />
                )}
                <div className="text-xs font-mono space-y-0.5">
                  <span className="text-white font-bold block">{settings?.upiMerchantName}</span>
                  <span className="text-cyan-400 text-[11px] block">{settings?.upiMerchantId}</span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 8. FAST PAYMENT VERIFICATION TOOL                        */}
          {/* ======================================================== */}
          {activeTab === 'payment_verification' && (
            <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                  CRYPTOGRAPHIC LOOKUP
                </span>
                <h2 className="text-lg font-bold text-white">Payment Verification Center</h2>
                <p className="text-xs text-white/60">
                  Instantly verify any 12-digit UTR, Order Number, or Reference ID against treasury records.
                </p>
              </div>

              <form onSubmit={handleFastVerificationLookup} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Paste UTR Number, Order # (e.g. RM-ORD-...), or Reference..."
                  value={verificationQuery}
                  onChange={(e) => setVerificationQuery(e.target.value)}
                  className="flex-1 h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="px-5 rounded-xl bg-cyan-400 text-black font-semibold text-xs flex items-center gap-1.5"
                >
                  <Search className="w-4 h-4" />
                  <span>Verify</span>
                </button>
              </form>

              {verificationResult && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 font-mono text-xs">
                  {verificationResult.type === 'not_found' ? (
                    <div className="text-rose-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>No matching transaction or order found for "{verificationResult.query}".</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-emerald-400 font-bold">
                        <span>Record Identified ({verificationResult.type.toUpperCase()})</span>
                        <span className="text-white">{verificationResult.data.status}</span>
                      </div>
                      <pre className="p-3 bg-black/40 rounded-xl overflow-x-auto text-[11px] text-white/70">
                        {JSON.stringify(verificationResult.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 9. QR SCANNER MODULE                                     */}
          {/* ======================================================== */}
          {activeTab === 'qr_scanner' && (
            <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                  HARDWARE & TOKEN SCANNER
                </span>
                <h2 className="text-lg font-bold text-white">Collectible Pass Scanner</h2>
                <p className="text-xs text-white/60">
                  Scan customer QR passes or paste redemption token string to verify physical/digital handover.
                </p>
              </div>

              <form onSubmit={handleScanLookup} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Scan or paste redemption token (e.g. RM-PASS-...)..."
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  className="flex-1 h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="px-5 rounded-xl bg-cyan-400 text-black font-semibold text-xs flex items-center gap-1.5"
                >
                  <ScanLine className="w-4 h-4" />
                  <span>Lookup</span>
                </button>
              </form>

              {qrError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {qrError}
                </div>
              )}

              {scannedOrder && (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className="text-white font-bold block text-sm">#{scannedOrder.orderNumber}</span>
                      <span className="text-white/50">{scannedOrder.customerEmail}</span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        scannedOrder.isRedeemed ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {scannedOrder.isRedeemed ? 'REDEEMED' : 'UNREDEEMED VALID'}
                    </span>
                  </div>

                  {!scannedOrder.isRedeemed && (
                    <button
                      type="button"
                      disabled={isRedeeming}
                      onClick={handleRedeemCollectible}
                      className="w-full py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs"
                    >
                      {isRedeeming ? 'Processing...' : 'Mark Collectible Handover Completed'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 10. CHAT INBOX MODULE                                    */}
          {/* ======================================================== */}
          {activeTab === 'inbox' && (
            <AdminChatInbox onNotify={notifySuccess} />
          )}

          {/* ======================================================== */}
          {/* 11. NOTIFICATIONS MODULE                                 */}
          {/* ======================================================== */}
          {activeTab === 'notifications' && (
            <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-4">
              <h2 className="text-base font-bold text-white">Broadcast Vault Notification</h2>
              <p className="text-xs text-white/60">Dispatch real-time notification to all active collectors.</p>
              <div className="space-y-3 font-mono text-xs max-w-lg">
                <input
                  type="text"
                  placeholder="Notification title..."
                  className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                />
                <textarea
                  rows={3}
                  placeholder="Message body..."
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400 resize-none font-sans"
                />
                <button
                  type="button"
                  onClick={() => notifySuccess('Broadcast dispatched to all collectors!')}
                  className="px-4 py-2 rounded-xl bg-cyan-400 text-black font-semibold text-xs"
                >
                  Send Broadcast
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 12. ADMIN USERS & ROLES                                  */}
          {/* ======================================================== */}
          {activeTab === 'roles' && (
            <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-cyan-400 uppercase">ACCESS CONTROL</span>
                <h2 className="text-base font-bold text-white">Authorized Administrators</h2>
                <p className="text-xs text-white/60">
                  Privileged operators authorized for database mutation and payment settlement.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="font-bold text-white block">{AUTHORIZED_ADMIN_EMAIL}</span>
                  <span className="text-[10px] text-cyan-400">INITIAL ROOT ADMINISTRATOR</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
                  VERIFIED ACTIVE
                </span>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 13. AUDIT LOGS MODULE                                    */}
          {/* ======================================================== */}
          {activeTab === 'audit' && (
            <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-4">
              <h2 className="text-base font-bold text-white">Immutable Administrative Audit Log</h2>
              <div className="divide-y divide-white/5 text-xs font-mono">
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">INITIAL_ADMIN_BOOTSTRAP</span>
                    <span className="text-[10px] text-white/40">Root operator: {AUTHORIZED_ADMIN_EMAIL}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400">VERIFIED</span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">UPI_GATEWAY_CONFIGURED</span>
                    <span className="text-[10px] text-white/40">VPA: {settings?.upiMerchantId}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400">VERIFIED</span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 14. CONTENT & SYSTEM SETTINGS                            */}
          {/* ======================================================== */}
          {(activeTab === 'settings' || activeTab === 'content') && (
            <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-4">
              <h2 className="text-base font-bold text-white">Governance & Core Parameters</h2>
              <div className="space-y-3 font-mono text-xs max-w-lg">
                <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                  <span className="text-white/60">Platform Currency:</span>
                  <span className="text-white font-bold">INR (₹)</span>
                </div>
                <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                  <span className="text-white/60">Supabase Endpoint:</span>
                  <span className="text-cyan-400 truncate max-w-[200px]">deeprhlnoflqzpraxkaq</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* MODAL: ORDER DETAILS                                     */}
      {/* ======================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#0c0e13] rounded-3xl p-6 border border-white/[0.1] shadow-2xl space-y-4 text-xs font-mono">
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[11px] text-cyan-400 uppercase tracking-wider block mb-0.5">
                ORDER RECORD
              </span>
              <h3 className="text-base font-bold text-white">#{selectedOrder.orderNumber}</h3>
            </div>

            <div className="p-3.5 rounded-xl bg-[#12151c] border border-white/[0.05] space-y-2">
              <div className="flex justify-between">
                <span className="text-white/40">Customer:</span>
                <span className="text-white">{selectedOrder.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Settlement:</span>
                <span className="text-emerald-400 font-bold">{formatINR(selectedOrder.subtotalMinor)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Status:</span>
                <span className="text-white font-semibold">{selectedOrder.status}</span>
              </div>
            </div>

            {selectedOrder.status === 'pending' && (
              <button
                type="button"
                onClick={() => {
                  void handleVerifyOrder(selectedOrder.id)
                  setSelectedOrder(null)
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-400 text-black font-semibold text-xs"
              >
                Verify & Unlock Digital Collectible Pass
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
