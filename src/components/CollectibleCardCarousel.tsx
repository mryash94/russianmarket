import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Eye, ArrowRight } from 'lucide-react'
import { CollectibleCardVisual } from './CollectibleCardVisual'
import { formatINR } from '../lib/currency'
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
  const featured = products.filter((p) => p.isFeatured || p.isPopular).slice(0, 5)
  const [currentIndex, setCurrentIndex] = useState(0)

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

  const priceMinor = active.salePriceMinor && active.salePriceMinor < active.priceMinor
    ? active.salePriceMinor
    : active.priceMinor

  const originalPriceMinor = active.salePriceMinor && active.salePriceMinor < active.priceMinor
    ? active.priceMinor
    : null

  const isAvailable = active.availability === 'in_stock' || active.stockCount > 0

  return (
    <section aria-label="Featured Collectibles" className="w-full">
      <div className="relative w-full rounded-3xl glass-panel p-4 sm:p-6 border border-white/[0.08] shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
          {/* Card Visual Showcase */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <div className="w-full max-w-[340px] sm:max-w-[380px]">
              <CollectibleCardVisual product={active} size="md" interactive={true} />
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous card"
                className="p-1.5 rounded-lg btn-ghost text-slate-300 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5">
                {featured.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      idx === currentIndex
                        ? 'w-6 bg-cyan-400'
                        : 'w-2 bg-white/20 hover:bg-white/40'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next card"
                className="p-1.5 rounded-lg btn-ghost text-slate-300 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Details & Actions */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-3.5 text-left">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full font-mono-code text-[10px] font-bold tracking-widest uppercase border ${
                  active.category === 'VISA'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40'
                    : active.category === 'MASTERCARD'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-400/40'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40'
                }`}
              >
                {active.category}
              </span>

              <span className="flex items-center gap-1 font-mono-code text-[11px] text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isAvailable ? 'In Stock' : 'Sold Out'}
              </span>
            </div>

            <div>
              <h2 className="font-space text-xl sm:text-2xl font-bold text-white tracking-tight">
                {active.name}
              </h2>
            </div>

            {/* Price Box */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono-code text-slate-400 uppercase tracking-wider block">
                  Price
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-space text-2xl font-extrabold text-white">
                    {formatINR(priceMinor)}
                  </span>
                  {originalPriceMinor && (
                    <span className="text-xs font-mono-code line-through text-slate-500">
                      {formatINR(originalPriceMinor)}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono-code text-slate-400 uppercase tracking-wider block">
                  Category
                </span>
                <span className="text-xs font-mono-code font-bold text-white block mt-0.5">
                  {active.category}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => onSelectProduct(active)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl btn-ghost text-xs font-semibold text-slate-300 hover:text-white border border-white/[0.08]"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Details</span>
              </button>

              <button
                type="button"
                disabled={!isAvailable}
                onClick={() => onQuickBuy(active)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl btn-primary text-xs font-bold active:scale-95 disabled:opacity-50 transition-all shadow-md"
              >
                <span>BUY NOW</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
