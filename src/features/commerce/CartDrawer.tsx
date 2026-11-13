import { useEffect } from 'react'
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react'
import type { Product } from '../../types/product'

type CartDrawerProps = {
  isOpen: boolean
  onClose: () => void
  cartItems: Record<string, number>
  products: Product[]
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onProceedToCheckout: () => void
}

export function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  products,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}: CartDrawerProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

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

  const formattedSubtotal = `$${(subtotalMinor / 100).toFixed(2)}`

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md glass-panel-glow border-l border-white/10 flex flex-col justify-between shadow-2xl p-5 md:p-6 animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
              <h2 className="font-space font-bold text-base text-white tracking-wider">
                SHOPPING BAG
              </h2>
              <span className="px-2 py-0.5 rounded-full font-mono-code text-[11px] bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                {items.length}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full glass-input text-slate-400 hover:text-white"
              aria-label="Close cart"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="font-space font-semibold text-slate-300 text-sm">
                  Your shopping bag is empty
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Browse our curated collections to discover rare digital collectible editions.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 px-4 py-2 rounded-xl btn-cyan text-xs font-bold"
                >
                  Explore Collectibles
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => {
                const itemPrice = product.salePriceMinor ?? product.priceMinor
                const formattedPrice = `$${((itemPrice * quantity) / 100).toFixed(2)}`

                return (
                  <div
                    key={product.id}
                    className="p-3 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-mono-code text-[9px] uppercase tracking-wider text-cyan-400 block truncate">
                        {product.collection}
                      </span>
                      <h4 className="font-space font-bold text-xs text-white truncate">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono-code text-[11px] font-bold text-white">
                          {formattedPrice}
                        </span>
                        <span className="font-mono-code text-[9px] text-slate-500">
                          (${((itemPrice) / 100).toFixed(2)} ea)
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5 glass-input px-2 py-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                        className="p-1 text-slate-400 hover:text-white"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono-code text-xs font-bold w-4 text-center text-white">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                        className="p-1 text-slate-400 hover:text-white"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(product.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="space-y-1.5 font-mono-code text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>SUBTOTAL</span>
                  <span className="text-white">{formattedSubtotal}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>VAULT CONCIERGE FEE</span>
                  <span className="text-emerald-400">FREE ($0.00)</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-white/5 text-white">
                  <span>TOTAL SETTLEMENT</span>
                  <span className="font-space text-lg text-cyan-300">{formattedSubtotal} USD</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose()
                  onProceedToCheckout()
                }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl btn-cyan text-xs font-bold active:scale-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              >
                <span>PROCEED TO SECURE CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono-code text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Protected by Russian Market Zero-Fraud Architecture</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
