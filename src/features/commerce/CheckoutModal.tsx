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

  const formattedTotal = `$${(subtotalMinor / 100).toFixed(2)}`

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel-glow rounded-3xl p-5 md:p-8 border border-white/15 shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full glass-input text-slate-400 hover:text-white"
          aria-label="Close checkout"
        >
          <X className="w-5 h-5" />
        </button>

        {completedOrder ? (
          /* Order Confirmation Success State */
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(0,240,255,0.3)]">
              <CheckCircle2 className="w-8 h-8 text-cyan-400" />
            </div>

            <span className="font-mono-code text-[11px] uppercase tracking-widest text-cyan-400 font-bold block">
              ORDER REGISTERED SUCCESSFULLY
            </span>

            <h2 className="font-cinzel text-2xl font-bold text-white">
              Order #{completedOrder.orderNumber}
            </h2>

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 max-w-md mx-auto text-left space-y-2 text-xs font-mono-code">
              <div className="flex justify-between">
                <span className="text-slate-400">STATUS:</span>
                <span className="text-amber-400 font-bold uppercase">
                  Pending Settlement Verification
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">TOTAL VALUE:</span>
                <span className="text-white font-bold">{formattedTotal} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PAYMENT PROVIDER:</span>
                <span className="text-cyan-300 uppercase">{completedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CUSTOMER:</span>
                <span className="text-slate-200 truncate">{completedOrder.customerEmail}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-md mx-auto font-sans leading-relaxed">
              Your order has been safely committed to the database. As required by our security protocol, digital assets are unlocked upon verified settlement. You can track this order in <strong>My Orders</strong> or verify settlement in the <strong>Admin Control Room</strong>.
            </p>

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl btn-cyan text-xs font-bold shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              >
                View in My Orders
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handlePlaceOrder} className="space-y-6">
            <div>
              <span className="font-mono-code text-[10px] uppercase font-bold tracking-widest text-cyan-400 block mb-1">
                SECURE ACQUISITION PROTOCOL
              </span>
              <h2 id="checkout-title" className="font-cinzel text-xl md:text-2xl font-bold text-white">
                Finalize Collectible Order
              </h2>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Customer Details */}
            <div className="space-y-3">
              <h3 className="font-space text-xs font-bold uppercase tracking-wider text-slate-300">
                1. Collector Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono-code text-slate-400 mb-1">
                    EMAIL FOR VAULT TOKENS
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="collector@example.com"
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono-code text-slate-400 mb-1">
                    COLLECTOR NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Payment Provider Selection */}
            <div className="space-y-3">
              <h3 className="font-space text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Select Payment Settlement Gateway
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* SunPay Gateway */}
                <div
                  onClick={() => setSelectedProvider('sunpay')}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                    selectedProvider === 'sunpay'
                      ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-space font-bold text-xs text-white">SunPay Gateway</span>
                    <CreditCard className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="font-mono-code text-[10px] text-cyan-300 block mb-1">
                    Modular Adapter (SunPay-Ready)
                  </span>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    Pre-configured for future SunPay merchant API activation. Orders register as pending.
                  </p>
                </div>

                {/* Concierge Settlement */}
                <div
                  onClick={() => setSelectedProvider('admin_concierge')}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                    selectedProvider === 'admin_concierge'
                      ? 'bg-violet-500/10 border-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-space font-bold text-xs text-white">
                      Private Concierge
                    </span>
                    <Building className="w-4 h-4 text-violet-400" />
                  </div>
                  <span className="font-mono-code text-[10px] text-violet-300 block mb-1">
                    Admin Verification
                  </span>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    Enables manual verification by the administrator in the Admin Control Room.
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items Snapshot Summary */}
            <div className="space-y-3">
              <h3 className="font-space text-xs font-bold uppercase tracking-wider text-slate-300">
                3. Order Review ({items.length} Collectibles)
              </h3>
              <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                {items.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs font-mono-code"
                  >
                    <div>
                      <span className="text-white font-medium block truncate max-w-[240px]">
                        {product.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        SKU: {product.sku} • Qty: {quantity}
                      </span>
                    </div>
                    <span className="text-cyan-300 font-bold">
                      ${(((product.salePriceMinor ?? product.priceMinor) * quantity) / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total & Submit */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-400 block">
                  IMMUTABLE ORDER TOTAL
                </span>
                <span className="font-space text-2xl font-bold text-white">
                  {formattedTotal} <span className="text-xs font-mono-code text-cyan-400">USD</span>
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl btn-cyan text-xs font-bold active:scale-95 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              >
                <span>{isSubmitting ? 'Securing Order...' : 'COMMIT ORDER'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono-code text-slate-500">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Complies with payment idempotency and anti-tamper server calculations</span>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
