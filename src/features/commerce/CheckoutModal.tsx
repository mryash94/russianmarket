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
      const itemSnapshots: OrderItemSnapshot[] = items.map(({ product, quantity }) => ({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        collection: product.collection,
        unitPriceMinor: product.salePriceMinor ?? product.priceMinor,
        quantity,
        digitalAssetName: product.digitalAsset.filename,
      }))

      const idempotencyKey = `RM-IDEMP-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

      const order = await storeEngine.createOrder({
        userId,
        customerEmail: email.trim(),
        customerName: name.trim(),
        items: itemSnapshots,
        paymentMethod: selectedProvider,
        idempotencyKey,
      })

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#0c0e13] rounded-2xl p-5 sm:p-6 border border-white/[0.1] shadow-2xl animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-[#181c25] border border-white/[0.08] text-slate-400 hover:text-white transition-colors"
          aria-label="Close checkout"
        >
          <X className="w-4 h-4" />
        </button>

        {completedOrder ? (
          /* Order Confirmation Success State */
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center mx-auto text-white">
              <CheckCircle2 className="w-6 h-6 text-[#34d399]" />
            </div>

            <div>
              <span className="font-mono-code text-[10px] uppercase font-medium tracking-wider text-[#9499a6] block mb-1">
                Order confirmed
              </span>
              <h2 className="font-space text-xl font-semibold text-[#ededed]">
                #{completedOrder.orderNumber}
              </h2>
            </div>

            <div className="p-3.5 rounded-lg bg-[#12151c] border border-white/[0.06] text-left space-y-2 text-xs font-mono-code">
              <div className="flex justify-between items-center">
                <span className="text-[#9499a6]">Status:</span>
                <span className="text-[#fbbf24] font-medium uppercase text-[11px]">
                  Pending settlement
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#9499a6]">Total:</span>
                <span className="text-[#ededed] font-medium tabular-nums">{formattedTotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#9499a6]">Payment:</span>
                <span className="text-[#ededed] uppercase">{completedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#9499a6]">Email:</span>
                <span className="text-[#ededed] truncate max-w-[180px] sm:max-w-[240px]">
                  {completedOrder.customerEmail}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#9499a6] max-w-sm mx-auto font-sans leading-relaxed">
              Your order has been recorded. Once payment is verified, your collectible master assets unlock in your Digital Vault.
            </p>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg btn-primary text-xs font-semibold"
              >
                View my orders
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            <div>
              <span className="font-mono-code text-[10px] uppercase font-medium tracking-wider text-[#9499a6] block mb-0.5">
                Checkout
              </span>
              <h2 id="checkout-title" className="font-space text-lg font-semibold text-[#ededed]">
                Acquire Collectibles
              </h2>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-xs text-[#f87171]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Customer Details */}
            <div className="space-y-2.5">
              <span className="font-space text-xs font-medium text-[#ededed] block">
                Collector information
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-sans text-[#9499a6] mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="collector@example.com"
                    className="w-full h-10 bg-[#181c25] border border-white/[0.08] focus:border-white/30 px-3 rounded-lg text-xs text-[#ededed] placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-sans text-[#9499a6] mb-1">
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Collector Name"
                    className="w-full h-10 bg-[#181c25] border border-white/[0.08] focus:border-white/30 px-3 rounded-lg text-xs text-[#ededed] placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Provider Selection */}
            <div className="space-y-2">
              <span className="font-space text-xs font-medium text-[#ededed] block">
                Payment method
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* SunPay Gateway */}
                <div
                  onClick={() => setSelectedProvider('sunpay')}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    selectedProvider === 'sunpay'
                      ? 'bg-[#181c25] border-white/30'
                      : 'bg-[#12151c] border-white/[0.06] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-space font-medium text-xs text-[#ededed]">SunPay Gateway</span>
                    <CreditCard className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-[#9499a6] font-sans leading-relaxed">
                    Card & digital checkout. Recorded with pending settlement.
                  </p>
                </div>

                {/* Concierge Settlement */}
                <div
                  onClick={() => setSelectedProvider('admin_concierge')}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    selectedProvider === 'admin_concierge'
                      ? 'bg-[#181c25] border-white/30'
                      : 'bg-[#12151c] border-white/[0.06] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-space font-medium text-xs text-[#ededed]">
                      Private Concierge
                    </span>
                    <Building className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-[#9499a6] font-sans leading-relaxed">
                    Direct admin verification via the Admin Control Room.
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items Snapshot Summary */}
            <div className="space-y-1.5">
              <span className="font-space text-xs font-medium text-[#ededed] block">
                Items ({items.length})
              </span>
              <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                {items.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="p-2 rounded-lg bg-[#12151c] border border-white/[0.05] flex items-center justify-between text-xs font-mono-code"
                  >
                    <div className="truncate max-w-[200px] sm:max-w-[260px]">
                      <span className="text-[#ededed] font-medium block truncate">
                        {product.name}
                      </span>
                      <span className="text-[10px] text-[#666b7a]">
                        {product.sku} • Qty: {quantity}
                      </span>
                    </div>
                    <span className="text-[#ededed] font-medium ml-2 tabular-nums">
                      {formatINR((product.salePriceMinor ?? product.priceMinor) * quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total & Submit */}
            <div className="pt-3 border-t border-white/[0.07] flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-sans text-[#9499a6] block">
                  Order total
                </span>
                <span className="font-space text-xl font-bold text-[#ededed] tabular-nums">
                  {formattedTotal}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg btn-primary text-xs font-semibold active:scale-98 disabled:opacity-40 transition-all"
              >
                <span>{isSubmitting ? 'Placing order...' : 'Place order'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono-code text-[#666b7a] pt-1">
              <Lock className="w-3 h-3 text-[#9499a6]" />
              <span>Encrypted checkout & verified database settlement</span>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default CheckoutModal
