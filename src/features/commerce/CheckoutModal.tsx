import { useState, useEffect, useMemo } from 'react'
import QRCode from 'qrcode'
import {
  X,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building,
  Wallet,
  QrCode,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react'
import {
  storeEngine,
  type Order,
  type OrderItemSnapshot,
  type StoreSettings,
} from '../../services/storeEngine'
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

type PaymentMethodType = 'wallet' | 'upi_qr' | 'sunpay' | 'admin_concierge'

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
  const [selectedProvider, setSelectedProvider] = useState<PaymentMethodType>('wallet')
  const [walletBalanceMinor, setWalletBalanceMinor] = useState<number>(0)
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)

  // UPI Dynamic QR State
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [upiUtrNumber, setUpiUtrNumber] = useState<string>('')
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false)

  // Load wallet balance & live settings on open
  useEffect(() => {
    if (isOpen) {
      void Promise.all([
        storeEngine.getWalletBalance(userId),
        storeEngine.getSettings(),
      ]).then(([bal, s]) => {
        setWalletBalanceMinor(bal)
        setSettings(s)
        if (bal < 1000) {
          setSelectedProvider('upi_qr')
        }
      })
      setError(null)
      setCompletedOrder(null)
      setUpiUtrNumber('')
    }
  }, [isOpen, userId])

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
  const hasSufficientWallet = walletBalanceMinor >= subtotalMinor

  // Generate dynamic QR code if UPI QR selected
  const merchantUpi = settings?.upiMerchantId || 'russianmarket@icici'
  const merchantName = settings?.upiMerchantName || 'Russian Market Collectibles'
  const amountRupees = (subtotalMinor / 100).toFixed(2)

  const upiDeepLink = useMemo(() => {
    const note = `RM-ORDER-${subtotalMinor}`
    return `upi://pay?pa=${encodeURIComponent(merchantUpi)}&pn=${encodeURIComponent(
      merchantName,
    )}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent(note)}`
  }, [merchantUpi, merchantName, amountRupees, subtotalMinor])

  useEffect(() => {
    if (selectedProvider === 'upi_qr' && subtotalMinor > 0) {
      QRCode.toDataURL(upiDeepLink, {
        width: 220,
        margin: 1.5,
        color: { dark: '#060709', light: '#ffffff' },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => {})
    }
  }, [selectedProvider, subtotalMinor, upiDeepLink])

  if (!isOpen) return null

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(merchantUpi)
    setCopiedUpi(true)
    setTimeout(() => setCopiedUpi(false), 2000)
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return

    if (selectedProvider === 'wallet' && !hasSufficientWallet) {
      setError(`Insufficient wallet balance. You have ${formatINR(walletBalanceMinor)}, but total is ${formattedTotal}.`)
      return
    }

    if (selectedProvider === 'upi_qr' && (!upiUtrNumber.trim() || upiUtrNumber.trim().length < 8)) {
      setError('Please enter your 12-digit UPI transaction reference / UTR number after payment.')
      return
    }

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

      if (selectedProvider === 'wallet') {
        // Instant wallet deduction & instant digital pass unlock
        await storeEngine.recordWalletTransaction({
          userId,
          amountMinor: -order.subtotalMinor,
          transactionType: 'debit',
          status: 'completed',
          reference: order.orderNumber,
          description: `Acquisition of ${order.items.length} Haute Collectible(s)`,
        })

        const verifiedOrder = await storeEngine.verifyOrderPayment(
          order.id,
          'Instant settlement via verified collector wallet balance.',
        )
        setCompletedOrder(verifiedOrder)
      } else if (selectedProvider === 'upi_qr') {
        // Record deposit request & update order notes with UTR
        await storeEngine.createDepositRequest({
          userId,
          userEmail: email.trim(),
          amountMinor: order.subtotalMinor,
          utrNumber: upiUtrNumber.trim(),
          reference: order.orderNumber,
          notes: `Checkout UPI payment for Order #${order.orderNumber}`,
        }).catch(() => {})

        await storeEngine.updateOrderStatus(order.id, 'pending', `UPI UTR: ${upiUtrNumber.trim()}`)
        setCompletedOrder(order)
      } else {
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
      }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
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
                {completedOrder.status === 'payment_verified' ? 'Acquisition Verified & Unlocked' : 'Order Recorded'}
              </span>
              <h2 className="font-space text-xl font-semibold text-[#ededed]">
                #{completedOrder.orderNumber}
              </h2>
            </div>

            <div className="p-3.5 rounded-lg bg-[#12151c] border border-white/[0.06] text-left space-y-2 text-xs font-mono-code">
              <div className="flex justify-between items-center">
                <span className="text-[#9499a6]">Status:</span>
                <span className={`font-medium uppercase text-[11px] ${
                  completedOrder.status === 'payment_verified' ? 'text-[#34d399]' : 'text-[#fbbf24]'
                }`}>
                  {completedOrder.status === 'payment_verified' ? 'Settled & In Vault' : 'Pending Verification'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#9499a6]">Total:</span>
                <span className="text-[#ededed] font-medium tabular-nums">{formattedTotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#9499a6]">Payment Method:</span>
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
              {completedOrder.status === 'payment_verified'
                ? 'Your cryptographic digital collectible master assets have been delivered to your Digital Vault.'
                : 'Your order reference has been logged. Upon curatorial payment audit, your assets will unlock automatically in your Vault.'}
            </p>

            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg btn-primary text-xs font-semibold"
              >
                Close & View Collection
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
                {/* 1. Wallet Balance Option */}
                <div
                  onClick={() => setSelectedProvider('wallet')}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    selectedProvider === 'wallet'
                      ? 'bg-[#181c25] border-white/30'
                      : 'bg-[#12151c] border-white/[0.06] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-space font-medium text-xs text-[#ededed]">Wallet Balance</span>
                    <Wallet className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-[11px] text-[#9499a6] font-sans leading-relaxed">
                    Balance: {formatINR(walletBalanceMinor)}
                  </p>
                  <span className={`text-[10px] font-mono-code font-semibold block mt-1 ${
                    hasSufficientWallet ? 'text-[#34d399]' : 'text-[#f87171]'
                  }`}>
                    {hasSufficientWallet ? '● Instant Settlement Ready' : '● Insufficient Funds'}
                  </span>
                </div>

                {/* 2. Direct UPI QR Option */}
                <div
                  onClick={() => setSelectedProvider('upi_qr')}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    selectedProvider === 'upi_qr'
                      ? 'bg-[#181c25] border-white/30'
                      : 'bg-[#12151c] border-white/[0.06] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-space font-medium text-xs text-[#ededed]">Instant UPI QR</span>
                    <QrCode className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-[#9499a6] font-sans leading-relaxed">
                    Scan with any UPI App (GPay, PhonePe, Paytm) & enter UTR.
                  </p>
                </div>

                {/* 3. SunPay Gateway */}
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

                {/* 4. Concierge Settlement */}
                <div
                  onClick={() => setSelectedProvider('admin_concierge')}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    selectedProvider === 'admin_concierge'
                      ? 'bg-[#181c25] border-white/30'
                      : 'bg-[#12151c] border-white/[0.06] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-space font-medium text-xs text-[#ededed]">Private Concierge</span>
                    <Building className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-[#9499a6] font-sans leading-relaxed">
                    Direct admin verification via the Admin Control Room.
                  </p>
                </div>
              </div>
            </div>

            {/* UPI QR Payment Detail View if UPI selected */}
            {selectedProvider === 'upi_qr' && (
              <div className="p-4 rounded-xl bg-[#12151c] border border-white/[0.08] space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="UPI QR Code"
                      className="w-36 h-36 bg-white rounded-xl p-1.5 shrink-0 shadow-md"
                    />
                  ) : (
                    <div className="w-36 h-36 bg-white/5 rounded-xl animate-pulse shrink-0" />
                  )}
                  <div className="space-y-2 text-xs flex-1 w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-[#9499a6]">Merchant:</span>
                      <span className="text-[#ededed] font-medium">{merchantName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#9499a6]">UPI ID:</span>
                      <div className="flex items-center gap-1.5 font-mono-code text-[11px]">
                        <span className="text-cyan-400">{merchantUpi}</span>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="p-1 rounded bg-white/10 hover:bg-white/20 text-white"
                          title="Copy UPI ID"
                        >
                          {copiedUpi ? <Check className="w-3 h-3 text-[#34d399]" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#9499a6]">Amount:</span>
                      <span className="text-[#ededed] font-bold font-mono-code">{formattedTotal}</span>
                    </div>

                    {/* Mobile UPI Deep Link */}
                    <a
                      href={upiDeepLink}
                      className="mt-1 w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors sm:hidden"
                    >
                      <span>Pay via Mobile UPI App</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="block text-[11px] font-mono-code text-[#9499a6]">
                    12-Digit UPI Transaction Reference / UTR *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter 12-digit UTR after payment"
                    value={upiUtrNumber}
                    onChange={(e) => setUpiUtrNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                    className="w-full h-10 bg-[#181c25] border border-white/[0.08] focus:border-white/30 px-3 rounded-lg text-xs font-mono-code text-[#ededed]"
                  />
                </div>
              </div>
            )}

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
                disabled={isSubmitting || (selectedProvider === 'wallet' && !hasSufficientWallet)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg btn-primary text-xs font-semibold active:scale-98 disabled:opacity-40 transition-all"
              >
                <span>
                  {isSubmitting
                    ? 'Processing...'
                    : selectedProvider === 'wallet'
                    ? 'Acquire with Wallet'
                    : 'Submit Order'}
                </span>
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
