import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Eye, Zap, ShieldCheck } from 'lucide-react'
import { CollectibleCardVisual } from './CollectibleCardVisual'
import type { Product } from '../types/product'

type CollectibleCardCarouselProps = {
  products: Product[]
  onSelectProduct: (product: Product) => void
  onQuickBuy: (product: Product) => void
}

export function CollectibleCardCarousel({
  products,
  onSelectProduct,
  onQuickBuy,
}: CollectibleCardCarouselProps) {
  const featured = products.filter((p) => p.isFeatured || p.isPopular).slice(0, 6)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-cycle every 7 seconds
  useEffect(() => {
    if (featured.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [featured.length])

  if (featured.length === 0) return null

  const active = featured[currentIndex]

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? featured.length - 1 : prev - 1))
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % featured.length)
  }

  const formattedPrice = `$${(active.priceMinor / 100).toFixed(2)}`
  const formattedSale = active.salePriceMinor ? `$${(active.salePriceMinor / 100).toFixed(2)}` : null

  return (
    <div className="relative w-full overflow-hidden rounded-3xl glass-panel-glow p-4 md:p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
      {/* Background ambient lighting bloom */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-violet-500/10 blur-[100px] pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Card Interactive Showcase */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center py-2">
          <div className="w-full max-w-[420px] transition-all duration-300">
            <CollectibleCardVisual product={active} size="md" interactive={true} />
          </div>

          {/* Carousel Pagination Dots & Nav Controls */}
          <div className="flex items-center gap-4 mt-6">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous Collectible"
              className="p-2 rounded-full glass-input text-slate-300 hover:text-white hover:border-cyan-400 active:scale-90 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {featured.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    idx === currentIndex
                      ? 'w-6 h-1.5 bg-cyan-400 shadow-[0_0_8px_#00f0ff]'
                      : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Go to item ${idx + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next Collectible"
              className="p-2 rounded-full glass-input text-slate-300 hover:text-white hover:border-cyan-400 active:scale-90 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: High-Luxury Lore & Acquisition CTA */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-4 text-left">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full font-mono-code text-[11px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              {active.collection}
            </span>
            <span className="text-xs font-mono-code text-slate-400">
              MINT ALLOCATION #{active.editionNumber} / {active.editionTotal}
            </span>
          </div>

          <h2 className="font-cinzel text-2xl md:text-3xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-200">
            {active.name}
          </h2>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans line-clamp-3">
            {active.description}
          </p>

          {/* Pricing & Value Specs */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-400 block">
                ACQUISITION PRICE
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-space text-xl md:text-2xl font-bold text-white">
                  {formattedSale || formattedPrice}
                </span>
                {formattedSale && (
                  <span className="text-xs font-mono-code line-through text-slate-500">
                    {formattedPrice}
                  </span>
                )}
                <span className="text-[10px] font-mono-code text-cyan-400">USD</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-400 block">
                STOCK AVAILABILITY
              </span>
              <span className="font-mono-code text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {active.stockLabel}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => onSelectProduct(active)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl glass-input text-xs font-semibold text-slate-200 hover:text-white hover:border-white/30 active:scale-95 transition-all"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Inspect Specs</span>
            </button>

            <button
              type="button"
              onClick={() => onQuickBuy(active)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl btn-cyan text-xs font-bold active:scale-95 transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>Acquire Now</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono-code text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Instant Cryptographic Vault Entitlement Upon Verified Settlement</span>
          </div>
        </div>
      </div>
    </div>
  )
}
