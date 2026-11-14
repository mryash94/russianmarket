import { useEffect, useState } from 'react'
import {
  X,
  FileCheck,
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
          <span className="px-2 py-0.5 rounded font-mono-code text-[10px] uppercase bg-white/[0.05] text-[#fbbf24] border border-white/[0.08] inline-flex items-center gap-1.5">
            <span className="status-beacon pending" />
            Pending settlement
          </span>
        )
      case 'payment_verified':
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded font-mono-code text-[10px] uppercase bg-white/[0.05] text-[#34d399] border border-white/[0.08] inline-flex items-center gap-1.5">
            <span className="status-beacon active" />
            Vault unlocked
          </span>
        )
      case 'processing':
        return (
          <span className="px-2 py-0.5 rounded font-mono-code text-[10px] uppercase bg-white/[0.05] text-[#9499a6] border border-white/[0.08] inline-flex items-center gap-1.5">
            <span className="status-beacon active" />
            Processing token
          </span>
        )
      case 'failed':
      case 'cancelled':
      case 'expired':
      case 'refunded':
        return (
          <span className="px-2 py-0.5 rounded font-mono-code text-[10px] uppercase bg-white/[0.05] text-[#f87171] border border-white/[0.08] inline-flex items-center gap-1.5">
            <span className="status-beacon idle" />
            {status}
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0c0e13] rounded-2xl p-5 sm:p-6 border border-white/[0.1] shadow-2xl animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="orders-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-[#181c25] border border-white/[0.08] text-slate-400 hover:text-white transition-colors"
          aria-label="Close orders"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#181c25] border border-white/[0.1] flex items-center justify-center text-white">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 id="orders-title" className="font-space text-lg font-semibold text-[#ededed]">
              My orders
            </h2>
            <p className="text-[11px] text-[#9499a6] font-sans">
              Recorded sovereign purchases and settlement certificates
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#9499a6] text-xs font-mono-code">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center space-y-2 bg-[#12151c] rounded-xl border border-white/[0.06]">
            <FileCheck className="w-8 h-8 text-[#666b7a] mx-auto" />
            <h3 className="font-space font-medium text-[#ededed] text-sm">
              No orders yet
            </h3>
            <p className="text-xs text-[#9499a6] max-w-xs mx-auto font-sans">
              Acquired collectible orders will be registered here.
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
                  className="p-3.5 sm:p-4 rounded-xl bg-[#12151c] border border-white/[0.07] space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-space font-semibold text-sm text-[#ededed]">
                          #{order.orderNumber}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <span className="text-[10px] font-mono-code text-[#666b7a] block mt-0.5">
                        {formattedDate} • {order.paymentMethod.toUpperCase()}
                      </span>
                    </div>

                    <span className="font-space font-semibold text-sm sm:text-base text-[#ededed] tabular-nums">
                      {formattedTotal}
                    </span>
                  </div>

                  {/* Items Summary */}
                  <div className="space-y-1 text-xs font-mono-code">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[#ededed] py-0.5"
                      >
                        <div className="truncate max-w-[180px] sm:max-w-[280px]">
                          <span>{item.productName}</span>
                          <span className="text-[10px] text-[#666b7a] ml-1.5">
                            ({item.sku} × {item.quantity})
                          </span>
                        </div>
                        <span className="text-[#9499a6] text-[11px] tabular-nums">
                          {formatINR(item.unitPriceMinor * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions / Status Timeline Info */}
                  <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] text-[#9499a6] font-sans">
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
                        className="px-3 py-1.5 rounded-lg btn-primary text-xs font-semibold"
                      >
                        Access vault asset
                      </button>
                    ) : (
                      <span className="font-mono-code text-[10px] text-[#fbbf24]">
                        Manual verification queue
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
