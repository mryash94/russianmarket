import { useEffect } from 'react'
import {
  X,
  ShoppingBag,
  Zap,
  FileArchive,
  Sparkles,
  Lock,
} from 'lucide-react'
import { CollectibleCardVisual } from '../../components/CollectibleCardVisual'
import type { Product } from '../../types/product'

type ProductDetailsDialogProps = {
  product: Product | null
  onClose: () => void
  onAddToCart: (product: Product) => void
  onQuickBuy: (product: Product) => void
}

export function ProductDetailsDialog({
  product,
  onClose,
  onAddToCart,
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

  const formattedPrice = `$${(product.priceMinor / 100).toFixed(2)}`
  const formattedSale = product.salePriceMinor
    ? `$${(product.salePriceMinor / 100).toFixed(2)}`
    : null

  const sizeMb = (product.digitalAsset.sizeBytes / (1024 * 1024)).toFixed(1) + ' MB'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto glass-panel-glow rounded-3xl p-5 md:p-8 border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-dialog-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full glass-input text-slate-400 hover:text-white hover:border-white/30 active:scale-90 transition-all z-20"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Column: 3D Collectible Card Visual */}
          <div className="md:col-span-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-[360px]">
              <CollectibleCardVisual product={product} size="md" interactive={true} />
            </div>

            <div className="flex items-center gap-2 mt-4 text-[11px] font-mono-code text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Touch or hover card to inspect 3D metallic facets</span>
            </div>
          </div>

          {/* Right Column: Detailed Specifications & Master Asset Specs */}
          <div className="md:col-span-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full font-mono-code text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                  {product.collection}
                </span>
                <span className="font-mono-code text-xs text-slate-400">
                  SKU: {product.sku}
                </span>
              </div>

              <h2 id="product-dialog-title" className="font-cinzel text-xl md:text-2xl font-bold text-white">
                {product.name}
              </h2>

              <p className="text-xs text-slate-300 font-sans mt-2 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Cryptographic Digital Vault Asset Box */}
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-code">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <FileArchive className="w-4 h-4 text-violet-400" />
                  PAYLOAD FILE:
                </span>
                <strong className="text-white text-[11px] truncate max-w-[180px]">
                  {product.digitalAsset.filename}
                </strong>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono-code pt-1 border-t border-white/5 text-slate-400">
                <div>
                  ARCHIVE SIZE: <strong className="text-cyan-300">{sizeMb}</strong>
                </div>
                <div>
                  DELIVERY: <strong className="text-cyan-300">Signed Token</strong>
                </div>
              </div>
            </div>

            {/* Curated Specifications List */}
            <div className="space-y-1.5 text-xs">
              <span className="font-mono-code text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">
                AUTHENTICATED SPECIFICATIONS
              </span>
              {product.specifications.map((spec, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1 border-b border-white/5 font-mono-code text-[11px]"
                >
                  <span className="text-slate-400">{spec.label}</span>
                  <span className="text-white font-medium">{spec.value}</span>
                </div>
              ))}
            </div>

            {/* Price & Acquisition Controls */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono-code uppercase tracking-widest text-slate-400 block">
                  SETTLEMENT VALUE
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-space text-2xl font-bold text-white">
                    {formattedSale || formattedPrice}
                  </span>
                  {formattedSale && (
                    <span className="text-xs font-mono-code line-through text-slate-500">
                      {formattedPrice}
                    </span>
                  )}
                  <span className="text-xs font-mono-code text-cyan-400">USD</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onAddToCart(product)
                    onClose()
                  }}
                  className="p-3 rounded-xl glass-input text-slate-200 hover:text-white hover:border-cyan-400 active:scale-95 transition-all"
                  title="Add to Shopping Bag"
                >
                  <ShoppingBag className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onQuickBuy(product)
                  }}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl btn-cyan text-xs font-bold active:scale-95 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                >
                  <Zap className="w-4 h-4" />
                  <span>ACQUIRE NOW</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[9px] font-mono-code text-slate-500 pt-1">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>Complies with Russian Market Zero-Knowledge & Asymmetric Delivery Standards</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
