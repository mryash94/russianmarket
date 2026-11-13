import { useEffect } from 'react'
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react'
import { formatINR } from '../../lib/currency'
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

  const formattedSubtotal = formatINR(subtotalMinor)

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-sm sm:max-w-md glass-panel-elevated border-l border-white/[0.1] flex flex-col justify-between shadow-2xl p-4 sm:p-6 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
              <h2 className="font-space font-bold text-sm sm:text-base text-white tracking-tight">
                Shopping Bag
              </h2>
              <span className="px-1.5 py-0.2 rounded-md font-mono-code text-[10px] bg-white/[0.08] text-slate-300 font-medium">
                {items.length}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg btn-ghost text-slate-400 hover:text-white"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-sans">
                  Your shopping bag is empty.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 px-3.5 py-1.5 rounded-lg btn-ghost text-xs font-medium"
                >
                  Explore Catalogue
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => {
                const itemPrice = product.salePriceMinor ?? product.priceMinor
                const formattedPrice = formatINR(itemPrice * quantity)

                return (
                  <div
                    key={product.id}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-mono-code text-[9px] uppercase tracking-wider text-slate-400 block truncate">
                        {product.collection}
                      </span>
                      <h4 className="font-space font-semibold text-xs text-white truncate">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono-code text-[11px] font-semibold text-white">
                          {formattedPrice}
                        </span>
                        <span className="font-mono-code text-[9px] text-slate-500">
                          ({formatINR(itemPrice)} ea)
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 glass-input px-1.5 py-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                        className="p-1 text-slate-400 hover:text-white"
                        aria-label="Decrease"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono-code text-xs font-semibold w-4 text-center text-white">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                        className="p-1 text-slate-400 hover:text-white"
                        aria-label="Increase"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(product.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="pt-3 border-t border-white/[0.08] space-y-3">
              <div className="space-y-1 font-mono-code text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-white">{formattedSubtotal}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Vault Delivery</span>
                  <span className="text-emerald-400">Free</span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold pt-1.5 border-t border-white/[0.04] text-white">
                  <span>Total</span>
                  <span className="font-space text-base text-cyan-300">{formattedSubtotal}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose()
                  onProceedToCheckout()
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl btn-primary text-xs font-bold active:scale-95 transition-transform"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
