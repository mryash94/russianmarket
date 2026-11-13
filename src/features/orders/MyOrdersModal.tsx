import { useEffect, useState } from 'react'
import {
  X,
  FileCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
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

  useEffect(() => {
    if (!isOpen) return
    const fetchOrders = async () => {
      setLoading(true)
      const list = await storeEngine.getOrders(userId)
      setOrders(list)
      setLoading(false)
    }
    fetchOrders()

    // Realtime subscription for order updates
    const unsubscribe = storeEngine.subscribe((event) => {
      if (event === 'order_updated' || event === 'order_created') {
        fetchOrders()
      }
    })
    return () => unsubscribe()
  }, [isOpen, userId])

  if (!isOpen) return null

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-0.5 rounded-full font-mono-code text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin" />
            Pending Payment
          </span>
        )
      case 'payment_verified':
        return (
          <span className="px-2.5 py-0.5 rounded-full font-mono-code text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Payment Verified
          </span>
        )
      case 'processing':
        return (
          <span className="px-2.5 py-0.5 rounded-full font-mono-code text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Processing Vault Token
          </span>
        )
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full font-mono-code text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Vault Delivered
          </span>
        )
      case 'failed':
      case 'cancelled':
      case 'expired':
      case 'refunded':
        return (
          <span className="px-2.5 py-0.5 rounded-full font-mono-code text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {status}
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel-elevated rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/[0.12] shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="orders-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full glass-input text-slate-400 hover:text-white"
          aria-label="Close orders"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <FileCheck className="w-5 h-5 text-cyan-400" />
          <h2 id="orders-title" className="font-cinzel text-lg sm:text-xl font-bold text-white">
            My Orders
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-mono-code">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <FileCheck className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="font-space font-semibold text-slate-300 text-sm">
              No orders yet
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto font-sans">
              Your acquired collectible orders will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
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
                  className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-all space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-space font-bold text-sm text-white">
                          #{order.orderNumber}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <span className="text-[10px] font-mono-code text-slate-400 block mt-0.5">
                        {formattedDate} • {order.paymentMethod.toUpperCase()}
                      </span>
                    </div>

                    <span className="font-space font-bold text-base text-cyan-300">
                      {formattedTotal}
                    </span>
                  </div>

                  {/* Items Summary */}
                  <div className="space-y-1 text-xs font-mono-code">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-slate-300 py-0.5"
                      >
                        <div className="truncate max-w-[180px] sm:max-w-[280px]">
                          <span>{item.productName}</span>
                          <span className="text-[10px] text-slate-500 ml-1.5">
                            ({item.sku} × {item.quantity})
                          </span>
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          {formatINR(item.unitPriceMinor * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions / Status Timeline Info */}
                  <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-400 font-sans">
                      {order.status === 'pending'
                        ? 'Awaiting settlement verification.'
                        : 'Settlement confirmed. Digital assets unlocked.'}
                    </p>

                    {isVerified ? (
                      <button
                        type="button"
                        onClick={() => {
                          onClose()
                          onOpenVault()
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-violet text-xs font-bold active:scale-95 transition-all"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Open Vault</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono-code text-amber-400 font-semibold">
                        AWAITING CLEARANCE
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
