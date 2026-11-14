import { useEffect, useState } from 'react'
import {
  X,
  FileCheck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  Download,
} from 'lucide-react'
import { storeEngine, type Order } from '../../services/storeEngine'
import { formatINR } from '../../lib/currency'
import type { OrderStatus } from '../../types/database'

type MyOrdersModalProps = {
  isOpen: boolean
  onClose: () => void
  userId: string
  onOpenVault: () => void
}

export function MyOrdersModal({
  isOpen,
  onClose,
  userId,
  onOpenVault,
}: MyOrdersModalProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('all')

  useEffect(() => {
    if (!isOpen) return
    const fetchOrders = async () => {
      setLoading(true)
      const list = await storeEngine.getOrders(userId)
      setOrders(list)
      setLoading(false)
    }
    fetchOrders()

    const unsubscribe = storeEngine.subscribe((event) => {
      if (event === 'order_updated' || event === 'order_created') {
        fetchOrders()
      }
    })
    return () => unsubscribe()
  }, [isOpen, userId])

  if (!isOpen) return null

  const filteredOrders = orders.filter((o) => {
    const isVerified =
      o.status === 'payment_verified' || o.status === 'processing' || o.status === 'completed'
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'pending'
        ? o.status === 'pending'
        : isVerified

    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      o.items.some((it) => it.productName.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q))

    return matchesFilter && matchesSearch
  })

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-0.5 rounded font-mono-code text-[10px] uppercase bg-amber-500/10 text-[#fbbf24] border border-amber-500/20 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] animate-pulse" />
            Pending settlement
          </span>
        )
      case 'payment_verified':
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded font-mono-code text-[10px] uppercase bg-emerald-500/10 text-[#34d399] border border-emerald-500/20 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
            Vault unlocked
          </span>
        )
      case 'processing':
        return (
          <span className="px-2 py-0.5 rounded font-mono-code text-[10px] uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Processing token
          </span>
        )
      case 'failed':
      case 'cancelled':
      case 'expired':
      case 'refunded':
        return (
          <span className="px-2 py-0.5 rounded font-mono-code text-[10px] uppercase bg-rose-500/10 text-[#f87171] border border-rose-500/20 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f87171]" />
            {status}
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0c0e13] rounded-3xl p-5 sm:p-7 border border-white/[0.1] shadow-2xl animate-in zoom-in-95 duration-150 space-y-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="orders-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-[#181c25] border border-white/[0.08] text-slate-400 hover:text-white transition-colors"
          aria-label="Close orders"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#181c25] border border-white/[0.1] flex items-center justify-center text-white shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 id="orders-title" className="font-space text-lg sm:text-xl font-semibold text-[#ededed]">
              My Orders & Acquisitions
            </h2>
            <p className="text-[11px] sm:text-xs text-[#9499a6] font-sans">
              Recorded cryptographic purchases, settlement timelines, and vault delivery certificates
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order # or item..."
              className="w-full h-9 bg-[#181c25] border border-white/[0.08] focus:border-white/30 pl-8 pr-3 rounded-xl text-xs text-white placeholder:text-slate-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#12151c] p-1 rounded-xl border border-white/[0.06] shrink-0">
            {(['all', 'pending', 'verified'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-lg font-mono-code text-[10px] font-medium transition-colors ${
                  filter === tab
                    ? 'bg-[#181c25] text-white border border-white/20'
                    : 'text-[#9499a6] hover:text-white'
                }`}
              >
                {tab === 'all' ? 'All Orders' : tab === 'pending' ? 'Pending' : 'Unlocked'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[#9499a6] text-xs font-mono-code animate-pulse">
            Retrieving sovereign order records...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center space-y-2 bg-[#12151c] rounded-2xl border border-white/[0.06] p-6">
            <FileCheck className="w-9 h-9 text-[#666b7a] mx-auto" />
            <h3 className="font-space font-medium text-[#ededed] text-sm">
              No orders found
            </h3>
            <p className="text-xs text-[#9499a6] max-w-xs mx-auto font-sans">
              {search || filter !== 'all'
                ? 'No acquisitions match the selected filter.'
                : 'Acquired collectible orders will be registered here with real-time settlement tracking.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
              const formattedTotal = formatINR(order.subtotalMinor)
              const isVerified =
                order.status === 'payment_verified' ||
                order.status === 'processing' ||
                order.status === 'completed'

              return (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#12151c] border border-white/[0.07] space-y-3 shadow-lg"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-space font-semibold text-sm sm:text-base text-[#ededed]">
                          #{order.orderNumber}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <span className="text-[10px] font-mono-code text-[#666b7a] block mt-0.5">
                        {formattedDate} • {order.paymentMethod.toUpperCase()}
                      </span>
                    </div>

                    <span className="font-space font-bold text-base sm:text-lg text-[#ededed] tabular-nums">
                      {formattedTotal}
                    </span>
                  </div>

                  {/* 4-Step Order Lifecycle Timeline */}
                  <div className="py-2 px-3 rounded-xl bg-black/40 border border-white/[0.05] space-y-2">
                    <span className="text-[9px] font-mono-code uppercase tracking-wider text-white/40 block">
                      Settlement Lifecycle Timeline
                    </span>
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      {/* Step 1: Created */}
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                        <span className="text-[9px] font-mono-code text-white/80 mt-1">Created</span>
                        <span className="text-[8px] font-mono-code text-white/40">Sealed</span>
                      </div>

                      {/* Step 2: Payment */}
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                        <span className="text-[9px] font-mono-code text-white/80 mt-1">Payment</span>
                        <span className="text-[8px] font-mono-code text-white/40">Logged</span>
                      </div>

                      {/* Step 3: Verification Audit */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                            isVerified
                              ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-400'
                              : 'bg-amber-500/20 border border-amber-400 text-amber-400'
                          }`}
                        >
                          {isVerified ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3 animate-spin" />
                          )}
                        </div>
                        <span className="text-[9px] font-mono-code text-white/80 mt-1">Audit</span>
                        <span
                          className={`text-[8px] font-mono-code ${
                            isVerified ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {isVerified ? 'Verified' : 'In Review'}
                        </span>
                      </div>

                      {/* Step 4: Vault Delivery */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                            isVerified
                              ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-400'
                              : 'bg-white/5 border border-white/10 text-white/30'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                        </div>
                        <span
                          className={`text-[9px] font-mono-code mt-1 ${
                            isVerified ? 'text-emerald-400 font-semibold' : 'text-white/40'
                          }`}
                        >
                          Vault
                        </span>
                        <span className="text-[8px] font-mono-code text-white/40">
                          {isVerified ? 'Unlocked' : 'Locked'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div className="space-y-1.5 text-xs font-mono-code">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between text-[#ededed]"
                      >
                        <div className="truncate max-w-[200px] sm:max-w-[320px]">
                          <span className="font-medium block truncate">{item.productName}</span>
                          <span className="text-[10px] text-[#666b7a]">
                            {item.sku} • Qty: {item.quantity}
                          </span>
                        </div>
                        <span className="text-[#ededed] font-medium text-xs tabular-nums">
                          {formatINR(item.unitPriceMinor * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions / Status Timeline Info */}
                  <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] text-[#9499a6] font-sans">
                      {order.status === 'pending'
                        ? 'Payment logged. Our curatorial audit officer verifies bank settlements every 2 minutes.'
                        : 'Settlement confirmed. Master cryptographic assets unlocked in your Digital Vault.'}
                    </p>

                    {isVerified ? (
                      <button
                        type="button"
                        onClick={() => {
                          onClose()
                          onOpenVault()
                        }}
                        className="px-3.5 py-1.5 rounded-xl btn-primary text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Access Vault Asset</span>
                      </button>
                    ) : (
                      <span className="font-mono-code text-[10px] text-[#fbbf24] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Curatorial Audit Standby</span>
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyOrdersModal
