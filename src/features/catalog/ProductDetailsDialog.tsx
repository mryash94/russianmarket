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
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-[#0c0e13] rounded-2xl p-5 sm:p-6 border border-white/[0.1] shadow-2xl animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-dialog-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-[#181c25] border border-white/[0.08] text-slate-400 hover:text-white z-20 transition-colors"
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
          <div className="space-y-3.5 pt-2 border-t border-white/[0.07]">
            {/* Category & Availability & Edition Row */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md font-mono-code text-[10px] font-medium tracking-wide uppercase bg-white/[0.05] text-[#ededed] border border-white/[0.08]">
                  {product.category}
                </span>

                <span className="font-mono-code text-[10px] text-[#9499a6] tracking-wider tabular-nums">
                  Edition #{String(editionNumber).padStart(3, '0')} / {String(editionTotal).padStart(3, '0')}
                </span>
              </div>

              <span className="flex items-center gap-1.5 font-mono-code text-[11px] text-[#9499a6]">
                <span className={`status-beacon ${isAvailable ? 'active' : 'idle'}`} />
                {isAvailable ? 'In stock' : 'Sold out'}
              </span>
            </div>

            {/* Product Name */}
            <div>
              <h2
                id="product-dialog-title"
                className="font-space text-lg font-semibold text-[#ededed] tracking-tight"
              >
                {product.name}
              </h2>
            </div>

            {/* Price Row */}
            <div className="p-3 rounded-lg bg-[#181c25] border border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-sans text-[#9499a6]">
                Current price
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-space text-xl font-bold text-[#ededed] tabular-nums">
                  {formatINR(priceMinor)}
                </span>
                {originalPriceMinor && (
                  <span className="font-mono-code text-xs line-through text-[#666b7a] tabular-nums">
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
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg btn-primary text-xs font-semibold active:scale-98 disabled:opacity-40 transition-all"
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
