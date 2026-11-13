import { useState } from 'react'
import {
  X,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building,
} from 'lucide-react'
import { storeEngine, type Order, type OrderItemSnapshot } from '../../services/storeEngine'
import { PaymentGatewayService } from '../../services/payment'
import { formatINR } from '../../lib/currency'
import type { Product } from '../../types/product'

type CheckoutModalProps = {
  isOpen: boolean
  onClose: () => void
  cartItems: Record<string, number>
  products: Product[]
  userId: string
  userEmail?: string
  onOrderSuccess: (order: Order) => void
  onClearCart: () => void
}

export function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  products,
  userId,
  userEmail = 'collector@russianmarket.store',
  onOrderSuccess,
  onClearCart,
}: CheckoutModalProps) {
  const [email, setEmail] = useState(userEmail)
  const [name, setName] = useState('Valued Collector')
  const [selectedProvider, setSelectedProvider] = useState<'sunpay' | 'admin_concierge'>('sunpay')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)

  if (!isOpen) return null

  const items = Object.entries(cartItems)
    .map(([productId, quantity]) => {
      const product = products.find((p) => p.id === productId)
      return { product, quantity }
    })
    .filter((item): item is { product: Product; quantity: number } => Boolean(item.product))

  const subtotalMinor = items.reduce((sum, item) => {
    const price = item.product.salePriceMinor ?? item.product.priceMinor
    return sum + price * item.quantity
  }, 0)

  const formattedTotal = formatINR(subtotalMinor)

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return

    setIsSubmitting(true)
    setError(null)

    try {
      // 1. Create immutable item snapshots
      const itemSnapshots: OrderItemSnapshot[] = items.map(({ product, quantity }) => ({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        collection: product.collection,
        unitPriceMinor: product.salePriceMinor ?? product.priceMinor,
        quantity,
        digitalAssetName: product.digitalAsset.filename,
      }))

      // 2. Generate unique idempotency key
      const idempotencyKey = `RM-IDEMP-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

      // 3. Register Order in Database (status: 'pending')
      const order = await storeEngine.createOrder({
        userId,
        customerEmail: email.trim(),
        customerName: name.trim(),
        items: itemSnapshots,
        paymentMethod: selectedProvider,
        idempotencyKey,
      })

      // 4. Initiate through modular payment provider
      const provider = PaymentGatewayService.getProvider(selectedProvider)
      await provider.initiatePayment({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amountMinor: order.subtotalMinor,
        currency: order.currency,
        customerEmail: email.trim(),
        customerName: name.trim(),
        idempotencyKey,
      })

      setCompletedOrder(order)
      onClearCart()
      onOrderSuccess(order)
    } catch (err) {
      console.error('Order creation error:', err)
      setError(err instanceof Error ? err.message : 'Order submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto glass-panel-elevated rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/[0.12] shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full glass-input text-slate-400 hover:text-white"
          aria-label="Close checkout"
        >
          <X className="w-4 h-4" />
        </button>

        {completedOrder ? (
          /* Order Confirmation Success State */
          <div className="text-center py-4 space-y-3.5">
            <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(0,240,255,0.25)]">
              <CheckCircle2 className="w-7 h-7 text-cyan-400" />
            </div>

            <div>
              <span className="font-mono-code text-[10px] uppercase tracking-widest text-cyan-400 font-bold block mb-1">
                ORDER CONFIRMED
              </span>
              <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-white">
                #{completedOrder.orderNumber}
              </h2>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-left space-y-2 text-xs font-mono-code">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status:</span>
                <span className="text-amber-400 font-bold uppercase text-[11px]">
                  Pending Settlement
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total:</span>
                <span className="text-white font-bold">{formattedTotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Payment:</span>
                <span className="text-cyan-300 uppercase">{completedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-200 truncate max-w-[180px] sm:max-w-[240px]">
                  {completedOrder.customerEmail}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-sm mx-auto font-sans leading-relaxed">
              Your order has been recorded. Once payment is verified, your collectible master assets unlock instantly in your Digital Vault.
            </p>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl btn-primary text-xs font-bold"
              >
                View My Orders
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handlePlaceOrder} className="space-y-4 sm:space-y-5">
            <div>
              <span className="font-mono-code text-[10px] uppercase font-bold tracking-widest text-cyan-400 block mb-0.5">
                CHECKOUT
              </span>
              <h2 id="checkout-title" className="font-cinzel text-lg sm:text-xl font-bold text-white">
                Acquire Collectibles
              </h2>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Customer Details */}
            <div className="space-y-2.5">
              <span className="font-space text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Collector Information
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono-code text-slate-400 mb-1">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="collector@example.com"
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono-code text-slate-400 mb-1">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Collector Name"
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Provider Selection */}
            <div className="space-y-2.5">
              <span className="font-space text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Payment Method
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* SunPay Gateway */}
                <div
                  onClick={() => setSelectedProvider('sunpay')}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${
                    selectedProvider === 'sunpay'
                      ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-space font-bold text-xs text-white">SunPay Gateway</span>
                    <CreditCard className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    Card & digital checkout. Order records with pending settlement.
                  </p>
                </div>

                {/* Concierge Settlement */}
                <div
                  onClick={() => setSelectedProvider('admin_concierge')}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${
                    selectedProvider === 'admin_concierge'
                      ? 'bg-violet-500/10 border-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-space font-bold text-xs text-white">
                      Private Concierge
                    </span>
                    <Building className="w-4 h-4 text-violet-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    Direct admin verification via the Admin Control Room.
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items Snapshot Summary */}
            <div className="space-y-2">
              <span className="font-space text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Items ({items.length})
              </span>
              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                {items.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs font-mono-code"
                  >
                    <div className="truncate max-w-[200px] sm:max-w-[260px]">
                      <span className="text-white font-medium block truncate">
                        {product.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {product.sku} • Qty: {quantity}
                      </span>
                    </div>
                    <span className="text-cyan-300 font-bold ml-2">
                      {formatINR((product.salePriceMinor ?? product.priceMinor) * quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total & Submit */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-400 block">
                  ORDER TOTAL
                </span>
                <span className="font-space text-xl sm:text-2xl font-bold text-white">
                  {formattedTotal}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-xs font-bold active:scale-95 disabled:opacity-50 transition-all"
              >
                <span>{isSubmitting ? 'Placing Order...' : 'Place Order'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono-code text-slate-400 pt-1">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>Encrypted checkout & verified database settlement</span>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
