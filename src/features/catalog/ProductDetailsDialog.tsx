import { useEffect } from 'react'
import { X, ArrowRight } from 'lucide-react'
import { RussianMarketCard } from '../../components/RussianMarketCard'
import { formatINR } from '../../lib/currency'
import type { Product } from '../../types/product'

type ProductDetailsDialogProps = {
  product: Product | null
  onClose: () => void
  onQuickBuy: (product: Product) => void
  onAddToCart?: (product: Product) => void
}

export function ProductDetailsDialog({
  product,
  onClose,
  onQuickBuy,
}: ProductDetailsDialogProps) {
  useEffect(() => {
    if (!product) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [product, onClose])

  if (!product) return null

  const priceMinor = product.salePriceMinor && product.salePriceMinor < product.priceMinor
    ? product.salePriceMinor
    : product.priceMinor

  const originalPriceMinor = product.salePriceMinor && product.salePriceMinor < product.priceMinor
    ? product.priceMinor
    : null

  const isAvailable = product.availability === 'in_stock' || product.stockCount > 0

  const editionNumber = product.editionNumber ?? 1
  const editionTotal = product.editionTotal ?? 50

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto glass-panel-elevated rounded-3xl p-5 sm:p-6 border border-white/[0.12] shadow-2xl animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-dialog-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full glass-input text-slate-400 hover:text-white z-20 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-4">
          {/* 1. Interactive Collectible Artwork */}
          <div className="w-full max-w-[340px] mx-auto pt-1">
            <RussianMarketCard
              product={product}
              interactive={true}
              showFlipHint={true}
            />
          </div>

          {/* 2. Compact Product Information */}
          <div className="space-y-3.5 pt-2 border-t border-white/[0.08]">
            {/* Category & Availability & Edition Row */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full font-mono-code text-[10px] font-bold tracking-widest uppercase border ${
                    product.category === 'VISA'
                      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40'
                      : product.category === 'MASTERCARD'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-400/40'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40'
                  }`}
                >
                  {product.category}
                </span>

                <span className="font-mono-code text-[10px] text-slate-400 tracking-wider">
                  EDITION #{String(editionNumber).padStart(3, '0')} / {String(editionTotal).padStart(3, '0')}
                </span>
              </div>

              <span className="flex items-center gap-1 font-mono-code text-[11px] text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isAvailable ? 'In Stock' : 'Sold Out'}
              </span>
            </div>

            {/* Product Name */}
            <div>
              <h2
                id="product-dialog-title"
                className="font-space text-lg sm:text-xl font-bold text-white tracking-tight"
              >
                {product.name}
              </h2>
            </div>

            {/* Price Row */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
              <span className="text-[10px] font-mono-code text-slate-400 uppercase tracking-wider">
                Current Price
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-space text-2xl font-extrabold text-white">
                  {formatINR(priceMinor)}
                </span>
                {originalPriceMinor && (
                  <span className="font-mono-code text-xs line-through text-slate-500">
                    {formatINR(originalPriceMinor)}
                  </span>
                )}
              </div>
            </div>

            {/* 3. One Primary BUY NOW Button */}
            <div className="pt-1">
              <button
                type="button"
                disabled={!isAvailable}
                onClick={() => {
                  onClose()
                  onQuickBuy(product)
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl btn-primary text-xs font-bold active:scale-95 disabled:opacity-50 transition-all shadow-xl"
              >
                <span>BUY NOW</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailsDialog
